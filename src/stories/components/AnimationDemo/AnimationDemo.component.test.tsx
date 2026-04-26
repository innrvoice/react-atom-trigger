import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AtomTriggerEvent, AtomTriggerProps } from '../../../index';

const atomTriggerProps: AtomTriggerProps[] = [];

type MockAircraftProps = {
  mode: string;
  direction: string | null;
  onFlightComplete?: () => void;
};

vi.mock('../../../index', async () => {
  const actual = await vi.importActual<typeof import('../../../index')>('../../../index');

  return {
    ...actual,
    AtomTrigger: (props: AtomTriggerProps) => {
      atomTriggerProps.push(props);

      return (
        <div className={props.className} data-testid={`mock-trigger-${atomTriggerProps.length}`} />
      );
    },
  };
});

vi.mock('./Plane', () => ({
  Plane: ({ mode, direction, onFlightComplete }: MockAircraftProps) => (
    <div
      data-testid="mock-plane"
      data-mode={mode}
      data-direction={direction ?? ''}
      onTransitionEnd={onFlightComplete}
    />
  ),
}));

vi.mock('./Heli', () => ({
  Helicopter: ({ mode, direction, onFlightComplete }: MockAircraftProps) => (
    <div
      data-testid="mock-helicopter"
      data-mode={mode}
      data-direction={direction ?? ''}
      onTransitionEnd={onFlightComplete}
    />
  ),
}));

vi.mock('./Scene', () => ({
  Scene: ({ mode }: { mode: string }) => <div data-testid="mock-scene">{mode}</div>,
}));

import { AnimationDemo } from './AnimationDemo';

function createEvent(movementDirection: AtomTriggerEvent['movementDirection']): AtomTriggerEvent {
  return {
    type: 'enter',
    isInitial: false,
    entry: {
      target: document.createElement('div'),
      rootBounds: new DOMRect(0, 0, 320, 240),
      boundingClientRect: new DOMRect(0, 0, 24, 24),
      intersectionRect: new DOMRect(0, 0, 24, 24),
      isIntersecting: true,
      intersectionRatio: 1,
      source: 'geometry',
    },
    counts: {
      entered: 1,
      left: 0,
    },
    movementDirection,
    position: 'inside',
    timestamp: 1,
  };
}

function setRect(element: Element, top: number): void {
  Object.defineProperty(element, 'getBoundingClientRect', {
    configurable: true,
    value: () => new DOMRect(0, top, 120, 24),
  });
}

function setupScrollGeometry(): HTMLDivElement {
  const root = screen.getByTestId('animation-demo-scroll-root');

  if (!(root instanceof HTMLDivElement)) {
    throw new Error('Scroll root not found');
  }

  Object.defineProperty(root, 'scrollTop', {
    configurable: true,
    writable: true,
    value: 0,
  });
  Object.defineProperty(root, 'clientHeight', {
    configurable: true,
    value: 200,
  });
  Object.defineProperty(root, 'scrollHeight', {
    configurable: true,
    value: 1400,
  });
  Object.defineProperty(root, 'getBoundingClientRect', {
    configurable: true,
    value: () => new DOMRect(0, 10, 320, 200),
  });
  Object.defineProperty(root, 'scrollTo', {
    configurable: true,
    value: ({ top }: { top: number }) => {
      root.scrollTop = top;
    },
  });

  const dayRow = screen.getByText('Day trigger').parentElement;
  const middleRow = screen.getByText('Sunset / sunrise trigger').parentElement;
  const nightRow = screen.getByText('Night trigger').parentElement;

  if (!dayRow || !middleRow || !nightRow) {
    throw new Error('Trigger rows not found');
  }

  setRect(dayRow, 80);
  setRect(middleRow, 420);
  setRect(nightRow, 760);

  return root;
}

describe('AnimationDemo component behavior', () => {
  beforeEach(() => {
    atomTriggerProps.length = 0;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('maps upward trigger movement to the downward sunset transition', () => {
    render(<AnimationDemo defaultShowTriggers scrollBehavior="instant" />);

    const middleTriggerOnEnter = atomTriggerProps[1]?.onEnter;

    act(() => {
      middleTriggerOnEnter?.(createEvent('up'));
    });

    expect(screen.getByTestId('animation-demo-mode').textContent).toContain('Sunset');
    expect(screen.getByTestId('animation-demo-aircraft').textContent).toContain('Plane + heli');
    expect(screen.getByTestId('animation-demo-last-event').textContent).toContain('moving down');
  });

  it('scrolls the root and updates state when using a jump control', () => {
    render(<AnimationDemo defaultShowTriggers scrollBehavior="instant" />);
    const root = setupScrollGeometry();

    fireEvent.click(screen.getByRole('button', { name: /jump to sunset/i }));

    expect(root.scrollTop).toBe(410);
    expect(screen.getByTestId('animation-demo-mode').textContent).toContain('Sunset');
    expect(screen.getByTestId('animation-demo-transition-count').textContent).toContain('1');
    expect(screen.getByTestId('animation-demo-last-event').textContent).toContain('moving down');
  });

  it('keeps in-flight aircraft mounted and retints them when the scene changes again', () => {
    render(<AnimationDemo defaultShowTriggers scrollBehavior="instant" />);

    const middleTriggerOnEnter = atomTriggerProps[1]?.onEnter;
    const bottomTriggerOnEnter = atomTriggerProps[2]?.onEnter;

    act(() => {
      middleTriggerOnEnter?.(createEvent('up'));
    });

    expect(screen.getAllByTestId('mock-plane')).toHaveLength(1);
    expect(screen.getAllByTestId('mock-plane')[0]?.getAttribute('data-mode')).toBe('sunset');
    expect(screen.getAllByTestId('mock-helicopter')).toHaveLength(1);
    expect(screen.getAllByTestId('mock-helicopter')[0]?.getAttribute('data-mode')).toBe('sunset');

    act(() => {
      bottomTriggerOnEnter?.(createEvent('up'));
    });

    const planes = screen.getAllByTestId('mock-plane');
    const helicopters = screen.getAllByTestId('mock-helicopter');
    expect(planes).toHaveLength(2);
    expect(helicopters).toHaveLength(1);
    expect(planes[0]?.getAttribute('data-mode')).toBe('night');
    expect(planes[1]?.getAttribute('data-mode')).toBe('night');
    expect(helicopters[0]?.getAttribute('data-mode')).toBe('night');

    fireEvent.transitionEnd(planes[0]);

    expect(screen.getAllByTestId('mock-plane')).toHaveLength(1);
  });

  it('resets the scroll position and returns to the configured initial mode', () => {
    render(<AnimationDemo initialMode="sunset" defaultShowTriggers scrollBehavior="instant" />);
    const root = setupScrollGeometry();

    fireEvent.click(screen.getByRole('button', { name: /jump to night/i }));

    expect(root.scrollTop).toBe(750);
    expect(screen.getByTestId('animation-demo-mode').textContent).toContain('Night');

    fireEvent.click(screen.getByRole('button', { name: /reset demo/i }));

    expect(root.scrollTop).toBe(0);
    expect(screen.getByTestId('animation-demo-mode').textContent).toContain('Sunset');
    expect(screen.getByTestId('animation-demo-transition-count').textContent).toContain('0');
    expect(screen.getByTestId('animation-demo-last-event').textContent).toContain(
      'No trigger crossed yet',
    );
  });
});
