import type {
  AtomTriggerEntry,
  AtomTriggerEvent,
  TriggerCounts,
  TriggerType,
} from './AtomTrigger.types';
import {
  getEffectiveRootBounds,
  getIntersectionRatio,
  getIntersectionRect,
  getMovementDirection,
  getTriggerPosition,
  normalizeTargetRect,
} from './AtomTrigger.geometry';
import type { SampleCause, SentinelRegistration } from './AtomTrigger.scheduler';

function shouldFire(
  type: TriggerType,
  counts: TriggerCounts,
  once: boolean,
  oncePerDirection: boolean,
): boolean {
  if (once && counts.entered + counts.left > 0) {
    return false;
  }

  if (oncePerDirection) {
    if (type === 'enter' && counts.entered > 0) {
      return false;
    }

    if (type === 'leave' && counts.left > 0) {
      return false;
    }
  }

  return true;
}

function isRegistrationComplete(registration: SentinelRegistration): boolean {
  if (registration.once) {
    return registration.counts.entered + registration.counts.left > 0;
  }

  if (registration.oncePerDirection) {
    return registration.counts.entered > 0 && registration.counts.left > 0;
  }

  return false;
}

export function resetObservationState(registration: SentinelRegistration): void {
  registration.previousTriggerActive = undefined;
  registration.previousRect = null;
}

export function sampleRegistration(
  registration: SentinelRegistration,
  baseRootBounds: DOMRectReadOnly,
  sampleCause: SampleCause,
  rootBoundsChanged: boolean,
): void {
  const rect = normalizeTargetRect(registration.node.getBoundingClientRect());
  const effectiveRootBounds = getEffectiveRootBounds(baseRootBounds, registration.rootMargin);
  const intersectionRect = getIntersectionRect(rect, effectiveRootBounds);
  const intersectionRatio = getIntersectionRatio(rect, intersectionRect);
  const isVisible = intersectionRatio > 0;
  const previousTriggerActive = registration.previousTriggerActive;
  const nextTriggerActive =
    previousTriggerActive === true
      ? isVisible
      : registration.threshold === 0
        ? isVisible
        : intersectionRatio >= registration.threshold;
  const movementDirection =
    registration.previousRect && (sampleCause === 'root-change' || rootBoundsChanged)
      ? 'stationary'
      : getMovementDirection(registration.previousRect, rect);

  registration.previousRect = rect;
  registration.previousTriggerActive = nextTriggerActive;

  const timestamp = Date.now();
  const entry: AtomTriggerEntry = {
    target: registration.node,
    rootBounds: effectiveRootBounds,
    boundingClientRect: rect,
    intersectionRect,
    isIntersecting: isVisible,
    intersectionRatio,
    source: 'geometry',
  };

  const isInitial = previousTriggerActive === undefined;
  if (isInitial && (!registration.fireOnInitialVisible || !nextTriggerActive)) {
    return;
  }

  if (previousTriggerActive === nextTriggerActive) {
    return;
  }

  const type: TriggerType = nextTriggerActive ? 'enter' : 'leave';
  if (!shouldFire(type, registration.counts, registration.once, registration.oncePerDirection)) {
    return;
  }

  const nextCounts =
    type === 'enter'
      ? { ...registration.counts, entered: registration.counts.entered + 1 }
      : { ...registration.counts, left: registration.counts.left + 1 };
  registration.counts = nextCounts;

  const payload: AtomTriggerEvent = {
    type,
    isInitial,
    entry,
    counts: nextCounts,
    movementDirection,
    position: getTriggerPosition(entry),
    timestamp,
  };

  registration.onEvent?.(payload);

  if (type === 'enter') {
    registration.onEnter?.(payload);
  } else {
    registration.onLeave?.(payload);
  }

  if (isRegistrationComplete(registration)) {
    registration.dispose?.();
  }
}
