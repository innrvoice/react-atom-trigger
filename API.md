# react-atom-trigger API

This is a more detailed explanation of how `<AtomTrigger />` works and how to use it.

If you just need something quick, you can probably stop at the README.
But if something feels unclear or behaves a bit differently than you expected, this part should help.

The goal here is not only to explain what it does, but also why it behaves like that, because this is usually where confusion starts.

`v2` treats the published peer range as the compatibility contract: React `16.8` through `19.x`.

## What `<AtomTrigger />` Actually Does

At the simplest level, it solves this:

> Run some code when something enters or leaves the view.

If you used `react-waypoint` before, this solves basically the same problem.

## Sentinel Mode vs Child Mode

There are two ways this component works.

This matters because some props behave differently depending on the mode.

### 1. Sentinel Mode

If you render it like this:

```tsx
<AtomTrigger onEnter={() => console.log('entered')} />
```

It renders its own internal `<div>` and observes that node.

This works fine in most cases, but it is a bit abstract because you do not really "see" what is being tracked.

Important detail:

- In this mode the sentinel is basically point-like.
- The internal sentinel intentionally uses a non-block display so it behaves like a marker, not a full-width block placeholder.
- So things like `threshold` do not behave very meaningfully unless you explicitly give it size.
- The library normalizes zero-size geometry to at least `1px x 1px`, but in practice it still behaves almost like a point.

### 2. Child Mode

If you pass exactly one child:

```tsx
<AtomTrigger threshold={0.75}>
  <section>Hero</section>
</AtomTrigger>
```

Now it observes that element directly.

In practice this is usually better when:

- you care about `threshold`
- you want behavior based on real element size

### Important Constraint

Child mode requires exactly one top-level child.

If you pass multiple children, it will not work correctly.

### Custom Components

This is where people usually get stuck.

If you pass a custom component, the ref from `AtomTrigger` still has to reach a DOM node.

Otherwise, even though it renders correctly, `AtomTrigger` cannot access the actual element it
needs to measure. Then it just looks like "nothing works".

Rule of thumb:

- If something does not trigger, check where the ref ends up first.

`AtomTrigger` needs a real DOM node to measure. Intrinsic elements such as `<div>`, `<section>` and `<article>` work automatically.

Example:

```tsx
<AtomTrigger threshold={0.5}>
  <section>
    <h2>Pricing</h2>
    <p>...</p>
  </section>
</AtomTrigger>
```

A custom component works in child mode only if it passes the received ref down to a DOM element.

For React 18 and older, that usually means `React.forwardRef`.

For React 19, a plain function component can also work if it accepts `ref` as a prop and passes it
through.

Good:

```tsx
const Card = React.forwardRef<HTMLDivElement, { children: React.ReactNode }>(function Card(
  { children },
  ref,
) {
  return <div ref={ref}>{children}</div>;
});

function Example() {
  return (
    <AtomTrigger threshold={0.5}>
      <Card>Mario World</Card>
    </AtomTrigger>
  );
}
```

Also good in React 19:

```tsx
function Card({ children, ref }: { children: React.ReactNode; ref?: React.Ref<HTMLDivElement> }) {
  return <div ref={ref}>{children}</div>;
}

function Example() {
  return (
    <AtomTrigger threshold={0.5}>
      <Card>Mario World</Card>
    </AtomTrigger>
  );
}
```

Not enough:

```tsx
function Card({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}

function Example() {
  return (
    <AtomTrigger threshold={0.5}>
      <Card>Mario World</Card>
    </AtomTrigger>
  );
}
```

The second example still renders a `<div>`, but `AtomTrigger` cannot reach that DOM node directly
because the component never passes the received ref through.

The simplest workaround is often to wrap the custom component in a plain DOM element and observe that wrapper instead:

```tsx
function Example() {
  return (
    <AtomTrigger threshold={0.5}>
      <div>
        <Card>Mario World</Card>
      </div>
    </AtomTrigger>
  );
}
```

If a custom child temporarily renders `null` or a placeholder before the DOM node exists,
`AtomTrigger` delays the missing-ref warning a bit so that normal async mount flows can settle first.

## Props

```tsx
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

### `onEnter`

This fires when the trigger goes from outside to inside the visible area.

In practice this means:

> Something entered the view.

Typical use cases:

- start animation
- lazy load something
- trigger logic

### `onLeave`

Fires when something leaves the visible area.

Typical use cases:

- stop animation
- pause something
- cleanup

### `onEvent`

Fires for both `enter` and `leave`.

Sometimes it is easier to use one handler and branch on:

```tsx
event.type;
```

### `once`

Allows only the first transition.

After that it stops reacting.

This is useful when:

- you only need something once
- you do not want to track state yourself

### `oncePerDirection`

Allows:

- one `enter`
- one `leave`

This is usually more predictable than `once`, because you still get both directions.

### `fireOnInitialVisible`

This one usually causes confusion the first time.

Normally:

- if the element is already visible when the page loads, nothing fires

That is because technically nothing "entered".

#### What This Prop Does

If you enable it, it will fire an `enter` event immediately if the element is already visible.

But this is not a real transition, so the event contains:

```tsx
event.isInitial === true;
```

Example:

```tsx
import React from 'react';
import { AtomTrigger } from 'react-atom-trigger';

export function RestoredStateExample() {
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

Important detail:

- This counts as an `enter`.
- It can consume `once`.
- It can consume `oncePerDirection`.

If something fires "too early", this is often the reason.

### `disabled`

Disables observation.

It does not unmount anything. It just stops reactions.

### `threshold`

Number between `0` and `1`.

Controls when `enter` fires.

- `0` means any visibility
- `0.5` means half visible
- `1` means fully visible

Important detail:

- `threshold` only affects `enter`

`leave` is simpler:

- after `enter`, `leave` fires when the element is fully out of view

Full behavior example with `threshold={1}`:

1. Element is outside: no event
2. Element is partially visible: still no `enter`
3. Element is fully visible: `enter` fires
4. Element starts leaving: still no `leave`
5. Element is fully out: `leave` fires

Another important detail:

- `threshold` is calculated against the effective root
- `rootMargin` affects that effective root

So if something feels off, check both together.

#### Sentinel vs Child Mode

In sentinel mode, `threshold` is usually not very meaningful because the sentinel is basically a point.

So in practice:

- `threshold` is mostly useful in child mode, unless you give the sentinel some real width and height via `className`

### `root`

Defines what "visible area" means.

Default is the viewport.

If you pass a container, it uses that container instead.

Think of `root` as:

> What counts as visible.

Example:

```tsx
function Example({ containerElement }: { containerElement: HTMLDivElement | null }) {
  return (
    <AtomTrigger
      root={containerElement}
      onEnter={() => {
        console.log('entered container viewport');
      }}
    />
  );
}
```

If you pass `root` explicitly but it is currently `null`, observation pauses until that real root
exists. It does not silently switch back to the viewport.

### `rootRef`

Same as `root`, but React-friendly.

If both exist, `rootRef` wins.

Example:

```tsx
import React from 'react';
import { AtomTrigger } from 'react-atom-trigger';

export function ScrollBox() {
  const containerRef = React.useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} style={{ height: 320, overflowY: 'auto' }}>
      <div style={{ height: 600 }} />
      <AtomTrigger
        rootRef={containerRef}
        onEnter={() => {
          console.log('entered scroll box');
        }}
      />
      <div style={{ height: 600 }} />
    </div>
  );
}
```

If `rootRef.current` is still `null`, observation pauses until the ref resolves to a real DOM
element.

Rule of thumb:

- no `root`: viewport
- `rootRef`: JSX container
- `root`: external DOM node
- unresolved explicit `root` / `rootRef`: paused observation, not viewport fallback

### `rootMargin`

This shifts the boundaries of the root.

Important:

- You are not moving the element.
- You are moving the trigger zone.

Example:

```tsx
// Top margin only
<AtomTrigger rootMargin="-100px 0px 0px 0px" />

// Top + bottom
<AtomTrigger rootMargin="-100px 0px -80px 0px" />

// Array version
<AtomTrigger rootMargin={[-100, 0, -80, 0]} />
```

Practical advice:

- use `rootMargin` for pixel adjustments
- use `threshold` for proportions

Important implementation detail:

- `rootMargin` is handled by the library itself
- `IntersectionObserver` is only used to wake things up when nearby layout changes happen

That is why behavior is consistent and not dependent on browser quirks.

Design note:

- very large margins far outside the root are not the main use case
- geometry stays correct, but layout-shift-only updates may not trigger until things are closer

### `className`

Applies only to the sentinel.

In child mode, style the child instead.

## Event Payload

```tsx
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

### `isInitial`

`true` only when the event comes from `fireOnInitialVisible`.

Otherwise it is always `false`.

### `movementDirection`

Tells how things are moving.

Usually:

- `up`
- `down`
- `left`
- `right`

- `stationary` if an event fired even though the element itself did not really move, which usually means the visible area changed around it
- `unknown` if there is not enough previous geometry yet to tell a direction, which most commonly happens on an initial event from `fireOnInitialVisible`

### `position`

Where the element is relative to the root.

Useful if you want more control than just `enter` and `leave`.

### `counts`

Tracks how many times `enter` and `leave` happened.

## Final Notes

If something behaves differently than expected, check these first:

- `threshold`
- `rootMargin`
- child mode vs sentinel mode

In practice, most issues come from those three.

If something still feels weird after that, it is usually timing near boundaries and that is expected to be slightly different from older approaches.
