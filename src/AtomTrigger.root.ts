import React from 'react';
import { isDomElementLike } from './AtomTrigger.runtime';
import { warningMessages, warnOnce } from './AtomTrigger.warnings';

export type SchedulerTarget = Window | Element;

export type SchedulerTargetSource =
  | { kind: 'rootRef'; target: Element | null | undefined }
  | { kind: 'root'; target: Element | null | undefined }
  | { kind: 'viewport' };

function resolveExplicitRootTarget(
  source: Extract<SchedulerTargetSource, { kind: 'rootRef' | 'root' }>,
): Element | null {
  const warningMessage =
    source.kind === 'rootRef' ? warningMessages.invalidRootRef : warningMessages.invalidRoot;
  const { target } = source;

  if (target === null || target === undefined) {
    return null;
  }

  if (isDomElementLike(target)) {
    return target;
  }

  if (process.env.NODE_ENV === 'development') {
    warnOnce(warningMessage);
  }
  return null;
}

export function useTrackedRootRefTarget(
  rootRef: React.RefObject<Element | null> | undefined,
): Element | null | undefined {
  const hasRootRef = rootRef !== undefined;
  const [rootRefTarget, setRootRefTarget] = React.useState<Element | null>(() =>
    hasRootRef ? rootRef.current : null,
  );

  React.useEffect(() => {
    if (!hasRootRef) {
      return;
    }

    // rootRef.current can change during commit without changing the ref object itself
    // Mirror it after each commit so observation can rebind to newly mounted roots
    const nextTarget = rootRef.current;
    setRootRefTarget(currentTarget => (currentTarget === nextTarget ? currentTarget : nextTarget));
  });

  return hasRootRef ? rootRefTarget : undefined;
}

export function resolveSchedulerTarget(source: SchedulerTargetSource): SchedulerTarget | null {
  switch (source.kind) {
    case 'rootRef':
    case 'root':
      return resolveExplicitRootTarget(source);
    case 'viewport':
      if (typeof window === 'undefined') {
        return null;
      }

      return window;
  }
}
