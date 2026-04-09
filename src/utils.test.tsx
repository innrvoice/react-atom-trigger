import React from 'react';
import { act, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useScrollPosition, useViewportSize } from './index';
import {
  finishDomTestRun,
  prepareDomTestRun,
  RemovableScrollPositionHarness,
  ScrollPositionHarness,
  setElementScroll,
  setWindowScroll,
  setWindowSize,
  ToggleableScrollPositionHarness,
  ViewportSizeHarness,
  WindowScrollPositionHarness,
} from './AtomTrigger.testUtils';

function ElementScrollPositionHarness({
  target,
  throttleMs,
}: {
  target: HTMLElement;
  throttleMs: number;
}) {
  const position = useScrollPosition({ target, throttleMs });

  return (
    <output data-testid="element-scroll-position">
      {position.x},{position.y}
    </output>
  );
}

function DisabledViewportSizeHarness({
  enabled,
  throttleMs,
}: {
  enabled: boolean;
  throttleMs: number;
}) {
  const size = useViewportSize({ enabled, throttleMs });

  return (
    <output data-testid="disabled-viewport-size">
      {size.width},{size.height}
    </output>
  );
}

beforeEach(() => {
  prepareDomTestRun();
});

afterEach(() => {
  finishDomTestRun();
});

describe('utility hooks', () => {
  it('rebinds useScrollPosition when a ref target swaps to a different element', () => {
    vi.useFakeTimers();

    const view = render(<ScrollPositionHarness />);
    const position = view.getByTestId('scroll-position');
    const firstTarget = view.getByTestId('scroll-target-1');

    setElementScroll(firstTarget, 3, 12);
    fireEvent.scroll(firstTarget);

    act(() => {
      vi.runAllTimers();
    });

    expect(position.textContent).toBe('3,12');

    fireEvent.click(view.getByRole('button', { name: 'swap target' }));

    act(() => {
      vi.runAllTimers();
    });

    const secondTarget = view.getByTestId('scroll-target-2');
    const positionAfterSwap = position.textContent;
    setElementScroll(firstTarget, 9, 30);
    fireEvent.scroll(firstTarget);

    act(() => {
      vi.runAllTimers();
    });

    expect(position.textContent).toBe(positionAfterSwap);

    setElementScroll(secondTarget, 7, 44);
    fireEvent.scroll(secondTarget);

    act(() => {
      vi.runAllTimers();
    });

    expect(position.textContent).toBe('7,44');
  });

  it('tracks scroll position for an explicit HTMLElement target', () => {
    const target = document.createElement('div');
    setElementScroll(target, 2, 8);

    const view = render(<ElementScrollPositionHarness target={target} throttleMs={0} />);
    const position = view.getByTestId('element-scroll-position');

    expect(position.textContent).toBe('2,8');

    setElementScroll(target, 6, 18);
    fireEvent.scroll(target);

    expect(position.textContent).toBe('6,18');
  });

  it('resets useScrollPosition to 0,0 when a ref target disappears', () => {
    vi.useFakeTimers();

    const view = render(<RemovableScrollPositionHarness />);
    const position = view.getByTestId('removable-scroll-position');
    const target = view.getByTestId('removable-scroll-target');

    setElementScroll(target, 4, 21);
    fireEvent.scroll(target);

    act(() => {
      vi.runAllTimers();
    });

    expect(position.textContent).toBe('4,21');

    fireEvent.click(view.getByRole('button', { name: 'remove target' }));

    act(() => {
      vi.runAllTimers();
    });

    expect(position.textContent).toBe('0,0');
  });

  it('resets useScrollPosition to 0,0 when disabled', () => {
    vi.useFakeTimers();

    const view = render(<ToggleableScrollPositionHarness />);
    const position = view.getByTestId('toggleable-scroll-position');
    const target = view.getByTestId('toggleable-scroll-target');

    setElementScroll(target, 6, 24);
    fireEvent.scroll(target);

    act(() => {
      vi.runAllTimers();
    });

    expect(position.textContent).toBe('6,24');

    fireEvent.click(view.getByRole('button', { name: 'disable scroll position' }));

    act(() => {
      vi.runAllTimers();
    });

    expect(position.textContent).toBe('0,0');

    setElementScroll(target, 9, 40);
    fireEvent.scroll(target);

    act(() => {
      vi.runAllTimers();
    });

    expect(position.textContent).toBe('0,0');
  });

  it('throttles window scroll updates with leading and trailing behavior', () => {
    vi.useFakeTimers();

    const view = render(<WindowScrollPositionHarness throttleMs={100} />);
    const position = view.getByTestId('window-scroll-position');

    expect(position.textContent).toBe('0,0');

    act(() => {
      setWindowScroll(5, 10);
      fireEvent.scroll(window);
    });

    expect(position.textContent).toBe('5,10');

    act(() => {
      vi.advanceTimersByTime(20);
      setWindowScroll(9, 30);
      fireEvent.scroll(window);
    });

    expect(position.textContent).toBe('5,10');

    act(() => {
      vi.advanceTimersByTime(20);
      setWindowScroll(11, 40);
      fireEvent.scroll(window);
    });

    expect(position.textContent).toBe('5,10');

    act(() => {
      vi.advanceTimersByTime(60);
    });

    expect(position.textContent).toBe('11,40');
  });

  it('throttles viewport resize updates with leading and trailing behavior', () => {
    vi.useFakeTimers();

    const view = render(<ViewportSizeHarness throttleMs={100} />);
    const size = view.getByTestId('viewport-size');

    expect(size.textContent).toBe('1024,768');

    act(() => {
      setWindowSize(1100, 768);
      fireEvent.resize(window);
    });

    expect(size.textContent).toBe('1100,768');

    act(() => {
      vi.advanceTimersByTime(20);
      setWindowSize(1200, 768);
      fireEvent.resize(window);
    });

    expect(size.textContent).toBe('1100,768');

    act(() => {
      vi.advanceTimersByTime(20);
      setWindowSize(1300, 768);
      fireEvent.resize(window);
    });

    expect(size.textContent).toBe('1100,768');

    act(() => {
      vi.advanceTimersByTime(60);
    });

    expect(size.textContent).toBe('1300,768');
  });

  it('cancels a pending throttled scroll update when the listener unmounts', () => {
    vi.useFakeTimers();
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
    const target = document.createElement('div');
    setElementScroll(target, 0, 0);

    const view = render(<ElementScrollPositionHarness target={target} throttleMs={100} />);

    act(() => {
      setElementScroll(target, 5, 10);
      fireEvent.scroll(target);
    });

    act(() => {
      vi.advanceTimersByTime(20);
      setElementScroll(target, 8, 20);
      fireEvent.scroll(target);
    });

    view.unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  it('keeps viewport size fixed when the hook is disabled', () => {
    vi.useFakeTimers();

    const view = render(<DisabledViewportSizeHarness enabled={false} throttleMs={0} />);
    const size = view.getByTestId('disabled-viewport-size');

    expect(size.textContent).toBe('1024,768');

    act(() => {
      setWindowSize(1400, 900);
      fireEvent.resize(window);
      vi.runAllTimers();
    });

    expect(size.textContent).toBe('1024,768');
  });
});
