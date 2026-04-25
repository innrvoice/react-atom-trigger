import React from 'react';
import type { AtomTriggerEvent, AtomTriggerProps } from '../../index';

export type DemoProps = Pick<
  AtomTriggerProps,
  'once' | 'oncePerDirection' | 'fireOnInitialVisible' | 'threshold'
> & {
  rootMargin?: string;
  initialScrollTop?: number;
  onEnter?: AtomTriggerProps['onEnter'];
  onLeave?: AtomTriggerProps['onLeave'];
  onEvent?: AtomTriggerProps['onEvent'];
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

export function useDemoEvents(forwardEvent?: AtomTriggerProps['onEvent']) {
  const [events, setEvents] = React.useState<AtomTriggerEvent[]>([]);

  const handleEvent = React.useCallback(
    (event: AtomTriggerEvent) => {
      setEvents(prev => [event, ...prev].slice(0, 12));
      forwardEvent?.(event);
    },
    [forwardEvent],
  );

  return {
    events,
    handleEvent,
  };
}
