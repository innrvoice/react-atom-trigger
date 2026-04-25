import React from 'react';
import { AtomTrigger } from '../../../index';
import type { AtomTriggerEvent, AtomTriggerProps } from '../../../index';
import { addHarnessEvent } from './shared';

type FixedHeaderViewportHarnessProps = Pick<
  AtomTriggerProps,
  'threshold' | 'onEnter' | 'onLeave' | 'onEvent'
>;

export function FixedHeaderViewportHarness({
  threshold = 0,
  onEnter,
  onLeave,
  onEvent,
}: FixedHeaderViewportHarnessProps) {
  const scrollTopRef = React.useRef(0);
  const [harnessReady, setHarnessReady] = React.useState(false);
  const [triggerKey, setTriggerKey] = React.useState(0);
  const [currentScrollTop, setCurrentScrollTop] = React.useState(0);
  const [events, setEvents] = React.useState<AtomTriggerEvent[]>([]);

  React.useLayoutEffect(() => {
    const sentinel = document.querySelector('.fixed-header-viewport-sentinel');
    if (!(sentinel instanceof HTMLDivElement)) {
      setHarnessReady(false);
      return;
    }

    const previousInnerWidth = Object.getOwnPropertyDescriptor(window, 'innerWidth');
    const previousInnerHeight = Object.getOwnPropertyDescriptor(window, 'innerHeight');

    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 200,
    });
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 200,
    });
    Object.defineProperty(sentinel, 'getBoundingClientRect', {
      configurable: true,
      value: () => new DOMRect(40, 260 - scrollTopRef.current, 120, 2),
    });

    scrollTopRef.current = 0;
    setCurrentScrollTop(0);
    const readyId = window.requestAnimationFrame(() => {
      setHarnessReady(true);
    });

    return () => {
      window.cancelAnimationFrame(readyId);

      if (previousInnerWidth) {
        Object.defineProperty(window, 'innerWidth', previousInnerWidth);
      }
      if (previousInnerHeight) {
        Object.defineProperty(window, 'innerHeight', previousInnerHeight);
      }
    };
  }, [triggerKey]);

  const dispatchViewportScroll = React.useCallback((nextTop: number) => {
    scrollTopRef.current = nextTop;
    setCurrentScrollTop(nextTop);
    window.dispatchEvent(new Event('scroll'));
  }, []);

  const triggerEnter = React.useCallback(() => {
    dispatchViewportScroll(120);
  }, [dispatchViewportScroll]);

  const scrollBeforeBoundary = React.useCallback(() => {
    dispatchViewportScroll(161);
  }, [dispatchViewportScroll]);

  const scrollPastBoundary = React.useCallback(() => {
    dispatchViewportScroll(162);
  }, [dispatchViewportScroll]);

  const resetHarness = React.useCallback(() => {
    setEvents([]);
    setHarnessReady(false);
    setTriggerKey(prev => prev + 1);
  }, []);

  const latestEvent = events[0];
  const latestRootTop = Math.round(latestEvent?.entry.rootBounds?.top ?? 0);
  const latestRectBottom = Math.round(latestEvent?.entry.boundingClientRect.bottom ?? 0);
  const currentRootTop = 100;
  const currentRectBottom = 262 - currentScrollTop;

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
          <button type="button" onClick={triggerEnter} disabled={!harnessReady}>
            Trigger Margin Enter
          </button>
          <button type="button" onClick={scrollBeforeBoundary} disabled={!harnessReady}>
            Scroll Before Header Boundary
          </button>
          <button type="button" onClick={scrollPastBoundary} disabled={!harnessReady}>
            Scroll Past Header Boundary
          </button>
          <button type="button" onClick={resetHarness}>
            Reset Margin Harness
          </button>
        </div>

        <div
          style={{
            position: 'relative',
            minHeight: 240,
            border: '1px solid #d1d5db',
            overflow: 'hidden',
            background: '#fff',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 100,
              background: '#4c1d95',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2,
            }}
          >
            Fixed header (100px)
          </div>

          <div style={{ paddingTop: 120, paddingLeft: 12, paddingRight: 12, color: '#6b7280' }}>
            Viewport-root harness with <code>rootMargin: -100px 0px 0px 0px</code>.
          </div>

          <AtomTrigger
            key={`fixed-header-viewport-${triggerKey}`}
            className="atom-trigger-sentinel fixed-header-viewport-sentinel"
            rootMargin="-100px 0px 0px 0px"
            threshold={threshold}
            onEnter={onEnter}
            onLeave={onLeave}
            onEvent={event => addHarnessEvent(setEvents, event, onEvent)}
          />
        </div>
      </section>

      <aside
        style={{
          width: 360,
          border: '1px solid #d1d5db',
          background: '#f9fafb',
          padding: 12,
        }}
      >
        <strong>Fixed header margin checks</strong>
        <p style={{ marginTop: 10 }}>
          Harness ready:{' '}
          <span data-testid="fixed-header-observer-ready">{harnessReady ? 'true' : 'false'}</span>
        </p>
        <p>
          Entered:{' '}
          <span data-testid="fixed-header-entered">{latestEvent?.counts.entered ?? 0}</span>
        </p>
        <p>
          Left: <span data-testid="fixed-header-left">{latestEvent?.counts.left ?? 0}</span>
        </p>
        <p>
          Latest type:{' '}
          <span data-testid="fixed-header-latest-type">{latestEvent?.type ?? 'none'}</span>
        </p>
        <p>
          Latest position:{' '}
          <span data-testid="fixed-header-latest-position">{latestEvent?.position ?? 'none'}</span>
        </p>
        <p>
          Latest root top: <span data-testid="fixed-header-root-top">{latestRootTop}</span>
        </p>
        <p>
          Latest rect bottom: <span data-testid="fixed-header-rect-bottom">{latestRectBottom}</span>
        </p>
        <p>
          Current root top:{' '}
          <span data-testid="fixed-header-current-root-top">{currentRootTop}</span>
        </p>
        <p>
          Current rect bottom:{' '}
          <span data-testid="fixed-header-current-rect-bottom">{currentRectBottom}</span>
        </p>
      </aside>
    </div>
  );
}
