import React from 'react';
import { act, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AtomTrigger } from './index';
import {
  finishDomTestRun,
  prepareDomTestRun,
  scrollElement,
  setNodeEnv,
  setRect,
  setupChildRootHarness,
} from './AtomTrigger.testUtils';
import { warningMessages } from './AtomTrigger.warnings';

beforeEach(() => {
  prepareDomTestRun();
});

afterEach(() => {
  finishDomTestRun();
});

describe('AtomTrigger child mode', () => {
  it('preserves the child ref while observing the child node', () => {
    const childRef = React.createRef<HTMLDivElement>();
    const { child } = setupChildRootHarness({ childRef });

    expect(childRef.current).toBe(child);
  });

  it('observes a React 19-style component that passes ref through props', async () => {
    const onEnter = vi.fn();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const rootRef = React.createRef<HTMLDivElement>();
    let scrollTop = 0;

    function RefPropChild(props: { ref?: React.Ref<HTMLDivElement> }) {
      return (
        <div data-testid="react19-ref-child" ref={props.ref}>
          child
        </div>
      );
    }

    const view = render(
      <div ref={rootRef} data-testid="root">
        <AtomTrigger rootRef={rootRef} onEnter={onEnter}>
          <RefPropChild />
        </AtomTrigger>
      </div>,
    );

    const root = view.getByTestId('root');
    const child = view.getByTestId('react19-ref-child');

    if (!(root instanceof HTMLDivElement) || !(child instanceof HTMLDivElement)) {
      throw new Error('React 19 child harness not found');
    }

    setRect(root, () => new DOMRect(0, 0, 200, 200));
    setRect(child, () => new DOMRect(0, 260 - scrollTop, 20, 100));

    await act(async () => {
      await Promise.resolve();
    });

    scrollTop = 135;
    fireEvent.scroll(root);

    expect(onEnter).toHaveBeenCalledTimes(1);
    expect(warn).not.toHaveBeenCalledWith(
      '[react-atom-trigger] Child mode expects a DOM element or a component that forwards its ref to a DOM element. Observation is disabled for this render.',
    );
  });

  it('warns when a forwarded ref resolves to a pseudo-DOM handle instead of crashing', () => {
    setNodeEnv('development');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const rootRef = React.createRef<HTMLDivElement>();

    const ImperativeHandleChild = React.forwardRef<{ nodeType: number }>((_props, ref) => {
      React.useImperativeHandle(
        ref,
        () => ({
          nodeType: 1,
        }),
        [],
      );

      return <div data-testid="imperative-handle-child">child</div>;
    });

    const view = render(
      <div ref={rootRef} data-testid="root">
        <AtomTrigger rootRef={rootRef}>
          <ImperativeHandleChild />
        </AtomTrigger>
      </div>,
    );

    expect(view.getByTestId('imperative-handle-child')).toBeTruthy();
    expect(warn).toHaveBeenCalledWith(warningMessages.nonDomChildRef);
    expect(error).not.toHaveBeenCalled();
  });

  it('does not warn when a child resolves to a DOM node after an async placeholder render', async () => {
    setNodeEnv('development');
    vi.useFakeTimers();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const rootRef = React.createRef<HTMLDivElement>();

    const DelayedDomChild = React.forwardRef<HTMLDivElement>((_props, ref) => {
      const [ready, setReady] = React.useState(false);

      React.useEffect(() => {
        const timeoutId = window.setTimeout(() => {
          setReady(true);
        }, 0);

        return () => {
          window.clearTimeout(timeoutId);
        };
      }, []);

      if (!ready) {
        return null;
      }

      return (
        <div data-testid="delayed-dom-child" ref={ref}>
          child
        </div>
      );
    });

    const view = render(
      <div ref={rootRef} data-testid="root">
        <AtomTrigger rootRef={rootRef}>
          <DelayedDomChild />
        </AtomTrigger>
      </div>,
    );

    const root = view.getByTestId('root');
    if (!(root instanceof HTMLDivElement)) {
      throw new Error('Delayed child root not found');
    }

    setRect(root, () => new DOMRect(0, 0, 200, 200));

    await act(async () => {
      vi.advanceTimersByTime(0);
    });

    const child = view.getByTestId('delayed-dom-child');
    if (!(child instanceof HTMLDivElement)) {
      throw new Error('Delayed child not found');
    }

    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      vi.advanceTimersByTime(16);
    });

    expect(
      warn.mock.calls.some(([message]) => message === warningMessages.unsupportedChildRef),
    ).toBe(false);
  });

  it('warns and ignores className in child mode', () => {
    setNodeEnv('development');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const view = render(
      <AtomTrigger className="atom-trigger-sentinel">
        <div data-testid="observed-child">child</div>
      </AtomTrigger>,
    );
    const child = view.getByTestId('observed-child');

    expect(child.className).toBe('');
    expect(warn).toHaveBeenCalledWith(
      '[react-atom-trigger] `className` only applies to the internal sentinel. In child mode, style the child element directly.',
    );
  });

  it('keeps child mode warnings silent when development is not explicitly known', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const view = render(
      <AtomTrigger className="atom-trigger-sentinel">
        <div data-testid="observed-child">child</div>
      </AtomTrigger>,
    );
    const child = view.getByTestId('observed-child');

    expect(child.className).toBe('');
    expect(warn).toHaveBeenCalledTimes(0);
  });

  it('dedupes repeated child mode warnings in development', () => {
    setNodeEnv('development');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const message =
      '[react-atom-trigger] `className` only applies to the internal sentinel. In child mode, style the child element directly.';
    const view = render(
      <AtomTrigger className="atom-trigger-sentinel">
        <div data-testid="observed-child">child</div>
      </AtomTrigger>,
    );

    view.rerender(
      <AtomTrigger className="atom-trigger-sentinel">
        <div data-testid="observed-child">child</div>
      </AtomTrigger>,
    );

    expect(warn.mock.calls.filter(([warning]) => warning === message)).toHaveLength(1);
  });

  it('cleans up child observation when a previously observed child stops exposing a DOM node', async () => {
    const onEnter = vi.fn();
    const rootRef = React.createRef<HTMLDivElement>();
    let scrollTop = 0;

    const ObservedChild = React.forwardRef<HTMLDivElement>((_props, ref) => (
      <div data-testid="switchable-child" ref={ref}>
        child
      </div>
    ));

    function PlainChild() {
      return <div data-testid="switchable-child">child</div>;
    }

    const view = render(
      <div ref={rootRef} data-testid="root">
        <AtomTrigger rootRef={rootRef} onEnter={onEnter}>
          <ObservedChild />
        </AtomTrigger>
      </div>,
    );

    const root = view.getByTestId('root');
    const child = view.getByTestId('switchable-child');

    if (!(root instanceof HTMLDivElement) || !(child instanceof HTMLDivElement)) {
      throw new Error('Switchable child harness not found');
    }

    setRect(root, () => new DOMRect(0, 0, 200, 200));
    setRect(child, () => new DOMRect(0, 260 - scrollTop, 20, 100));

    await act(async () => {
      await Promise.resolve();
    });

    scrollTop = 135;
    fireEvent.scroll(root);

    expect(onEnter).toHaveBeenCalledTimes(1);

    view.rerender(
      <div ref={rootRef} data-testid="root">
        <AtomTrigger rootRef={rootRef} onEnter={onEnter}>
          <PlainChild />
        </AtomTrigger>
      </div>,
    );

    scrollTop = 0;
    fireEvent.scroll(root);

    expect(onEnter).toHaveBeenCalledTimes(1);
  });

  it.each([
    {
      label: 'multiple top-level children',
      expected:
        '[react-atom-trigger] Child mode expects exactly one top-level React element. Observation is disabled for this render.',
      renderChildren: () => [
        <div key="first" data-testid="first-child" />,
        <div key="second" data-testid="second-child" />,
      ],
      assertContent: (view: ReturnType<typeof render>) => {
        expect(view.getByTestId('first-child')).toBeTruthy();
        expect(view.getByTestId('second-child')).toBeTruthy();
      },
    },
    {
      label: 'a fragment child',
      expected:
        '[react-atom-trigger] Child mode does not support React.Fragment. Wrap the content in a single DOM element. Observation is disabled for this render.',
      renderChildren: () => (
        <>
          <div data-testid="fragment-child" />
        </>
      ),
      assertContent: (view: ReturnType<typeof render>) => {
        expect(view.getByTestId('fragment-child')).toBeTruthy();
      },
    },
    {
      label: 'a text child',
      expected:
        '[react-atom-trigger] Child mode expects a React element child. Observation is disabled for this render.',
      renderChildren: () => 'plain text child',
      assertContent: (view: ReturnType<typeof render>) => {
        expect(view.container.textContent).toContain('plain text child');
      },
    },
    {
      label: 'a custom child without ref forwarding',
      expected:
        '[react-atom-trigger] Child mode expects a DOM element or a component that forwards its ref to a DOM element. Observation is disabled for this render.',
      renderChildren: () => {
        function PlainChild() {
          return <div data-testid="plain-child" />;
        }

        return <PlainChild />;
      },
      assertContent: (view: ReturnType<typeof render>) => {
        expect(view.getByTestId('plain-child')).toBeTruthy();
      },
    },
  ])('warns and skips observation for $label', ({ expected, renderChildren, assertContent }) => {
    setNodeEnv('development');
    vi.useFakeTimers();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const onEnter = vi.fn();
    const rootRef = React.createRef<HTMLDivElement>();

    const view = render(
      <div ref={rootRef} data-testid="root">
        <AtomTrigger rootRef={rootRef} onEnter={onEnter}>
          {renderChildren()}
        </AtomTrigger>
      </div>,
    );

    const root = view.getByTestId('root');
    setRect(root, () => new DOMRect(0, 0, 200, 200));

    scrollElement(root, 120);
    act(() => {
      vi.runAllTimers();
    });

    assertContent(view);
    expect(onEnter).toHaveBeenCalledTimes(0);
    expect(warn.mock.calls.some(([warning]) => warning === expected)).toBe(true);
  });
});
