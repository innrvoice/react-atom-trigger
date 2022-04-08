import React from 'react';
import { Dimensions, SimpleScrollEvent } from './AtomTrigger';


export function log<T>(log: T, color?: string) {
  if (process.env.NODE_ENV === 'development') {
    color = !color
      ? 'background:  #007700; color: #fff'
      : `background: ${color}; color: #fff`;
    console.group('%c log: ' + log, color);
    console.groupEnd();
  }
}

function getScrollInfo(): SimpleScrollEvent {
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

export function useWindowDimensions(options: { timeout: number } | undefined) {
  const [dimensions, setDimensions] = React.useState<Dimensions | null>(null);
  const currentTimeout = React.useRef<NodeJS.Timeout | null>(null);
  const eventListenerAdded = React.useRef(false);

  const resizeTimeout = options && options.timeout  ? options.timeout : 15;

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

    window.addEventListener('resize', handleResize);
    eventListenerAdded.current = true;

    return () => {
      if (eventListenerAdded) {
        window.removeEventListener('resize', handleResize);
      }
    };
  }, []);

  return dimensions;
}

export function useContainerScroll({
  containerRef,
  timeout,
}: {
  containerRef?: React.RefObject<HTMLDivElement>;
  timeout?: number;
}) {
  const [scrollInfo, setScrollInfo] = React.useState(getScrollInfo());
  const currentTimeout = React.useRef<NodeJS.Timeout | null>(null);
  const eventListenerAdded = React.useRef(false);

  React.useEffect(() => {
    const handleScroll = (e: any) => {
      currentTimeout.current && clearTimeout(currentTimeout.current);
      currentTimeout.current = setTimeout(() => {
        setScrollInfo({
          scrollX: e.target.scrollLeft,
          scrollY: e.target.scrollTop,
        });
      }, timeout || 15);
    };

    const containerElement = containerRef?.current;
    if (containerElement) {
      if (containerElement && eventListenerAdded.current === false) {
        containerElement.addEventListener('scroll', handleScroll);
      }
      eventListenerAdded.current = true;
    }

    return () => {
      if (eventListenerAdded && containerElement) {
        containerElement.removeEventListener('scroll', handleScroll);
      }
    };
  }, [containerRef]);
  return scrollInfo;
}

export function useWindowScroll() {
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
      }, 15);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    eventListenerAdded.current = true;

    return () => {
      if (eventListenerAdded) {
        window.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  return scrollInfo;
}
