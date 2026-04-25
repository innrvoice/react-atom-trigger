import React from 'react';
import { AtomTrigger } from '../../index';
import { EventLogPanel } from './EventLogPanel';
import {
  demoScrollContainerStyle,
  demoTwoColumnLayoutStyle,
  type DemoProps,
  useDemoEvents,
} from './DemoLayoutShared';

export { type DemoProps } from './DemoLayoutShared';

export function AtomTriggerDemo({
  once = false,
  oncePerDirection = false,
  fireOnInitialVisible = false,
  rootMargin = '0px',
  threshold = 0,
  initialScrollTop = 0,
  onEnter,
  onLeave,
  onEvent,
}: DemoProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { events, handleEvent } = useDemoEvents(onEvent);

  React.useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    container.scrollTop = initialScrollTop;
  }, [initialScrollTop]);

  return (
    <div style={demoTwoColumnLayoutStyle}>
      <section>
        <p style={{ margin: '0 0 12px' }}>
          {initialScrollTop > 0
            ? 'This demo loads partway down the scroll area so the trigger starts visible.'
            : 'Scroll inside the box. The violet line is the sentinel.'}
        </p>

        <div ref={containerRef} style={demoScrollContainerStyle}>
          <div style={{ height: 500 }}>
            <p style={{ marginTop: 0 }}>
              <em>Top spacer</em>
            </p>
            <p>Keep scrolling to reach the trigger.</p>
          </div>

          <AtomTrigger
            className="atom-trigger-sentinel"
            rootRef={containerRef}
            rootMargin={rootMargin}
            threshold={threshold}
            once={once}
            oncePerDirection={oncePerDirection}
            fireOnInitialVisible={fireOnInitialVisible}
            onEnter={onEnter}
            onLeave={onLeave}
            onEvent={handleEvent}
          />

          <div style={{ height: 500, paddingTop: 8 }}>
            <p>
              <em>Bottom spacer</em>
            </p>
          </div>
        </div>
      </section>

      <EventLogPanel events={events} />
    </div>
  );
}

type FixedHeaderDemoProps = Pick<
  DemoProps,
  'once' | 'oncePerDirection' | 'threshold' | 'onEnter' | 'onLeave' | 'onEvent'
> & {
  headerHeight?: number;
};

export function FixedHeaderOffsetDemo({
  headerHeight = 100,
  once = false,
  oncePerDirection = false,
  threshold = 0,
  onEnter,
  onLeave,
  onEvent,
}: FixedHeaderDemoProps) {
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const { events, handleEvent } = useDemoEvents(onEvent);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(520px, 1fr) 360px',
        gap: 16,
        alignItems: 'start',
        width: '100%',
        padding: 20,
        fontFamily: 'sans-serif',
      }}
    >
      <div
        ref={viewportRef}
        style={{
          height: 'min(1000px, calc(100vh - 40px))',
          overflowY: 'auto',
          border: '1px solid #d1d5db',
          background: '#fff',
          width: 550,
        }}
      >
        <div
          style={{
            position: 'sticky',
            top: 0,
            height: headerHeight,
            background: '#4c1d95',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 5,
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
          }}
        >
          Fixed header (100px)
        </div>

        <div style={{ padding: 16 }}>
          <p style={{ margin: 0 }}>
            This uses <code>rootMargin: -100px 0px 0px 0px</code> so the trigger starts below the
            fixed header, not behind it.
          </p>

          <div style={{ height: 1000, paddingTop: 20 }}>
            <p>
              <em>Top content. Scroll down.</em>
            </p>
          </div>

          <AtomTrigger
            className="atom-trigger-sentinel"
            rootRef={viewportRef}
            rootMargin={`-${headerHeight}px 0px 0px 0px`}
            threshold={threshold}
            once={once}
            oncePerDirection={oncePerDirection}
            onEnter={onEnter}
            onLeave={onLeave}
            onEvent={handleEvent}
          />

          <div style={{ height: 1200, paddingTop: 8 }}>
            <p>
              <em>Bottom content.</em>
            </p>
          </div>
        </div>
      </div>

      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 100 }}>
        <EventLogPanel events={events} />
      </div>
    </div>
  );
}

export function FixedHeaderOffsetViewportDemo({
  headerHeight = 100,
  once = false,
  oncePerDirection = false,
  threshold = 0,
  onEnter,
  onLeave,
  onEvent,
}: FixedHeaderDemoProps) {
  const { events, handleEvent } = useDemoEvents(onEvent);

  return (
    <div style={{ display: 'flex', width: '100%', padding: 20, fontFamily: 'sans-serif' }}>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: headerHeight,
          background: '#4c1d95',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 30,
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
        }}
      >
        Fixed header (100px, viewport root)
      </div>

      <div style={{ background: '#fff', width: 550 }}>
        <div style={{ padding: 16, marginTop: headerHeight }}>
          <p style={{ margin: 0 }}>
            No <code>rootRef</code> here. This uses viewport root with{' '}
            <code>rootMargin: -100px 0px 0px 0px</code>. It is the same fixed-header idea, just with
            the browser viewport as the root.
          </p>

          <div style={{ height: 1400, paddingTop: 20 }}>
            <p>
              <em>Top content. Scroll page down.</em>
            </p>
          </div>

          <AtomTrigger
            className="atom-trigger-sentinel"
            rootMargin={`-${headerHeight}px 0px 0px 0px`}
            threshold={threshold}
            once={once}
            oncePerDirection={oncePerDirection}
            onEnter={onEnter}
            onLeave={onLeave}
            onEvent={handleEvent}
          />

          <div style={{ height: 1600, paddingTop: 8 }}>
            <p>
              <em>Bottom content.</em>
            </p>
          </div>
        </div>
      </div>

      <div style={{ position: 'fixed', top: headerHeight + 16, right: 16 }}>
        <EventLogPanel events={events} />
      </div>
    </div>
  );
}

type HorizontalScrollDemoProps = Pick<
  DemoProps,
  'once' | 'oncePerDirection' | 'threshold' | 'rootMargin' | 'onEnter' | 'onLeave' | 'onEvent'
>;

export function HorizontalScrollDemo({
  once = false,
  oncePerDirection = false,
  threshold = 0,
  rootMargin = '0px',
  onEnter,
  onLeave,
  onEvent,
}: HorizontalScrollDemoProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { events, handleEvent } = useDemoEvents(onEvent);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(560px, 720px) 360px',
        gap: 16,
        width: '100%',
        alignItems: 'start',
      }}
    >
      <section>
        <p style={{ margin: '0 0 12px' }}>
          Scroll horizontally inside the box. The violet vertical line is the sentinel.
        </p>
        <div
          ref={containerRef}
          style={{
            border: '1px solid #d1d5db',
            background: '#fff',
            height: 220,
            overflowX: 'auto',
            overflowY: 'hidden',
            whiteSpace: 'nowrap',
            padding: '16px 0',
          }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', height: '100%' }}>
            <div
              style={{
                width: 1000,
                minWidth: 1000,
                padding: '0 16px',
                boxSizing: 'border-box',
              }}
            >
              <p style={{ margin: 0 }}>
                <em>Left spacer</em>
              </p>
              <p style={{ margin: '8px 0 0' }}>Keep scrolling right to reach the trigger.</p>
            </div>

            <AtomTrigger
              className="atom-trigger-sentinel--vertical"
              rootRef={containerRef}
              rootMargin={rootMargin}
              threshold={threshold}
              once={once}
              oncePerDirection={oncePerDirection}
              onEnter={onEnter}
              onLeave={onLeave}
              onEvent={handleEvent}
            />

            <div
              style={{
                width: 500,
                minWidth: 500,
                padding: '0 16px',
                boxSizing: 'border-box',
              }}
            >
              <p style={{ margin: 0 }}>
                <em>Right spacer</em>
              </p>
              <p style={{ margin: '8px 0 0' }}>
                Scroll back left to trigger the reverse transition.
              </p>
            </div>
          </div>
        </div>
      </section>

      <EventLogPanel events={events} />
    </div>
  );
}
