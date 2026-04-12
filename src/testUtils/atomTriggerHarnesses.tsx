import React from 'react';
import { render } from '@testing-library/react';
import { vi } from 'vitest';
import { AtomTrigger } from '../index';
import type { AtomTriggerEvent, AtomTriggerProps } from '../index';
import { getActiveScrollPosition, setActiveScrollPosition, setRect } from './domEnvironment';

export type RootGeometryOptions = {
  rootMargin?: AtomTriggerProps['rootMargin'];
  once?: boolean;
  oncePerDirection?: boolean;
  fireOnInitialVisible?: boolean;
  disabled?: boolean;
  threshold?: unknown;
  initialScrollTop?: number;
  initialScrollLeft?: number;
  onEnter?: (event: AtomTriggerEvent) => void;
  onLeave?: (event: AtomTriggerEvent) => void;
  onEvent?: (event: AtomTriggerEvent) => void;
};

export type RootHarness = {
  root: HTMLDivElement;
};

export type ViewportHarness = {
  container: HTMLElement;
};

export type ZeroSizeRootHarness = {
  root: HTMLDivElement;
};

export type SharedRootHarness = {
  root: HTMLDivElement;
  onEnterFirst: (...args: unknown[]) => unknown;
  onEnterSecond: (...args: unknown[]) => unknown;
  getRootRectCalls: () => number;
  resetRootRectCalls: () => void;
};

export type MeasuredRootHarness = {
  root: HTMLDivElement;
  getRootRectCalls: () => number;
  resetRootRectCalls: () => void;
};

export type ChildRootHarness = {
  root: HTMLDivElement;
  child: HTMLDivElement;
};

export function setupRootHarness(options: RootGeometryOptions = {}): RootHarness {
  const rootRef = React.createRef<HTMLDivElement>();
  setActiveScrollPosition(options.initialScrollTop ?? 0, options.initialScrollLeft ?? 0);

  const view = render(
    <div ref={rootRef} data-testid="root">
      <AtomTrigger
        className="atom-trigger-sentinel"
        rootRef={rootRef}
        rootMargin={options.rootMargin}
        once={options.once}
        oncePerDirection={options.oncePerDirection}
        fireOnInitialVisible={options.fireOnInitialVisible}
        threshold={options.threshold as number | undefined}
        onEnter={options.onEnter}
        onLeave={options.onLeave}
        onEvent={options.onEvent}
      />
    </div>,
  );

  const root = view.getByTestId('root');
  const sentinel = view.container.querySelector('.atom-trigger-sentinel');

  if (!(sentinel instanceof HTMLDivElement)) {
    throw new Error('Sentinel not found');
  }

  setRect(root, () => new DOMRect(0, 0, 200, 200));
  setRect(sentinel, () => {
    const activeScroll = getActiveScrollPosition();
    return new DOMRect(activeScroll.left, 260 - activeScroll.top, 10, 10);
  });

  if (!(root instanceof HTMLDivElement)) {
    throw new Error('Root not found');
  }

  return { root };
}

export function setupViewportHarness(options: RootGeometryOptions = {}): ViewportHarness {
  setActiveScrollPosition(options.initialScrollTop ?? 0, options.initialScrollLeft ?? 0);

  const view = render(
    <div>
      <AtomTrigger
        className="atom-trigger-sentinel"
        rootMargin={options.rootMargin}
        once={options.once}
        oncePerDirection={options.oncePerDirection}
        fireOnInitialVisible={options.fireOnInitialVisible}
        threshold={options.threshold as number | undefined}
        onEnter={options.onEnter}
        onLeave={options.onLeave}
        onEvent={options.onEvent}
      />
    </div>,
  );

  const sentinel = view.container.querySelector('.atom-trigger-sentinel');

  if (!(sentinel instanceof HTMLDivElement)) {
    throw new Error('Sentinel not found');
  }

  setRect(sentinel, () => {
    const activeScroll = getActiveScrollPosition();
    return new DOMRect(activeScroll.left, 220 - activeScroll.top, 10, 10);
  });

  return { container: view.container };
}

export function setupZeroSizeRootHarness(options: RootGeometryOptions = {}): ZeroSizeRootHarness {
  const rootRef = React.createRef<HTMLDivElement>();
  setActiveScrollPosition(options.initialScrollTop ?? 0, options.initialScrollLeft ?? 0);

  const view = render(
    <div ref={rootRef} data-testid="root">
      <AtomTrigger
        rootRef={rootRef}
        rootMargin={options.rootMargin}
        once={options.once}
        oncePerDirection={options.oncePerDirection}
        fireOnInitialVisible={options.fireOnInitialVisible}
        threshold={options.threshold as number | undefined}
        onEnter={options.onEnter}
        onLeave={options.onLeave}
        onEvent={options.onEvent}
      />
    </div>,
  );

  const root = view.getByTestId('root');
  const sentinel = root.querySelector('div');

  if (!(sentinel instanceof HTMLDivElement)) {
    throw new Error('Sentinel not found');
  }

  setRect(root, () => new DOMRect(0, 0, 200, 200));
  setRect(sentinel, () => {
    const activeScroll = getActiveScrollPosition();
    return new DOMRect(activeScroll.left, 260 - activeScroll.top, 0, 0);
  });

  if (!(root instanceof HTMLDivElement)) {
    throw new Error('Root not found');
  }

  return { root };
}

export function setupSharedRootHarness(): SharedRootHarness {
  const rootRef = React.createRef<HTMLDivElement>();
  const onEnterFirst = vi.fn();
  const onEnterSecond = vi.fn();

  const view = render(
    <div ref={rootRef} data-testid="root">
      <AtomTrigger className="atom-trigger-first" rootRef={rootRef} onEnter={onEnterFirst} />
      <AtomTrigger className="atom-trigger-second" rootRef={rootRef} onEnter={onEnterSecond} />
    </div>,
  );

  const root = view.getByTestId('root');
  const first = view.container.querySelector('.atom-trigger-first');
  const second = view.container.querySelector('.atom-trigger-second');

  if (
    !(root instanceof HTMLDivElement) ||
    !(first instanceof HTMLDivElement) ||
    !(second instanceof HTMLDivElement)
  ) {
    throw new Error('Shared sentinel not found');
  }

  let rootRectCalls = 0;
  setRect(root, () => {
    rootRectCalls += 1;
    return new DOMRect(0, 0, 200, 200);
  });
  setRect(first, () => {
    const activeScroll = getActiveScrollPosition();
    return new DOMRect(activeScroll.left, 260 - activeScroll.top, 10, 10);
  });
  setRect(second, () => {
    const activeScroll = getActiveScrollPosition();
    return new DOMRect(activeScroll.left, 300 - activeScroll.top, 10, 10);
  });

  return {
    root,
    onEnterFirst,
    onEnterSecond,
    getRootRectCalls: () => rootRectCalls,
    resetRootRectCalls: () => {
      rootRectCalls = 0;
    },
  };
}

export function setupMeasuredRootHarness(options: RootGeometryOptions = {}): MeasuredRootHarness {
  const rootRef = React.createRef<HTMLDivElement>();
  const onEnter = vi.fn();
  const onLeave = vi.fn();
  setActiveScrollPosition(options.initialScrollTop ?? 0, options.initialScrollLeft ?? 0);

  const view = render(
    <div ref={rootRef} data-testid="root">
      <AtomTrigger
        className="atom-trigger-sentinel"
        rootRef={rootRef}
        once={options.once}
        oncePerDirection={options.oncePerDirection}
        fireOnInitialVisible={options.fireOnInitialVisible}
        threshold={options.threshold as number | undefined}
        rootMargin={options.rootMargin}
        onEnter={options.onEnter ?? onEnter}
        onLeave={options.onLeave ?? onLeave}
        onEvent={options.onEvent}
      />
    </div>,
  );

  const root = view.getByTestId('root');
  const sentinel = view.container.querySelector('.atom-trigger-sentinel');

  if (!(root instanceof HTMLDivElement) || !(sentinel instanceof HTMLDivElement)) {
    throw new Error('Sentinel not found');
  }

  let rootRectCalls = 0;
  setRect(root, () => {
    rootRectCalls += 1;
    return new DOMRect(0, 0, 200, 200);
  });
  setRect(sentinel, () => {
    const activeScroll = getActiveScrollPosition();
    return new DOMRect(activeScroll.left, 260 - activeScroll.top, 10, 10);
  });

  return {
    root,
    getRootRectCalls: () => rootRectCalls,
    resetRootRectCalls: () => {
      rootRectCalls = 0;
    },
  };
}

export function setupChildRootHarness(
  options: RootGeometryOptions & {
    atomTriggerClassName?: string;
    childHeight?: number;
    childTop?: number;
    childRef?: React.Ref<HTMLDivElement>;
  } = {},
): ChildRootHarness {
  const rootRef = React.createRef<HTMLDivElement>();
  setActiveScrollPosition(options.initialScrollTop ?? 0, options.initialScrollLeft ?? 0);

  const view = render(
    <div ref={rootRef} data-testid="root">
      <AtomTrigger
        className={options.atomTriggerClassName}
        rootRef={rootRef}
        rootMargin={options.rootMargin}
        once={options.once}
        oncePerDirection={options.oncePerDirection}
        fireOnInitialVisible={options.fireOnInitialVisible}
        threshold={options.threshold as number | undefined}
        onEnter={options.onEnter}
        onLeave={options.onLeave}
        onEvent={options.onEvent}
      >
        <div data-testid="observed-child" ref={options.childRef}>
          observed child
        </div>
      </AtomTrigger>
    </div>,
  );

  const root = view.getByTestId('root');
  const child = view.getByTestId('observed-child');

  if (!(child instanceof HTMLDivElement)) {
    throw new Error('Observed child not found');
  }

  const childHeight = options.childHeight ?? 100;
  const childTop = options.childTop ?? 260;
  setRect(root, () => new DOMRect(0, 0, 200, 200));
  setRect(child, () => {
    const activeScroll = getActiveScrollPosition();
    return new DOMRect(activeScroll.left, childTop - activeScroll.top, 20, childHeight);
  });

  if (!(root instanceof HTMLDivElement)) {
    throw new Error('Root not found');
  }

  return { root, child };
}

export function ParentRerenderHarness({ onEnter }: { onEnter: (event: AtomTriggerEvent) => void }) {
  const [tick, setTick] = React.useState(0);
  const rootRef = React.useRef<HTMLDivElement | null>(null);

  return (
    <div>
      <button type="button" onClick={() => setTick(value => value + 1)}>
        rerender
      </button>
      <div data-testid="parent-rerender-tick">{tick}</div>
      <div ref={rootRef} data-testid="parent-rerender-root">
        <AtomTrigger className="atom-trigger-sentinel" rootRef={rootRef} onEnter={onEnter} />
      </div>
    </div>
  );
}

export function ReconfigurableRootHarness({
  disabled,
  onEnter,
  onLeave,
  rootMargin,
  threshold,
}: RootGeometryOptions) {
  const rootRef = React.useRef<HTMLDivElement | null>(null);

  return (
    <div ref={rootRef} data-testid="reconfigurable-root">
      <AtomTrigger
        className="atom-trigger-sentinel"
        rootRef={rootRef}
        disabled={disabled}
        rootMargin={rootMargin}
        threshold={threshold as number | undefined}
        onEnter={onEnter}
        onLeave={onLeave}
      />
    </div>
  );
}

export function CustomRootMarginHarness({
  onEnter,
  rootMargin,
}: {
  onEnter: (event: AtomTriggerEvent) => void;
  rootMargin: AtomTriggerProps['rootMargin'];
}) {
  const rootRef = React.useRef<HTMLDivElement | null>(null);

  return (
    <div ref={rootRef} data-testid="custom-root-margin-root">
      <AtomTrigger
        className="atom-trigger-sentinel"
        rootRef={rootRef}
        rootMargin={rootMargin}
        onEnter={onEnter}
      />
    </div>
  );
}

export function SwappingRootRefHarness({
  onEnter,
}: {
  onEnter: (event: AtomTriggerEvent) => void;
}) {
  const [useSecondRoot, setUseSecondRoot] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement | null>(null);

  return (
    <div>
      <button type="button" onClick={() => setUseSecondRoot(value => !value)}>
        swap root
      </button>
      {useSecondRoot ? (
        <div data-testid="swap-root-2" ref={rootRef} />
      ) : (
        <div data-testid="swap-root-1" ref={rootRef} />
      )}
      <AtomTrigger className="atom-trigger-sentinel" rootRef={rootRef} onEnter={onEnter} />
    </div>
  );
}
