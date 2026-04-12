import { afterEach, describe, expect, it, vi } from 'vitest';
import * as scheduler from './AtomTrigger.scheduler';
import * as sampling from './AtomTrigger.sampling';
import {
  createObservationController,
  disposeObservationController,
  reconcileObservationBinding,
  updateObservationCallbacks,
} from './AtomTrigger.observation';

function createNode(): Element {
  return document.createElement('div');
}

describe('AtomTrigger observation controller', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('updates callbacks without replacing the registration object', () => {
    const node = createNode();
    const firstOnEnter = vi.fn();
    const secondOnEnter = vi.fn();
    const controller = createObservationController(
      {
        node,
        rootMargin: '0px',
        threshold: 0,
        once: false,
        oncePerDirection: false,
        fireOnInitialVisible: false,
      },
      { onEnter: firstOnEnter },
    );

    updateObservationCallbacks(controller, { onEnter: secondOnEnter });

    expect(controller.registration.node).toBe(node);
    expect(controller.registration.onEnter).toBe(secondOnEnter);
  });

  it('clears binding state when no node is available', () => {
    const dispose = vi.fn();
    const controller = createObservationController(
      {
        node: createNode(),
        rootMargin: '0px',
        threshold: 0,
        once: false,
        oncePerDirection: false,
        fireOnInitialVisible: false,
      },
      {},
    );

    controller.dispose = dispose;
    controller.binding = {
      node: createNode(),
      target: window,
      rootMargin: '0px',
      threshold: 0,
      once: false,
      oncePerDirection: false,
      fireOnInitialVisible: false,
    };

    reconcileObservationBinding(controller, {
      disabled: false,
      node: null,
      target: window,
      rootMargin: '0px',
      threshold: 0,
      once: false,
      oncePerDirection: false,
      fireOnInitialVisible: false,
    });

    expect(dispose).toHaveBeenCalledTimes(1);
    expect(controller.binding).toBeNull();
    expect(controller.dispose).toBeNull();
  });

  it('resets and stays unsubscribed when disabled or missing a target', () => {
    const resetSpy = vi.spyOn(sampling, 'resetObservationState');
    const controller = createObservationController(
      {
        node: createNode(),
        rootMargin: '0px',
        threshold: 0,
        once: false,
        oncePerDirection: false,
        fireOnInitialVisible: false,
      },
      {},
    );

    reconcileObservationBinding(controller, {
      disabled: true,
      node: controller.registration.node,
      target: null,
      rootMargin: '10px',
      threshold: 1,
      once: true,
      oncePerDirection: true,
      fireOnInitialVisible: true,
    });

    expect(resetSpy).toHaveBeenCalledWith(controller.registration);
    expect(controller.binding).toBeNull();
    expect(controller.dispose).toBeNull();
    expect(controller.registration.node).toBe(controller.registration.node);
  });

  it('avoids resubscribing when the binding snapshot is unchanged', () => {
    const registerSpy = vi.spyOn(scheduler, 'registerSentinel').mockReturnValue(vi.fn());
    const controller = createObservationController(
      {
        node: createNode(),
        rootMargin: '0px',
        threshold: 0,
        once: false,
        oncePerDirection: false,
        fireOnInitialVisible: false,
      },
      {},
    );

    const input = {
      disabled: false,
      node: controller.registration.node,
      target: window,
      rootMargin: '0px',
      threshold: 0,
      once: false,
      oncePerDirection: false,
      fireOnInitialVisible: false,
    } as const;

    reconcileObservationBinding(controller, input);
    reconcileObservationBinding(controller, input);

    expect(registerSpy).toHaveBeenCalledTimes(1);
  });

  it('cleans up an active subscription when the controller is disposed', () => {
    const dispose = vi.fn();
    const controller = createObservationController(
      {
        node: createNode(),
        rootMargin: '0px',
        threshold: 0,
        once: false,
        oncePerDirection: false,
        fireOnInitialVisible: false,
      },
      {},
    );

    controller.dispose = dispose;
    disposeObservationController(controller);

    expect(dispose).toHaveBeenCalledTimes(1);
    expect(controller.binding).toBeNull();
    expect(controller.dispose).toBeNull();
  });
});
