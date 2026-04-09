import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { assignRef, getInvalidChildWarning, supportsObservationRef } from './AtomTrigger.childMode';
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

  describe('supportsObservationRef', () => {
    it('supports intrinsic elements and function components', () => {
      const FunctionChild = () => null;

      expect(supportsObservationRef('div')).toBe(true);
      expect(supportsObservationRef(FunctionChild)).toBe(true);
    });

    it('supports forwardRef children and memo-wrapped forwardRef children', () => {
      const ForwardRefChild = React.forwardRef<HTMLDivElement>((_props, _ref) => null);
      const MemoForwardRefChild = React.memo(ForwardRefChild);

      expect(supportsObservationRef(ForwardRefChild)).toBe(true);
      expect(supportsObservationRef(MemoForwardRefChild)).toBe(true);
    });

    it('rejects unsupported child types', () => {
      expect(supportsObservationRef(null)).toBe(false);
      expect(supportsObservationRef(42)).toBe(false);
      expect(supportsObservationRef({})).toBe(false);
    });
  });

  describe('getInvalidChildWarning', () => {
    const childElement = React.createElement('div');

    it('stays silent when child observation is not in use', () => {
      expect(getInvalidChildWarning(false, 1, childElement, 'div')).toBeNull();
    });

    it('warns when more than one top-level child is passed', () => {
      expect(getInvalidChildWarning(true, 2, childElement, 'div')).toBe(invalidChildCountWarning);
    });

    it('warns when the child is not a React element', () => {
      expect(getInvalidChildWarning(true, 1, null, null)).toBe(invalidChildElementWarning);
    });

    it('warns when the child is a fragment', () => {
      expect(getInvalidChildWarning(true, 1, childElement, React.Fragment)).toBe(
        fragmentChildWarning,
      );
    });

    it('keeps unsupported child types silent at the helper level', () => {
      expect(getInvalidChildWarning(true, 1, childElement, null)).toBeNull();
      expect(getInvalidChildWarning(true, 1, childElement, {})).toBeNull();
    });
  });
});
