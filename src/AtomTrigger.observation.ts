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

export type ObservationBinding = ObservationConfig & {
  target: SchedulerTarget;
};

export type ObservationController = {
  registration: SentinelRegistration;
  binding: ObservationBinding | null;
  dispose: (() => void) | null;
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

function applyObservationCallbacks(
  registration: SentinelRegistration,
  callbacks: ObservationCallbacks,
): void {
  registration.onEnter = callbacks.onEnter;
  registration.onLeave = callbacks.onLeave;
  registration.onEvent = callbacks.onEvent;
}

function clearObservationBinding(controller: ObservationController): void {
  controller.dispose?.();
  controller.dispose = null;
  controller.binding = null;
}

export function createObservationController(
  config: ObservationConfig,
  callbacks: ObservationCallbacks,
): ObservationController {
  return {
    registration: createRegistration(config, callbacks),
    binding: null,
    dispose: null,
  };
}

export function updateObservationCallbacks(
  controller: ObservationController,
  callbacks: ObservationCallbacks,
): void {
  applyObservationCallbacks(controller.registration, callbacks);
}

export function reconcileObservationBinding(
  controller: ObservationController,
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
  const registration = controller.registration;

  if (!input.node) {
    resetObservationState(registration);
    clearObservationBinding(controller);
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
    clearObservationBinding(controller);
    Object.assign(registration, nextConfig);
    resetObservationState(registration);
    return;
  }

  const nextBinding: ObservationBinding = {
    ...nextConfig,
    target: input.target,
  };

  const bindingUnchanged =
    controller.binding !== null &&
    controller.binding.node === nextBinding.node &&
    controller.binding.target === nextBinding.target &&
    controller.binding.rootMargin === nextBinding.rootMargin &&
    controller.binding.threshold === nextBinding.threshold &&
    controller.binding.once === nextBinding.once &&
    controller.binding.oncePerDirection === nextBinding.oncePerDirection &&
    controller.binding.fireOnInitialVisible === nextBinding.fireOnInitialVisible;

  if (bindingUnchanged) {
    Object.assign(registration, nextConfig);
    return;
  }

  resetObservationState(registration);
  clearObservationBinding(controller);
  Object.assign(registration, nextConfig);
  controller.dispose = registerSentinel(input.target, registration);
  controller.binding = nextBinding;
}

export function disposeObservationController(controller: ObservationController): void {
  clearObservationBinding(controller);
}
