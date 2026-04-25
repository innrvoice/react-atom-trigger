import type { AtomTriggerEvent } from './AtomTrigger.types';
import { registerSentinel, type SentinelRegistration } from './AtomTrigger.scheduler';
import type { SchedulerTarget } from './AtomTrigger.root';
import { resetObservationState } from './AtomTrigger.sampling';

export type ObservationConfig = {
  node: Element;
  rootMargin: string;
  threshold: number;
  once: boolean;
  oncePerDirection: boolean;
  fireOnInitialVisible: boolean;
};

export type ObservationCallbacks = {
  onEnter?: (event: AtomTriggerEvent) => void;
  onLeave?: (event: AtomTriggerEvent) => void;
  onEvent?: (event: AtomTriggerEvent) => void;
};

export type SubscriptionSnapshot = ObservationConfig & {
  target: SchedulerTarget;
};

export type ObservationState = {
  registration: SentinelRegistration;
  subscription: SubscriptionSnapshot | null;
  unsubscribe: (() => void) | null;
};

function createRegistration(
  config: ObservationConfig,
  callbacks: ObservationCallbacks,
): SentinelRegistration {
  return {
    ...config,
    ...callbacks,
    previousTriggerActive: undefined,
    previousRect: null,
    counts: {
      entered: 0,
      left: 0,
    },
  };
}

function clearObservationSubscription(observation: ObservationState): void {
  observation.unsubscribe?.();
  observation.unsubscribe = null;
  observation.subscription = null;
}

export function createObservationState(
  config: ObservationConfig,
  callbacks: ObservationCallbacks,
): ObservationState {
  return {
    registration: createRegistration(config, callbacks),
    subscription: null,
    unsubscribe: null,
  };
}

export function updateObservationCallbacks(
  observation: ObservationState,
  callbacks: ObservationCallbacks,
): void {
  observation.registration.onEnter = callbacks.onEnter;
  observation.registration.onLeave = callbacks.onLeave;
  observation.registration.onEvent = callbacks.onEvent;
}

export function syncObservationSubscription(
  observation: ObservationState,
  input: {
    disabled: boolean;
    node: Element | null;
    target: SchedulerTarget | null;
    rootMargin: string;
    threshold: number;
    once: boolean;
    oncePerDirection: boolean;
    fireOnInitialVisible: boolean;
  },
): void {
  const registration = observation.registration;

  if (!input.node) {
    resetObservationState(registration);
    clearObservationSubscription(observation);
    return;
  }

  const nextConfig: ObservationConfig = {
    node: input.node,
    rootMargin: input.rootMargin,
    threshold: input.threshold,
    once: input.once,
    oncePerDirection: input.oncePerDirection,
    fireOnInitialVisible: input.fireOnInitialVisible,
  };

  if (input.disabled || !input.target) {
    clearObservationSubscription(observation);
    Object.assign(registration, nextConfig);
    resetObservationState(registration);
    return;
  }

  const nextSubscription: SubscriptionSnapshot = {
    ...nextConfig,
    target: input.target,
  };

  const subscriptionUnchanged =
    observation.subscription !== null &&
    observation.subscription.node === nextSubscription.node &&
    observation.subscription.target === nextSubscription.target &&
    observation.subscription.rootMargin === nextSubscription.rootMargin &&
    observation.subscription.threshold === nextSubscription.threshold &&
    observation.subscription.once === nextSubscription.once &&
    observation.subscription.oncePerDirection === nextSubscription.oncePerDirection &&
    observation.subscription.fireOnInitialVisible === nextSubscription.fireOnInitialVisible;

  if (subscriptionUnchanged) {
    Object.assign(registration, nextConfig);
    return;
  }

  resetObservationState(registration);
  clearObservationSubscription(observation);
  Object.assign(registration, nextConfig);
  observation.unsubscribe = registerSentinel(input.target, registration);
  observation.subscription = nextSubscription;
}

export function cleanupObservationState(observation: ObservationState): void {
  clearObservationSubscription(observation);
}
