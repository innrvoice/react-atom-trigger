import type { AtomTriggerEvent } from '../../../index';
import { describe, expect, it } from 'vitest';
import {
  animationDemoReducer,
  createInitialState,
  getTransitionDirectionFromEvent,
  resolveAnimationTransition,
} from './AnimationDemo.state';

describe('AnimationDemo transition resolver', () => {
  it('resolves middle trigger while moving down to sunset with both aircraft', () => {
    expect(resolveAnimationTransition('middle', 'down')).toEqual({
      nextMode: 'sunset',
      aircraft: 'both',
    });
  });

  it('resolves bottom trigger while moving down to night with plane only', () => {
    expect(resolveAnimationTransition('bottom', 'down')).toEqual({
      nextMode: 'night',
      aircraft: 'plane',
    });
  });

  it('resolves middle trigger while moving up to sunrise with helicopter only', () => {
    expect(resolveAnimationTransition('middle', 'up')).toEqual({
      nextMode: 'sunrise',
      aircraft: 'helicopter',
    });
  });

  it('resolves top trigger while moving up to day with both aircraft', () => {
    expect(resolveAnimationTransition('top', 'up')).toEqual({
      nextMode: 'day',
      aircraft: 'both',
    });
  });

  it('ignores unsupported trigger and direction combinations', () => {
    expect(resolveAnimationTransition('top', 'down')).toBeNull();
    expect(resolveAnimationTransition('bottom', 'up')).toBeNull();
    expect(resolveAnimationTransition('middle', 'left')).toBeNull();
  });
});

describe('AnimationDemo state helpers', () => {
  it('maps trigger movement directions back to scroll directions', () => {
    expect(getTransitionDirectionFromEvent('up')).toBe('down');
    expect(getTransitionDirectionFromEvent('down')).toBe('up');
    expect(getTransitionDirectionFromEvent('left')).toBeNull();
    expect(getTransitionDirectionFromEvent('stationary')).toBeNull();
  });

  it('updates transition state and resets back to the configured initial mode', () => {
    const event: AtomTriggerEvent = {
      type: 'enter',
      isInitial: false,
      entry: {
        target: document.createElement('div'),
        rootBounds: new DOMRect(0, 0, 320, 240),
        boundingClientRect: new DOMRect(0, 0, 24, 24),
        intersectionRect: new DOMRect(0, 0, 24, 24),
        isIntersecting: true,
        intersectionRatio: 1,
        source: 'geometry' as const,
      },
      counts: { entered: 1, left: 0 },
      movementDirection: 'down',
      position: 'inside',
      timestamp: 10,
    };

    const nextState = animationDemoReducer(createInitialState('day'), {
      type: 'triggered',
      transition: {
        nextMode: 'sunset',
        aircraft: 'both',
      },
      direction: 'down',
      event,
    });

    expect(nextState).toMatchObject({
      mode: 'sunset',
      activeAircraft: 'both',
      transitionDirection: 'down',
      transitionCount: 1,
      lastEvent: event,
    });

    expect(
      animationDemoReducer(nextState, {
        type: 'reset',
        mode: 'sunrise',
      }),
    ).toEqual(createInitialState('sunrise'));
  });
});
