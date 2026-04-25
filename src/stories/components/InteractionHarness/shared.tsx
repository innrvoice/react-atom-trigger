import React from 'react';
import type { AtomTriggerEvent, AtomTriggerProps } from '../../../index';

export type InteractionHarnessProps = {
  once?: boolean;
  oncePerDirection?: boolean;
  fireOnInitialVisible?: boolean;
  initialVerticalScrollTop?: number;
} & Pick<AtomTriggerProps, 'onEnter' | 'onLeave' | 'onEvent'>;

export type ChildModeInteractionHarnessProps = {
  threshold?: number;
} & Pick<AtomTriggerProps, 'onEnter' | 'onLeave' | 'onEvent'>;

export type SharedHarnessEventCallbacks = Pick<AtomTriggerProps, 'onEnter' | 'onLeave' | 'onEvent'>;

export function addHarnessEvent(
  setEvents: React.Dispatch<React.SetStateAction<AtomTriggerEvent[]>>,
  event: AtomTriggerEvent,
  forwardEvent?: AtomTriggerProps['onEvent'],
): void {
  setEvents(prev => [event, ...prev].slice(0, 12));
  forwardEvent?.(event);
}

export function mockElementRect(element: Element, readRect: () => DOMRectReadOnly): void {
  Object.defineProperty(element, 'getBoundingClientRect', {
    configurable: true,
    value: readRect,
  });
}

export function dispatchElementScroll(element: Element): void {
  element.dispatchEvent(
    new element.ownerDocument.defaultView!.Event('scroll', {
      bubbles: true,
    }),
  );
}

export function markHarnessReady(
  setHarnessReady: React.Dispatch<React.SetStateAction<boolean>>,
): number {
  return window.requestAnimationFrame(() => {
    setHarnessReady(true);
  });
}

export function runFrameSequence(callbacks: readonly (() => void)[]): void {
  const [callback, ...remainingCallbacks] = callbacks;
  if (!callback) {
    return;
  }

  window.requestAnimationFrame(() => {
    callback();
    runFrameSequence(remainingCallbacks);
  });
}

export function CounterPanel({
  title,
  testIdPrefix,
  events,
  harnessReady,
}: {
  title: string;
  testIdPrefix?: string;
  events: AtomTriggerEvent[];
  harnessReady: boolean;
}) {
  const latestCounts = events[0]?.counts ?? { entered: 0, left: 0 };
  const latestEvent = events[0];
  const getTestId = (name: string) => (testIdPrefix ? `${testIdPrefix}-${name}` : name);

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
        <span data-testid={getTestId('observer-ready')}>{harnessReady ? 'true' : 'false'}</span>
      </p>
      <p style={{ marginTop: 10 }}>
        Entered: <span data-testid={getTestId('entered')}>{latestCounts.entered}</span>
      </p>
      <p>
        Left: <span data-testid={getTestId('left')}>{latestCounts.left}</span>
      </p>
      <p>
        Total events: <span data-testid={getTestId('total')}>{events.length}</span>
      </p>
      <p>
        Latest type:{' '}
        <span data-testid={getTestId('latest-type')}>{latestEvent?.type ?? 'none'}</span>
      </p>
      <p>
        Latest initial:{' '}
        <span data-testid={getTestId('latest-initial')}>
          {latestEvent ? String(latestEvent.isInitial) : 'none'}
        </span>
      </p>
      <p>
        Latest movement:{' '}
        <span data-testid={getTestId('latest-movement')}>
          {latestEvent?.movementDirection ?? 'none'}
        </span>
      </p>
      <p>
        Latest position:{' '}
        <span data-testid={getTestId('latest-position')}>{latestEvent?.position ?? 'none'}</span>
      </p>
    </aside>
  );
}
