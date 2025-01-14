import React from 'react';
import { IAtomTriggerProps } from './AtomTrigger.types';

const AtomTrigger: React.FC<IAtomTriggerProps> = ({
  scrollEvent,
  callback,
  getDebugInfo,
  triggerOnce = false,
  className,
  behavior = 'default',
  dimensions,
  offset = [0, 0, 0, 0],
}) => {
  const atomTriggerRef = React.useRef<HTMLDivElement>(null);
  const [triggerPosition, setTriggerPosition] = React.useState<
    'inViewport' | 'top' | 'bottom' | undefined
  >(undefined);
  const previousPositionState = React.useRef<
    'inViewport' | 'top' | 'bottom' | undefined
  >(undefined);

  const [timesTriggered, setTimesTriggered] = React.useState({
    leftViewport: 0,
    enteredViewport: 0,
  });

  React.useLayoutEffect(() => {
    if (atomTriggerRef.current) {
      const triggerElement = atomTriggerRef.current;
      const elementDOMRect = triggerElement.getBoundingClientRect();
      const [offsetTop, offsetRight, offsetBottom, offsetLeft] = offset;

      if (
        elementDOMRect.top > offsetTop &&
        elementDOMRect.bottom < dimensions.height - offsetBottom &&
        elementDOMRect.left > offsetLeft &&
        elementDOMRect.right < dimensions.width - offsetRight
      ) {
        setTriggerPosition('inViewport');
      } else if (elementDOMRect.top > dimensions.height - offsetBottom) {
        setTriggerPosition('bottom');
      } else {
        setTriggerPosition('top');
      }
    }
  }, [atomTriggerRef, scrollEvent, dimensions, offset]);

  React.useLayoutEffect(() => {
    if (
      previousPositionState.current === undefined &&
      triggerPosition !== undefined
    ) {
      previousPositionState.current = triggerPosition;
    }

    if (
      triggerPosition === 'inViewport' &&
      (previousPositionState.current === 'bottom' ||
        previousPositionState.current === 'top')
    ) {
      if (
        (behavior === 'enter' &&
          (!triggerOnce || (triggerOnce && timesTriggered.enteredViewport))) ||
        (behavior === 'default' &&
          (!triggerOnce ||
            (triggerOnce &&
              (timesTriggered.enteredViewport < 1 ||
                timesTriggered.leftViewport < 1))))
      ) {
        callback && callback();
        const updatedTimes = {
          ...timesTriggered,
          enteredViewport: timesTriggered.enteredViewport + 1,
        };
        getDebugInfo &&
          getDebugInfo({
            timesTriggered: updatedTimes,
            trigger: 'entered',
          });
        setTimesTriggered(updatedTimes);
      }

      previousPositionState.current = triggerPosition;
    }

    if (
      (triggerPosition === 'top' || triggerPosition === 'bottom') &&
      previousPositionState.current === 'inViewport'
    ) {
      previousPositionState.current = triggerPosition;

      if (
        (behavior === 'leave' &&
          (!triggerOnce ||
            (triggerOnce && timesTriggered.leftViewport === 0))) ||
        (behavior === 'default' &&
          (!triggerOnce ||
            (triggerOnce &&
              (timesTriggered.leftViewport < 1 ||
                timesTriggered.enteredViewport < 1))))
      ) {
        callback && callback();

        const updatedTimes = {
          ...timesTriggered,
          leftViewport: timesTriggered.leftViewport + 1,
        };
        getDebugInfo &&
          getDebugInfo({
            timesTriggered: updatedTimes,
            trigger: 'left',
          });
        setTimesTriggered(updatedTimes);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerPosition, callback, triggerOnce, behavior, getDebugInfo]);

  return (
    <div
      ref={atomTriggerRef}
      style={{ display: 'table' }}
      className={className}
    />
  );
};

export default AtomTrigger;
