import React from 'react';
import type { AtomTriggerProps } from './AtomTrigger.types';
import { assignRef, getInvalidChildWarning } from './AtomTrigger.childMode';
import { normalizeRootMargin, normalizeThreshold } from './AtomTrigger.geometry';
import {
  type SchedulerTarget,
  type SentinelRegistration,
  registerSentinel,
  resetObservationState,
  resolveSchedulerTarget,
} from './AtomTrigger.scheduler';
import {
  childModeClassNameWarning,
  nonDomChildRefWarning,
  unsupportedChildRefWarning,
  upgradeBehaviorWarning,
  warnOnce,
} from './AtomTrigger.warnings';

const defaultSentinelStyle = { display: 'table' } satisfies React.CSSProperties;

const AtomTrigger: React.FC<AtomTriggerProps> = ({
  onEnter,
  onLeave,
  onEvent,
  children,
  once = false,
  oncePerDirection = false,
  fireOnInitialVisible = false,
  disabled = false,
  threshold = 0,
  root = null,
  rootRef,
  rootMargin = '0px',
  className,
}) => {
  const sentinelRef = React.useRef<HTMLDivElement>(null);
  const [childNode, setChildNode] = React.useState<Element | null>(null);
  const childNodeRef = React.useRef<Element | null>(null);
  const registrationRef = React.useRef<SentinelRegistration | null>(null);
  const disposeRef = React.useRef<(() => void) | null>(null);
  const bindingRef = React.useRef<{
    node: Element;
    target: SchedulerTarget;
    rootMargin: string;
    threshold: number;
    once: boolean;
    oncePerDirection: boolean;
    fireOnInitialVisible: boolean;
  } | null>(null);

  const normalizedRootMargin = normalizeRootMargin(rootMargin);
  const normalizedThreshold = normalizeThreshold(threshold);

  const hasObservedChild = children !== null && children !== undefined;
  const childCount = React.Children.count(children);
  const singleChildElement = childCount === 1 && React.isValidElement(children) ? children : null;
  const childType = singleChildElement ? singleChildElement.type : null;

  const invalidChildWarning = getInvalidChildWarning(
    hasObservedChild,
    childCount,
    singleChildElement,
    childType,
  );

  const childElementWithRef =
    invalidChildWarning || !singleChildElement
      ? null
      : (singleChildElement as React.ReactElement<{ ref?: React.Ref<unknown> }>);
  const originalChildRef = childElementWithRef?.props.ref;

  const attachObservedChildRef = React.useCallback(
    (value: unknown) => {
      assignRef(originalChildRef, value);

      if (value === null) {
        childNodeRef.current = null;
        setChildNode(currentNode => (currentNode === null ? currentNode : null));
        return;
      }

      if (value instanceof Element) {
        childNodeRef.current = value;
        setChildNode(currentNode => (currentNode === value ? currentNode : value));
        return;
      }

      childNodeRef.current = null;
      setChildNode(currentNode => (currentNode === null ? currentNode : null));
      warnOnce(nonDomChildRefWarning);
    },
    [originalChildRef],
  );

  React.useEffect(() => {
    warnOnce(upgradeBehaviorWarning);
  }, []);

  React.useEffect(() => {
    if (hasObservedChild && className) {
      warnOnce(childModeClassNameWarning);
    }
  }, [className, hasObservedChild]);

  React.useEffect(() => {
    if (invalidChildWarning) {
      warnOnce(invalidChildWarning);
    }
  }, [invalidChildWarning]);

  React.useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !hasObservedChild ||
      !childElementWithRef ||
      invalidChildWarning ||
      childNode
    ) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      if (!childNodeRef.current) {
        warnOnce(unsupportedChildRefWarning);
      }
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [childNode, childElementWithRef, hasObservedChild, invalidChildWarning]);

  React.useEffect(() => {
    const registration = registrationRef.current;
    if (!registration) {
      return;
    }

    registration.onEnter = onEnter;
    registration.onLeave = onLeave;
    registration.onEvent = onEvent;
  }, [onEnter, onLeave, onEvent]);

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const node = hasObservedChild ? childNode : sentinelRef.current;
    const resolvedRoot = resolveSchedulerTarget(root, rootRef);

    if (!node) {
      if (registrationRef.current) {
        resetObservationState(registrationRef.current);
      }
      disposeRef.current?.();
      disposeRef.current = null;
      bindingRef.current = null;
      return;
    }

    if (!registrationRef.current) {
      registrationRef.current = {
        node,
        rootMargin: normalizedRootMargin,
        threshold: normalizedThreshold,
        once,
        oncePerDirection,
        fireOnInitialVisible,
        onEnter,
        onLeave,
        onEvent,
        previousTriggerActive: undefined,
        previousRect: null,
        counts: {
          entered: 0,
          left: 0,
        },
      } satisfies SentinelRegistration;
    } else {
      registrationRef.current.node = node;
      registrationRef.current.rootMargin = normalizedRootMargin;
      registrationRef.current.threshold = normalizedThreshold;
      registrationRef.current.once = once;
      registrationRef.current.oncePerDirection = oncePerDirection;
      registrationRef.current.fireOnInitialVisible = fireOnInitialVisible;
    }

    const registration = registrationRef.current;

    if (disabled || !resolvedRoot) {
      resetObservationState(registration);
      disposeRef.current?.();
      disposeRef.current = null;
      bindingRef.current = null;
      return;
    }

    const previousBinding = bindingRef.current;
    const nextBinding = {
      node,
      target: resolvedRoot,
      rootMargin: normalizedRootMargin,
      threshold: normalizedThreshold,
      once,
      oncePerDirection,
      fireOnInitialVisible,
    };

    const shouldResubscribe =
      !previousBinding ||
      previousBinding.node !== nextBinding.node ||
      previousBinding.target !== nextBinding.target ||
      previousBinding.rootMargin !== nextBinding.rootMargin ||
      previousBinding.threshold !== nextBinding.threshold ||
      previousBinding.once !== nextBinding.once ||
      previousBinding.oncePerDirection !== nextBinding.oncePerDirection ||
      previousBinding.fireOnInitialVisible !== nextBinding.fireOnInitialVisible;

    if (shouldResubscribe) {
      resetObservationState(registration);
      disposeRef.current?.();
      disposeRef.current = registerSentinel(resolvedRoot, registration);
      bindingRef.current = nextBinding;
    }
  }, [
    disabled,
    normalizedRootMargin,
    normalizedThreshold,
    once,
    oncePerDirection,
    fireOnInitialVisible,
    childNode,
    root,
    rootRef?.current,
    hasObservedChild,
  ]);

  React.useEffect(
    () => () => {
      disposeRef.current?.();
      disposeRef.current = null;
      bindingRef.current = null;
    },
    [],
  );

  if (!hasObservedChild) {
    return <div ref={sentinelRef} style={defaultSentinelStyle} className={className} />;
  }

  if (!childElementWithRef) {
    return <>{children}</>;
  }

  return React.cloneElement(childElementWithRef, {
    ref: attachObservedChildRef,
  });
};

export default AtomTrigger;
