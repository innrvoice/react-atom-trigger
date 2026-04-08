import React from 'react';
import type { AtomTriggerEvent } from '../../index';

export type DemoProps = {
  once?: boolean;
  oncePerDirection?: boolean;
  fireOnInitialVisible?: boolean;
  rootMargin?: string;
  threshold?: number;
  initialScrollTop?: number;
};

export const demoTwoColumnLayoutStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(420px, 520px) 360px',
  gap: 16,
  alignItems: 'start',
  fontFamily: 'sans-serif',
};

export const demoScrollContainerStyle: React.CSSProperties = {
  border: '1px solid #d1d5db',
  height: 300,
  overflowY: 'auto',
  padding: 16,
  background: '#fff',
};

export function useDemoEvents() {
  const [events, setEvents] = React.useState<AtomTriggerEvent[]>([]);

  const handleEvent = React.useCallback((event: AtomTriggerEvent) => {
    setEvents(prev => [event, ...prev].slice(0, 12));
  }, []);

  return {
    events,
    latestEvent: events[0],
    handleEvent,
  };
}
