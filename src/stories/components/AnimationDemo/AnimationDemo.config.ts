import type {
  AircraftAnimation,
  AnimationMode,
  AnimationTransition,
  AnimationTransitionDirection,
  AnimationTriggerId,
} from './types';

export type TriggerDefinition = {
  id: AnimationTriggerId;
  label: string;
};

export type JumpDefinition = {
  label: string;
  triggerId: AnimationTriggerId;
  direction: AnimationTransitionDirection;
};

export const defaultTransitionMap = {
  top: {
    up: {
      nextMode: 'day',
      aircraft: 'both',
    },
  },
  middle: {
    down: {
      nextMode: 'sunset',
      aircraft: 'both',
    },
    up: {
      nextMode: 'sunrise',
      aircraft: 'helicopter',
    },
  },
  bottom: {
    down: {
      nextMode: 'night',
      aircraft: 'plane',
    },
  },
} satisfies Record<
  AnimationTriggerId,
  Partial<Record<AnimationTransitionDirection, AnimationTransition>>
>;

export const triggerDefinitions: readonly TriggerDefinition[] = [
  {
    id: 'top',
    label: 'Day trigger',
  },
  {
    id: 'middle',
    label: 'Sunset / sunrise trigger',
  },
  {
    id: 'bottom',
    label: 'Night trigger',
  },
] as const;

export const jumpDefinitions: readonly JumpDefinition[] = [
  {
    label: 'Jump to sunset',
    triggerId: 'middle',
    direction: 'down',
  },
  {
    label: 'Jump to night',
    triggerId: 'bottom',
    direction: 'down',
  },
  {
    label: 'Jump to sunrise',
    triggerId: 'middle',
    direction: 'up',
  },
  {
    label: 'Jump to day',
    triggerId: 'top',
    direction: 'up',
  },
] as const;

export const modeLabels: Record<AnimationMode, string> = {
  sunrise: 'Sunrise',
  day: 'Day',
  sunset: 'Sunset',
  night: 'Night',
};

export const aircraftLabels: Record<AircraftAnimation, string> = {
  both: 'Plane + heli',
  plane: 'Plane only',
  helicopter: 'Heli only',
  none: 'None',
};

export const scrollHintsByMode: Record<AnimationMode, string> = {
  sunrise: 'Scroll more...',
  day: 'Scroll down...',
  sunset: 'Scroll more...',
  night: 'Scroll up...',
};
