import React from 'react';

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

const useIsomorphicLayoutEffect =
  typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect;

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
    return { width: 0, height: 0 };
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
    target &&
    typeof target === 'object' &&
    !(typeof Window !== 'undefined' && target instanceof Window) &&
    'current' in target,
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
  return target === window || (typeof Window !== 'undefined' && target instanceof Window);
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

export function useViewportSize(options?: ListenerOptions): ViewportSize {
  const [size, setSize] = React.useState<ViewportSize>(getViewportSize);

  React.useEffect(() => {
    if (typeof window === 'undefined' || options?.enabled === false) {
      return;
    }

    const throttleMs = options?.throttleMs ?? 16;
    setSize(getViewportSize());
    const throttledResize = createThrottle(() => {
      setSize(getViewportSize());
    }, throttleMs);

    window.addEventListener('resize', throttledResize.schedule, {
      passive: options?.passive,
    });

    return () => {
      throttledResize.cancel();
      window.removeEventListener('resize', throttledResize.schedule);
    };
  }, [options?.enabled, options?.passive, options?.throttleMs]);

  return size;
}

export function useScrollPosition(options?: UseScrollPositionOptions): ScrollPosition {
  const target = options?.target;
  const targetUsesRef = isRefBasedTarget(target);
  const [position, setPosition] = React.useState<ScrollPosition>(() => {
    const initialTarget = getScrollTarget(target);

    if (!initialTarget) {
      return zeroScrollPosition;
    }

    return getTargetScrollPosition(initialTarget);
  });
  const [refTarget, setRefTarget] = React.useState<Window | HTMLElement | null>(() =>
    targetUsesRef ? getScrollTarget(target) : null,
  );

  useIsomorphicLayoutEffect(() => {
    if (!targetUsesRef) {
      return;
    }

    const nextTarget = getScrollTarget(target);
    setRefTarget(currentTarget => (currentTarget === nextTarget ? currentTarget : nextTarget));
  });

  const scrollTarget = targetUsesRef ? refTarget : getScrollTarget(target);

  React.useEffect(() => {
    if (options?.enabled === false) {
      setPosition(zeroScrollPosition);
      return;
    }

    if (!scrollTarget) {
      setPosition(zeroScrollPosition);
      return;
    }

    const throttleMs = options?.throttleMs ?? 16;
    setPosition(getTargetScrollPosition(scrollTarget));
    const throttledScroll = createThrottle(() => {
      setPosition(getTargetScrollPosition(scrollTarget));
    }, throttleMs);

    scrollTarget.addEventListener('scroll', throttledScroll.schedule, {
      passive: options?.passive,
    });

    return () => {
      throttledScroll.cancel();
      scrollTarget.removeEventListener('scroll', throttledScroll.schedule);
    };
  }, [options?.enabled, options?.passive, options?.throttleMs, scrollTarget]);

  return position;
}
