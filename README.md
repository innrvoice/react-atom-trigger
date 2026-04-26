# react-atom-trigger

[![codecov](https://codecov.io/gh/innrvoice/react-atom-trigger/branch/master/graph/badge.svg)](https://codecov.io/gh/innrvoice/react-atom-trigger)
[![bundle size](https://codecov.io/github/innrvoice/react-atom-trigger/branch/master/graph/bundle/react-atom-trigger-esm/badge.svg)](https://app.codecov.io/github/innrvoice/react-atom-trigger/bundles/master/react-atom-trigger-esm)

`react-atom-trigger` helps with the usual "run some code when this thing enters or leaves view" problem in React.

It is designed for scroll-triggered UI and viewport-based interactions, focusing on predictable enter/leave behavior in real layouts where scroll, resize and layout shifts all affect visibility.

It is a lightweight React alternative to `react-waypoint`.

It can also be used as a higher-level alternative to React Intersection Observer based solutions when you need more predictable scroll-trigger behavior.

## Typical use cases

- scroll-driven UI (sticky headers, scene transitions)
- triggering animations with precise timing
- layouts with dynamic content or frequent reflows
- containers with custom scroll roots

## Breaking changes

`v2` is a breaking release. If you are coming from `v1.x`, please check
[MIGRATION.md](./MIGRATION.md).

`v2.1` removes the helper hooks `useScrollPosition` and `useViewportSize`. `AtomTrigger` does its own observation and does not depend on those hooks.

If you want to stay on the old API:

```bash
# pnpm
pnpm add react-atom-trigger@^1

# npm
npm install react-atom-trigger@^1

# yarn
yarn add react-atom-trigger@^1
```

## Install

```bash
# pnpm
pnpm add react-atom-trigger

# npm
npm install react-atom-trigger

# yarn
yarn add react-atom-trigger
```

The published package does not enforce a specific Node.js engine.
Runtime compatibility is determined by your React version, browser target and bundler setup.

The public React compatibility contract for `v2` is the published peer range: React `16.8` through
`19.x`.

## How it works

`react-atom-trigger` uses a mixed approach.

- Geometry is the real source of truth for `enter` and `leave`.
- `IntersectionObserver` is only there to wake things up when the browser notices a nearby layout shift. You can think of it as: IntersectionObserver wakes things up, geometry decides what actually happened.
- `rootMargin` logic is handled by the library itself, so it stays consistent and does not depend on native observer quirks.

In practice this means `AtomTrigger` reacts to:

- scroll
- window resize
- root resize
- sentinel resize
- nearby layout shifts that move the observed element even if no scroll event happened

This allows it to support margin-aware behavior while still reacting to browser-driven changes.

## When to use vs react-intersection-observer

`react-intersection-observer` is a lightweight React wrapper around the browser’s IntersectionObserver API.

It is a great fit when:

- you only need to know if something is visible
- async observer timing is acceptable
- you want a simple hook like `useInView`

However, IntersectionObserver is designed as an asynchronous visibility signal managed by the browser. It does not provide exact geometry-based control over enter/leave transitions.

In fast scroll or layout-heavy UIs, this can lead to missed intermediate states or non-intuitive enter/leave timing.

Use `react-atom-trigger` when:

- you need predictable enter/leave behavior
- layout shifts should be handled consistently
- margins and thresholds must behave the same across cases
- visibility should be derived from actual element geometry rather than observer callbacks

## Quick start

```tsx
import React from 'react';
import { AtomTrigger } from 'react-atom-trigger';

export function Example() {
  return (
    <AtomTrigger
      onEnter={event => {
        console.log('entered', event);
      }}
      onLeave={event => {
        console.log('left', event);
      }}
      rootMargin="0px 0px 160px 0px"
      oncePerDirection
    />
  );
}
```

If you want an already-visible trigger to behave like a normal first `enter`, pass
`fireOnInitialVisible`.

```tsx
import React from 'react';
import { AtomTrigger } from 'react-atom-trigger';

export function RestoredScrollExample() {
  return (
    <AtomTrigger
      fireOnInitialVisible
      onEnter={event => {
        if (event.isInitial) {
          console.log('started visible after load');
          return;
        }

        console.log('entered from scrolling');
      }}
    />
  );
}
```

## Child mode

If you pass one top-level child, `AtomTrigger` observes that element directly instead of rendering its own sentinel.

```tsx
import React from 'react';
import { AtomTrigger } from 'react-atom-trigger';

export function HeroTrigger() {
  return (
    <AtomTrigger threshold={0.75} onEnter={() => console.log('hero is mostly visible')}>
      <section style={{ minHeight: 240 }}>Hero content</section>
    </AtomTrigger>
  );
}
```

This is usually the better mode when `threshold` should depend on a real element size.

Intrinsic elements such as `<div>` and `<section>` work automatically.

If you use a custom component, the ref that `AtomTrigger` passes down still has to reach a real DOM
element:

- in React 19, the component can receive `ref` as a prop and pass it through
- in React 18 and older, use `React.forwardRef`

If the ref never reaches a DOM node, child mode cannot observe anything.

If a custom child renders a placeholder first and only exposes its DOM node a moment later,
`AtomTrigger` waits briefly before showing the missing-ref warning so normal async mount flows do
not get flagged too early.

## API

```ts
interface AtomTriggerProps {
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
  rootMargin?: string | [number, number, number, number];
  className?: string;
}
```

### Props in short

- `onEnter`, `onLeave`, `onEvent`: trigger callbacks with a rich event payload.
- `children`: observe one real child element instead of the internal sentinel.
- `once`: allow only the first transition overall.
- `oncePerDirection`: allow one `enter` and one `leave`.
- `fireOnInitialVisible`: emit an initial `enter` when observation starts and the trigger is already active.
- `disabled`: stop observing without unmounting the component.
- `threshold`: a number from `0` to `1`. It affects `enter`, not `leave`.
- `root`: use a specific DOM element as the visible area.
- `rootRef`: same idea as `root`, but better when the container is created in JSX. If both are passed, `rootRef` wins.
- `root` / `rootRef`: if you pass one explicitly but it is still `null`, observation pauses until that real root exists. It does not silently fall back to the viewport.
- `rootMargin`: expand or shrink the effective root. String values use `IntersectionObserver`-style syntax. A four-number array is treated as `[top, right, bottom, left]` in pixels.
- `className`: applies only to the internal sentinel.

## Event payload

```ts
type AtomTriggerEvent = {
  type: 'enter' | 'leave';
  isInitial: boolean;
  entry: AtomTriggerEntry;
  counts: {
    entered: number;
    left: number;
  };
  movementDirection: 'up' | 'down' | 'left' | 'right' | 'stationary' | 'unknown';
  position: 'inside' | 'above' | 'below' | 'left' | 'right' | 'outside';
  timestamp: number;
};
```

```ts
type AtomTriggerEntry = {
  target: Element;
  rootBounds: DOMRectReadOnly | null;
  boundingClientRect: DOMRectReadOnly;
  intersectionRect: DOMRectReadOnly;
  isIntersecting: boolean;
  intersectionRatio: number;
  source: 'geometry';
};
```

The payload is library-owned geometry data. It is not a native `IntersectionObserverEntry`.

`isInitial` is `true` only for the synthetic first `enter` created by
`fireOnInitialVisible`.

## Notes

- In sentinel mode, `threshold` is usually only interesting if your sentinel has real width or height. The default sentinel is almost point-like.
- The internal sentinel intentionally uses a non-block display so it behaves like a point-like marker instead of stretching into a full-width placeholder.
- Child mode needs exactly one top-level child and any custom component used there needs to pass the received ref through to a DOM element.
- In React 19, a plain function component can also work in child mode if it passes the received `ref` prop through to a DOM element.
- If you pass `root` or `rootRef` explicitly and it is not ready yet, observation pauses instead of falling back to the viewport.
- `rootMargin` is handled by the library geometry logic. `IntersectionObserver` is only used as a nearby wake-up signal for layout shifts.

## Migration from v1

The short version:

1. `callback` became `onEnter`, `onLeave` and `onEvent`.
2. `behavior` is gone.
3. `triggerOnce` became `once` or `oncePerDirection`.
4. `scrollEvent`, `dimensions` and `offset` are gone.
5. Legacy helper hooks are no longer exported in `v2.1`. Use your app's own scroll or viewport hooks when needed.

For the real upgrade notes and examples, see [MIGRATION.md](./MIGRATION.md).

## Build output

This package is built with `tsdown`.

```text
lib/index.js
lib/index.umd.js
lib/index.d.ts
```

When the UMD bundle is loaded directly in the browser, the library is exposed as `window.reactAtomTrigger`.

## Examples

### Storybook

Storybook is the easiest way to see how the component behaves.

- `AtomTrigger Demo`: regular usage examples.
- `Extended Demo`: a larger animated interaction demo that shows AtomTrigger driving scene changes,
  event timing and more realistic scroll-based UI behavior.
- `Internal Tests`: interaction stories used for local checks and Storybook tests.

To run Storybook locally:

```bash
pnpm storybook
```

The latest Storybook build for `react-atom-trigger` is also available at
[storybook.atomtrigger.dev](https://storybook.atomtrigger.dev/).

### CodeSandbox

Quick way to tweak it in the browser.

- [Basic sentinel example](https://codesandbox.io/p/sandbox/react-atom-trigger-v2-basic-example-9xrzmg)
- [Child mode threshold example](https://codesandbox.io/p/sandbox/react-atom-trigger-v2-child-mode-threshold-qcpv28)
- [Fixed header offset example](https://codesandbox.io/p/devbox/react-atom-trigger-v2-fixed-header-offset-62lmrv)
- [Initial visible on load example](https://codesandbox.io/p/devbox/react-atom-trigger-v2-initial-visible-on-load-ncqjtf)
- [Horizontal scroll container example](https://codesandbox.io/p/devbox/react-atom-trigger-v2-horizontal-scroll-container-hs33gq)

## Development

```bash
pnpm install
pnpm lint
pnpm test
pnpm test:coverage
pnpm test:storybook
pnpm build
pnpm format:check
```

Coverage note:

- `pnpm test:coverage` is the official unit coverage signal used in CI and Codecov.
- `pnpm test:storybook` is a separate browser regression gate and is not merged into the official coverage number.

## Storybook (Static Build)

Build:

```bash
pnpm build:sb
```

Output:

`storybook-static/`
