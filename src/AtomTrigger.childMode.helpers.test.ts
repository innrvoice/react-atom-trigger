import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { assignRef, getElementRef, getInvalidChildWarning } from './AtomTrigger.childMode';
import {
  fragmentChildWarning,
  invalidChildCountWarning,
  invalidChildElementWarning,
} from './AtomTrigger.warnings';

describe('AtomTrigger child mode helpers', () => {
  afterEach(() => {
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
      const element = {
        props: {
          ref,
        },
      } as React.ReactElement<{ ref?: React.Ref<HTMLDivElement> }> & {
        ref?: React.Ref<HTMLDivElement>;
      };

      expect(getElementRef(element)).toBe(ref);
    });

    it('ignores primitive props carriers that cannot hold refs', () => {
      const element = {
        props: 'not-an-object',
      } as unknown as React.ReactElement<{ ref?: React.Ref<HTMLDivElement> }> & {
        ref?: React.Ref<HTMLDivElement>;
      };

      expect(getElementRef(element)).toBeUndefined();
    });

    it('reads ref from function-valued props carriers', () => {
      const ref = vi.fn();
      const propsCarrier = Object.assign(() => null, { ref });
      const element = {
        props: propsCarrier,
      } as React.ReactElement<{ ref?: React.Ref<HTMLDivElement> }> & {
        ref?: React.Ref<HTMLDivElement>;
      };

      expect(getElementRef(element)).toBe(ref);
    });

    it('falls back to the legacy element ref field', () => {
      const ref = { current: null as HTMLDivElement | null };
      const element = {
        props: {},
        ref,
      } as React.ReactElement<{ ref?: React.Ref<HTMLDivElement> }> & {
        ref?: React.Ref<HTMLDivElement>;
      };

      expect(getElementRef(element)).toBe(ref);
    });
  });
});
