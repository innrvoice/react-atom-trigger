import { cleanup, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { __resetWarningsForTests } from '../AtomTrigger.warnings';

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

export function setActiveScrollPosition(top: number, left: number): void {
  activeScrollTop = top;
  activeScrollLeft = left;
}

export function getActiveScrollPosition(): { top: number; left: number } {
  return {
    top: activeScrollTop,
    left: activeScrollLeft,
  };
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
  setRect(element, () => {
    const activeScroll = getActiveScrollPosition();
    return new DOMRect(left + activeScroll.left, top - activeScroll.top, width, height);
  });
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
  setActiveScrollPosition(0, 0);
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

export function scrollElement(target: HTMLElement, nextTop: number, nextLeft = 0): void {
  setActiveScrollPosition(nextTop, nextLeft);
  fireEvent.scroll(target);
}

export function scrollViewport(nextTop: number, nextLeft = 0): void {
  setActiveScrollPosition(nextTop, nextLeft);
  fireEvent.scroll(window);
}
