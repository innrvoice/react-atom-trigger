import React from 'react';
import { AtomTrigger } from '../../index';
import type { AtomTriggerEvent } from '../../index';

export type InteractionHarnessProps = {
  once?: boolean;
  oncePerDirection?: boolean;
  fireOnInitialVisible?: boolean;
  initialVerticalScrollTop?: number;
};

export type ChildModeInteractionHarnessProps = {
  threshold?: number;
};

function CounterPanel({
  title,
  testIdPrefix,
  events,
  harnessReady,
}: {
  title: string;
  testIdPrefix: string;
  events: AtomTriggerEvent[];
  harnessReady: boolean;
}) {
  const latestCounts = events[0]?.counts ?? { entered: 0, left: 0 };
  const latestEvent = events[0];

  return (
    <aside
      style={{
        width: 360,
        border: '1px solid #d1d5db',
        background: '#f9fafb',
        padding: 12,
      }}
    >
      <strong>{title}</strong>
      <p style={{ marginTop: 10 }}>
        Harness ready:{' '}
        <span data-testid={`${testIdPrefix}-observer-ready`}>
          {harnessReady ? 'true' : 'false'}
        </span>
      </p>
      <p style={{ marginTop: 10 }}>
        Entered: <span data-testid={`${testIdPrefix}-entered`}>{latestCounts.entered}</span>
      </p>
      <p>
        Left: <span data-testid={`${testIdPrefix}-left`}>{latestCounts.left}</span>
      </p>
      <p>
        Total events: <span data-testid={`${testIdPrefix}-total`}>{events.length}</span>
      </p>
      <p>
        Latest type:{' '}
        <span data-testid={`${testIdPrefix}-latest-type`}>{latestEvent?.type ?? 'none'}</span>
      </p>
      <p>
        Latest initial:{' '}
        <span data-testid={`${testIdPrefix}-latest-initial`}>
          {latestEvent ? String(latestEvent.isInitial) : 'none'}
        </span>
      </p>
      <p>
        Latest movement:{' '}
        <span data-testid={`${testIdPrefix}-latest-movement`}>
          {latestEvent?.movementDirection ?? 'none'}
        </span>
      </p>
      <p>
        Latest position:{' '}
        <span data-testid={`${testIdPrefix}-latest-position`}>
          {latestEvent?.position ?? 'none'}
        </span>
      </p>
    </aside>
  );
}

export function DeterministicInteractionHarness({
  once = false,
  oncePerDirection = false,
  fireOnInitialVisible = false,
  initialVerticalScrollTop = 0,
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
    const verticalSentinel = verticalRoot?.querySelector('.deterministic-vertical-sentinel');
    const horizontalSentinel = horizontalRoot?.querySelector('.deterministic-horizontal-sentinel');

    if (
      !(verticalRoot instanceof HTMLDivElement) ||
      !(horizontalRoot instanceof HTMLDivElement) ||
      !(verticalSentinel instanceof HTMLDivElement) ||
      !(horizontalSentinel instanceof HTMLDivElement)
    ) {
      setHarnessReady(false);
      return;
    }

    Object.defineProperty(verticalRoot, 'getBoundingClientRect', {
      configurable: true,
      value: () => new DOMRect(0, 0, 200, 180),
    });
    Object.defineProperty(horizontalRoot, 'getBoundingClientRect', {
      configurable: true,
      value: () => new DOMRect(0, 0, 200, 120),
    });
    Object.defineProperty(verticalSentinel, 'getBoundingClientRect', {
      configurable: true,
      value: () => new DOMRect(0, 260 - verticalScrollTopRef.current, 10, 10),
    });
    Object.defineProperty(horizontalSentinel, 'getBoundingClientRect', {
      configurable: true,
      value: () => new DOMRect(260 - horizontalScrollLeftRef.current, 0, 2, 160),
    });

    verticalScrollTopRef.current = initialVerticalScrollTop;
    horizontalScrollLeftRef.current = 0;
    const readyId = window.requestAnimationFrame(() => {
      setHarnessReady(true);
    });

    return () => {
      window.cancelAnimationFrame(readyId);
    };
  }, [initialVerticalScrollTop, triggerKey]);

  const handleEvent = React.useCallback((event: AtomTriggerEvent) => {
    setEvents(prev => [event, ...prev].slice(0, 12));
  }, []);

  const scrollVertical = React.useCallback((nextTop: number) => {
    const root = verticalRootRef.current;
    if (!root) {
      return;
    }

    verticalScrollTopRef.current = nextTop;
    root.dispatchEvent(
      new root.ownerDocument.defaultView!.Event('scroll', {
        bubbles: true,
      }),
    );
  }, []);

  const scrollHorizontal = React.useCallback((nextLeft: number) => {
    const root = horizontalRootRef.current;
    if (!root) {
      return;
    }

    horizontalScrollLeftRef.current = nextLeft;
    root.dispatchEvent(
      new root.ownerDocument.defaultView!.Event('scroll', {
        bubbles: true,
      }),
    );
  }, []);

  const emitEnter = React.useCallback(() => {
    scrollVertical(120);
  }, [scrollVertical]);

  const emitLeave = React.useCallback(() => {
    scrollVertical(280);
  }, [scrollVertical]);

  const runVerticalSequence = React.useCallback(() => {
    scrollVertical(0);

    window.requestAnimationFrame(() => {
      scrollVertical(120);
      window.requestAnimationFrame(() => {
        scrollVertical(280);
      });
    });
  }, [scrollVertical]);

  const runHorizontalSequence = React.useCallback(() => {
    scrollHorizontal(0);

    window.requestAnimationFrame(() => {
      scrollHorizontal(120);
      window.requestAnimationFrame(() => {
        scrollHorizontal(320);
      });
    });
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
          <p style={{ margin: '0 0 12px' }}>Deterministic geometry harness for transition tests.</p>

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
              className="atom-trigger-sentinel deterministic-vertical-sentinel"
              once={once}
              oncePerDirection={oncePerDirection}
              fireOnInitialVisible={fireOnInitialVisible}
              rootRef={verticalRootRef}
              onEvent={handleEvent}
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
                className="atom-trigger-sentinel--vertical deterministic-horizontal-sentinel"
                once={once}
                oncePerDirection={oncePerDirection}
                fireOnInitialVisible={fireOnInitialVisible}
                rootRef={horizontalRootRef}
                onEvent={handleEvent}
              />
              <div style={{ width: 260, minWidth: 260, padding: '0 12px' }}>
                <em>Horizontal right spacer</em>
              </div>
            </div>
          </div>
        </div>
      </section>

      <CounterPanel
        title="Interaction counters"
        testIdPrefix="deterministic"
        events={events}
        harnessReady={harnessReady}
      />
    </div>
  );
}

export function MultiSentinelInteractionHarness() {
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

    Object.defineProperty(sharedRoot, 'getBoundingClientRect', {
      configurable: true,
      value: () => new DOMRect(0, 0, 200, 180),
    });
    Object.defineProperty(horizontalFirst, 'getBoundingClientRect', {
      configurable: true,
      value: () => new DOMRect(40, 260 - scrollTopRef.current, 120, 2),
    });
    Object.defineProperty(horizontalSecond, 'getBoundingClientRect', {
      configurable: true,
      value: () => new DOMRect(40, 290 - scrollTopRef.current, 120, 2),
    });
    Object.defineProperty(verticalThird, 'getBoundingClientRect', {
      configurable: true,
      value: () => new DOMRect(260 - scrollLeftRef.current, 10, 2, 160),
    });
    Object.defineProperty(verticalFourth, 'getBoundingClientRect', {
      configurable: true,
      value: () => new DOMRect(275 - scrollLeftRef.current, 10, 2, 160),
    });

    scrollTopRef.current = 0;
    scrollLeftRef.current = 0;
    const readyId = window.requestAnimationFrame(() => {
      setHarnessReady(true);
    });

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
    root.dispatchEvent(
      new root.ownerDocument.defaultView!.Event('scroll', {
        bubbles: true,
      }),
    );
  }, []);

  const scrollHorizontal = React.useCallback((nextLeft: number) => {
    const root = sharedRootRef.current;
    if (!root) {
      return;
    }

    scrollLeftRef.current = nextLeft;
    root.dispatchEvent(
      new root.ownerDocument.defaultView!.Event('scroll', {
        bubbles: true,
      }),
    );
  }, []);

  const runVerticalSequence = React.useCallback(() => {
    scrollVertical(0);

    window.requestAnimationFrame(() => {
      scrollVertical(120);
      window.requestAnimationFrame(() => {
        scrollVertical(320);
      });
    });
  }, [scrollVertical]);

  const runHorizontalSequence = React.useCallback(() => {
    scrollHorizontal(0);

    window.requestAnimationFrame(() => {
      scrollHorizontal(120);
      window.requestAnimationFrame(() => {
        scrollHorizontal(280);
      });
    });
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
                onEvent={event => {
                  setFirstEvents(prev => [event, ...prev].slice(0, 12));
                }}
              />
              <AtomTrigger
                key={`multi-horizontal-second-${triggerKey}`}
                className="atom-trigger-sentinel multi-horizontal-second"
                rootRef={sharedRootRef}
                onEvent={event => {
                  setSecondEvents(prev => [event, ...prev].slice(0, 12));
                }}
              />
              <AtomTrigger
                key={`multi-vertical-third-${triggerKey}`}
                className="atom-trigger-sentinel--vertical multi-vertical-third"
                rootRef={sharedRootRef}
                onEvent={event => {
                  setThirdEvents(prev => [event, ...prev].slice(0, 12));
                }}
              />
              <AtomTrigger
                key={`multi-vertical-fourth-${triggerKey}`}
                className="atom-trigger-sentinel--vertical multi-vertical-fourth"
                rootRef={sharedRootRef}
                onEvent={event => {
                  setFourthEvents(prev => [event, ...prev].slice(0, 12));
                }}
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

export function FixedHeaderViewportHarness() {
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
            onEvent={event => {
              setEvents(prev => [event, ...prev].slice(0, 12));
            }}
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

export function ChildModeInteractionHarness({ threshold = 0 }: ChildModeInteractionHarnessProps) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const scrollTopRef = React.useRef(0);
  const [harnessReady, setHarnessReady] = React.useState(false);
  const [triggerKey, setTriggerKey] = React.useState(0);
  const [currentScrollTop, setCurrentScrollTop] = React.useState(0);
  const [events, setEvents] = React.useState<AtomTriggerEvent[]>([]);

  React.useLayoutEffect(() => {
    const root = rootRef.current;
    const child = root?.querySelector('.deterministic-child-observed');

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
            Deterministic child observation harness. The card is the observed element.
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
              onEvent={event => {
                setEvents(prev => [event, ...prev].slice(0, 12));
              }}
            >
              <article
                className="deterministic-child-observed"
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
