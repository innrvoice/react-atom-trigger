import React from 'react';
import { Dimensions, ScrollEvent } from './AtomTrigger.types';

export type Options = {
  passiveEventListener?: boolean;
  eventListenerTimeoutMs?: number;
};

export function log<T>(log: T, color?: string) {
  if (process.env.NODE_ENV === 'development') {
    color = !color
      ? 'background:  #007700; color: #fff'
      : `background: ${color}; color: #fff`;
    console.group('%c log: ' + log, color);
    console.groupEnd();
  }
}

function getScrollInfo(): ScrollEvent {
  const { scrollX, scrollY } = window;
  return {
    scrollX,
    scrollY,
  };
}

function getWindowDimensions(): Dimensions {
  const { innerWidth: width, innerHeight: height } = window;
  return {
    width,
    height,
  };
}

export function useWindowDimensions(options?: Options | undefined) {
  const [dimensions, setDimensions] = React.useState<Dimensions>(
    getWindowDimensions(),
  );
  const currentTimeout = React.useRef<NodeJS.Timeout | null>(null);
  const eventListenerAdded = React.useRef(false);

  const resizeTimeout = options?.eventListenerTimeoutMs || 15;

  React.useEffect(() => {
    const dimensions = getWindowDimensions();
    setDimensions(dimensions);

    function handleResize() {
      currentTimeout.current && clearTimeout(currentTimeout.current);
      currentTimeout.current = setTimeout(
        () => setDimensions(getWindowDimensions()),
        resizeTimeout,
      );
    }

    window.addEventListener('resize', handleResize, {
      passive: options?.passiveEventListener,
    });
    eventListenerAdded.current = true;

    return () => {
      if (eventListenerAdded) {
        window.removeEventListener('resize', handleResize);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return dimensions;
}

export function useContainerScroll({
  containerRef,
  options,
}: {
  containerRef?: React.RefObject<HTMLDivElement>;
  options?: Options;
}) {
  const [scrollInfo, setScrollInfo] = React.useState(getScrollInfo());
  const currentTimeout = React.useRef<NodeJS.Timeout | null>(null);
  const eventListenerAdded = React.useRef(false);

  React.useEffect(() => {
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLDivElement;
      currentTimeout.current && clearTimeout(currentTimeout.current);
      currentTimeout.current = setTimeout(() => {
        setScrollInfo({
          scrollX: target.scrollLeft,
          scrollY: target.scrollTop,
        });
      }, options?.eventListenerTimeoutMs || 15);
    };

    const containerElement = containerRef?.current;
    if (containerElement) {
      if (containerElement && eventListenerAdded.current === false) {
        containerElement.addEventListener('scroll', handleScroll, {
          passive: options?.passiveEventListener,
        });
      }
      eventListenerAdded.current = true;
    }

    return () => {
      if (eventListenerAdded && containerElement) {
        containerElement.removeEventListener('scroll', handleScroll);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef]);
  return scrollInfo;
}

export function useWindowScroll(options?: Options) {
  const [scrollInfo, setScrollInfo] = React.useState(getScrollInfo());
  const currentTimeout = React.useRef<NodeJS.Timeout | null>(null);
  const eventListenerAdded = React.useRef(false);

  React.useEffect(() => {
    const handleScroll = () => {
      currentTimeout.current && clearTimeout(currentTimeout.current);
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
    eventListenerAdded.current = true;

    return () => {
      if (eventListenerAdded) {
        window.removeEventListener('scroll', handleScroll);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return scrollInfo;
}
