import React from 'react';
import type { AtomTriggerProps } from './AtomTrigger.types';
import {
  getElementRef,
  getInvalidChildWarning,
  useObservedChildNode,
  type ChildElementWithOptionalRef,
} from './AtomTrigger.childMode';
import { normalizeRootMargin, normalizeThreshold } from './AtomTrigger.geometry';
import {
  cleanupObservationState,
  createObservationState,
  syncObservationSubscription,
  updateObservationCallbacks,
  type ObservationState,
} from './AtomTrigger.observation';
import {
  resolveSchedulerTarget,
  useTrackedRootRefTarget,
  type SchedulerTargetSource,
} from './AtomTrigger.root';
import { getWarningMessage, warnOnce } from './AtomTrigger.warnings';

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
  root,
  rootRef,
  rootMargin = '0px',
  className,
}) => {
  const sentinelRef = React.useRef<HTMLDivElement>(null);
  const observationRef = React.useRef<ObservationState | null>(null);
  const trackedRootRefTarget = useTrackedRootRefTarget(rootRef);

  const normalizedRootMargin = normalizeRootMargin(rootMargin);
  const normalizedThreshold = normalizeThreshold(threshold);

  const hasObservedChild = children !== null && children !== undefined;
  const childCount = React.Children.count(children);
  const singleChildElement = childCount === 1 && React.isValidElement(children) ? children : null;

  const invalidChildWarning = getInvalidChildWarning(
    hasObservedChild,
    childCount,
    singleChildElement,
  );

  const childElementWithRef =
    invalidChildWarning || !singleChildElement
      ? null
      : (singleChildElement as ChildElementWithOptionalRef);
  const originalChildRef = getElementRef(childElementWithRef);
  const { childNode, attachObservedChildRef } = useObservedChildNode({
    originalChildRef,
    hasObservedChild,
    invalidChildWarning,
    shouldWarnAboutMissingDomRef: childElementWithRef !== null,
  });

  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development' && hasObservedChild && className) {
      warnOnce(getWarningMessage('childModeClassName'));
    }
  }, [className, hasObservedChild]);

  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development' && invalidChildWarning) {
      warnOnce(getWarningMessage(invalidChildWarning));
    }
  }, [invalidChildWarning]);

  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development' && once && oncePerDirection) {
      warnOnce(getWarningMessage('conflictingOnceModes'));
    }
  }, [once, oncePerDirection]);

  React.useEffect(() => {
    const observation = observationRef.current;
    if (!observation) {
      return;
    }

    updateObservationCallbacks(observation, { onEnter, onLeave, onEvent });
  }, [onEnter, onLeave, onEvent]);

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const node = hasObservedChild ? childNode : sentinelRef.current;
    const targetSource: SchedulerTargetSource =
      rootRef !== undefined
        ? { kind: 'rootRef', target: trackedRootRefTarget }
        : root !== undefined
          ? { kind: 'root', target: root }
          : { kind: 'viewport' };
    const resolvedRoot = resolveSchedulerTarget(targetSource);

    if (!node) {
      if (observationRef.current) {
        syncObservationSubscription(observationRef.current, {
          disabled: false,
          node: null,
          target: resolvedRoot,
          rootMargin: normalizedRootMargin,
          threshold: normalizedThreshold,
          once,
          oncePerDirection,
          fireOnInitialVisible,
        });
      }
      return;
    }

    if (!observationRef.current) {
      observationRef.current = createObservationState(
        {
          node,
          rootMargin: normalizedRootMargin,
          threshold: normalizedThreshold,
          once,
          oncePerDirection,
          fireOnInitialVisible,
        },
        { onEnter, onLeave, onEvent },
      );
    }

    syncObservationSubscription(observationRef.current, {
      disabled,
      node,
      target: resolvedRoot,
      rootMargin: normalizedRootMargin,
      threshold: normalizedThreshold,
      once,
      oncePerDirection,
      fireOnInitialVisible,
    });
  }, [
    disabled,
    normalizedRootMargin,
    normalizedThreshold,
    once,
    oncePerDirection,
    fireOnInitialVisible,
    childNode,
    root,
    rootRef,
    trackedRootRefTarget,
    hasObservedChild,
  ]);

  React.useEffect(
    () => () => {
      if (!observationRef.current) {
        return;
      }

      cleanupObservationState(observationRef.current);
      observationRef.current = null;
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
