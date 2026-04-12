# Migration Guide: v1 to v2

`react-atom-trigger@2` is a breaking release.

The biggest change is simple: `AtomTrigger` does its own observation now. In `v1.x` you had to pass scroll state and dimensions in from the outside. In `v2.x` you pass callbacks and, when needed, a root element.

The supported React range for `v2` remains the published peer range: React `16.8` through `19.x`.

## Before you start

This is not just a prop rename release.

Please re-check the behavior in the real UI after upgrading, especially if you use:

- `threshold`
- `rootMargin`
- custom scroll containers
- any code that was sensitive to the exact timing of the old callback

The new version samples geometry internally, so some edge timing can feel a bit different near boundaries.

## Quick prop map

| v1.x                 | v2.x                                      |
| -------------------- | ----------------------------------------- |
| `callback`           | `onEnter`, `onLeave` or `onEvent`         |
| `behavior="enter"`   | `onEnter`                                 |
| `behavior="leave"`   | `onLeave`                                 |
| `behavior="default"` | `onEvent` or both `onEnter` and `onLeave` |
| `triggerOnce`        | `once` or `oncePerDirection`              |
| `scrollEvent`        | removed                                   |
| `dimensions`         | removed                                   |
| `offset`             | `rootMargin`                              |
| `getDebugInfo`       | read data from `AtomTriggerEvent`         |
| `IAtomTriggerProps`  | `AtomTriggerProps`                        |

## Hook and type changes

| v1.x                                   | v2.x                                          |
| -------------------------------------- | --------------------------------------------- |
| `useWindowScroll`                      | `useScrollPosition()`                         |
| `useContainerScroll({ containerRef })` | `useScrollPosition({ target: containerRef })` |
| `useWindowDimensions`                  | `useViewportSize()`                           |
| `Options`                              | `ListenerOptions`                             |
| `ScrollEvent`                          | removed                                       |
| `Dimensions`                           | removed                                       |
| `DebugInfo`                            | removed                                       |
| `log`                                  | removed                                       |

## Common upgrades

### 1. Simple enter trigger

#### v1.x

```tsx
import React from 'react';
import { AtomTrigger, useWindowDimensions, useWindowScroll } from 'react-atom-trigger';

export function HeroAnimationTrigger() {
  const scrollEvent = useWindowScroll();
  const dimensions = useWindowDimensions();

  return (
    <AtomTrigger
      behavior="enter"
      callback={() => {
        console.log('start animation');
      }}
      scrollEvent={scrollEvent}
      dimensions={dimensions}
    />
  );
}
```

#### v2.x

```tsx
import React from 'react';
import { AtomTrigger } from 'react-atom-trigger';

export function HeroAnimationTrigger() {
  return <AtomTrigger onEnter={() => console.log('start animation')} />;
}
```

### 2. Enter and leave in one place

#### v1.x

```tsx
<AtomTrigger
  behavior="default"
  callback={() => {
    console.log('visibility changed');
  }}
  scrollEvent={scrollEvent}
  dimensions={dimensions}
/>
```

#### v2.x

```tsx
<AtomTrigger
  onEvent={event => {
    console.log(event.type, event.position, event.counts);
  }}
/>
```

### 3. Custom scroll container

#### v1.x

```tsx
import React from 'react';
import { AtomTrigger, useContainerScroll } from 'react-atom-trigger';

export function ContainerExample() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const scrollEvent = useContainerScroll({ containerRef });

  return (
    <div ref={containerRef} style={{ height: 320, overflowY: 'auto' }}>
      <div style={{ height: 600 }} />
      <AtomTrigger
        behavior="enter"
        callback={() => {
          console.log('entered container viewport');
        }}
        scrollEvent={scrollEvent}
        dimensions={{ width: 320, height: 320 }}
      />
      <div style={{ height: 600 }} />
    </div>
  );
}
```

#### v2.x

```tsx
import React from 'react';
import { AtomTrigger } from 'react-atom-trigger';

export function ContainerExample() {
  const containerRef = React.useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} style={{ height: 320, overflowY: 'auto' }}>
      <div style={{ height: 600 }} />
      <AtomTrigger
        rootRef={containerRef}
        onEnter={() => {
          console.log('entered container viewport');
        }}
      />
      <div style={{ height: 600 }} />
    </div>
  );
}
```

If you render the container in JSX, `rootRef` is usually the right choice.

If you already have the DOM element instance from somewhere else, use `root`.

If you want normal viewport behavior, pass neither.

### 4. `offset` to `rootMargin`

This part needs a little attention.

`offset` and `rootMargin` are related, but not identical in meaning. If you were using:

```tsx
<AtomTrigger offset={[100, 0, 0, 0]} />
```

the usual `v2.x` equivalent is:

```tsx
<AtomTrigger rootMargin="-100px 0px 0px 0px" />
```

For pixel tuples, this also works:

```tsx
<AtomTrigger rootMargin={[-100, 0, 0, 0]} />
```

After migrating, please check it in the actual UI. `rootMargin` is the place where timing differences are easiest to notice.

### 5. Replacing `getDebugInfo`

#### v1.x

```tsx
<AtomTrigger
  callback={handleTrigger}
  getDebugInfo={info => {
    console.log(info.trigger, info.timesTriggered);
  }}
  scrollEvent={scrollEvent}
  dimensions={dimensions}
/>
```

#### v2.x

```tsx
<AtomTrigger
  onEvent={event => {
    console.log(event.type);
    console.log(event.counts);
    console.log(event.position);
    console.log(event.movementDirection);
    console.log(event.entry.intersectionRatio);
  }}
/>
```

## Small hook examples

### Replace `useWindowScroll`

```tsx
const position = useScrollPosition();
console.log(position.y);
```

### Replace `useContainerScroll`

```tsx
const containerRef = React.useRef<HTMLDivElement>(null);
const position = useScrollPosition({ target: containerRef });
console.log(position.y);
```

### Replace `useWindowDimensions`

```tsx
const viewport = useViewportSize();
console.log(viewport.height);
```

## Final check

Your migration is probably done when all of these are true:

1. No `AtomTrigger` still passes `scrollEvent`, `dimensions`, `behavior`, `callback`, `getDebugInfo`, `triggerOnce` or `offset`.
2. Trigger handlers now use `onEnter`, `onLeave` and/or `onEvent`.
3. Custom containers use `root` or `rootRef`.
4. Hook imports were moved to `useScrollPosition` and `useViewportSize`.
5. You checked the real UI, not only TypeScript errors, especially around `threshold` and `rootMargin`.
