import React from 'react';
import { isWindowLike } from './AtomTrigger.runtime';
import { getStableSnapshot, useCompatSyncExternalStore } from './utils.syncExternalStore';

export type ScrollPosition = {
  x: number;
  y: number;
};

export type ViewportSize = {
  width: number;
  height: number;
};

export type ListenerOptions = {
  passive?: boolean;
  throttleMs?: number;
  enabled?: boolean;
};

export type UseScrollPositionOptions = ListenerOptions & {
  target?: Window | HTMLElement | React.RefObject<HTMLElement | null>;
};

const zeroScrollPosition: ScrollPosition = { x: 0, y: 0 };
const zeroViewportSize: ViewportSize = { width: 0, height: 0 };

type ThrottleController = {
  schedule: () => void;
  cancel: () => void;
};

function createThrottle(callback: () => void, wait: number): ThrottleController {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastInvocationTime: number | null = null;

  const invoke = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }

    lastInvocationTime = Date.now();
    callback();
  };

  const schedule = () => {
    if (wait <= 0) {
      invoke();
      return;
    }

    const now = Date.now();
    if (lastInvocationTime === null || now - lastInvocationTime >= wait) {
      invoke();
      return;
    }

    if (!timeoutId) {
      timeoutId = setTimeout(
        () => {
          invoke();
        },
        wait - (now - lastInvocationTime),
      );
    }
  };

  const cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return { schedule, cancel };
}

function getViewportSize(): ViewportSize {
  if (typeof window === 'undefined') {
    return zeroViewportSize;
  }

  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

function isRefBasedTarget(
  target: UseScrollPositionOptions['target'],
): target is React.RefObject<HTMLElement | null> {
  return Boolean(
    target && typeof target === 'object' && !isWindowLike(target) && 'current' in target,
  );
}

function getScrollTarget(target: UseScrollPositionOptions['target']): Window | HTMLElement | null {
  if (isRefBasedTarget(target)) {
    return target.current;
  }

  if (target) {
    return target;
  }

  if (typeof window === 'undefined') {
    return null;
  }

  return window;
}

function isWindowTarget(target: Window | HTMLElement): target is Window {
  return target === window || isWindowLike(target);
}

function getTargetScrollPosition(target: Window | HTMLElement): ScrollPosition {
  if (isWindowTarget(target)) {
    return {
      x: target.scrollX,
      y: target.scrollY,
    };
  }

  const elementTarget = target as HTMLElement;
  return {
    x: elementTarget.scrollLeft,
    y: elementTarget.scrollTop,
  };
}

function getInitialScrollPosition(target: UseScrollPositionOptions['target']): ScrollPosition {
  const initialTarget = getScrollTarget(target);

  if (!initialTarget) {
    return zeroScrollPosition;
  }

  return getTargetScrollPosition(initialTarget);
}

function areScrollPositionsEqual(current: ScrollPosition, next: ScrollPosition): boolean {
  return current.x === next.x && current.y === next.y;
}

function areViewportSizesEqual(current: ViewportSize, next: ViewportSize): boolean {
  return current.width === next.width && current.height === next.height;
}

export function useViewportSize(options?: ListenerOptions): ViewportSize {
  const enabled = options?.enabled !== false;
  const passive = options?.passive;
  const throttleMs = options?.throttleMs ?? 16;
  const lastSnapshotRef = React.useRef<ViewportSize>(getViewportSize());

  const getSnapshot = React.useCallback(() => {
    if (typeof window === 'undefined') {
      return zeroViewportSize;
    }

    if (!enabled) {
      return lastSnapshotRef.current;
    }

    return getStableSnapshot(lastSnapshotRef, getViewportSize(), areViewportSizesEqual);
  }, [enabled]);

  const subscribe = React.useCallback(
    (onStoreChange: () => void) => {
      if (typeof window === 'undefined' || !enabled) {
        return () => {};
      }

      const throttledResize = createThrottle(() => {
        const nextSize = getViewportSize();
        if (areViewportSizesEqual(lastSnapshotRef.current, nextSize)) {
          return;
        }

        lastSnapshotRef.current = nextSize;
        onStoreChange();
      }, throttleMs);

      window.addEventListener('resize', throttledResize.schedule, {
        passive,
      });

      return () => {
        throttledResize.cancel();
        window.removeEventListener('resize', throttledResize.schedule);
      };
    },
    [enabled, passive, throttleMs],
  );

  return useCompatSyncExternalStore(subscribe, getSnapshot, () => zeroViewportSize);
}

export function useScrollPosition(options?: UseScrollPositionOptions): ScrollPosition {
  const target = options?.target;
  const targetUsesRef = isRefBasedTarget(target);
  const enabled = options?.enabled !== false;
  const passive = options?.passive;
  const throttleMs = options?.throttleMs ?? 16;
  const lastSnapshotRef = React.useRef<ScrollPosition>(getInitialScrollPosition(target));
  const [trackedRefTarget, setTrackedRefTarget] = React.useState<Window | HTMLElement | null>(() =>
    targetUsesRef ? getScrollTarget(target) : null,
  );
  const useRefTargetEffect =
    typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect;

  useRefTargetEffect(() => {
    if (!targetUsesRef) {
      return;
    }

    // target.current can swap during commit without changing the ref object itself.
    // Mirror it after each commit so subscriptions rebind to the live scroll container.
    const nextTarget = getScrollTarget(target);
    setTrackedRefTarget(currentTarget =>
      currentTarget === nextTarget ? currentTarget : nextTarget,
    );
  });

  const scrollTarget = targetUsesRef ? trackedRefTarget : getScrollTarget(target);

  const getSnapshot = React.useCallback(() => {
    if (!enabled) {
      return lastSnapshotRef.current;
    }

    if (!scrollTarget) {
      return getStableSnapshot(lastSnapshotRef, zeroScrollPosition, areScrollPositionsEqual);
    }

    return getStableSnapshot(
      lastSnapshotRef,
      getTargetScrollPosition(scrollTarget),
      areScrollPositionsEqual,
    );
  }, [enabled, scrollTarget]);

  const subscribe = React.useCallback(
    (onStoreChange: () => void) => {
      if (!enabled || !scrollTarget) {
        return () => {};
      }

      const throttledScroll = createThrottle(() => {
        const nextPosition = getTargetScrollPosition(scrollTarget);
        if (areScrollPositionsEqual(lastSnapshotRef.current, nextPosition)) {
          return;
        }

        lastSnapshotRef.current = nextPosition;
        onStoreChange();
      }, throttleMs);

      scrollTarget.addEventListener('scroll', throttledScroll.schedule, {
        passive,
      });

      return () => {
        throttledScroll.cancel();
        scrollTarget.removeEventListener('scroll', throttledScroll.schedule);
      };
    },
    [enabled, passive, scrollTarget, throttleMs],
  );

  return useCompatSyncExternalStore(subscribe, getSnapshot, () => zeroScrollPosition);
}
