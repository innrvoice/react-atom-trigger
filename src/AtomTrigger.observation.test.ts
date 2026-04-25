import { afterEach, describe, expect, it, vi } from 'vitest';
import * as scheduler from './AtomTrigger.scheduler';
import * as sampling from './AtomTrigger.sampling';
import {
  cleanupObservationState,
  createObservationState,
  syncObservationSubscription,
  updateObservationCallbacks,
} from './AtomTrigger.observation';

function createNode(): Element {
  return document.createElement('div');
}

describe('AtomTrigger observation state', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('updates callbacks without replacing the registration object', () => {
    const node = createNode();
    const firstOnEnter = vi.fn();
    const secondOnEnter = vi.fn();
    const observation = createObservationState(
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

    updateObservationCallbacks(observation, { onEnter: secondOnEnter });

    expect(observation.registration.node).toBe(node);
    expect(observation.registration.onEnter).toBe(secondOnEnter);
  });

  it('clears subscription state when no node is available', () => {
    const unsubscribe = vi.fn();
    const observation = createObservationState(
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

    observation.unsubscribe = unsubscribe;
    observation.subscription = {
      node: createNode(),
      target: window,
      rootMargin: '0px',
      threshold: 0,
      once: false,
      oncePerDirection: false,
      fireOnInitialVisible: false,
    };

    syncObservationSubscription(observation, {
      disabled: false,
      node: null,
      target: window,
      rootMargin: '0px',
      threshold: 0,
      once: false,
      oncePerDirection: false,
      fireOnInitialVisible: false,
    });

    expect(unsubscribe).toHaveBeenCalledTimes(1);
    expect(observation.subscription).toBeNull();
    expect(observation.unsubscribe).toBeNull();
  });

  it('resets and stays unsubscribed when disabled or missing a target', () => {
    const resetSpy = vi.spyOn(sampling, 'resetObservationState');
    const observation = createObservationState(
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

    syncObservationSubscription(observation, {
      disabled: true,
      node: observation.registration.node,
      target: null,
      rootMargin: '10px',
      threshold: 1,
      once: true,
      oncePerDirection: true,
      fireOnInitialVisible: true,
    });

    expect(resetSpy).toHaveBeenCalledWith(observation.registration);
    expect(observation.subscription).toBeNull();
    expect(observation.unsubscribe).toBeNull();
    expect(observation.registration.node).toBe(observation.registration.node);
  });

  it('avoids resubscribing when the subscription snapshot is unchanged', () => {
    const registerSpy = vi.spyOn(scheduler, 'registerSentinel').mockReturnValue(vi.fn());
    const observation = createObservationState(
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
      node: observation.registration.node,
      target: window,
      rootMargin: '0px',
      threshold: 0,
      once: false,
      oncePerDirection: false,
      fireOnInitialVisible: false,
    } as const;

    syncObservationSubscription(observation, input);
    syncObservationSubscription(observation, input);

    expect(registerSpy).toHaveBeenCalledTimes(1);
  });

  it('cleans up an active subscription when the observation state is cleaned up', () => {
    const unsubscribe = vi.fn();
    const observation = createObservationState(
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

    observation.unsubscribe = unsubscribe;
    cleanupObservationState(observation);

    expect(unsubscribe).toHaveBeenCalledTimes(1);
    expect(observation.subscription).toBeNull();
    expect(observation.unsubscribe).toBeNull();
  });
});
