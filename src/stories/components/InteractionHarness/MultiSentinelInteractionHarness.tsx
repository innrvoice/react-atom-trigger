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
  type SharedHarnessEventCallbacks,
} from './shared';

export function MultiSentinelInteractionHarness({
  onEnter,
  onLeave,
  onEvent,
}: SharedHarnessEventCallbacks) {
  const sharedRootRef = React.useRef<HTMLDivElement>(null);
  const scrollTopRef = React.useRef(0);
  const scrollLeftRef = React.useRef(0);
  const [harnessReady, setHarnessReady] = React.useState(false);
  const [triggerKey, setTriggerKey] = React.useState(0);
  const [firstEvents, setFirstEvents] = React.useState<AtomTriggerEvent[]>([]);
  const [secondEvents, setSecondEvents] = React.useState<AtomTriggerEvent[]>([]);
  const [thirdEvents, setThirdEvents] = React.useState<AtomTriggerEvent[]>([]);
  const [fourthEvents, setFourthEvents] = React.useState<AtomTriggerEvent[]>([]);

  React.useLayoutEffect(() => {
    const sharedRoot = sharedRootRef.current;
    const horizontalFirst = sharedRoot?.querySelector('.multi-horizontal-first');
    const horizontalSecond = sharedRoot?.querySelector('.multi-horizontal-second');
    const verticalThird = sharedRoot?.querySelector('.multi-vertical-third');
    const verticalFourth = sharedRoot?.querySelector('.multi-vertical-fourth');

    if (
      !(sharedRoot instanceof HTMLDivElement) ||
      !(horizontalFirst instanceof HTMLDivElement) ||
      !(horizontalSecond instanceof HTMLDivElement) ||
      !(verticalThird instanceof HTMLDivElement) ||
      !(verticalFourth instanceof HTMLDivElement)
    ) {
      setHarnessReady(false);
      return;
    }

    mockElementRect(sharedRoot, () => new DOMRect(0, 0, 200, 180));
    mockElementRect(horizontalFirst, () => new DOMRect(40, 260 - scrollTopRef.current, 120, 2));
    mockElementRect(horizontalSecond, () => new DOMRect(40, 290 - scrollTopRef.current, 120, 2));
    mockElementRect(verticalThird, () => new DOMRect(260 - scrollLeftRef.current, 10, 2, 160));
    mockElementRect(verticalFourth, () => new DOMRect(275 - scrollLeftRef.current, 10, 2, 160));

    scrollTopRef.current = 0;
    scrollLeftRef.current = 0;
    const readyId = markHarnessReady(setHarnessReady);

    return () => {
      window.cancelAnimationFrame(readyId);
    };
  }, [triggerKey]);

  const scrollVertical = React.useCallback((nextTop: number) => {
    const root = sharedRootRef.current;
    if (!root) {
      return;
    }

    scrollTopRef.current = nextTop;
    dispatchElementScroll(root);
  }, []);

  const scrollHorizontal = React.useCallback((nextLeft: number) => {
    const root = sharedRootRef.current;
    if (!root) {
      return;
    }

    scrollLeftRef.current = nextLeft;
    dispatchElementScroll(root);
  }, []);

  const runVerticalSequence = React.useCallback(() => {
    scrollVertical(0);
    runFrameSequence([() => scrollVertical(120), () => scrollVertical(320)]);
  }, [scrollVertical]);

  const runHorizontalSequence = React.useCallback(() => {
    scrollHorizontal(0);
    runFrameSequence([() => scrollHorizontal(120), () => scrollHorizontal(280)]);
  }, [scrollHorizontal]);

  const resetHarness = React.useCallback(() => {
    setFirstEvents([]);
    setSecondEvents([]);
    setThirdEvents([]);
    setFourthEvents([]);
    setHarnessReady(false);
    setTriggerKey(prev => prev + 1);
  }, []);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(420px, 520px) repeat(4, 240px)',
        gap: 16,
        alignItems: 'start',
      }}
    >
      <section>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <button type="button" onClick={runVerticalSequence} disabled={!harnessReady}>
            Run Shared Vertical Scroll
          </button>
          <button type="button" onClick={runHorizontalSequence} disabled={!harnessReady}>
            Run Shared Horizontal Scroll
          </button>
          <button type="button" onClick={resetHarness}>
            Reset Multi Harness
          </button>
        </div>

        <div style={{ border: '1px solid #d1d5db', padding: 16, background: '#fff' }}>
          <p style={{ margin: '0 0 12px' }}>
            One bi-axial root with four sentinels registered into the same scheduler.
          </p>

          <div
            ref={sharedRootRef}
            style={{
              height: 180,
              width: 200,
              overflowX: 'auto',
              overflowY: 'auto',
              border: '1px solid #d1d5db',
              padding: 12,
            }}
          >
            <div
              style={{
                position: 'relative',
                width: 520,
                height: 520,
              }}
            >
              <div style={{ padding: 12, color: '#6b7280' }}>
                Scroll this shared root vertically and horizontally.
              </div>
              <AtomTrigger
                key={`multi-horizontal-first-${triggerKey}`}
                className="atom-trigger-sentinel multi-horizontal-first"
                rootRef={sharedRootRef}
                onEnter={onEnter}
                onLeave={onLeave}
                onEvent={event => addHarnessEvent(setFirstEvents, event, onEvent)}
              />
              <AtomTrigger
                key={`multi-horizontal-second-${triggerKey}`}
                className="atom-trigger-sentinel multi-horizontal-second"
                rootRef={sharedRootRef}
                onEnter={onEnter}
                onLeave={onLeave}
                onEvent={event => addHarnessEvent(setSecondEvents, event, onEvent)}
              />
              <AtomTrigger
                key={`multi-vertical-third-${triggerKey}`}
                className="atom-trigger-sentinel--vertical multi-vertical-third"
                rootRef={sharedRootRef}
                onEnter={onEnter}
                onLeave={onLeave}
                onEvent={event => addHarnessEvent(setThirdEvents, event, onEvent)}
              />
              <AtomTrigger
                key={`multi-vertical-fourth-${triggerKey}`}
                className="atom-trigger-sentinel--vertical multi-vertical-fourth"
                rootRef={sharedRootRef}
                onEnter={onEnter}
                onLeave={onLeave}
                onEvent={event => addHarnessEvent(setFourthEvents, event, onEvent)}
              />
            </div>
          </div>
        </div>
      </section>

      <CounterPanel
        title="Horizontal first"
        testIdPrefix="multi-first"
        events={firstEvents}
        harnessReady={harnessReady}
      />
      <CounterPanel
        title="Horizontal second"
        testIdPrefix="multi-second"
        events={secondEvents}
        harnessReady={harnessReady}
      />
      <CounterPanel
        title="Vertical third"
        testIdPrefix="multi-third"
        events={thirdEvents}
        harnessReady={harnessReady}
      />
      <CounterPanel
        title="Vertical fourth"
        testIdPrefix="multi-fourth"
        events={fourthEvents}
        harnessReady={harnessReady}
      />
    </div>
  );
}
