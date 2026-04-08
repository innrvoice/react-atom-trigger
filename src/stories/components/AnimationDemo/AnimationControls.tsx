import React from 'react';
import styles from './AnimationDemo.module.css';
import { classNames } from './classNames';
import { jumpDefinitions } from './AnimationDemo.config';
import type { AnimationTransitionDirection, AnimationTriggerId } from './types';

export type AnimationControlsProps = {
  showTriggers: boolean;
  onJump: (triggerId: AnimationTriggerId, direction: AnimationTransitionDirection) => void;
  onToggleMarkers: () => void;
  onReset: () => void;
};

export function AnimationControls({
  showTriggers,
  onJump,
  onToggleMarkers,
  onReset,
}: AnimationControlsProps) {
  return (
    <section className={classNames(styles.panel, styles.controls)} aria-label="Animation controls">
      {jumpDefinitions.map(jump => (
        <button
          key={jump.label}
          type="button"
          className={styles.controlButton}
          onClick={() => onJump(jump.triggerId, jump.direction)}
        >
          {jump.label}
        </button>
      ))}
      <button
        type="button"
        className={classNames(styles.controlButton, styles.controlButtonSecondary)}
        onClick={onToggleMarkers}
      >
        {showTriggers ? 'Hide markers' : 'Show markers'}
      </button>
      <button
        type="button"
        className={classNames(styles.controlButton, styles.controlButtonSecondary)}
        onClick={onReset}
      >
        Reset demo
      </button>
    </section>
  );
}
