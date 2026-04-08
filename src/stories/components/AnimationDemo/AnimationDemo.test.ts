import type { AtomTriggerEvent } from '../../../index';
import { describe, expect, it } from 'vitest';
import { defaultTransitionMap } from './AnimationDemo.config';
import {
  animationDemoReducer,
  createInitialState,
  getTransitionDirectionFromEvent,
  resolveAnimationTransition,
} from './AnimationDemo.state';

describe('AnimationDemo transition resolver', () => {
  it('resolves middle trigger while moving down to sunset with both aircraft', () => {
    expect(resolveAnimationTransition(defaultTransitionMap, 'middle', 'down')).toEqual({
      nextMode: 'sunset',
      aircraft: 'both',
    });
  });

  it('resolves bottom trigger while moving down to night with plane only', () => {
    expect(resolveAnimationTransition(defaultTransitionMap, 'bottom', 'down')).toEqual({
      nextMode: 'night',
      aircraft: 'plane',
    });
  });

  it('resolves middle trigger while moving up to sunrise with helicopter only', () => {
    expect(resolveAnimationTransition(defaultTransitionMap, 'middle', 'up')).toEqual({
      nextMode: 'sunrise',
      aircraft: 'helicopter',
    });
  });

  it('resolves top trigger while moving up to day with both aircraft', () => {
    expect(resolveAnimationTransition(defaultTransitionMap, 'top', 'up')).toEqual({
      nextMode: 'day',
      aircraft: 'both',
    });
  });

  it('ignores unsupported trigger and direction combinations', () => {
    expect(resolveAnimationTransition(defaultTransitionMap, 'top', 'down')).toBeNull();
    expect(resolveAnimationTransition(defaultTransitionMap, 'bottom', 'up')).toBeNull();
    expect(resolveAnimationTransition(defaultTransitionMap, 'middle', 'left')).toBeNull();
  });

  it('falls back to the default transition map when a custom map is partial', () => {
    expect(
      resolveAnimationTransition(
        {
          middle: {
            down: {
              nextMode: 'night',
              aircraft: 'plane',
            },
          },
        },
        'top',
        'up',
      ),
    ).toEqual({
      nextMode: 'day',
      aircraft: 'both',
    });
  });

  it('prefers the custom transition over the default transition', () => {
    expect(
      resolveAnimationTransition(
        {
          middle: {
            down: {
              nextMode: 'night',
              aircraft: 'plane',
            },
          },
        },
        'middle',
        'down',
      ),
    ).toEqual({
      nextMode: 'night',
      aircraft: 'plane',
    });
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
