import type { AtomTriggerEvent, MovementDirection } from '../../../index';
import { defaultTransitionMap } from './AnimationDemo.config';
import type {
  AircraftAnimation,
  AnimationMode,
  AnimationTransition,
  AnimationTransitionDirection,
  AnimationTriggerId,
} from './types';

export type AnimationDemoState = {
  mode: AnimationMode;
  activeAircraft: AircraftAnimation;
  transitionDirection: AnimationTransitionDirection | null;
  transitionCount: number;
  lastEvent: AtomTriggerEvent | null;
};

export type AnimationDemoAction =
  | {
      type: 'triggered';
      transition: AnimationTransition;
      direction: AnimationTransitionDirection;
      event: AtomTriggerEvent;
    }
  | {
      type: 'reset';
      mode: AnimationMode;
    };

export function createInitialState(mode: AnimationMode): AnimationDemoState {
  return {
    mode,
    activeAircraft: 'none',
    transitionDirection: null,
    transitionCount: 0,
    lastEvent: null,
  };
}

export function animationDemoReducer(
  state: AnimationDemoState,
  action: AnimationDemoAction,
): AnimationDemoState {
  if (action.type === 'reset') {
    return createInitialState(action.mode);
  }

  return {
    mode: action.transition.nextMode,
    activeAircraft: action.transition.aircraft,
    transitionDirection: action.direction,
    transitionCount: state.transitionCount + 1,
    lastEvent: action.event,
  };
}

export function getVerticalTransitionDirection(
  direction: MovementDirection,
): AnimationTransitionDirection | null {
  if (direction === 'up' || direction === 'down') {
    return direction;
  }

  return null;
}

export function getTransitionDirectionFromEvent(
  movementDirection: MovementDirection,
): AnimationTransitionDirection | null {
  if (movementDirection === 'up') {
    return 'down';
  }

  if (movementDirection === 'down') {
    return 'up';
  }

  return null;
}

export function resolveAnimationTransition(
  triggerId: AnimationTriggerId,
  direction: MovementDirection | AnimationTransitionDirection,
): AnimationTransition | null {
  const verticalDirection = getVerticalTransitionDirection(direction);

  if (!verticalDirection) {
    return null;
  }

  return defaultTransitionMap[triggerId]?.[verticalDirection] ?? null;
}
