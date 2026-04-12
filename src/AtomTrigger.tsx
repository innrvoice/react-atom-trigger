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
  createObservationController,
  disposeObservationController,
  reconcileObservationBinding,
  updateObservationCallbacks,
  type ObservationController,
} from './AtomTrigger.observation';
import {
  resolveSchedulerTarget,
  useTrackedRootRefTarget,
  type SchedulerTargetSource,
} from './AtomTrigger.root';
import {
  childModeClassNameWarning,
  conflictingOnceModesWarning,
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
  root,
  rootRef,
  rootMargin = '0px',
  className,
}) => {
  const sentinelRef = React.useRef<HTMLDivElement>(null);
  const controllerRef = React.useRef<ObservationController | null>(null);
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
    if (once && oncePerDirection) {
      warnOnce(conflictingOnceModesWarning);
    }
  }, [once, oncePerDirection]);

  React.useEffect(() => {
    const controller = controllerRef.current;
    if (!controller) {
      return;
    }

    updateObservationCallbacks(controller, { onEnter, onLeave, onEvent });
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
      if (controllerRef.current) {
        reconcileObservationBinding(controllerRef.current, {
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

    if (!controllerRef.current) {
      controllerRef.current = createObservationController(
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

    reconcileObservationBinding(controllerRef.current, {
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
      if (!controllerRef.current) {
        return;
      }

      disposeObservationController(controllerRef.current);
      controllerRef.current = null;
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
