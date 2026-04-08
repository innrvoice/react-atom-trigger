import type { AtomTriggerEvent } from '../../../index';
import type { AnimationTransitionDirection } from './types';

export function formatEvent(event: AtomTriggerEvent | null): string {
  if (!event) {
    return 'No trigger crossed yet';
  }

  return `${event.type} from ${event.position} while moving ${event.movementDirection}`;
}

export function createJumpEvent(
  root: HTMLDivElement,
  target: HTMLDivElement,
  direction: AnimationTransitionDirection,
): AtomTriggerEvent {
  const rootRect = root.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();

  return {
    type: 'enter',
    isInitial: false,
    entry: {
      target,
      rootBounds: new DOMRect(rootRect.x, rootRect.y, rootRect.width, rootRect.height),
      boundingClientRect: targetRect,
      intersectionRect: targetRect,
      isIntersecting: true,
      intersectionRatio: 1,
      source: 'geometry',
    },
    counts: {
      entered: 1,
      left: 0,
    },
    movementDirection: direction,
    position: 'inside',
    timestamp: Date.now(),
  };
}

export function getTargetScrollTop(root: HTMLDivElement, target: HTMLDivElement): number {
  const rootRect = root.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();

  return root.scrollTop + targetRect.top - rootRect.top;
}

export function scrollRootToPosition(
  root: HTMLDivElement,
  top: number,
  behavior: ScrollBehavior,
): number {
  const nextTop = Math.max(0, Math.min(top, root.scrollHeight - root.clientHeight));

  if (behavior === 'instant') {
    root.scrollTop = nextTop;
    return nextTop;
  }

  root.scrollTo({
    top: nextTop,
    behavior,
  });

  return nextTop;
}
