export type ScrollEvent = { scrollX: number; scrollY: number };

export type Dimensions = {
  width: number;
  height: number;
};

export type DebugInfo = {
  timesTriggered: { leftViewport: number; enteredViewport: number };
  trigger: 'entered' | 'left';
};

export interface IAtomTriggerProps {
  scrollEvent: ScrollEvent;
  behavior?: 'default' | 'enter' | 'leave';
  callback: () => unknown;
  getDebugInfo?: (data: DebugInfo) => void;
  triggerOnce?: boolean;
  className?: string;
  dimensions: Dimensions;
  offset?: [number, number, number, number];
}
