import React from 'react';
import type { AnimationTransitionDirection } from './types';

export function useRestartAnimation(
  isActive: boolean,
  direction: AnimationTransitionDirection | null,
): boolean {
  const [hasStarted, setHasStarted] = React.useState(false);

  React.useEffect(() => {
    if (!isActive || !direction) {
      setHasStarted(false);
      return;
    }

    setHasStarted(false);
    const frameId = requestAnimationFrame(() => {
      setHasStarted(true);
    });

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [direction, isActive]);

  return hasStarted;
}
