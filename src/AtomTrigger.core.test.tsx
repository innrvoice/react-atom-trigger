import React from 'react';
import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AtomTrigger } from './index';
import {
  finishDomTestRun,
  prepareDomTestRun,
  ReconfigurableRootHarness,
  scrollElement,
  setNodeEnv,
  setRect,
  setScrollAwareRect,
  setupChildRootHarness,
  setupRootHarness,
  setupZeroSizeRootHarness,
} from './AtomTrigger.testUtils';

beforeEach(() => {
  prepareDomTestRun();
});

afterEach(() => {
  finishDomTestRun();
});

describe('AtomTrigger rendering', () => {
  it('renders the sentinel with the legacy non-block default display', () => {
    const view = render(<AtomTrigger />);
    const sentinel = view.container.firstElementChild;

    if (!(sentinel instanceof HTMLDivElement)) {
      throw new Error('Sentinel not found');
    }

    expect(sentinel.style.display).toBe('table');
  });

  it('observes a single child element without adding a wrapper', () => {
    const view = render(
      <AtomTrigger>
        <section data-testid="observed-child">child</section>
      </AtomTrigger>,
    );
    const child = view.getByTestId('observed-child');

    expect(view.container.childElementCount).toBe(1);
    expect(view.container.firstElementChild).toBe(child);
  });

  it('shows the v2 upgrade warning only once in development and never in production or unknown envs', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    setNodeEnv('production');
    render(<AtomTrigger />);
    expect(warn).toHaveBeenCalledTimes(0);

    setNodeEnv(undefined);
    render(<AtomTrigger />);
    expect(warn).toHaveBeenCalledTimes(0);

    setNodeEnv('development');
    render(<AtomTrigger />);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenLastCalledWith(
      '[react-atom-trigger] v2 uses a new internal observation engine. If you upgraded from v1.x, verify trigger behavior for timing, threshold and rootMargin.',
    );

    render(<AtomTrigger />);
    expect(warn).toHaveBeenCalledTimes(1);
  });
});

describe('AtomTrigger transitions', () => {
  it('fires enter with payload after leaving the root bottom and entering the root', () => {
    const onEnter = vi.fn();
    const { root } = setupRootHarness({ onEnter });

    scrollElement(root, 0);
    scrollElement(root, 120);

    expect(onEnter).toHaveBeenCalledTimes(1);

    const event = onEnter.mock.calls[0][0];
    expect(event.type).toBe('enter');
    expect(event.counts).toEqual({ entered: 1, left: 0 });
    expect(event.position).toBe('inside');
    expect(event.movementDirection).toBe('up');
  });

  it('fires onEvent for both transitions with incrementing counts', () => {
    const onEvent = vi.fn();
    const { root } = setupRootHarness({ onEvent });

    scrollElement(root, 0);
    scrollElement(root, 120);
    scrollElement(root, 280);

    expect(onEvent).toHaveBeenCalledTimes(2);
    expect(onEvent.mock.calls[0][0].type).toBe('enter');
    expect(onEvent.mock.calls[0][0].counts).toEqual({ entered: 1, left: 0 });
    expect(onEvent.mock.calls[1][0].type).toBe('leave');
    expect(onEvent.mock.calls[1][0].counts).toEqual({ entered: 1, left: 1 });
  });

  it('fires enter for an unstyled zero-size sentinel', () => {
    const onEnter = vi.fn();
    const { root } = setupZeroSizeRootHarness({ onEnter });

    scrollElement(root, 0);
    scrollElement(root, 120);

    expect(onEnter).toHaveBeenCalledTimes(1);

    const event = onEnter.mock.calls[0][0];
    expect(event.type).toBe('enter');
    expect(event.entry.boundingClientRect.width).toBe(1);
    expect(event.entry.boundingClientRect.height).toBe(1);
  });

  it('respects once and stops after the first event', () => {
    const onEnter = vi.fn();
    const onLeave = vi.fn();
    const { root } = setupRootHarness({ onEnter, onLeave, once: true });

    scrollElement(root, 0);
    scrollElement(root, 120);
    scrollElement(root, 280);

    expect(onEnter).toHaveBeenCalledTimes(1);
    expect(onLeave).toHaveBeenCalledTimes(0);
  });

  it('respects oncePerDirection for enter and leave independently', () => {
    const onEnter = vi.fn();
    const onLeave = vi.fn();
    const { root } = setupRootHarness({ onEnter, onLeave, oncePerDirection: true });

    scrollElement(root, 0);
    scrollElement(root, 120);
    scrollElement(root, 280);
    scrollElement(root, 120);
    scrollElement(root, 280);

    expect(onEnter).toHaveBeenCalledTimes(1);
    expect(onLeave).toHaveBeenCalledTimes(1);
  });
});

describe('AtomTrigger threshold behavior', () => {
  it('respects a numeric threshold before firing enter', () => {
    const onEnter = vi.fn();
    const { root } = setupRootHarness({ onEnter, threshold: 0.75 });

    scrollElement(root, 0);
    scrollElement(root, 65);
    expect(onEnter).toHaveBeenCalledTimes(0);

    scrollElement(root, 68);
    expect(onEnter).toHaveBeenCalledTimes(1);
  });

  it('uses threshold against the observed child geometry', () => {
    const onEnter = vi.fn();
    const { root } = setupChildRootHarness({ onEnter, threshold: 0.75, childHeight: 100 });

    scrollElement(root, 0);
    scrollElement(root, 134);
    expect(onEnter).toHaveBeenCalledTimes(0);

    scrollElement(root, 135);
    expect(onEnter).toHaveBeenCalledTimes(1);
  });

  it('resets threshold qualification when the threshold prop changes', () => {
    const onEnter = vi.fn();
    const onLeave = vi.fn();
    const view = render(
      <ReconfigurableRootHarness threshold={0} onEnter={onEnter} onLeave={onLeave} />,
    );
    const root = view.getByTestId('reconfigurable-root');
    const sentinel = view.container.querySelector('.atom-trigger-sentinel');

    if (!(root instanceof HTMLDivElement) || !(sentinel instanceof HTMLDivElement)) {
      throw new Error('Reconfigurable root harness not found');
    }

    setRect(root, () => new DOMRect(0, 0, 200, 200));
    setScrollAwareRect(sentinel);

    scrollElement(root, 120);
    expect(onEnter).toHaveBeenCalledTimes(1);

    scrollElement(root, 65);
    view.rerender(<ReconfigurableRootHarness threshold={1} onEnter={onEnter} onLeave={onLeave} />);

    expect(onEnter).toHaveBeenCalledTimes(1);
    expect(onLeave).toHaveBeenCalledTimes(0);

    scrollElement(root, 70);
    expect(onEnter).toHaveBeenCalledTimes(2);
  });

  it('warns and uses the first numeric threshold entry from untyped array input', () => {
    setNodeEnv('development');
    const onEnter = vi.fn();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { root } = setupRootHarness({ onEnter, threshold: [0.75, 0.25] });

    scrollElement(root, 0);
    scrollElement(root, 65);
    expect(onEnter).toHaveBeenCalledTimes(0);

    scrollElement(root, 68);
    expect(onEnter).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(
      '[react-atom-trigger] `threshold` expects a single number in v2. Using the first finite numeric entry.',
    );
  });

  it('clamps out-of-range thresholds to 1', () => {
    setNodeEnv('development');
    const onEnter = vi.fn();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { root } = setupRootHarness({ onEnter, threshold: 2 });

    scrollElement(root, 0);
    scrollElement(root, 68);
    expect(onEnter).toHaveBeenCalledTimes(0);

    scrollElement(root, 70);
    expect(onEnter).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(
      '[react-atom-trigger] `threshold` should be between 0 and 1. Values are clamped.',
    );
  });
});
