import type {
  AtomTriggerEntry,
  AtomTriggerEvent,
  AtomTriggerProps,
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

export type SchedulerTarget = Window | Element;

export type SentinelRegistration = {
  node: Element;
  rootMargin: string;
  threshold: number;
  once: boolean;
  oncePerDirection: boolean;
  fireOnInitialVisible: boolean;
  dispose?: () => void;
  onEnter?: (event: AtomTriggerEvent) => void;
  onLeave?: (event: AtomTriggerEvent) => void;
  onEvent?: (event: AtomTriggerEvent) => void;
  previousTriggerActive?: boolean;
  previousRect: DOMRectReadOnly | null;
  counts: TriggerCounts;
};

type RootScheduler = {
  registrations: Set<SentinelRegistration>;
  rafId: number;
  resizeObserver: ResizeObserver | null;
  intersectionObserver: IntersectionObserver | null;
  queueSample: () => void;
  cleanup: () => void;
};

const rootSchedulers = new WeakMap<SchedulerTarget, RootScheduler>();

function createViewportRootBounds(): DOMRectReadOnly {
  return new DOMRect(0, 0, window.innerWidth, window.innerHeight);
}

function isWindowTarget(target: SchedulerTarget): target is Window {
  return target === window || (typeof Window !== 'undefined' && target instanceof Window);
}

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

function sampleRegistration(
  registration: SentinelRegistration,
  baseRootBounds: DOMRectReadOnly,
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
  const movementDirection = getMovementDirection(registration.previousRect, rect);

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

function createRootScheduler(target: SchedulerTarget): RootScheduler {
  const scheduler: RootScheduler = {
    registrations: new Set<SentinelRegistration>(),
    rafId: 0,
    resizeObserver: null,
    intersectionObserver: null,
    queueSample: () => {},
    cleanup: () => {},
  };

  const flushSamples = () => {
    scheduler.rafId = 0;

    if (scheduler.registrations.size === 0) {
      return;
    }

    const baseRootBounds = isWindowTarget(target)
      ? createViewportRootBounds()
      : target.getBoundingClientRect();

    for (const registration of scheduler.registrations) {
      sampleRegistration(registration, baseRootBounds);
    }
  };

  const queueSample = () => {
    if (scheduler.rafId !== 0) {
      return;
    }

    scheduler.rafId = -1;
    const nextFrameId = window.requestAnimationFrame(() => {
      scheduler.rafId = 0;
      flushSamples();
    });

    if (scheduler.rafId === -1) {
      scheduler.rafId = nextFrameId;
    }
  };

  const handleRootChange = () => {
    queueSample();
  };

  target.addEventListener('scroll', handleRootChange, { passive: true });
  window.addEventListener('resize', handleRootChange);

  if (typeof ResizeObserver !== 'undefined') {
    scheduler.resizeObserver = new ResizeObserver(handleRootChange);

    if (!isWindowTarget(target)) {
      scheduler.resizeObserver.observe(target);
    }
  }

  if (typeof IntersectionObserver !== 'undefined') {
    scheduler.intersectionObserver = new IntersectionObserver(
      () => {
        queueSample();
      },
      {
        root: isWindowTarget(target) ? null : target,
        // This observer is only an invalidation signal. Visibility correctness still comes
        // from the custom geometry engine, so we use a broad envelope instead of mirroring
        // the public rootMargin prop.
        rootMargin: '200% 200% 200% 200%',
        threshold: 0,
      },
    );
  }

  scheduler.queueSample = queueSample;
  scheduler.cleanup = () => {
    if (scheduler.rafId !== 0) {
      cancelAnimationFrame(scheduler.rafId);
      scheduler.rafId = 0;
    }

    target.removeEventListener('scroll', handleRootChange);
    window.removeEventListener('resize', handleRootChange);
    scheduler.resizeObserver?.disconnect();
    scheduler.intersectionObserver?.disconnect();
  };

  return scheduler;
}

function getOrCreateRootScheduler(target: SchedulerTarget): RootScheduler {
  const existing = rootSchedulers.get(target);
  if (existing) {
    return existing;
  }

  const created = createRootScheduler(target);
  rootSchedulers.set(target, created);
  return created;
}

export function registerSentinel(
  target: SchedulerTarget,
  registration: SentinelRegistration,
): () => void {
  const scheduler = getOrCreateRootScheduler(target);
  let isDisposed = false;

  scheduler.registrations.add(registration);
  scheduler.resizeObserver?.observe(registration.node);
  scheduler.intersectionObserver?.observe(registration.node);
  scheduler.queueSample();

  const dispose = () => {
    if (isDisposed) {
      return;
    }

    isDisposed = true;
    scheduler.registrations.delete(registration);
    scheduler.resizeObserver?.unobserve(registration.node);
    scheduler.intersectionObserver?.unobserve(registration.node);
    registration.dispose = undefined;

    if (scheduler.registrations.size === 0) {
      scheduler.cleanup();
      rootSchedulers.delete(target);
    }
  };

  registration.dispose = dispose;

  return dispose;
}

export function resolveSchedulerTarget(
  root: AtomTriggerProps['root'],
  rootRef: AtomTriggerProps['rootRef'],
): SchedulerTarget | null {
  if (rootRef) {
    return rootRef.current;
  }

  if (root) {
    return root;
  }

  if (typeof window === 'undefined') {
    return null;
  }

  return window;
}
