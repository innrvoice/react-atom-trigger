import type { AtomTriggerEvent, TriggerCounts } from './AtomTrigger.types';
import { isWindowLike } from './AtomTrigger.runtime';
import { type SchedulerTarget } from './AtomTrigger.root';
import { sampleRegistration } from './AtomTrigger.sampling';

export type SampleCause = 'geometry-change' | 'root-change' | 'scroll';

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
  pendingSampleCause: SampleCause | null;
  previousBaseRootBounds: DOMRectReadOnly | null;
  resizeObserver: ResizeObserver | null;
  intersectionObserver: IntersectionObserver | null;
  queueSample: (cause?: SampleCause) => void;
  cleanup: () => void;
};

const rootSchedulers = new WeakMap<SchedulerTarget, RootScheduler>();

function createViewportRootBounds(): DOMRectReadOnly {
  return new DOMRect(0, 0, window.innerWidth, window.innerHeight);
}

function isWindowTarget(target: SchedulerTarget): target is Window {
  return target === window || isWindowLike(target);
}

function createRootScheduler(target: SchedulerTarget): RootScheduler {
  const scheduler: RootScheduler = {
    registrations: new Set<SentinelRegistration>(),
    rafId: 0,
    pendingSampleCause: null,
    previousBaseRootBounds: null,
    resizeObserver: null,
    intersectionObserver: null,
    queueSample: () => {},
    cleanup: () => {},
  };

  const flushSamples = () => {
    scheduler.rafId = 0;

    if (scheduler.registrations.size === 0) {
      scheduler.pendingSampleCause = null;
      return;
    }

    const sampleCause = scheduler.pendingSampleCause ?? 'geometry-change';
    scheduler.pendingSampleCause = null;
    const baseRootBounds = isWindowTarget(target)
      ? createViewportRootBounds()
      : target.getBoundingClientRect();
    const rootBoundsChanged =
      scheduler.previousBaseRootBounds !== null &&
      (scheduler.previousBaseRootBounds.top !== baseRootBounds.top ||
        scheduler.previousBaseRootBounds.left !== baseRootBounds.left ||
        scheduler.previousBaseRootBounds.width !== baseRootBounds.width ||
        scheduler.previousBaseRootBounds.height !== baseRootBounds.height);

    for (const registration of scheduler.registrations) {
      sampleRegistration(registration, baseRootBounds, sampleCause, rootBoundsChanged);
    }

    scheduler.previousBaseRootBounds = new DOMRect(
      baseRootBounds.left,
      baseRootBounds.top,
      baseRootBounds.width,
      baseRootBounds.height,
    );
  };

  const queueSample = (cause: SampleCause = 'geometry-change') => {
    if (
      scheduler.pendingSampleCause === null ||
      (scheduler.pendingSampleCause === 'geometry-change' && cause !== 'geometry-change') ||
      (scheduler.pendingSampleCause === 'root-change' && cause === 'scroll')
    ) {
      scheduler.pendingSampleCause = cause;
    }

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

  const handleScroll = () => {
    queueSample('scroll');
  };
  const handleRootChange = () => {
    queueSample('root-change');
  };

  target.addEventListener('scroll', handleScroll, { passive: true });
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
        queueSample('geometry-change');
      },
      {
        root: isWindowTarget(target) ? null : target,
        // This observer is only a nearby invalidation signal. Visibility correctness still comes
        // from the custom geometry engine, so we use a broad envelope instead of mirroring
        // the public rootMargin prop exactly.
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

    target.removeEventListener('scroll', handleScroll);
    window.removeEventListener('resize', handleRootChange);
    scheduler.resizeObserver?.disconnect();
    scheduler.intersectionObserver?.disconnect();
    scheduler.pendingSampleCause = null;
    scheduler.previousBaseRootBounds = null;
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
  const observedNode = registration.node;

  scheduler.registrations.add(registration);
  scheduler.resizeObserver?.observe(observedNode);
  scheduler.intersectionObserver?.observe(observedNode);
  scheduler.queueSample();

  const dispose = () => {
    if (isDisposed) {
      return;
    }

    isDisposed = true;
    scheduler.registrations.delete(registration);
    scheduler.resizeObserver?.unobserve(observedNode);
    scheduler.intersectionObserver?.unobserve(observedNode);
    registration.dispose = undefined;

    if (scheduler.registrations.size === 0) {
      scheduler.cleanup();
      rootSchedulers.delete(target);
    }
  };

  registration.dispose = dispose;

  return dispose;
}
