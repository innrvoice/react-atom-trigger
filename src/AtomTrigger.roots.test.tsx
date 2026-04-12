import React from 'react';
import { act, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AtomTrigger } from './index';
import {
  CustomRootMarginHarness,
  finishDomTestRun,
  ParentRerenderHarness,
  prepareDomTestRun,
  ReconfigurableRootHarness,
  scrollElement,
  scrollViewport,
  setNodeEnv,
  setRect,
  setScrollAwareRect,
  setWindowSize,
  setupChildRootHarness,
  setupMeasuredRootHarness,
  setupRootHarness,
  setupSharedRootHarness,
  setupViewportHarness,
  SwappingRootRefHarness,
} from './AtomTrigger.testUtils';

beforeEach(() => {
  prepareDomTestRun();
});

afterEach(() => {
  finishDomTestRun();
});

function DeferredRootRefHarness({
  fireOnInitialVisible = false,
  onEnter,
  onLeave,
}: {
  fireOnInitialVisible?: boolean;
  onEnter?: (
    event: Parameters<NonNullable<React.ComponentProps<typeof AtomTrigger>['onEnter']>>[0],
  ) => void;
  onLeave?: (
    event: Parameters<NonNullable<React.ComponentProps<typeof AtomTrigger>['onLeave']>>[0],
  ) => void;
}) {
  const [showRoot, setShowRoot] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const [, forceRootRefresh] = React.useReducer((value: number) => value + 1, 0);
  const attachRootRef = React.useCallback((node: HTMLDivElement | null) => {
    rootRef.current = node;
    forceRootRefresh();
  }, []);

  return (
    <div>
      <button type="button" onClick={() => setShowRoot(value => !value)}>
        {showRoot ? 'hide root' : 'show root'}
      </button>
      {showRoot ? <div ref={attachRootRef} data-testid="deferred-root-ref-root" /> : null}
      <AtomTrigger
        className="atom-trigger-sentinel"
        rootRef={rootRef}
        fireOnInitialVisible={fireOnInitialVisible}
        onEnter={onEnter}
        onLeave={onLeave}
      />
    </div>
  );
}

function DeferredExplicitRootHarness({
  onEnter,
}: {
  onEnter?: (
    event: Parameters<NonNullable<React.ComponentProps<typeof AtomTrigger>['onEnter']>>[0],
  ) => void;
}) {
  const [showRoot, setShowRoot] = React.useState(false);
  const [root, setRoot] = React.useState<HTMLDivElement | null>(null);

  return (
    <div>
      <button type="button" onClick={() => setShowRoot(value => !value)}>
        {showRoot ? 'hide explicit root' : 'show explicit root'}
      </button>
      {showRoot ? <div ref={setRoot} data-testid="deferred-explicit-root" /> : null}
      <AtomTrigger className="atom-trigger-sentinel" root={root} onEnter={onEnter} />
    </div>
  );
}

function PlainDeferredRootRefHarness({
  onEnter,
}: {
  onEnter?: (
    event: Parameters<NonNullable<React.ComponentProps<typeof AtomTrigger>['onEnter']>>[0],
  ) => void;
}) {
  const [showRoot, setShowRoot] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement | null>(null);

  return (
    <div>
      <button type="button" onClick={() => setShowRoot(value => !value)}>
        {showRoot ? 'hide plain root' : 'show plain root'}
      </button>
      {showRoot ? <div ref={rootRef} data-testid="plain-deferred-root-ref-root" /> : null}
      <AtomTrigger className="atom-trigger-sentinel" rootRef={rootRef} onEnter={onEnter} />
    </div>
  );
}

function PlainSwappingRootRefHarness({
  onEnter,
}: {
  onEnter?: (
    event: Parameters<NonNullable<React.ComponentProps<typeof AtomTrigger>['onEnter']>>[0],
  ) => void;
}) {
  const [useSecondRoot, setUseSecondRoot] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement | null>(null);

  return (
    <div>
      <button type="button" onClick={() => setUseSecondRoot(value => !value)}>
        swap keyed root
      </button>
      {useSecondRoot ? (
        <div key="plain-swap-root-2" data-testid="plain-swap-root-2" ref={rootRef} />
      ) : (
        <div key="plain-swap-root-1" data-testid="plain-swap-root-1" ref={rootRef} />
      )}
      <AtomTrigger className="atom-trigger-sentinel" rootRef={rootRef} onEnter={onEnter} />
    </div>
  );
}

describe('AtomTrigger roots and margins', () => {
  it('does not fall back to the viewport while a rootRef is still unresolved', () => {
    const onEnter = vi.fn();
    const view = render(<DeferredRootRefHarness onEnter={onEnter} />);
    const sentinel = view.container.querySelector('.atom-trigger-sentinel');

    if (!(sentinel instanceof HTMLDivElement)) {
      throw new Error('Deferred rootRef sentinel not found');
    }

    setScrollAwareRect(sentinel);

    scrollViewport(120);
    expect(onEnter).toHaveBeenCalledTimes(0);
    scrollViewport(0);

    fireEvent.click(view.getByRole('button', { name: 'show root' }));

    const root = view.getByTestId('deferred-root-ref-root');
    if (!(root instanceof HTMLDivElement)) {
      throw new Error('Deferred rootRef root not found');
    }

    setRect(root, () => new DOMRect(0, 0, 200, 200));

    scrollElement(root, 120);
    expect(onEnter).toHaveBeenCalledTimes(1);
  });

  it('starts observing when a plain useRef root appears after the first render', () => {
    const onEnter = vi.fn();
    const view = render(<PlainDeferredRootRefHarness onEnter={onEnter} />);
    const sentinel = view.container.querySelector('.atom-trigger-sentinel');

    if (!(sentinel instanceof HTMLDivElement)) {
      throw new Error('Plain deferred rootRef sentinel not found');
    }

    setScrollAwareRect(sentinel);

    scrollViewport(120);
    expect(onEnter).toHaveBeenCalledTimes(0);

    fireEvent.click(view.getByRole('button', { name: 'show plain root' }));

    const root = view.getByTestId('plain-deferred-root-ref-root');
    if (!(root instanceof HTMLDivElement)) {
      throw new Error('Plain deferred rootRef root not found');
    }

    setRect(root, () => new DOMRect(0, 0, 200, 200));

    scrollElement(root, 120);
    expect(onEnter).toHaveBeenCalledTimes(1);
  });

  it('fires initial visible only after the real rootRef target appears', () => {
    const frameCallbacks: FrameRequestCallback[] = [];
    let frameId = 0;
    const flushFrames = () => {
      for (const callback of frameCallbacks.splice(0)) {
        callback(performance.now());
      }
    };

    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      frameCallbacks.push(callback);
      frameId += 1;
      return frameId;
    });

    const onEnter = vi.fn();
    const view = render(<DeferredRootRefHarness fireOnInitialVisible onEnter={onEnter} />);
    const sentinel = view.container.querySelector('.atom-trigger-sentinel');

    if (!(sentinel instanceof HTMLDivElement)) {
      throw new Error('Initial visible deferred rootRef sentinel not found');
    }

    setScrollAwareRect(sentinel);

    scrollViewport(120);
    expect(onEnter).toHaveBeenCalledTimes(0);

    fireEvent.click(view.getByRole('button', { name: 'show root' }));

    const root = view.getByTestId('deferred-root-ref-root');
    if (!(root instanceof HTMLDivElement)) {
      throw new Error('Initial visible deferred rootRef root not found');
    }

    setRect(root, () => new DOMRect(0, 0, 200, 200));
    flushFrames();

    expect(onEnter).toHaveBeenCalledTimes(1);
    expect(onEnter.mock.calls[0][0].isInitial).toBe(true);
    expect(onEnter.mock.calls[0][0].position).toBe('inside');
  });

  it('does not fall back to the viewport while an explicit root prop is unresolved', () => {
    const onEnter = vi.fn();
    const view = render(<DeferredExplicitRootHarness onEnter={onEnter} />);
    const sentinel = view.container.querySelector('.atom-trigger-sentinel');

    if (!(sentinel instanceof HTMLDivElement)) {
      throw new Error('Deferred explicit root sentinel not found');
    }

    setScrollAwareRect(sentinel);

    scrollViewport(120);
    expect(onEnter).toHaveBeenCalledTimes(0);

    fireEvent.click(view.getByRole('button', { name: 'show explicit root' }));

    const root = view.getByTestId('deferred-explicit-root');
    if (!(root instanceof HTMLDivElement)) {
      throw new Error('Deferred explicit root not found');
    }

    setRect(root, () => new DOMRect(0, 0, 200, 200));

    scrollElement(root, 120);
    expect(onEnter).toHaveBeenCalledTimes(1);
  });

  it('pauses observation when rootRef disappears instead of replaying viewport transitions', () => {
    const onEnter = vi.fn();
    const onLeave = vi.fn();
    const view = render(<DeferredRootRefHarness onEnter={onEnter} onLeave={onLeave} />);

    fireEvent.click(view.getByRole('button', { name: 'show root' }));

    const sentinel = view.container.querySelector('.atom-trigger-sentinel');
    const firstRoot = view.getByTestId('deferred-root-ref-root');

    if (!(sentinel instanceof HTMLDivElement) || !(firstRoot instanceof HTMLDivElement)) {
      throw new Error('Toggleable rootRef harness not found');
    }

    setRect(firstRoot, () => new DOMRect(0, 0, 200, 200));
    setScrollAwareRect(sentinel);

    scrollElement(firstRoot, 120);
    expect(onEnter).toHaveBeenCalledTimes(1);

    fireEvent.click(view.getByRole('button', { name: 'hide root' }));
    scrollViewport(280);

    expect(onLeave).toHaveBeenCalledTimes(0);

    fireEvent.click(view.getByRole('button', { name: 'show root' }));

    const nextRoot = view.getByTestId('deferred-root-ref-root');
    if (!(nextRoot instanceof HTMLDivElement)) {
      throw new Error('Restored rootRef root not found');
    }

    setRect(nextRoot, () => new DOMRect(0, 0, 200, 200));

    scrollElement(nextRoot, 120);
    expect(onEnter).toHaveBeenCalledTimes(2);
  });

  it('uses an explicit root element when root is passed directly', () => {
    const onEnter = vi.fn();

    function ExplicitRootHarness() {
      const [root, setRoot] = React.useState<HTMLDivElement | null>(null);

      return (
        <div ref={setRoot} data-testid="explicit-root">
          {root ? (
            <AtomTrigger className="atom-trigger-sentinel" root={root} onEnter={onEnter} />
          ) : null}
        </div>
      );
    }

    const view = render(<ExplicitRootHarness />);
    const root = view.getByTestId('explicit-root');
    const sentinel = view.container.querySelector('.atom-trigger-sentinel');

    if (!(root instanceof HTMLDivElement) || !(sentinel instanceof HTMLDivElement)) {
      throw new Error('Explicit root harness not found');
    }

    setRect(root, () => new DOMRect(0, 0, 200, 200));
    setScrollAwareRect(sentinel);

    scrollElement(root, 0);
    scrollElement(root, 120);

    expect(onEnter).toHaveBeenCalledTimes(1);
    expect(onEnter.mock.calls[0][0].position).toBe('inside');
  });

  it('uses viewport geometry and rootMargin when no rootRef is provided', () => {
    const onLeave = vi.fn();
    setupViewportHarness({ onLeave, rootMargin: '-100px 0px 0px 0px' });

    scrollViewport(0);
    scrollViewport(190);

    expect(onLeave).toHaveBeenCalledTimes(1);

    const event = onLeave.mock.calls[0][0];
    expect(event.type).toBe('leave');
    expect(event.position).toBe('above');
    expect(Math.round(event.entry.rootBounds?.top ?? 0)).toBe(100);
  });

  it('reports stationary movement when a viewport resize causes an enter', () => {
    const frameCallbacks: FrameRequestCallback[] = [];
    let frameId = 0;
    const flushFrames = () => {
      for (const callback of frameCallbacks.splice(0)) {
        callback(performance.now());
      }
    };

    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      frameCallbacks.push(callback);
      frameId += 1;
      return frameId;
    });

    setWindowSize(1024, 200);
    const onEnter = vi.fn();
    const view = render(<AtomTrigger className="atom-trigger-sentinel" onEnter={onEnter} />);
    const sentinel = view.container.querySelector('.atom-trigger-sentinel');

    if (!(sentinel instanceof HTMLDivElement)) {
      throw new Error('Viewport resize harness not found');
    }

    setRect(sentinel, () => new DOMRect(0, 220, 10, 10));
    flushFrames();

    expect(onEnter).toHaveBeenCalledTimes(0);

    setWindowSize(1024, 240);
    fireEvent(window, new Event('resize'));
    flushFrames();

    expect(onEnter).toHaveBeenCalledTimes(1);
    expect(onEnter.mock.calls[0][0].type).toBe('enter');
    expect(onEnter.mock.calls[0][0].movementDirection).toBe('stationary');
    expect(onEnter.mock.calls[0][0].position).toBe('inside');
  });

  it('supports a four-number rootMargin array in pixel order', () => {
    const onEnter = vi.fn();
    const { root } = setupRootHarness({ onEnter, rootMargin: [0, 0, 100, 0] });

    scrollElement(root, 0);
    scrollElement(root, 60);

    expect(onEnter).toHaveBeenCalledTimes(1);
    expect(Math.round(onEnter.mock.calls[0][0].entry.rootBounds?.bottom ?? 0)).toBe(300);
  });

  it('applies rootMargin to child observation mode', () => {
    const onEnter = vi.fn();
    const { root } = setupChildRootHarness({
      onEnter,
      rootMargin: [0, 0, 100, 0],
      childHeight: 20,
      childTop: 305,
    });

    scrollElement(root, 0);
    scrollElement(root, 25);

    expect(onEnter).toHaveBeenCalledTimes(1);
    expect(Math.round(onEnter.mock.calls[0][0].entry.rootBounds?.bottom ?? 0)).toBe(300);
  });

  it('establishes a fresh baseline when rootMargin changes', () => {
    const onEnter = vi.fn();
    const onLeave = vi.fn();
    const view = render(
      <ReconfigurableRootHarness
        rootMargin="0px 0px 100px 0px"
        onEnter={onEnter}
        onLeave={onLeave}
      />,
    );
    const root = view.getByTestId('reconfigurable-root');
    const sentinel = view.container.querySelector('.atom-trigger-sentinel');

    if (!(root instanceof HTMLDivElement) || !(sentinel instanceof HTMLDivElement)) {
      throw new Error('Reconfigurable root harness not found');
    }

    setRect(root, () => new DOMRect(0, 0, 200, 200));
    setScrollAwareRect(sentinel);

    scrollElement(root, 60);
    expect(onEnter).toHaveBeenCalledTimes(1);

    view.rerender(
      <ReconfigurableRootHarness rootMargin="0px" onEnter={onEnter} onLeave={onLeave} />,
    );

    expect(onEnter).toHaveBeenCalledTimes(1);
    expect(onLeave).toHaveBeenCalledTimes(0);

    scrollElement(root, 120);
    expect(onEnter).toHaveBeenCalledTimes(2);
  });

  it('warns and falls back to 0px for unsupported rootMargin units', () => {
    setNodeEnv('development');
    const onEnter = vi.fn();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { root } = setupRootHarness({ onEnter, rootMargin: '0px 0px 100rem 0px' });

    scrollElement(root, 0);
    scrollElement(root, 120);

    expect(onEnter).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(
      '[react-atom-trigger] Invalid rootMargin token "100rem". Use px, % or 0. Falling back to 0px.',
    );
  });

  it('warns and falls back to 0px when rootMargin has more than four values', () => {
    setNodeEnv('development');
    const onEnter = vi.fn();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { root } = setupRootHarness({ onEnter, rootMargin: '0px 0px 100px 0px 20px' });

    scrollElement(root, 0);
    scrollElement(root, 120);

    expect(onEnter).toHaveBeenCalledTimes(1);
    expect(Math.round(onEnter.mock.calls[0][0].entry.rootBounds?.bottom ?? 0)).toBe(200);
    expect(warn).toHaveBeenCalledWith(
      '[react-atom-trigger] Invalid rootMargin "0px 0px 100px 0px 20px". Use 1 to 4 values in IntersectionObserver order. Falling back to 0px.',
    );
  });

  it('uses IntersectionObserver invalidation to catch layout shifts across a custom rootMargin boundary', () => {
    let ioCallback: IntersectionObserverCallback | null = null;

    class MockIntersectionObserver {
      constructor(callback: IntersectionObserverCallback) {
        ioCallback = callback;
      }

      observe() {}

      unobserve() {}

      disconnect() {}
    }

    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);

    const onEnter = vi.fn();
    const view = render(
      <CustomRootMarginHarness onEnter={onEnter} rootMargin="0px 0px 100px 0px" />,
    );
    const root = view.getByTestId('custom-root-margin-root');
    const sentinel = view.container.querySelector('.atom-trigger-sentinel');

    if (!(root instanceof HTMLDivElement) || !(sentinel instanceof HTMLDivElement)) {
      throw new Error('Custom rootMargin harness not found');
    }

    let sentinelTop = 305;

    setRect(root, () => new DOMRect(0, 0, 200, 200));
    setRect(sentinel, () => new DOMRect(0, sentinelTop, 10, 10));

    expect(onEnter).toHaveBeenCalledTimes(0);
    expect(ioCallback).not.toBeNull();

    sentinelTop = 295;

    act(() => {
      ioCallback?.([], {} as IntersectionObserver);
    });

    expect(onEnter).toHaveBeenCalledTimes(1);
    expect(onEnter.mock.calls[0][0].position).toBe('inside');
  });

  it('reports stationary movement when a root resize causes an enter', () => {
    const frameCallbacks: FrameRequestCallback[] = [];
    let frameId = 0;
    const flushFrames = () => {
      for (const callback of frameCallbacks.splice(0)) {
        callback(performance.now());
      }
    };

    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      frameCallbacks.push(callback);
      frameId += 1;
      return frameId;
    });

    const onEnter = vi.fn();
    const rootRef = React.createRef<HTMLDivElement>();
    const view = render(
      <div ref={rootRef} data-testid="resize-root">
        <AtomTrigger className="atom-trigger-sentinel" rootRef={rootRef} onEnter={onEnter} />
      </div>,
    );
    const root = view.getByTestId('resize-root');
    const sentinel = view.container.querySelector('.atom-trigger-sentinel');

    if (!(root instanceof HTMLDivElement) || !(sentinel instanceof HTMLDivElement)) {
      throw new Error('Resize root harness not found');
    }

    let rootHeight = 200;

    setRect(root, () => new DOMRect(0, 0, 200, rootHeight));
    setRect(sentinel, () => new DOMRect(0, 220, 10, 10));
    flushFrames();

    expect(onEnter).toHaveBeenCalledTimes(0);

    rootHeight = 240;
    fireEvent(window, new Event('resize'));
    flushFrames();

    expect(onEnter).toHaveBeenCalledTimes(1);
    expect(onEnter.mock.calls[0][0].type).toBe('enter');
    expect(onEnter.mock.calls[0][0].movementDirection).toBe('stationary');
    expect(onEnter.mock.calls[0][0].position).toBe('inside');
  });
});

describe('AtomTrigger subscription lifecycle', () => {
  it('stops sampling geometry after a once registration completes', () => {
    const { root, getRootRectCalls, resetRootRectCalls } = setupMeasuredRootHarness({
      once: true,
    });

    scrollElement(root, 0);
    resetRootRectCalls();
    scrollElement(root, 120);

    expect(getRootRectCalls()).toBe(1);

    resetRootRectCalls();
    scrollElement(root, 280);

    expect(getRootRectCalls()).toBe(0);
  });

  it('stops sampling geometry after oncePerDirection completes both directions', () => {
    const { root, getRootRectCalls, resetRootRectCalls } = setupMeasuredRootHarness({
      oncePerDirection: true,
    });

    scrollElement(root, 0);
    scrollElement(root, 120);
    resetRootRectCalls();
    scrollElement(root, 280);

    expect(getRootRectCalls()).toBe(1);

    resetRootRectCalls();
    scrollElement(root, 120);

    expect(getRootRectCalls()).toBe(0);
  });

  it('shares one root measurement per scroll sample for multiple sentinels in the same root', () => {
    const { root, onEnterFirst, onEnterSecond, getRootRectCalls, resetRootRectCalls } =
      setupSharedRootHarness();

    resetRootRectCalls();
    scrollElement(root, 120);

    expect(onEnterFirst).toHaveBeenCalledTimes(1);
    expect(onEnterSecond).toHaveBeenCalledTimes(1);
    expect(getRootRectCalls()).toBe(1);
  });

  it('rebinds AtomTrigger when the same rootRef points to a different element', () => {
    const onEnter = vi.fn();
    const view = render(<SwappingRootRefHarness onEnter={onEnter} />);
    const sentinel = view.container.querySelector('.atom-trigger-sentinel');
    const firstRoot = view.getByTestId('swap-root-1');

    if (!(sentinel instanceof HTMLDivElement) || !(firstRoot instanceof HTMLDivElement)) {
      throw new Error('Swap root harness not found');
    }

    let firstRootRectCalls = 0;
    let secondRootRectCalls = 0;

    setRect(firstRoot, () => {
      firstRootRectCalls += 1;
      return new DOMRect(0, 0, 200, 200);
    });
    setRect(sentinel, () => new DOMRect(0, 260, 10, 10));

    scrollElement(firstRoot, 120);
    expect(firstRootRectCalls).toBe(1);

    fireEvent.click(view.getByRole('button', { name: 'swap root' }));

    const secondRoot = view.getByTestId('swap-root-2');
    if (!(secondRoot instanceof HTMLDivElement)) {
      throw new Error('Second root not found');
    }

    setRect(secondRoot, () => {
      secondRootRectCalls += 1;
      return new DOMRect(0, 0, 200, 200);
    });

    firstRootRectCalls = 0;
    secondRootRectCalls = 0;
    scrollElement(firstRoot, 140);

    expect(firstRootRectCalls).toBe(0);
    const secondRootCallsBeforeOwnScroll = secondRootRectCalls;

    scrollElement(secondRoot, 140);

    expect(secondRootRectCalls).toBeGreaterThan(secondRootCallsBeforeOwnScroll);
  });

  it('rebinds when a plain useRef root swaps to a new keyed DOM element', () => {
    const onEnter = vi.fn();
    const view = render(<PlainSwappingRootRefHarness onEnter={onEnter} />);
    const sentinel = view.container.querySelector('.atom-trigger-sentinel');
    const firstRoot = view.getByTestId('plain-swap-root-1');

    if (!(sentinel instanceof HTMLDivElement) || !(firstRoot instanceof HTMLDivElement)) {
      throw new Error('Plain swap root harness not found');
    }

    let firstRootRectCalls = 0;
    let secondRootRectCalls = 0;

    setRect(firstRoot, () => {
      firstRootRectCalls += 1;
      return new DOMRect(0, 0, 200, 200);
    });
    setRect(sentinel, () => new DOMRect(0, 260, 10, 10));

    scrollElement(firstRoot, 120);
    expect(firstRootRectCalls).toBe(1);

    fireEvent.click(view.getByRole('button', { name: 'swap keyed root' }));

    const secondRoot = view.getByTestId('plain-swap-root-2');
    if (!(secondRoot instanceof HTMLDivElement)) {
      throw new Error('Plain second root not found');
    }

    setRect(secondRoot, () => {
      secondRootRectCalls += 1;
      return new DOMRect(0, 0, 200, 200);
    });

    firstRootRectCalls = 0;
    secondRootRectCalls = 0;
    scrollElement(firstRoot, 140);

    expect(firstRootRectCalls).toBe(0);
    const secondRootCallsBeforeOwnScroll = secondRootRectCalls;

    scrollElement(secondRoot, 140);

    expect(secondRootRectCalls).toBeGreaterThan(secondRootCallsBeforeOwnScroll);
  });

  it('does not replay transitions that happened while observation was disabled', () => {
    const onEnter = vi.fn();
    const onLeave = vi.fn();
    const view = render(<ReconfigurableRootHarness onEnter={onEnter} onLeave={onLeave} />);
    const root = view.getByTestId('reconfigurable-root');
    const sentinel = view.container.querySelector('.atom-trigger-sentinel');

    if (!(root instanceof HTMLDivElement) || !(sentinel instanceof HTMLDivElement)) {
      throw new Error('Reconfigurable root harness not found');
    }

    setRect(root, () => new DOMRect(0, 0, 200, 200));
    setScrollAwareRect(sentinel);

    scrollElement(root, 120);
    expect(onEnter).toHaveBeenCalledTimes(1);

    view.rerender(<ReconfigurableRootHarness disabled onEnter={onEnter} onLeave={onLeave} />);
    scrollElement(root, 280);

    view.rerender(<ReconfigurableRootHarness onEnter={onEnter} onLeave={onLeave} />);

    expect(onLeave).toHaveBeenCalledTimes(0);

    scrollElement(root, 120);
    expect(onEnter).toHaveBeenCalledTimes(2);
  });

  it('does not re-register on unrelated parent rerenders', () => {
    const onEnter = vi.fn();
    const view = render(<ParentRerenderHarness onEnter={onEnter} />);
    const root = view.getByTestId('parent-rerender-root');
    const sentinel = view.container.querySelector('.atom-trigger-sentinel');

    if (!(root instanceof HTMLDivElement) || !(sentinel instanceof HTMLDivElement)) {
      throw new Error('Parent rerender harness not found');
    }

    let rootRectCalls = 0;
    setRect(root, () => {
      rootRectCalls += 1;
      return new DOMRect(0, 0, 200, 200);
    });
    setRect(sentinel, () => new DOMRect(0, 260, 10, 10));

    scrollElement(root, 0);
    rootRectCalls = 0;

    fireEvent.click(view.getByRole('button', { name: 'rerender' }));

    expect(rootRectCalls).toBe(0);
    expect(onEnter).toHaveBeenCalledTimes(0);
  });

  it('updates event callbacks after rerender without resubscribing', () => {
    const firstOnEnter = vi.fn();
    const secondOnEnter = vi.fn();
    const firstOnLeave = vi.fn();
    const secondOnLeave = vi.fn();
    const firstOnEvent = vi.fn();
    const secondOnEvent = vi.fn();
    const rootRef = React.createRef<HTMLDivElement>();

    const view = render(
      <div ref={rootRef} data-testid="callback-root">
        <AtomTrigger
          className="atom-trigger-sentinel"
          rootRef={rootRef}
          onEnter={firstOnEnter}
          onLeave={firstOnLeave}
          onEvent={firstOnEvent}
        />
      </div>,
    );
    const root = view.getByTestId('callback-root');
    const sentinel = view.container.querySelector('.atom-trigger-sentinel');

    if (!(root instanceof HTMLDivElement) || !(sentinel instanceof HTMLDivElement)) {
      throw new Error('Callback rerender harness not found');
    }

    let rootRectCalls = 0;
    setRect(root, () => {
      rootRectCalls += 1;
      return new DOMRect(0, 0, 200, 200);
    });
    setScrollAwareRect(sentinel);

    scrollElement(root, 120);

    expect(firstOnEnter).toHaveBeenCalledTimes(1);
    expect(firstOnEvent).toHaveBeenCalledTimes(1);

    rootRectCalls = 0;
    view.rerender(
      <div ref={rootRef} data-testid="callback-root">
        <AtomTrigger
          className="atom-trigger-sentinel"
          rootRef={rootRef}
          onEnter={secondOnEnter}
          onLeave={secondOnLeave}
          onEvent={secondOnEvent}
        />
      </div>,
    );

    expect(rootRectCalls).toBe(0);

    scrollElement(root, 280);
    scrollElement(root, 120);

    expect(firstOnLeave).toHaveBeenCalledTimes(0);
    expect(firstOnEvent).toHaveBeenCalledTimes(1);
    expect(secondOnLeave).toHaveBeenCalledTimes(1);
    expect(secondOnEnter).toHaveBeenCalledTimes(1);
    expect(secondOnEvent).toHaveBeenCalledTimes(2);
  });
});
