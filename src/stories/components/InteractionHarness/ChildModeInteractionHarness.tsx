import React from 'react';
import { AtomTrigger } from '../../../index';
import type { AtomTriggerEvent } from '../../../index';
import { addHarnessEvent, CounterPanel, type ChildModeInteractionHarnessProps } from './shared';

export function ChildModeInteractionHarness({
  threshold = 0,
  onEnter,
  onLeave,
  onEvent,
}: ChildModeInteractionHarnessProps) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const scrollTopRef = React.useRef(0);
  const [harnessReady, setHarnessReady] = React.useState(false);
  const [triggerKey, setTriggerKey] = React.useState(0);
  const [currentScrollTop, setCurrentScrollTop] = React.useState(0);
  const [events, setEvents] = React.useState<AtomTriggerEvent[]>([]);

  React.useLayoutEffect(() => {
    const root = rootRef.current;
    const child = root?.querySelector('.observed-child');

    if (!(root instanceof HTMLDivElement) || !(child instanceof HTMLElement)) {
      setHarnessReady(false);
      return;
    }

    Object.defineProperty(root, 'getBoundingClientRect', {
      configurable: true,
      value: () => new DOMRect(0, 0, 200, 200),
    });
    Object.defineProperty(child, 'getBoundingClientRect', {
      configurable: true,
      value: () => new DOMRect(20, 260 - scrollTopRef.current, 160, 100),
    });

    scrollTopRef.current = 0;
    setCurrentScrollTop(0);
    const readyId = window.requestAnimationFrame(() => {
      setHarnessReady(true);
    });

    return () => {
      window.cancelAnimationFrame(readyId);
    };
  }, [triggerKey]);

  const scrollVertical = React.useCallback((nextTop: number) => {
    const root = rootRef.current;
    if (!root) {
      return;
    }

    scrollTopRef.current = nextTop;
    setCurrentScrollTop(nextTop);
    root.dispatchEvent(
      new root.ownerDocument.defaultView!.Event('scroll', {
        bubbles: true,
      }),
    );
  }, []);

  const triggerBasicEnter = React.useCallback(() => {
    scrollVertical(120);
  }, [scrollVertical]);

  const triggerBelowThreshold = React.useCallback(() => {
    scrollVertical(134);
  }, [scrollVertical]);

  const triggerThresholdEnter = React.useCallback(() => {
    scrollVertical(135);
  }, [scrollVertical]);

  const triggerLeave = React.useCallback(() => {
    scrollVertical(360);
  }, [scrollVertical]);

  const runSequence = React.useCallback(() => {
    scrollVertical(0);

    window.requestAnimationFrame(() => {
      scrollVertical(threshold > 0 ? 134 : 120);
      window.requestAnimationFrame(() => {
        if (threshold > 0) {
          scrollVertical(135);
        }

        window.requestAnimationFrame(() => {
          scrollVertical(360);
        });
      });
    });
  }, [scrollVertical, threshold]);

  const resetHarness = React.useCallback(() => {
    setEvents([]);
    setHarnessReady(false);
    setCurrentScrollTop(0);
    setTriggerKey(prev => prev + 1);
  }, []);

  const latestEvent = events[0];
  const visibleHeight = Math.max(
    0,
    Math.min(200, 360 - currentScrollTop) - Math.max(0, 260 - currentScrollTop),
  );
  const visibleRatio = visibleHeight / 100;

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
          <button type="button" onClick={triggerBasicEnter} disabled={!harnessReady}>
            Trigger Child Enter
          </button>
          <button type="button" onClick={triggerBelowThreshold} disabled={!harnessReady}>
            Scroll Below Threshold
          </button>
          <button type="button" onClick={triggerThresholdEnter} disabled={!harnessReady}>
            Trigger Threshold Enter
          </button>
          <button type="button" onClick={triggerLeave} disabled={!harnessReady}>
            Trigger Child Leave
          </button>
          <button type="button" onClick={runSequence} disabled={!harnessReady}>
            Run Child Sequence
          </button>
          <button type="button" onClick={resetHarness}>
            Reset Child Harness
          </button>
        </div>

        <div style={{ border: '1px solid #d1d5db', padding: 16, background: '#fff' }}>
          <p style={{ margin: '0 0 12px' }}>
            Controlled child observation harness. The card is the observed element.
          </p>

          <div
            ref={rootRef}
            style={{
              height: 200,
              overflowY: 'auto',
              border: '1px solid #d1d5db',
              padding: 12,
              background: '#f8fafc',
            }}
          >
            <div style={{ height: 260 }}>
              <em>Child mode top spacer</em>
            </div>
            <AtomTrigger
              key={`child-mode-${triggerKey}`}
              rootRef={rootRef}
              threshold={threshold}
              onEnter={onEnter}
              onLeave={onLeave}
              onEvent={event => addHarnessEvent(setEvents, event, onEvent)}
            >
              <article
                className="observed-child"
                style={{
                  border: '1px solid #8b5cf6',
                  minHeight: 100,
                  padding: 16,
                  color: '#2e1065',
                  background:
                    'linear-gradient(135deg, rgba(76, 29, 149, 0.22), rgba(124, 58, 237, 0.18) 55%, rgba(255, 255, 255, 0.96))',
                  boxShadow: '0 18px 40px rgba(76, 29, 149, 0.18)',
                }}
              >
                <strong>Observed child</strong>
                <p style={{ margin: '8px 0 0' }}>
                  Threshold is <code>{threshold}</code>.
                </p>
              </article>
            </AtomTrigger>
            <div style={{ height: 260, paddingTop: 8 }}>
              <em>Child mode bottom spacer</em>
            </div>
          </div>
        </div>
      </section>

      <div style={{ display: 'grid', gap: 12 }}>
        <CounterPanel
          title="Child mode counters"
          testIdPrefix="child-mode"
          events={events}
          harnessReady={harnessReady}
        />
        <aside
          style={{
            width: 360,
            border: '1px solid #d1d5db',
            background: '#f9fafb',
            padding: 12,
          }}
        >
          <strong>Child mode geometry</strong>
          <p style={{ marginTop: 10 }}>
            Threshold: <span data-testid="child-mode-threshold">{threshold.toFixed(2)}</span>
          </p>
          <p>
            Visible px: <span data-testid="child-mode-visible-height">{visibleHeight}</span>
          </p>
          <p>
            Visible ratio:{' '}
            <span data-testid="child-mode-visible-ratio">{visibleRatio.toFixed(2)}</span>
          </p>
          <p>
            Latest ratio:{' '}
            <span data-testid="child-mode-latest-ratio">
              {latestEvent?.entry.intersectionRatio.toFixed(2) ?? '0.00'}
            </span>
          </p>
          <p style={{ marginBottom: 0 }}>
            Latest target:{' '}
            <span data-testid="child-mode-latest-target">
              {latestEvent?.entry.target.tagName.toLowerCase() ?? 'none'}
            </span>
          </p>
        </aside>
      </div>
    </div>
  );
}
