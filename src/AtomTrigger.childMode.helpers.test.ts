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

  it('assigns callback and object refs', () => {
    const callbackRef = vi.fn();
    const objectRef = { current: null as HTMLDivElement | null };
    const node = document.createElement('div');

    assignRef(callbackRef, node);
    assignRef(objectRef, node);

    expect(callbackRef).toHaveBeenCalledWith(node);
    expect(objectRef.current).toBe(node);
  });

  it('supports intrinsic, function, forwardRef, and memo-wrapped forwardRef child types', () => {
    const FunctionChild = () => null;
    const ForwardRefChild = React.forwardRef<HTMLDivElement>((_props, _ref) => null);
    const MemoForwardRefChild = React.memo(ForwardRefChild);

    expect(supportsObservationRef('div')).toBe(true);
    expect(supportsObservationRef(FunctionChild)).toBe(true);
    expect(supportsObservationRef(ForwardRefChild)).toBe(true);
    expect(supportsObservationRef(MemoForwardRefChild)).toBe(true);
  });

  it('rejects unsupported child types', () => {
    expect(supportsObservationRef(null)).toBe(false);
    expect(supportsObservationRef(42)).toBe(false);
    expect(supportsObservationRef({})).toBe(false);
  });

  it('returns the expected warning for invalid child mode inputs', () => {
    const childElement = React.createElement('div');

    expect(getInvalidChildWarning(false, 1, childElement, 'div')).toBeNull();
    expect(getInvalidChildWarning(true, 2, childElement, 'div')).toBe(invalidChildCountWarning);
    expect(getInvalidChildWarning(true, 1, null, null)).toBe(invalidChildElementWarning);
    expect(getInvalidChildWarning(true, 1, childElement, React.Fragment)).toBe(
      fragmentChildWarning,
    );
  });

  it('keeps unsupported child types silent at the helper level', () => {
    const childElement = React.createElement('div');

    expect(getInvalidChildWarning(true, 1, childElement, null)).toBeNull();
    expect(getInvalidChildWarning(true, 1, childElement, {})).toBeNull();
  });
});
