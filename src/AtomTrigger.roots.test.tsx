import React from 'react';
import { act, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

describe('AtomTrigger roots and margins', () => {
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
});
