import React from 'react';
import { AtomTrigger } from '../../../index';
import type { AtomTriggerEvent } from '../../../index';
import {
  addHarnessEvent,
  CounterPanel,
  dispatchElementScroll,
  markHarnessReady,
  mockElementRect,
  runFrameSequence,
  type InteractionHarnessProps,
} from './shared';

export function InteractionHarness({
  once = false,
  oncePerDirection = false,
  fireOnInitialVisible = false,
  initialVerticalScrollTop = 0,
  onEnter,
  onLeave,
  onEvent,
}: InteractionHarnessProps) {
  const verticalRootRef = React.useRef<HTMLDivElement>(null);
  const horizontalRootRef = React.useRef<HTMLDivElement>(null);
  const verticalScrollTopRef = React.useRef(0);
  const horizontalScrollLeftRef = React.useRef(0);
  const [harnessReady, setHarnessReady] = React.useState(false);
  const [triggerKey, setTriggerKey] = React.useState(0);
  const [events, setEvents] = React.useState<AtomTriggerEvent[]>([]);

  React.useLayoutEffect(() => {
    const verticalRoot = verticalRootRef.current;
    const horizontalRoot = horizontalRootRef.current;
    const verticalSentinel = verticalRoot?.querySelector('.vertical-sentinel');
    const horizontalSentinel = horizontalRoot?.querySelector('.horizontal-sentinel');

    if (
      !(verticalRoot instanceof HTMLDivElement) ||
      !(horizontalRoot instanceof HTMLDivElement) ||
      !(verticalSentinel instanceof HTMLDivElement) ||
      !(horizontalSentinel instanceof HTMLDivElement)
    ) {
      setHarnessReady(false);
      return;
    }

    mockElementRect(verticalRoot, () => new DOMRect(0, 0, 200, 180));
    mockElementRect(horizontalRoot, () => new DOMRect(0, 0, 200, 120));
    mockElementRect(
      verticalSentinel,
      () => new DOMRect(0, 260 - verticalScrollTopRef.current, 10, 10),
    );
    mockElementRect(
      horizontalSentinel,
      () => new DOMRect(260 - horizontalScrollLeftRef.current, 0, 2, 160),
    );

    verticalScrollTopRef.current = initialVerticalScrollTop;
    horizontalScrollLeftRef.current = 0;
    const readyId = markHarnessReady(setHarnessReady);

    return () => {
      window.cancelAnimationFrame(readyId);
    };
  }, [initialVerticalScrollTop, triggerKey]);

  const handleHarnessEvent = React.useCallback(
    (event: AtomTriggerEvent) => {
      addHarnessEvent(setEvents, event, onEvent);
    },
    [onEvent],
  );

  const scrollVertical = React.useCallback((nextTop: number) => {
    const root = verticalRootRef.current;
    if (!root) {
      return;
    }

    verticalScrollTopRef.current = nextTop;
    dispatchElementScroll(root);
  }, []);

  const scrollHorizontal = React.useCallback((nextLeft: number) => {
    const root = horizontalRootRef.current;
    if (!root) {
      return;
    }

    horizontalScrollLeftRef.current = nextLeft;
    dispatchElementScroll(root);
  }, []);

  const emitEnter = React.useCallback(() => {
    scrollVertical(120);
  }, [scrollVertical]);

  const emitLeave = React.useCallback(() => {
    scrollVertical(280);
  }, [scrollVertical]);

  const runVerticalSequence = React.useCallback(() => {
    scrollVertical(0);
    runFrameSequence([() => scrollVertical(120), () => scrollVertical(280)]);
  }, [scrollVertical]);

  const runHorizontalSequence = React.useCallback(() => {
    scrollHorizontal(0);
    runFrameSequence([() => scrollHorizontal(120), () => scrollHorizontal(320)]);
  }, [scrollHorizontal]);

  const resetHarness = React.useCallback(() => {
    setEvents([]);
    setHarnessReady(false);
    setTriggerKey(prev => prev + 1);
  }, []);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(420px, 520px) 360px',
        gap: 16,
        alignItems: 'start',
      }}
    >
      <section>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <button type="button" onClick={emitEnter} disabled={!harnessReady}>
            Trigger Enter
          </button>
          <button type="button" onClick={emitLeave} disabled={!harnessReady}>
            Trigger Leave
          </button>
          <button type="button" onClick={runVerticalSequence} disabled={!harnessReady}>
            Run Vertical Sequence
          </button>
          <button type="button" onClick={runHorizontalSequence} disabled={!harnessReady}>
            Run Horizontal Sequence
          </button>
          <button type="button" onClick={resetHarness}>
            Reset
          </button>
        </div>

        <div style={{ border: '1px solid #d1d5db', padding: 16, background: '#fff' }}>
          <p style={{ margin: '0 0 12px' }}>Controlled geometry harness for transition tests.</p>

          <div
            ref={verticalRootRef}
            style={{
              height: 180,
              overflowY: 'auto',
              border: '1px solid #d1d5db',
              padding: 12,
              marginBottom: 16,
            }}
          >
            <div style={{ height: 260 }}>
              <em>Vertical top spacer</em>
            </div>
            <AtomTrigger
              key={`vertical-${triggerKey}`}
              className="atom-trigger-sentinel vertical-sentinel"
              once={once}
              oncePerDirection={oncePerDirection}
              fireOnInitialVisible={fireOnInitialVisible}
              rootRef={verticalRootRef}
              onEnter={onEnter}
              onLeave={onLeave}
              onEvent={handleHarnessEvent}
            />
            <div style={{ height: 260, paddingTop: 8 }}>
              <em>Vertical bottom spacer</em>
            </div>
          </div>

          <div
            ref={horizontalRootRef}
            style={{
              height: 120,
              overflowX: 'auto',
              overflowY: 'hidden',
              whiteSpace: 'nowrap',
              border: '1px solid #d1d5db',
              padding: '12px 0',
            }}
          >
            <div style={{ display: 'inline-flex', alignItems: 'center', height: '100%' }}>
              <div style={{ width: 260, minWidth: 260, padding: '0 12px' }}>
                <em>Horizontal left spacer</em>
              </div>
              <AtomTrigger
                key={`horizontal-${triggerKey}`}
                className="atom-trigger-sentinel--vertical horizontal-sentinel"
                once={once}
                oncePerDirection={oncePerDirection}
                fireOnInitialVisible={fireOnInitialVisible}
                rootRef={horizontalRootRef}
                onEnter={onEnter}
                onLeave={onLeave}
                onEvent={handleHarnessEvent}
              />
              <div style={{ width: 260, minWidth: 260, padding: '0 12px' }}>
                <em>Horizontal right spacer</em>
              </div>
            </div>
          </div>
        </div>
      </section>

      <CounterPanel title="Interaction counters" events={events} harnessReady={harnessReady} />
    </div>
  );
}
