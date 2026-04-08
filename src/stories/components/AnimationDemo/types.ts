export type AnimationMode = 'sunrise' | 'day' | 'sunset' | 'night';

export type AircraftAnimation = 'none' | 'plane' | 'helicopter' | 'both';

export type AnimationTriggerId = 'top' | 'middle' | 'bottom';

export type AnimationTransitionDirection = 'up' | 'down';

export type AnimationTransition = {
  nextMode: AnimationMode;
  aircraft: AircraftAnimation;
};

export type AnimationTransitionMap = Partial<
  Record<AnimationTriggerId, Partial<Record<AnimationTransitionDirection, AnimationTransition>>>
>;
