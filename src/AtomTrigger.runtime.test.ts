import { describe, expect, it } from 'vitest';
import { isDomElementLike, isWindowLike } from './AtomTrigger.runtime';

describe('AtomTrigger runtime helpers', () => {
  it('detects DOM-like element values without relying on the current realm', () => {
    expect(isDomElementLike(document.createElement('div'))).toBe(true);
    expect(isDomElementLike({ nodeType: 1 })).toBe(false);
    expect(isDomElementLike({ nodeType: 3 })).toBe(false);
    expect(isDomElementLike(null)).toBe(false);
  });

  it('detects window-like objects without relying on instanceof Window', () => {
    expect(isWindowLike(window)).toBe(true);
    expect(isWindowLike({ window: null })).toBe(false);

    const crossRealmLike = {} as { window?: unknown };
    crossRealmLike.window = crossRealmLike;

    expect(isWindowLike(crossRealmLike)).toBe(true);
  });
});
