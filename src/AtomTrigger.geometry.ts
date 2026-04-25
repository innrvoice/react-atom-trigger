import type {
  AtomTriggerEntry,
  MovementDirection,
  RootMarginTuple,
  TriggerPosition,
} from './AtomTrigger.types';
import { warnOnce } from './AtomTrigger.warnings';

export type RootMarginValues = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

function isRootMarginTuple(value: unknown): value is RootMarginTuple {
  return (
    Array.isArray(value) &&
    value.length === 4 &&
    value.every(entry => typeof entry === 'number' && Number.isFinite(entry))
  );
}

export function normalizeRootMargin(
  rootMargin: string | RootMarginTuple | null | undefined,
): string {
  if (typeof rootMargin === 'string') {
    return rootMargin;
  }

  if (isRootMarginTuple(rootMargin)) {
    return rootMargin.map(value => `${Object.is(value, -0) ? 0 : value}px`).join(' ');
  }

  if (rootMargin === null || rootMargin === undefined) {
    return '0px';
  }

  if (process.env.NODE_ENV === 'development') {
    warnOnce(
      `[react-atom-trigger] Invalid rootMargin array ${JSON.stringify(rootMargin)}. Use exactly four finite numbers: [top, right, bottom, left]. Falling back to 0px.`,
    );
  }

  return '0px';
}

function parseMarginPart(part: string, axisSize: number): number {
  const value = part.trim();
  if (/^[+-]?0(?:\.0+)?$/.test(value)) {
    return 0;
  }

  const match = value.match(/^([+-]?(?:\d+\.?\d*|\.\d+))(px|%)$/);
  if (!match) {
    if (process.env.NODE_ENV === 'development') {
      warnOnce(
        `[react-atom-trigger] Invalid rootMargin token "${value}". Use px, % or 0. Falling back to 0px.`,
      );
    }
    return 0;
  }

  const [, numericPart, unit] = match;
  const numeric = Number.parseFloat(numericPart);

  if (unit === '%') {
    return (numeric / 100) * axisSize;
  }

  return numeric;
}

function resolveRootMargin(
  rootMargin: string,
  rootWidth: number,
  rootHeight: number,
): RootMarginValues {
  const parts = rootMargin.trim().split(/\s+/).filter(Boolean);
  if (parts.length > 4) {
    if (process.env.NODE_ENV === 'development') {
      warnOnce(
        `[react-atom-trigger] Invalid rootMargin "${rootMargin}". Use 1 to 4 values in IntersectionObserver order. Falling back to 0px.`,
      );
    }

    return {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    };
  }

  const [a = '0px', b = a, c = a, d = b] = parts;

  return {
    top: parseMarginPart(a, rootHeight),
    right: parseMarginPart(b, rootWidth),
    bottom: parseMarginPart(c, rootHeight),
    left: parseMarginPart(d, rootWidth),
  };
}

export function getEffectiveRootBounds(
  baseRootBounds: DOMRectReadOnly,
  rootMargin: string,
): DOMRectReadOnly {
  const margins = resolveRootMargin(rootMargin, baseRootBounds.width, baseRootBounds.height);

  return new DOMRect(
    baseRootBounds.left - margins.left,
    baseRootBounds.top - margins.top,
    baseRootBounds.width + margins.left + margins.right,
    baseRootBounds.height + margins.top + margins.bottom,
  );
}

export function normalizeTargetRect(rect: DOMRectReadOnly): DOMRectReadOnly {
  const width = rect.width > 0 ? rect.width : 1;
  const height = rect.height > 0 ? rect.height : 1;

  if (width === rect.width && height === rect.height) {
    return rect;
  }

  return new DOMRect(rect.left, rect.top, width, height);
}

export function getIntersectionRect(
  rect: DOMRectReadOnly,
  rootBounds: DOMRectReadOnly,
): DOMRectReadOnly {
  const left = Math.max(rect.left, rootBounds.left);
  const top = Math.max(rect.top, rootBounds.top);
  const right = Math.min(rect.right, rootBounds.right);
  const bottom = Math.min(rect.bottom, rootBounds.bottom);

  if (right <= left || bottom <= top) {
    return new DOMRect(0, 0, 0, 0);
  }

  return new DOMRect(left, top, right - left, bottom - top);
}

export function getIntersectionRatio(
  rect: DOMRectReadOnly,
  intersectionRect: DOMRectReadOnly,
): number {
  const targetArea = rect.width * rect.height;
  if (targetArea <= 0) {
    return 0;
  }

  return (intersectionRect.width * intersectionRect.height) / targetArea;
}

function clampThreshold(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function normalizeThreshold(threshold: unknown): number {
  if (Array.isArray(threshold)) {
    if (process.env.NODE_ENV === 'development') {
      warnOnce(
        '[react-atom-trigger] `threshold` expects a single number in v2. Using the first finite numeric entry.',
      );
    }
    const firstNumeric = threshold.find(
      (value): value is number => typeof value === 'number' && Number.isFinite(value),
    );
    return clampThreshold(firstNumeric ?? 0);
  }

  if (threshold === null || threshold === undefined) {
    return 0;
  }

  if (typeof threshold !== 'number' || !Number.isFinite(threshold)) {
    if (process.env.NODE_ENV === 'development') {
      warnOnce(
        '[react-atom-trigger] `threshold` must be a finite number between 0 and 1. Falling back to 0.',
      );
    }
    return 0;
  }

  if (threshold < 0 || threshold > 1) {
    if (process.env.NODE_ENV === 'development') {
      warnOnce('[react-atom-trigger] `threshold` should be between 0 and 1. Values are clamped.');
    }
  }

  return clampThreshold(threshold);
}

export function getMovementDirection(
  previousRect: DOMRectReadOnly | null,
  currentRect: DOMRectReadOnly,
): MovementDirection {
  if (!previousRect) {
    return 'unknown';
  }

  const dx = currentRect.left - previousRect.left;
  const dy = currentRect.top - previousRect.top;

  if (dx === 0 && dy === 0) {
    return 'stationary';
  }

  if (Math.abs(dy) >= Math.abs(dx)) {
    return dy < 0 ? 'up' : 'down';
  }

  return dx < 0 ? 'left' : 'right';
}

export function getTriggerPosition(entry: AtomTriggerEntry): TriggerPosition {
  if (entry.isIntersecting) {
    return 'inside';
  }

  const rect = entry.boundingClientRect;
  const rootTop = entry.rootBounds?.top ?? 0;
  const rootBottom = entry.rootBounds?.bottom ?? window.innerHeight;
  const rootLeft = entry.rootBounds?.left ?? 0;
  const rootRight = entry.rootBounds?.right ?? window.innerWidth;

  if (rect.bottom <= rootTop) {
    return 'above';
  }

  if (rect.top >= rootBottom) {
    return 'below';
  }

  if (rect.right <= rootLeft) {
    return 'left';
  }

  if (rect.left >= rootRight) {
    return 'right';
  }

  return 'outside';
}
