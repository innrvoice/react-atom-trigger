import React from 'react';
import { AtomTrigger } from '../../index';
import { EventLogPanel } from './EventLogPanel';
import {
  demoScrollContainerStyle,
  demoTwoColumnLayoutStyle,
  useDemoEvents,
} from './DemoLayoutShared';

export type ChildModeDemoProps = {
  rootMargin?: string;
  threshold?: number;
};

const childCardStyle: React.CSSProperties = {
  border: '1px solid #8b5cf6',
  minHeight: 200,
  padding: 20,
  background:
    'linear-gradient(135deg, rgba(76, 29, 149, 0.22), rgba(124, 58, 237, 0.18) 55%, rgba(255, 255, 255, 0.96))',
  boxShadow: '0 18px 40px rgba(76, 29, 149, 0.18)',
  color: '#2e1065',
};

function ChildThresholdMeter({ threshold }: { threshold: number }) {
  if (threshold <= 0) {
    return null;
  }

  return (
    <div style={{ marginTop: 16 }}>
      <p style={{ margin: 0, color: '#6d28d9', fontSize: 13 }}>
        Enter waits for roughly {Math.round(threshold * 100)}% of this card to become visible.
      </p>
    </div>
  );
}

export function ChildModeDemo({ rootMargin = '0px', threshold = 0 }: ChildModeDemoProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { events, handleEvent } = useDemoEvents();

  return (
    <div style={demoTwoColumnLayoutStyle}>
      <section>
        <p style={{ margin: '0 0 12px' }}>
          Scroll inside the box. In child mode, the card itself is the observed element rather than
          an internal sentinel.
        </p>

        <div ref={containerRef} style={demoScrollContainerStyle}>
          <div style={{ height: 460 }}>
            <p style={{ marginTop: 0 }}>
              <em>Top spacer</em>
            </p>
            <p>Keep scrolling until the observed card enters the scroll root.</p>
          </div>

          <AtomTrigger
            rootRef={containerRef}
            rootMargin={rootMargin}
            threshold={threshold}
            onEvent={handleEvent}
          >
            <article style={childCardStyle}>
              <p
                style={{
                  margin: '0 0 8px',
                  fontSize: 12,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#6d28d9',
                }}
              >
                Child Mode
              </p>
              <h3 style={{ margin: '0 0 8px', fontSize: 20 }}>Observed card</h3>
              <p style={{ margin: 0, lineHeight: 1.5 }}>
                This block is measured directly, so the threshold is based on the real card size.
              </p>
              <ChildThresholdMeter threshold={threshold} />
            </article>
          </AtomTrigger>

          <div style={{ height: 420, paddingTop: 12 }}>
            <p>
              <em>Bottom spacer</em>
            </p>
          </div>
        </div>
      </section>

      <div style={{ display: 'grid', gap: 12 }}>
        <EventLogPanel events={events} />
        <aside
          style={{
            width: 360,
            border: '1px solid #d1d5db',
            background: '#f9fafb',
            padding: 12,
          }}
        >
          <strong>Child mode notes</strong>
          <p style={{ marginTop: 10 }}>
            Threshold: <code>{threshold}</code>
          </p>
          <p style={{ marginBottom: 0 }}>
            rootMargin: <code>{rootMargin}</code>
          </p>
        </aside>
      </div>
    </div>
  );
}
