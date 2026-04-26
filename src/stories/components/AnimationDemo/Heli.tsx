import React from 'react';
import styles from './AnimationDemo.module.css';
import helicopterSvg from './assets/helicopter.svg';
import { classNames } from './classNames';
import type { AnimationMode, AnimationTransitionDirection } from './types';
import { useRestartAnimation } from './useRestartAnimation';

export type HelicopterProps = {
  mode: AnimationMode;
  isActive: boolean;
  direction: AnimationTransitionDirection | null;
};

const phaseClassNames: Record<AnimationMode, string> = {
  sunrise: styles.vehicleSunrise,
  day: styles.vehicleDay,
  sunset: styles.vehicleSunset,
  night: styles.vehicleNight,
};

export function Helicopter({ mode, isActive, direction }: HelicopterProps) {
  const isUpwardFlight = direction === 'up';
  const hasStarted = useRestartAnimation(isActive, direction);

  return (
    <div
      aria-hidden="true"
      className={classNames(
        styles.vehicle,
        styles.helicopter,
        phaseClassNames[mode],
        isActive ? styles.vehicleActive : styles.vehicleIdle,
        isActive && styles.helicopterMotion,
        isActive && (isUpwardFlight ? styles.helicopterFromLeft : styles.helicopterFromRight),
        isActive &&
          hasStarted &&
          (isUpwardFlight ? styles.helicopterToRight : styles.helicopterToLeft),
      )}
    >
      <div className={classNames(isUpwardFlight && styles.mirror)}>
        <img className={styles.vehicleImage} src={helicopterSvg} alt="" />
      </div>
    </div>
  );
}

export default Helicopter;
