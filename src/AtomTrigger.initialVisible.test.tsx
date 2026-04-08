import React from 'react';
import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AtomTrigger } from './index';
import { finishDomTestRun, prepareDomTestRun, setRect } from './AtomTrigger.testUtils';

type InitialHarnessOptions = {
  fireOnInitialVisible?: boolean;
  threshold?: number;
  once?: boolean;
  oncePerDirection?: boolean;
  initialScrollTop?: number;
  childHeight?: number;
  onEnter?: Parameters<typeof AtomTrigger>[0]['onEnter'];
  onLeave?: Parameters<typeof AtomTrigger>[0]['onLeave'];
  onEvent?: Parameters<typeof AtomTrigger>[0]['onEvent'];
  useChild?: boolean;
};

type InitialHarness = {
  root: HTMLDivElement;
  scrollTo: (nextTop: number) => void;
};

function setupInitialHarness({
  fireOnInitialVisible = false,
  threshold = 0,
  once = false,
  oncePerDirection = false,
  initialScrollTop = 0,
  childHeight = 100,
  onEnter,
  onLeave,
  onEvent,
  useChild = false,
}: InitialHarnessOptions = {}): InitialHarness {
  const rootRef = React.createRef<HTMLDivElement>();
  const frameCallbacks: FrameRequestCallback[] = [];
  let frameId = 0;
  let scrollTop = initialScrollTop;

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

  const view = render(
    <div ref={rootRef} data-testid="root">
      <AtomTrigger
        className={useChild ? undefined : 'atom-trigger-sentinel'}
        rootRef={rootRef}
        threshold={threshold}
        once={once}
        oncePerDirection={oncePerDirection}
        fireOnInitialVisible={fireOnInitialVisible}
        onEnter={onEnter}
        onLeave={onLeave}
        onEvent={onEvent}
      >
        {useChild ? <div data-testid="observed-child">observed child</div> : undefined}
      </AtomTrigger>
    </div>,
  );

  const root = view.getByTestId('root');
  const observedNode = useChild
    ? view.getByTestId('observed-child')
    : view.container.querySelector('.atom-trigger-sentinel');

  if (!(root instanceof HTMLDivElement) || !(observedNode instanceof HTMLElement)) {
    throw new Error('Initial-visible harness node not found');
  }

  setRect(root, () => new DOMRect(0, 0, 200, 200));
  setRect(
    observedNode,
    () => new DOMRect(0, 260 - scrollTop, useChild ? 20 : 10, useChild ? childHeight : 10),
  );

  flushFrames();

  return {
    root,
    scrollTo: (nextTop: number) => {
      scrollTop = nextTop;
      root.dispatchEvent(new Event('scroll', { bubbles: true }));
      flushFrames();
    },
  };
}

beforeEach(() => {
  prepareDomTestRun();
});

afterEach(() => {
  finishDomTestRun();
});

describe('AtomTrigger initial visible behavior', () => {
  it('does not fire when the trigger starts visible unless explicitly enabled', () => {
    const onEnter = vi.fn();
    setupInitialHarness({
      onEnter,
      initialScrollTop: 120,
    });

    expect(onEnter).toHaveBeenCalledTimes(0);
  });

  it('fires an initial enter when the trigger starts visible and marks the event', () => {
    const onEnter = vi.fn();
    const onEvent = vi.fn();

    setupInitialHarness({
      onEnter,
      onEvent,
      fireOnInitialVisible: true,
      initialScrollTop: 120,
    });

    expect(onEnter).toHaveBeenCalledTimes(1);
    expect(onEvent).toHaveBeenCalledTimes(1);

    const event = onEnter.mock.calls[0][0];
    expect(event.type).toBe('enter');
    expect(event.isInitial).toBe(true);
    expect(event.counts).toEqual({ entered: 1, left: 0 });
    expect(event.position).toBe('inside');
    expect(event.entry.isIntersecting).toBe(true);
  });

  it('respects threshold when deciding whether to fire the initial enter', () => {
    const onEnter = vi.fn();

    setupInitialHarness({
      onEnter,
      threshold: 0.75,
      childHeight: 100,
      fireOnInitialVisible: true,
      initialScrollTop: 135,
      useChild: true,
    });

    expect(onEnter).toHaveBeenCalledTimes(1);
    expect(onEnter.mock.calls[0][0].isInitial).toBe(true);
    expect(onEnter.mock.calls[0][0].entry.intersectionRatio).toBe(0.75);
  });

  it('counts the initial enter as a real transition for once modes', () => {
    const onEnter = vi.fn();
    const onLeave = vi.fn();
    const { scrollTo } = setupInitialHarness({
      onEnter,
      onLeave,
      once: true,
      fireOnInitialVisible: true,
      initialScrollTop: 120,
    });

    expect(onEnter).toHaveBeenCalledTimes(1);
    expect(onEnter.mock.calls[0][0].isInitial).toBe(true);

    scrollTo(280);

    expect(onLeave).toHaveBeenCalledTimes(0);
  });

  it('keeps later transitions non-initial after the initial visible enter', () => {
    const onEvent = vi.fn();
    const { scrollTo } = setupInitialHarness({
      onEvent,
      oncePerDirection: true,
      fireOnInitialVisible: true,
      initialScrollTop: 120,
    });

    expect(onEvent).toHaveBeenCalledTimes(1);
    expect(onEvent.mock.calls[0][0].type).toBe('enter');
    expect(onEvent.mock.calls[0][0].isInitial).toBe(true);

    scrollTo(280);

    expect(onEvent).toHaveBeenCalledTimes(2);
    expect(onEvent.mock.calls[1][0].type).toBe('leave');
    expect(onEvent.mock.calls[1][0].isInitial).toBe(false);
    expect(onEvent.mock.calls[1][0].counts).toEqual({ entered: 1, left: 1 });
  });
});
