import React from 'react';
import type { AtomTriggerEvent } from '../../index';

function formatEvent(event: AtomTriggerEvent): string {
  return `${event.type} | initial: ${event.isInitial ? 'yes' : 'no'} | position: ${event.position} | movement: ${event.movementDirection} | ratio: ${event.entry.intersectionRatio.toFixed(2)}`;
}

export function EventLogPanel({ events }: { events: AtomTriggerEvent[] }) {
  const latestEvent = events[0];

  return (
    <aside
      style={{
        position: 'relative',
        width: 360,
        border: '1px solid #d1d5db',
        background: '#f9fafb',
        padding: 12,
        zIndex: 20,
      }}
    >
      <strong>Last Event</strong>

      <div
        style={{
          marginTop: 10,
          borderTop: '1px solid #e5e7eb',
          paddingTop: 10,
        }}
      >
        {!latestEvent ? (
          <p style={{ margin: 0, color: '#6b7280' }}>No events yet.</p>
        ) : (
          <p style={{ margin: 0 }}>{formatEvent(latestEvent)}</p>
        )}
      </div>
    </aside>
  );
}
