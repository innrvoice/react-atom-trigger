import React from 'react';
import { useScrollPosition, useViewportSize } from '../index';

export function ScrollPositionHarness() {
  const [useSecondTarget, setUseSecondTarget] = React.useState(false);
  const targetRef = React.useRef<HTMLDivElement | null>(null);
  const position = useScrollPosition({ target: targetRef, throttleMs: 0 });

  return (
    <div>
      <button type="button" onClick={() => setUseSecondTarget(value => !value)}>
        swap target
      </button>
      {useSecondTarget ? (
        <div key="second-target" data-testid="scroll-target-2" ref={targetRef} />
      ) : (
        <div key="first-target" data-testid="scroll-target-1" ref={targetRef} />
      )}
      <output data-testid="scroll-position">
        {position.x},{position.y}
      </output>
    </div>
  );
}

export function RemovableScrollPositionHarness() {
  const [showTarget, setShowTarget] = React.useState(true);
  const targetRef = React.useRef<HTMLDivElement | null>(null);
  const position = useScrollPosition({ target: targetRef, throttleMs: 0 });

  return (
    <div>
      <button type="button" onClick={() => setShowTarget(false)}>
        remove target
      </button>
      {showTarget ? <div data-testid="removable-scroll-target" ref={targetRef} /> : null}
      <output data-testid="removable-scroll-position">
        {position.x},{position.y}
      </output>
    </div>
  );
}

export function ToggleableScrollPositionHarness() {
  const [enabled, setEnabled] = React.useState(true);
  const targetRef = React.useRef<HTMLDivElement | null>(null);
  const position = useScrollPosition({ target: targetRef, throttleMs: 0, enabled });

  return (
    <div>
      <button type="button" onClick={() => setEnabled(value => !value)}>
        {enabled ? 'disable scroll position' : 'enable scroll position'}
      </button>
      <div data-testid="toggleable-scroll-target" ref={targetRef} />
      <output data-testid="toggleable-scroll-position">
        {position.x},{position.y}
      </output>
    </div>
  );
}

export function WindowScrollPositionHarness({ throttleMs }: { throttleMs: number }) {
  const position = useScrollPosition({ throttleMs });

  return (
    <output data-testid="window-scroll-position">
      {position.x},{position.y}
    </output>
  );
}

export function ViewportSizeHarness({ throttleMs }: { throttleMs: number }) {
  const size = useViewportSize({ throttleMs });

  return (
    <output data-testid="viewport-size">
      {size.width},{size.height}
    </output>
  );
}
