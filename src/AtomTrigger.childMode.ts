import React from 'react';
import {
  fragmentChildWarning,
  invalidChildCountWarning,
  invalidChildElementWarning,
} from './AtomTrigger.warnings';

const forwardRefSymbol = Symbol.for('react.forward_ref');
const memoSymbol = Symbol.for('react.memo');

export function assignRef<T>(ref: React.Ref<T> | undefined, value: T | null): void {
  if (!ref) {
    return;
  }

  if (typeof ref === 'function') {
    ref(value);
    return;
  }

  ref.current = value;
}

export function supportsObservationRef(type: unknown): boolean {
  if (typeof type === 'string') {
    return true;
  }

  if (typeof type === 'function') {
    return true;
  }

  if (typeof type !== 'object' || type === null) {
    return false;
  }

  const typedType = type as {
    $$typeof?: symbol;
    type?: React.ElementType;
  };

  if (typedType.$$typeof === forwardRefSymbol) {
    return true;
  }

  if (typedType.$$typeof === memoSymbol && typedType.type) {
    return supportsObservationRef(typedType.type);
  }

  return false;
}

export function getInvalidChildWarning(
  usesChildObservation: boolean,
  childCount: number,
  singleChildElement: React.ReactElement | null,
  childType: unknown,
): string | null {
  if (!usesChildObservation) {
    return null;
  }

  if (childCount !== 1) {
    return invalidChildCountWarning;
  }

  if (!singleChildElement) {
    return invalidChildElementWarning;
  }

  if (childType === React.Fragment) {
    return fragmentChildWarning;
  }

  if (!childType || !supportsObservationRef(childType)) {
    return null;
  }

  return null;
}
