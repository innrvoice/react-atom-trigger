import React from 'react';
import styles from './AnimationDemo.module.css';
import { classNames } from './classNames';
import { aircraftLabels, modeLabels } from './AnimationDemo.config';
import { formatEvent } from './AnimationDemo.utils';
import type { AnimationDemoState } from './AnimationDemo.state';

export type AnimationStatusPanelProps = {
  state: AnimationDemoState;
};

export function AnimationStatusPanel({ state }: AnimationStatusPanelProps) {
  return (
    <section className={styles.panel} aria-label="Animation status">
      <div className={styles.statusHeader}>
        <p className={styles.statusLabel}>Current phase</p>
        <span className={styles.modeBadge} data-testid="animation-demo-mode">
          {modeLabels[state.mode]}
        </span>
      </div>

      <div className={styles.statusGrid}>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Active aircraft</span>
          <span className={styles.metricValue} data-testid="animation-demo-aircraft">
            {aircraftLabels[state.activeAircraft]}
          </span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Transitions</span>
          <span className={styles.metricValue} data-testid="animation-demo-transition-count">
            {state.transitionCount}
          </span>
        </div>
        <div className={classNames(styles.metric, styles.metricWide)}>
          <span className={styles.metricLabel}>Latest event</span>
          <span className={styles.metricValue} data-testid="animation-demo-last-event">
            {formatEvent(state.lastEvent)}
          </span>
        </div>
      </div>
    </section>
  );
}
