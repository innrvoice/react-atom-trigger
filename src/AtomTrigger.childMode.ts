import React from 'react';
import {
  fragmentChildWarning,
  invalidChildCountWarning,
  invalidChildElementWarning,
  nonDomChildRefWarning,
  unsupportedChildRefWarning,
  warnOnce,
} from './AtomTrigger.warnings';
import { isDomElementLike } from './AtomTrigger.runtime';

const missingDomRefWarningDelayMs = 16;

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

export type ObservedChildBinding = {
  childNode: Element | null;
  attachObservedChildRef: (value: unknown) => void;
};

export type ChildElementWithOptionalRef = React.ReactElement<{ ref?: React.Ref<unknown> }> & {
  ref?: React.Ref<unknown>;
};

function readOwnRefProperty(value: unknown): React.Ref<unknown> | undefined {
  if (!value || (typeof value !== 'object' && typeof value !== 'function')) {
    return undefined;
  }

  const descriptor = Object.getOwnPropertyDescriptor(value, 'ref');
  if (!descriptor || !('value' in descriptor)) {
    return undefined;
  }

  return descriptor.value as React.Ref<unknown> | undefined;
}

export function getElementRef(
  element: ChildElementWithOptionalRef | null,
): React.Ref<unknown> | undefined {
  if (!element) {
    return undefined;
  }

  // React 19 can surface the child ref on props.ref, while older React versions can still
  // expose it on the element itself. Read only own data properties so this stays compatible
  // without depending on React internals or tripping foreign getters
  const propsRef = readOwnRefProperty(element.props);
  if (propsRef !== undefined) {
    return propsRef;
  }

  return readOwnRefProperty(element);
}

export function getInvalidChildWarning(
  usesChildObservation: boolean,
  childCount: number,
  singleChildElement: React.ReactElement | null,
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

  if (singleChildElement.type === React.Fragment) {
    return fragmentChildWarning;
  }

  return null;
}

export function useObservedChildNode({
  originalChildRef,
  hasObservedChild,
  invalidChildWarning,
  shouldWarnAboutMissingDomRef: shouldCheckMissingDomRef,
}: {
  originalChildRef: React.Ref<unknown> | undefined;
  hasObservedChild: boolean;
  invalidChildWarning: string | null;
  shouldWarnAboutMissingDomRef: boolean;
}): ObservedChildBinding {
  const [childNode, setChildNode] = React.useState<Element | null>(null);
  const childNodeRef = React.useRef<Element | null>(null);

  const clearObservedChildNode = React.useCallback(() => {
    childNodeRef.current = null;
    setChildNode(currentNode => (currentNode === null ? currentNode : null));
  }, []);

  const attachObservedChildRef = React.useCallback(
    (value: unknown) => {
      assignRef(originalChildRef, value);

      if (value === null) {
        clearObservedChildNode();
        return;
      }

      if (isDomElementLike(value)) {
        childNodeRef.current = value;
        setChildNode(currentNode => (currentNode === value ? currentNode : value));
        return;
      }

      clearObservedChildNode();
      warnOnce(nonDomChildRefWarning);
    },
    [clearObservedChildNode, originalChildRef],
  );

  React.useEffect(() => {
    const shouldScheduleMissingDomRefWarning =
      hasObservedChild && !invalidChildWarning && !childNode && shouldCheckMissingDomRef;

    if (typeof window === 'undefined' || !shouldScheduleMissingDomRefWarning) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      if (childNodeRef.current) {
        return;
      }

      warnOnce(unsupportedChildRefWarning);
    }, missingDomRefWarningDelayMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [hasObservedChild, invalidChildWarning, childNode, shouldCheckMissingDomRef]);

  return {
    childNode,
    attachObservedChildRef,
  };
}
