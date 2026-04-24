import React from 'react';
import { act, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  assignRef,
  getElementRef,
  getInvalidChildWarning,
  useObservedChildNode,
  type ChildElementWithOptionalRef,
} from './AtomTrigger.childMode';
import {
  fragmentChildWarning,
  getWarningMessage,
  invalidChildCountWarning,
  invalidChildElementWarning,
  unsupportedChildRefWarning,
} from './AtomTrigger.warnings';

function stubProcess(processValue: Partial<Pick<NodeJS.Process, 'env'>>): void {
  vi.stubGlobal('process', processValue as unknown as NodeJS.Process);
}

function createChildElementWithOptionalRef(
  props: ChildElementWithOptionalRef['props'],
  ref?: React.Ref<HTMLDivElement>,
): ChildElementWithOptionalRef & { ref?: React.Ref<HTMLDivElement> } {
  return {
    type: 'div',
    key: null,
    props,
    ref,
  };
}

function createBrokenChildElement(
  props: unknown,
  ref?: React.Ref<HTMLDivElement>,
): ChildElementWithOptionalRef & { ref?: React.Ref<HTMLDivElement> } {
  return {
    type: 'div',
    key: null,
    props,
    ref,
  } as unknown as ChildElementWithOptionalRef & { ref?: React.Ref<HTMLDivElement> };
}

describe('AtomTrigger child mode helpers', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('assignRef', () => {
    it('passes the node through callback refs', () => {
      const callbackRef = vi.fn();
      const node = document.createElement('div');

      assignRef(callbackRef, node);

      expect(callbackRef).toHaveBeenCalledWith(node);
    });

    it('stores the node on object refs', () => {
      const objectRef = { current: null as HTMLDivElement | null };
      const node = document.createElement('div');

      assignRef(objectRef, node);

      expect(objectRef.current).toBe(node);
    });

    it('ignores missing refs', () => {
      expect(() => assignRef(undefined, document.createElement('div'))).not.toThrow();
    });
  });

  describe('getInvalidChildWarning', () => {
    const childElement = React.createElement('div');

    it('stays silent when child observation is not in use', () => {
      expect(getInvalidChildWarning(false, 1, childElement)).toBeNull();
    });

    it('warns when more than one top-level child is passed', () => {
      expect(getInvalidChildWarning(true, 2, childElement)).toBe(invalidChildCountWarning);
    });

    it('warns when the child is not a React element', () => {
      expect(getInvalidChildWarning(true, 1, null)).toBe(invalidChildElementWarning);
    });

    it('warns when the child is a fragment', () => {
      expect(getInvalidChildWarning(true, 1, React.createElement(React.Fragment))).toBe(
        fragmentChildWarning,
      );
    });

    it('keeps structurally valid children silent at the helper level', () => {
      const PlainChild = () => null;

      expect(getInvalidChildWarning(true, 1, childElement)).toBeNull();
      expect(getInvalidChildWarning(true, 1, React.createElement(PlainChild))).toBeNull();
    });
  });

  describe('getElementRef', () => {
    it('returns undefined when the element is missing', () => {
      expect(getElementRef(null)).toBeUndefined();
    });

    it('prefers ref from props when available', () => {
      const ref = vi.fn();
      const element = createChildElementWithOptionalRef({
        ref,
      });

      expect(getElementRef(element)).toBe(ref);
    });

    it('ignores primitive props carriers that cannot hold refs', () => {
      const element = createBrokenChildElement('not-an-object');

      expect(getElementRef(element)).toBeUndefined();
    });

    it('reads ref from function-valued props carriers', () => {
      const ref = vi.fn();
      const propsCarrier = Object.assign(() => null, { ref });
      const element = createChildElementWithOptionalRef(propsCarrier);

      expect(getElementRef(element)).toBe(ref);
    });

    it('falls back to the legacy element ref field', () => {
      const ref = { current: null as HTMLDivElement | null };
      const element = createChildElementWithOptionalRef({}, ref);

      expect(getElementRef(element)).toBe(ref);
    });
  });

  describe('useObservedChildNode', () => {
    it('keeps the delayed missing-dom warning silent when a DOM ref appears before the timer callback runs', () => {
      vi.useFakeTimers();
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      let attachObservedChildRef: ((value: unknown) => void) | undefined;

      stubProcess({
        env: {
          NODE_ENV: 'development',
        },
      });

      function Harness() {
        const binding = useObservedChildNode({
          originalChildRef: undefined,
          hasObservedChild: true,
          invalidChildWarning: null,
          shouldWarnAboutMissingDomRef: true,
        });
        attachObservedChildRef = binding.attachObservedChildRef;
        return null;
      }

      render(React.createElement(Harness));

      act(() => {
        attachObservedChildRef?.(document.createElement('div'));
        vi.advanceTimersByTime(16);
      });

      expect(warn).not.toHaveBeenCalledWith(getWarningMessage(unsupportedChildRefWarning));
    });
  });
});
