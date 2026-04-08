import type React from 'react';

export type MovementDirection = 'up' | 'down' | 'left' | 'right' | 'stationary' | 'unknown';

export type TriggerPosition = 'inside' | 'above' | 'below' | 'left' | 'right' | 'outside';

export type TriggerType = 'enter' | 'leave';

export type TriggerCounts = {
  entered: number;
  left: number;
};

export type RootMarginTuple = readonly [number, number, number, number];

export type AtomTriggerEntry = {
  target: Element;
  rootBounds: DOMRectReadOnly | null;
  boundingClientRect: DOMRectReadOnly;
  intersectionRect: DOMRectReadOnly;
  isIntersecting: boolean;
  intersectionRatio: number;
  source: 'geometry';
};

export type AtomTriggerEvent = {
  type: TriggerType;
  isInitial: boolean;
  entry: AtomTriggerEntry;
  counts: TriggerCounts;
  movementDirection: MovementDirection;
  position: TriggerPosition;
  timestamp: number;
};

export interface AtomTriggerProps {
  onEnter?: (event: AtomTriggerEvent) => void;
  onLeave?: (event: AtomTriggerEvent) => void;
  onEvent?: (event: AtomTriggerEvent) => void;
  children?: React.ReactNode;
  once?: boolean;
  oncePerDirection?: boolean;
  fireOnInitialVisible?: boolean;
  disabled?: boolean;
  threshold?: number;
  root?: Element | null;
  rootRef?: React.RefObject<Element | null>;
  rootMargin?: string | RootMarginTuple;
  className?: string;
}
