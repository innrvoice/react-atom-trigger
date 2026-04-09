import { fireEvent } from '@testing-library/react';
import type React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  registerSentinel,
  resetObservationState,
  resolveSchedulerTarget,
  type SentinelRegistration,
} from './AtomTrigger.scheduler';
import { finishDomTestRun, prepareDomTestRun, setRect } from './AtomTrigger.testUtils';

function createRegistration(
  node: Element,
  overrides: Partial<SentinelRegistration> = {},
): SentinelRegistration {
  return {
    node,
    rootMargin: '0px',
    threshold: 0,
    once: false,
    oncePerDirection: false,
    fireOnInitialVisible: false,
    previousTriggerActive: undefined,
    previousRect: null,
    counts: {
      entered: 0,
      left: 0,
    },
    ...overrides,
  };
}

function installQueuedAnimationFrames() {
  const callbacks = new Map<number, FrameRequestCallback>();
  let nextFrameId = 0;

  const requestAnimationFrameSpy = vi.fn((callback: FrameRequestCallback) => {
    nextFrameId += 1;
    callbacks.set(nextFrameId, callback);
    return nextFrameId;
  });
  const cancelAnimationFrameSpy = vi.fn();

  vi.stubGlobal('requestAnimationFrame', requestAnimationFrameSpy);
  vi.stubGlobal('cancelAnimationFrame', cancelAnimationFrameSpy);

  return {
    requestAnimationFrameSpy,
    cancelAnimationFrameSpy,
    getFrameIds: () => Array.from(callbacks.keys()),
    runFrame: (frameId: number) => {
      callbacks.get(frameId)?.(performance.now());
      callbacks.delete(frameId);
    },
    runAllFrames: () => {
      for (const frameId of Array.from(callbacks.keys())) {
        callbacks.get(frameId)?.(performance.now());
        callbacks.delete(frameId);
      }
    },
  };
}

function installObserverMocks() {
  const resizeObservers: MockResizeObserver[] = [];
  const intersectionObservers: MockIntersectionObserver[] = [];

  class MockResizeObserver {
    callback: ResizeObserverCallback;
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();

    constructor(callback: ResizeObserverCallback) {
      this.callback = callback;
      resizeObservers.push(this);
    }
  }

  class MockIntersectionObserver {
    callback: IntersectionObserverCallback;
    options: IntersectionObserverInit;
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();

    constructor(callback: IntersectionObserverCallback, options: IntersectionObserverInit) {
      this.callback = callback;
      this.options = options;
      intersectionObservers.push(this);
    }
  }

  vi.stubGlobal('ResizeObserver', MockResizeObserver);
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);

  return {
    resizeObservers,
    intersectionObservers,
  };
}

beforeEach(() => {
  prepareDomTestRun();
});

afterEach(() => {
  finishDomTestRun();
});

describe('AtomTrigger scheduler helpers', () => {
  it('resolves rootRef before root and falls back to the viewport', () => {
    const root = document.createElement('div');
    const rootFromRef = document.createElement('div');
    const rootRef = { current: rootFromRef } as React.RefObject<HTMLDivElement>;

    expect(resolveSchedulerTarget(root, rootRef)).toBe(rootFromRef);
    expect(resolveSchedulerTarget(root, undefined)).toBe(root);
    expect(resolveSchedulerTarget(null, undefined)).toBe(window);
  });

  it('returns null when the runtime has no viewport target', () => {
    vi.stubGlobal('window', undefined);

    expect(resolveSchedulerTarget(null, undefined)).toBeNull();

    vi.unstubAllGlobals();
  });

  it('clears the previous observation baseline without resetting trigger counts', () => {
    const registration = createRegistration(document.createElement('div'), {
      previousTriggerActive: true,
      previousRect: new DOMRect(0, 20, 10, 10),
      counts: {
        entered: 1,
        left: 1,
      },
    });

    resetObservationState(registration);

    expect(registration.previousTriggerActive).toBeUndefined();
    expect(registration.previousRect).toBeNull();
    expect(registration.counts).toEqual({ entered: 1, left: 1 });
  });

  it('attaches invalidation observers to a custom root and tears them down with the last sentinel', () => {
    const { resizeObservers, intersectionObservers } = installObserverMocks();
    const root = document.createElement('div');
    const node = document.createElement('div');

    setRect(root, () => new DOMRect(0, 0, 200, 200));
    setRect(node, () => new DOMRect(0, 260, 10, 10));

    const registration = createRegistration(node);
    const dispose = registerSentinel(root, registration);

    expect(resizeObservers).toHaveLength(1);
    expect(resizeObservers[0].observe).toHaveBeenCalledWith(root);
    expect(resizeObservers[0].observe).toHaveBeenCalledWith(node);

    expect(intersectionObservers).toHaveLength(1);
    expect(intersectionObservers[0].options.root).toBe(root);
    expect(intersectionObservers[0].observe).toHaveBeenCalledWith(node);

    dispose();

    expect(resizeObservers[0].unobserve).toHaveBeenCalledWith(node);
    expect(resizeObservers[0].disconnect).toHaveBeenCalledTimes(1);
    expect(intersectionObservers[0].unobserve).toHaveBeenCalledWith(node);
    expect(intersectionObservers[0].disconnect).toHaveBeenCalledTimes(1);
    expect(registration.dispose).toBeUndefined();
  });

  it('coalesces repeated invalidation signals into a single animation frame', () => {
    const { requestAnimationFrameSpy, runAllFrames } = installQueuedAnimationFrames();
    const onEnter = vi.fn();
    const node = document.createElement('div');

    setRect(node, () => new DOMRect(0, 100, 10, 10));

    const dispose = registerSentinel(
      window,
      createRegistration(node, {
        fireOnInitialVisible: true,
        onEnter,
      }),
    );

    fireEvent.resize(window);
    fireEvent.scroll(window);

    expect(requestAnimationFrameSpy).toHaveBeenCalledTimes(1);

    runAllFrames();

    expect(onEnter).toHaveBeenCalledTimes(1);

    dispose();
  });

  it('ignores a late animation frame after the last sentinel is disposed', () => {
    const { cancelAnimationFrameSpy, getFrameIds, runFrame } = installQueuedAnimationFrames();
    const onEnter = vi.fn();
    const node = document.createElement('div');

    setRect(node, () => new DOMRect(0, 100, 10, 10));

    const dispose = registerSentinel(
      window,
      createRegistration(node, {
        fireOnInitialVisible: true,
        onEnter,
      }),
    );
    const [frameId] = getFrameIds();

    dispose();

    expect(cancelAnimationFrameSpy).toHaveBeenCalledWith(frameId);

    runFrame(frameId);

    expect(onEnter).not.toHaveBeenCalled();
  });

  it('keeps a completed once registration silent when it is registered again', () => {
    const onEnter = vi.fn();
    const node = document.createElement('div');

    setRect(node, () => new DOMRect(0, 100, 10, 10));

    const dispose = registerSentinel(
      window,
      createRegistration(node, {
        once: true,
        fireOnInitialVisible: true,
        counts: {
          entered: 1,
          left: 0,
        },
        onEnter,
      }),
    );

    expect(onEnter).not.toHaveBeenCalled();

    dispose();
  });

  it('does not repeat the same direction for oncePerDirection registrations', () => {
    const repeatedEnter = vi.fn();
    const enterNode = document.createElement('div');

    setRect(enterNode, () => new DOMRect(0, 100, 10, 10));

    const disposeEnter = registerSentinel(
      window,
      createRegistration(enterNode, {
        oncePerDirection: true,
        fireOnInitialVisible: true,
        counts: {
          entered: 1,
          left: 0,
        },
        onEnter: repeatedEnter,
      }),
    );

    expect(repeatedEnter).not.toHaveBeenCalled();

    disposeEnter();

    const repeatedLeave = vi.fn();
    const leaveNode = document.createElement('div');

    setRect(leaveNode, () => new DOMRect(0, 900, 10, 10));

    const disposeLeave = registerSentinel(
      window,
      createRegistration(leaveNode, {
        oncePerDirection: true,
        previousTriggerActive: true,
        previousRect: new DOMRect(0, 100, 10, 10),
        counts: {
          entered: 1,
          left: 1,
        },
        onLeave: repeatedLeave,
      }),
    );

    expect(repeatedLeave).not.toHaveBeenCalled();

    disposeLeave();
  });
});
