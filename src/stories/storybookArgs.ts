import { fn } from 'storybook/test';

export const atomTriggerActionArgs = {
  onEnter: fn(),
  onLeave: fn(),
  onEvent: fn(),
} as const;

export const atomTriggerArgTypes = {
  once: {
    control: 'boolean',
    description: 'Fire only the first transition, then stop observing.',
  },
  oncePerDirection: {
    control: 'boolean',
    description: 'Allow one enter and one leave, then stop observing.',
  },
  fireOnInitialVisible: {
    control: 'boolean',
    description: 'Emit an initial enter when the target starts visible.',
  },
  threshold: {
    control: { type: 'range', min: 0, max: 1, step: 0.05 },
    description: 'Visibility ratio required before enter fires.',
  },
  rootMargin: {
    control: 'text',
    description: 'CSS-like root margin string passed to AtomTrigger.',
  },
  initialScrollTop: {
    control: { type: 'number', min: 0, step: 10 },
    description: 'Initial scroll position used by scroll-root demos.',
  },
  initialVerticalScrollTop: {
    control: { type: 'number', min: 0, step: 10 },
    description: 'Initial scroll position used by controlled vertical harnesses.',
  },
  headerHeight: {
    control: { type: 'number', min: 0, max: 240, step: 10 },
    description: 'Fixed header height used to derive negative top rootMargin.',
  },
  onEnter: {
    action: 'enter',
    description: 'Fires when the observed target enters the root.',
  },
  onLeave: {
    action: 'leave',
    description: 'Fires when the observed target leaves the root.',
  },
  onEvent: {
    action: 'event',
    description: 'Fires for every transition with the full AtomTrigger payload.',
  },
} as const;

export const animationDemoActionArgs = {
  onModeChange: fn(),
} as const;

export const animationDemoArgTypes = {
  initialMode: {
    control: 'inline-radio',
    options: ['day', 'sunset', 'night', 'sunrise'],
  },
  viewportHeight: {
    control: { type: 'number', min: 320, max: 960, step: 20 },
  },
  defaultShowTriggers: {
    control: 'boolean',
  },
  scrollBehavior: {
    control: 'inline-radio',
    options: ['smooth', 'instant'],
  },
  onModeChange: {
    action: 'mode change',
  },
} as const;
