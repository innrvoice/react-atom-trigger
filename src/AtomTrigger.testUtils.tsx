import React from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { vi } from 'vitest';
import { __resetWarningsForTests } from './AtomTrigger.warnings';
import { AtomTrigger, useScrollPosition, useViewportSize } from './index';
import type { AtomTriggerEvent, AtomTriggerProps } from './index';

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

let animationFrameId = 0;
let activeScrollTop = 0;
let activeScrollLeft = 0;
const initialNodeEnv = process.env.NODE_ENV;

export function setNodeEnv(value: string | undefined): void {
  if (value === undefined) {
    delete process.env.NODE_ENV;
    return;
  }

  process.env.NODE_ENV = value;
}

export function setRect(element: Element, getRect: () => DOMRect): void {
  Object.defineProperty(element, 'getBoundingClientRect', {
    configurable: true,
    value: getRect,
  });
}

export function setScrollAwareRect(
  element: Element,
  {
    top = 260,
    left = 0,
    width = 10,
    height = 10,
  }: {
    top?: number;
    left?: number;
    width?: number;
    height?: number;
  } = {},
): void {
  setRect(
    element,
    () => new DOMRect(left + activeScrollLeft, top - activeScrollTop, width, height),
  );
}

export function setElementScroll(element: HTMLElement, left: number, top: number): void {
  Object.defineProperty(element, 'scrollLeft', {
    configurable: true,
    value: left,
    writable: true,
  });
  Object.defineProperty(element, 'scrollTop', {
    configurable: true,
    value: top,
    writable: true,
  });
}

export function setWindowScroll(left: number, top: number): void {
  Object.defineProperty(window, 'scrollX', {
    configurable: true,
    value: left,
    writable: true,
  });
  Object.defineProperty(window, 'scrollY', {
    configurable: true,
    value: top,
    writable: true,
  });
}

export function setWindowSize(width: number, height: number): void {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    value: width,
    writable: true,
  });
  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    value: height,
    writable: true,
  });
}

export function prepareDomTestRun(): void {
  activeScrollTop = 0;
  activeScrollLeft = 0;
  animationFrameId = 0;
  setWindowScroll(0, 0);
  setWindowSize(1024, 768);

  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    callback(performance.now());
    animationFrameId += 1;
    return animationFrameId;
  });
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
}

export function finishDomTestRun(): void {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  __resetWarningsForTests();
  setNodeEnv(initialNodeEnv);
}

export function setupRootHarness(options: RootGeometryOptions = {}): RootHarness {
  const rootRef = React.createRef<HTMLDivElement>();
  activeScrollTop = options.initialScrollTop ?? 0;
  activeScrollLeft = options.initialScrollLeft ?? 0;

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
  setRect(sentinel, () => new DOMRect(activeScrollLeft, 260 - activeScrollTop, 10, 10));

  if (!(root instanceof HTMLDivElement)) {
    throw new Error('Root not found');
  }

  return { root };
}

export function setupViewportHarness(options: RootGeometryOptions = {}): ViewportHarness {
  activeScrollTop = options.initialScrollTop ?? 0;
  activeScrollLeft = options.initialScrollLeft ?? 0;

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

  setRect(sentinel, () => new DOMRect(activeScrollLeft, 220 - activeScrollTop, 10, 10));

  return { container: view.container };
}

export function setupZeroSizeRootHarness(options: RootGeometryOptions = {}): ZeroSizeRootHarness {
  const rootRef = React.createRef<HTMLDivElement>();
  activeScrollTop = options.initialScrollTop ?? 0;
  activeScrollLeft = options.initialScrollLeft ?? 0;

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
  setRect(sentinel, () => new DOMRect(activeScrollLeft, 260 - activeScrollTop, 0, 0));

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
  setRect(first, () => new DOMRect(activeScrollLeft, 260 - activeScrollTop, 10, 10));
  setRect(second, () => new DOMRect(activeScrollLeft, 300 - activeScrollTop, 10, 10));

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
  activeScrollTop = options.initialScrollTop ?? 0;
  activeScrollLeft = options.initialScrollLeft ?? 0;

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
  setRect(sentinel, () => new DOMRect(activeScrollLeft, 260 - activeScrollTop, 10, 10));

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
  activeScrollTop = options.initialScrollTop ?? 0;
  activeScrollLeft = options.initialScrollLeft ?? 0;

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
  setRect(child, () => new DOMRect(activeScrollLeft, childTop - activeScrollTop, 20, childHeight));

  if (!(root instanceof HTMLDivElement)) {
    throw new Error('Root not found');
  }

  return { root, child };
}

export function scrollElement(target: HTMLElement, nextTop: number, nextLeft = 0) {
  activeScrollTop = nextTop;
  activeScrollLeft = nextLeft;
  fireEvent.scroll(target);
}

export function scrollViewport(nextTop: number, nextLeft = 0) {
  activeScrollTop = nextTop;
  activeScrollLeft = nextLeft;
  fireEvent.scroll(window);
}

export function ScrollPositionHarness() {
  const [useSecondTarget, setUseSecondTarget] = React.useState(false);
  const targetRef = React.useRef<HTMLDivElement | null>(null);
  const position = useScrollPosition({ target: targetRef, throttleMs: 0 });

  return (
    <div>
      <button type="button" onClick={() => setUseSecondTarget(value => !value)}>
        swap target
      </button>
      {useSecondTarget ? (
        <div key="second-target" data-testid="scroll-target-2" ref={targetRef} />
      ) : (
        <div key="first-target" data-testid="scroll-target-1" ref={targetRef} />
      )}
      <output data-testid="scroll-position">
        {position.x},{position.y}
      </output>
    </div>
  );
}

export function RemovableScrollPositionHarness() {
  const [showTarget, setShowTarget] = React.useState(true);
  const targetRef = React.useRef<HTMLDivElement | null>(null);
  const position = useScrollPosition({ target: targetRef, throttleMs: 0 });

  return (
    <div>
      <button type="button" onClick={() => setShowTarget(false)}>
        remove target
      </button>
      {showTarget ? <div data-testid="removable-scroll-target" ref={targetRef} /> : null}
      <output data-testid="removable-scroll-position">
        {position.x},{position.y}
      </output>
    </div>
  );
}

export function ToggleableScrollPositionHarness() {
  const [enabled, setEnabled] = React.useState(true);
  const targetRef = React.useRef<HTMLDivElement | null>(null);
  const position = useScrollPosition({ target: targetRef, throttleMs: 0, enabled });

  return (
    <div>
      <button type="button" onClick={() => setEnabled(false)}>
        disable scroll position
      </button>
      <div data-testid="toggleable-scroll-target" ref={targetRef} />
      <output data-testid="toggleable-scroll-position">
        {position.x},{position.y}
      </output>
    </div>
  );
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

export function WindowScrollPositionHarness({ throttleMs }: { throttleMs: number }) {
  const position = useScrollPosition({ throttleMs });

  return (
    <output data-testid="window-scroll-position">
      {position.x},{position.y}
    </output>
  );
}

export function ViewportSizeHarness({ throttleMs }: { throttleMs: number }) {
  const size = useViewportSize({ throttleMs });

  return (
    <output data-testid="viewport-size">
      {size.width},{size.height}
    </output>
  );
}
