import React from 'react';
import type { AtomTriggerEvent } from '../../../index';
import styles from './AnimationDemo.module.css';
import { Helicopter } from './Heli';
import { Plane } from './Plane';
import { Scene } from './Scene';
import { AnimationControls } from './AnimationControls';
import { AnimationStatusPanel } from './AnimationStatusPanel';
import { AnimationTriggerTrack } from './AnimationTriggerTrack';
import { defaultTransitionMap, scrollHintsByMode } from './AnimationDemo.config';
import {
  animationDemoReducer,
  createInitialState,
  getTransitionDirectionFromEvent,
  resolveAnimationTransition,
} from './AnimationDemo.state';
import { createJumpEvent, getTargetScrollTop, scrollRootToPosition } from './AnimationDemo.utils';
import type {
  AircraftAnimation,
  AnimationMode,
  AnimationTransition,
  AnimationTransitionDirection,
  AnimationTriggerId,
} from './types';

export type AnimationDemoProps = {
  initialMode?: AnimationMode;
  viewportHeight?: number;
  defaultShowTriggers?: boolean;
  scrollBehavior?: ScrollBehavior;
  onModeChange?: (mode: AnimationMode, event: AtomTriggerEvent) => void;
};

type FlightAircraft = Extract<AircraftAnimation, 'plane' | 'helicopter'>;

type ActiveFlight = {
  id: number;
  aircraft: FlightAircraft;
  direction: AnimationTransitionDirection;
};

function getFlightAircraft(activeAircraft: AircraftAnimation): FlightAircraft[] {
  if (activeAircraft === 'both') {
    return ['plane', 'helicopter'];
  }

  if (activeAircraft === 'plane' || activeAircraft === 'helicopter') {
    return [activeAircraft];
  }

  return [];
}

export function AnimationDemo({
  initialMode = 'day',
  viewportHeight = 720,
  defaultShowTriggers = false,
  scrollBehavior = 'smooth',
  onModeChange,
}: AnimationDemoProps) {
  const scrollRootRef = React.useRef<HTMLDivElement>(null);
  const triggerAnchorRefs = React.useRef<Record<AnimationTriggerId, HTMLDivElement | null>>({
    top: null,
    middle: null,
    bottom: null,
  });
  const [showTriggers, setShowTriggers] = React.useState(defaultShowTriggers);
  const [state, dispatch] = React.useReducer(animationDemoReducer, initialMode, createInitialState);
  const [activeFlights, setActiveFlights] = React.useState<ActiveFlight[]>([]);
  const nextFlightIdRef = React.useRef(0);
  const queuedTransitionCountRef = React.useRef(0);
  const previousModeRef = React.useRef(state.mode);
  const pendingJumpRef = React.useRef<{
    triggerId: AnimationTriggerId;
    direction: AnimationTransitionDirection;
  } | null>(null);

  const setTriggerAnchor = React.useCallback(
    (id: AnimationTriggerId) => (node: HTMLDivElement | null) => {
      triggerAnchorRefs.current[id] = node;
    },
    [],
  );

  React.useEffect(() => {
    if (previousModeRef.current === state.mode || !state.lastEvent) {
      previousModeRef.current = state.mode;
      return;
    }

    onModeChange?.(state.mode, state.lastEvent);
    previousModeRef.current = state.mode;
  }, [onModeChange, state.lastEvent, state.mode]);

  React.useEffect(() => {
    const transitionDirection = state.transitionDirection;

    if (
      state.transitionCount === 0 ||
      state.transitionCount === queuedTransitionCountRef.current ||
      !transitionDirection
    ) {
      return;
    }

    queuedTransitionCountRef.current = state.transitionCount;
    const flightAircraft = getFlightAircraft(state.activeAircraft);
    if (flightAircraft.length === 0) {
      return;
    }

    setActiveFlights(currentFlights => [
      ...currentFlights,
      ...flightAircraft.map(aircraft => {
        const flight: ActiveFlight = {
          id: nextFlightIdRef.current,
          aircraft,
          direction: transitionDirection,
        };
        nextFlightIdRef.current += 1;
        return flight;
      }),
    ]);
  }, [state.activeAircraft, state.mode, state.transitionCount, state.transitionDirection]);

  const dispatchTransition = React.useCallback(
    (
      transition: AnimationTransition,
      direction: AnimationTransitionDirection,
      event: AtomTriggerEvent,
    ) => {
      dispatch({
        type: 'triggered',
        transition,
        direction,
        event: {
          ...event,
          movementDirection: direction,
        },
      });
    },
    [],
  );

  const handleTrigger = React.useCallback(
    (triggerId: AnimationTriggerId) => (event: AtomTriggerEvent) => {
      const direction = getTransitionDirectionFromEvent(event.movementDirection);

      if (!direction) {
        return;
      }

      const pendingJump = pendingJumpRef.current;
      if (
        pendingJump &&
        pendingJump.triggerId === triggerId &&
        pendingJump.direction === direction
      ) {
        pendingJumpRef.current = null;
        return;
      }

      const transition = resolveAnimationTransition(triggerId, direction);

      if (!transition) {
        return;
      }

      dispatchTransition(transition, direction, event);
    },
    [dispatchTransition],
  );

  const jumpToTransition = React.useCallback(
    (triggerId: AnimationTriggerId, direction: AnimationTransitionDirection) => {
      const root = scrollRootRef.current;
      const target = triggerAnchorRefs.current[triggerId];
      const transition = resolveAnimationTransition(triggerId, direction);

      if (!root || !target || !transition) {
        return;
      }

      pendingJumpRef.current = {
        triggerId,
        direction,
      };
      scrollRootToPosition(root, getTargetScrollTop(root, target), scrollBehavior);
      dispatchTransition(transition, direction, createJumpEvent(root, target, direction));
    },
    [dispatchTransition, scrollBehavior],
  );

  const resetDemo = React.useCallback(() => {
    const root = scrollRootRef.current;
    if (root) {
      scrollRootToPosition(root, 0, scrollBehavior);
    }

    dispatch({
      type: 'reset',
      mode: initialMode,
    });
    setActiveFlights([]);
    queuedTransitionCountRef.current = 0;
  }, [initialMode, scrollBehavior]);

  const removeFlight = React.useCallback((flightId: number) => {
    setActiveFlights(currentFlights => currentFlights.filter(flight => flight.id !== flightId));
  }, []);
  const scrollHint = scrollHintsByMode[state.mode];

  return (
    <div
      className={styles.shell}
      style={{ ['--animation-demo-height' as const]: `${viewportHeight}px` } as React.CSSProperties}
    >
      <div className={styles.header}>
        <div className={styles.copyBlock}>
          <span className={styles.eyebrow}>AtomTrigger v2</span>
          <h2 className={styles.headline}>Scroll scene demo</h2>
          <p className={styles.description}>
            This one is a bit extra, but useful for checking that a few triggers can drive different
            transitions inside one scroll area.
          </p>
        </div>

        <div className={styles.headerControls}>
          <AnimationStatusPanel state={state} />
          <AnimationControls
            showTriggers={showTriggers}
            onJump={jumpToTransition}
            onToggleMarkers={() => setShowTriggers(current => !current)}
            onReset={resetDemo}
          />
        </div>
      </div>

      <div className={styles.viewport} data-testid="animation-demo-viewport">
        <div className={styles.stage}>
          <Scene mode={state.mode} />
          {activeFlights.map(flight =>
            flight.aircraft === 'plane' ? (
              <Plane
                key={flight.id}
                mode={state.mode}
                isActive
                direction={flight.direction}
                onFlightComplete={() => removeFlight(flight.id)}
              />
            ) : (
              <Helicopter
                key={flight.id}
                mode={state.mode}
                isActive
                direction={flight.direction}
                onFlightComplete={() => removeFlight(flight.id)}
              />
            ),
          )}
          <div className={styles.scrollHint} aria-live="polite" aria-atomic="true">
            <span key={scrollHint} className={styles.scrollHintText}>
              {scrollHint}
            </span>
          </div>
          <div className={styles.overlay} />
        </div>

        <AnimationTriggerTrack
          scrollRootRef={scrollRootRef}
          showTriggers={showTriggers}
          setTriggerAnchor={setTriggerAnchor}
          handleTrigger={handleTrigger}
        />
      </div>
    </div>
  );
}

export { defaultTransitionMap, resolveAnimationTransition };
export default AnimationDemo;
