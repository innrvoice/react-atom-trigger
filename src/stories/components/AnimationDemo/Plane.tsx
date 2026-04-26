import React from 'react';
import styles from './AnimationDemo.module.css';
import planeSvg from './assets/plane.svg';
import { classNames } from './classNames';
import type { AnimationMode, AnimationTransitionDirection } from './types';
import { useRestartAnimation } from './useRestartAnimation';

export type PlaneProps = {
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

export function Plane({ mode, isActive, direction }: PlaneProps) {
  const isDownwardFlight = direction === 'down';
  const hasStarted = useRestartAnimation(isActive, direction);

  return (
    <div
      aria-hidden="true"
      className={classNames(
        styles.vehicle,
        styles.plane,
        phaseClassNames[mode],
        isActive ? styles.vehicleActive : styles.vehicleIdle,
        isActive && styles.planeMotion,
        isActive && (isDownwardFlight ? styles.planeFromLeft : styles.planeFromRight),
        isActive && hasStarted && (isDownwardFlight ? styles.planeToRight : styles.planeToLeft),
      )}
    >
      <div className={classNames(isDownwardFlight && styles.mirror)}>
        <img className={styles.vehicleImage} src={planeSvg} alt="" />
      </div>
    </div>
  );
}

export default Plane;
