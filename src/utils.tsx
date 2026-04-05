import React from 'react';
import { Dimensions, ScrollEvent } from './AtomTrigger.types';

export type Options = {
  passiveEventListener?: boolean;
  eventListenerTimeoutMs?: number;
};

const DEFAULT_SCROLL_INFO: ScrollEvent = {
  scrollX: 0,
  scrollY: 0,
};

const DEFAULT_DIMENSIONS: Dimensions = {
  width: 0,
  height: 0,
};

const hasWindow = typeof window !== 'undefined';

export function log<T>(log: T, color?: string) {
  if (
    typeof process !== 'undefined' &&
    process.env.NODE_ENV === 'development'
  ) {
    color = !color
      ? 'background:  #007700; color: #fff'
      : `background: ${color}; color: #fff`;
    console.group('%c log: ' + log, color);
    console.groupEnd();
  }
}

function getScrollInfo(): ScrollEvent {
  if (!hasWindow) {
    return DEFAULT_SCROLL_INFO;
  }

  const { scrollX, scrollY } = window;
  return {
    scrollX,
    scrollY,
  };
}

function getWindowDimensions(): Dimensions {
  if (!hasWindow) {
    return DEFAULT_DIMENSIONS;
  }

  const { innerWidth: width, innerHeight: height } = window;
  return {
    width,
    height,
  };
}

function getElementScrollInfo(
  element?: Pick<HTMLElement, 'scrollLeft' | 'scrollTop'> | null,
): ScrollEvent {
  if (!element) {
    return DEFAULT_SCROLL_INFO;
  }

  return {
    scrollX: element.scrollLeft,
    scrollY: element.scrollTop,
  };
}

export function useWindowDimensions(options?: Options | undefined) {
  const [dimensions, setDimensions] = React.useState<Dimensions>(() =>
    getWindowDimensions(),
  );
  const currentTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const resizeTimeout = options?.eventListenerTimeoutMs || 15;

  React.useEffect(() => {
    if (!hasWindow) {
      return;
    }

    const dimensions = getWindowDimensions();
    setDimensions(dimensions);

    function handleResize() {
      if (currentTimeout.current) {
        clearTimeout(currentTimeout.current);
      }
      currentTimeout.current = setTimeout(
        () => setDimensions(getWindowDimensions()),
        resizeTimeout,
      );
    }

    window.addEventListener('resize', handleResize, {
      passive: options?.passiveEventListener,
    });

    return () => {
      if (currentTimeout.current) {
        clearTimeout(currentTimeout.current);
      }

      window.removeEventListener('resize', handleResize);
    };
  }, [options?.eventListenerTimeoutMs, options?.passiveEventListener]);

  return dimensions;
}

export function useContainerScroll({
  containerRef,
  options,
}: {
  containerRef?: React.RefObject<HTMLElement | null>;
  options?: Options;
}) {
  const [scrollInfo, setScrollInfo] = React.useState<ScrollEvent>(() =>
    getElementScrollInfo(containerRef?.current),
  );
  const currentTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const containerElement = containerRef?.current;

  React.useEffect(() => {
    if (!containerElement) {
      setScrollInfo(DEFAULT_SCROLL_INFO);
      return;
    }

    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      if (currentTimeout.current) {
        clearTimeout(currentTimeout.current);
      }
      currentTimeout.current = setTimeout(() => {
        setScrollInfo({
          scrollX: target.scrollLeft,
          scrollY: target.scrollTop,
        });
      }, options?.eventListenerTimeoutMs || 15);
    };

    setScrollInfo(getElementScrollInfo(containerElement));
    containerElement.addEventListener('scroll', handleScroll, {
      passive: options?.passiveEventListener,
    });

    return () => {
      if (currentTimeout.current) {
        clearTimeout(currentTimeout.current);
      }

      containerElement.removeEventListener('scroll', handleScroll);
    };
  }, [
    containerElement,
    options?.eventListenerTimeoutMs,
    options?.passiveEventListener,
  ]);
  return scrollInfo;
}

export function useWindowScroll(options?: Options) {
  const [scrollInfo, setScrollInfo] = React.useState<ScrollEvent>(() =>
    getScrollInfo(),
  );
  const currentTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  React.useEffect(() => {
    if (!hasWindow) {
      return;
    }

    const handleScroll = () => {
      if (currentTimeout.current) {
        clearTimeout(currentTimeout.current);
      }
      currentTimeout.current = setTimeout(() => {
        const { scrollX, scrollY } = getScrollInfo();
        setScrollInfo({
          scrollX,
          scrollY,
        });
      }, options?.eventListenerTimeoutMs || 20);
    };

    window.addEventListener('scroll', handleScroll, {
      passive: options?.passiveEventListener,
    });

    return () => {
      if (currentTimeout.current) {
        clearTimeout(currentTimeout.current);
      }

      window.removeEventListener('scroll', handleScroll);
    };
  }, [options?.eventListenerTimeoutMs, options?.passiveEventListener]);

  return scrollInfo;
}
