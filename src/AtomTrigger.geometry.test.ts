import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getEffectiveRootBounds,
  getIntersectionRatio,
  getIntersectionRect,
  getMovementDirection,
  getTriggerPosition,
  normalizeRootMargin,
  normalizeTargetRect,
  normalizeThreshold,
} from './AtomTrigger.geometry';
import { __resetWarningsForTests } from './AtomTrigger.warnings';

describe('AtomTrigger geometry helpers', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 1024,
      writable: true,
    });
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 768,
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    __resetWarningsForTests();
    delete process.env.NODE_ENV;
  });

  it('normalizes rootMargin tuples and falls back for nullish or invalid arrays', () => {
    process.env.NODE_ENV = 'development';
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(normalizeRootMargin([1, -0, 3, 4])).toBe('1px 0px 3px 4px');
    expect(normalizeRootMargin(null)).toBe('0px');
    expect(normalizeRootMargin(undefined)).toBe('0px');
    expect(normalizeRootMargin([1, 2, Number.NaN, 4] as [number, number, number, number])).toBe(
      '0px',
    );

    expect(warn).toHaveBeenCalledWith(
      '[react-atom-trigger] Invalid rootMargin array [1,2,null,4]. Use exactly four finite numbers: [top, right, bottom, left]. Falling back to 0px.',
    );
  });

  it('resolves px, percent, blank, and invalid rootMargin parts when expanding root bounds', () => {
    process.env.NODE_ENV = 'development';
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const base = new DOMRect(10, 20, 200, 100);

    const expanded = getEffectiveRootBounds(base, '10% 5px 0 .0');

    expect(expanded.left).toBe(10);
    expect(expanded.top).toBe(10);
    expect(expanded.width).toBe(205);
    expect(expanded.height).toBe(110);

    const invalid = getEffectiveRootBounds(base, '1px auto');
    expect(invalid).toEqual(new DOMRect(10, 19, 200, 101));

    const tooMany = getEffectiveRootBounds(base, '1px 2px 3px 4px 5px');
    expect(tooMany).toEqual(new DOMRect(10, 20, 200, 100));

    expect(warn).toHaveBeenCalledWith(
      '[react-atom-trigger] Invalid rootMargin token "auto". Use px, % or 0. Falling back to 0px.',
    );
    expect(warn).toHaveBeenCalledWith(
      '[react-atom-trigger] Invalid rootMargin "1px 2px 3px 4px 5px". Use 1 to 4 values in IntersectionObserver order. Falling back to 0px.',
    );
  });

  it('normalizes target rectangles and computes intersection rectangles and ratios', () => {
    const untouched = new DOMRect(1, 2, 3, 4);
    const normalized = normalizeTargetRect(new DOMRect(10, 20, 0, -5));
    const rootBounds = new DOMRect(0, 0, 100, 100);
    const partialRect = new DOMRect(90, 90, 20, 20);
    const disjointRect = new DOMRect(110, 110, 20, 20);

    expect(normalizeTargetRect(untouched)).toBe(untouched);
    expect(normalized).toEqual(new DOMRect(10, 20, 1, 1));

    expect(getIntersectionRect(partialRect, rootBounds)).toEqual(new DOMRect(90, 90, 10, 10));
    expect(getIntersectionRect(disjointRect, rootBounds)).toEqual(new DOMRect(0, 0, 0, 0));
    expect(getIntersectionRatio(partialRect, new DOMRect(90, 90, 10, 10))).toBe(0.25);
    expect(getIntersectionRatio(new DOMRect(10, 10, 0, 10), new DOMRect(0, 0, 0, 0))).toBe(0);
  });

  it('normalizes threshold values and warns for invalid inputs', () => {
    process.env.NODE_ENV = 'development';
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(normalizeThreshold([Number.NaN, 0.25])).toBe(0.25);
    expect(normalizeThreshold(null)).toBe(0);
    expect(normalizeThreshold(undefined)).toBe(0);
    expect(normalizeThreshold('nope')).toBe(0);
    expect(normalizeThreshold(-0.5)).toBe(0);
    expect(normalizeThreshold(1.5)).toBe(1);

    expect(warn).toHaveBeenCalledWith(
      '[react-atom-trigger] `threshold` expects a single number in v2. Using the first finite numeric entry.',
    );
    expect(warn).toHaveBeenCalledWith(
      '[react-atom-trigger] `threshold` must be a finite number between 0 and 1. Falling back to 0.',
    );
    expect(warn).toHaveBeenCalledWith(
      '[react-atom-trigger] `threshold` should be between 0 and 1. Values are clamped.',
    );
  });

  it('detects movement direction across stationary, vertical, and horizontal changes', () => {
    const previous = new DOMRect(100, 100, 10, 10);

    expect(getMovementDirection(null, previous)).toBe('unknown');
    expect(getMovementDirection(previous, new DOMRect(100, 100, 10, 10))).toBe('stationary');
    expect(getMovementDirection(previous, new DOMRect(100, 80, 10, 10))).toBe('up');
    expect(getMovementDirection(previous, new DOMRect(100, 120, 10, 10))).toBe('down');
    expect(getMovementDirection(previous, new DOMRect(80, 100, 10, 10))).toBe('left');
    expect(getMovementDirection(previous, new DOMRect(120, 100, 10, 10))).toBe('right');
  });

  it('computes trigger position for each non-intersecting direction', () => {
    const rootBounds = new DOMRect(100, 100, 200, 150);
    const baseEntry = {
      target: document.createElement('div'),
      rootBounds,
      intersectionRect: new DOMRect(0, 0, 0, 0),
      isIntersecting: false,
      intersectionRatio: 0,
      source: 'geometry' as const,
    };

    expect(
      getTriggerPosition({
        ...baseEntry,
        isIntersecting: true,
        boundingClientRect: new DOMRect(120, 120, 10, 10),
      }),
    ).toBe('inside');
    expect(
      getTriggerPosition({
        ...baseEntry,
        boundingClientRect: new DOMRect(120, 70, 10, 20),
      }),
    ).toBe('above');
    expect(
      getTriggerPosition({
        ...baseEntry,
        boundingClientRect: new DOMRect(120, 260, 10, 20),
      }),
    ).toBe('below');
    expect(
      getTriggerPosition({
        ...baseEntry,
        boundingClientRect: new DOMRect(70, 120, 20, 10),
      }),
    ).toBe('left');
    expect(
      getTriggerPosition({
        ...baseEntry,
        boundingClientRect: new DOMRect(310, 120, 20, 10),
      }),
    ).toBe('right');
    expect(
      getTriggerPosition({
        ...baseEntry,
        boundingClientRect: new DOMRect(90, 120, 20, 10),
      }),
    ).toBe('outside');
    expect(
      getTriggerPosition({
        ...baseEntry,
        rootBounds: null,
        boundingClientRect: new DOMRect(0, 900, 10, 10),
      }),
    ).toBe('below');
  });
});
