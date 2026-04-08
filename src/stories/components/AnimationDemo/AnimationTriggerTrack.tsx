import React from 'react';
import { AtomTrigger } from '../../../index';
import styles from './AnimationDemo.module.css';
import { classNames } from './classNames';
import { triggerDefinitions } from './AnimationDemo.config';
import type { AtomTriggerEvent } from '../../../index';
import type { AnimationTriggerId } from './types';

export type AnimationTriggerTrackProps = {
  scrollRootRef: React.RefObject<HTMLDivElement | null>;
  showTriggers: boolean;
  setTriggerAnchor: (id: AnimationTriggerId) => (node: HTMLDivElement | null) => void;
  handleTrigger: (triggerId: AnimationTriggerId) => (event: AtomTriggerEvent) => void;
};

export function AnimationTriggerTrack({
  scrollRootRef,
  showTriggers,
  setTriggerAnchor,
  handleTrigger,
}: AnimationTriggerTrackProps) {
  return (
    <div ref={scrollRootRef} className={styles.scrollRoot} data-testid="animation-demo-scroll-root">
      <div className={styles.track}>
        <div className={styles.spacerTop} />

        {triggerDefinitions.map((trigger, index) => (
          <React.Fragment key={trigger.id}>
            <div ref={setTriggerAnchor(trigger.id)} className={styles.triggerRow}>
              <AtomTrigger
                rootRef={scrollRootRef}
                onEnter={handleTrigger(trigger.id)}
                className={classNames(styles.trigger, showTriggers && styles.triggerVisible)}
              />
              <span
                className={classNames(
                  styles.triggerLabel,
                  showTriggers && styles.triggerLabelVisible,
                )}
              >
                {trigger.label}
              </span>
            </div>

            <div
              className={
                index === triggerDefinitions.length - 1 ? styles.spacerEnd : styles.spacerLarge
              }
            />
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
