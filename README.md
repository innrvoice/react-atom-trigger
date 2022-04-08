![react-atom-trigger](/assets/atom-trigger.svg)

# react-atom-trigger

Simple react-waypoint alternative

## Basic features


Exposes `<AtomTrigger {...props} />` component, where `props` are:

```
interface IAtomTriggerProps {
  scrollEvent: SimpleScrollEvent;
  dimensions: Dimensions | null;
  behavior?: 'default' | 'enter' | 'leave';
  callback: () => void | Promise<void>;
  getDebugInfo?: (data: DebugInfo) => void;
  triggerOnce?: boolean;
  name?: string;
  className?: string;
  offset?: [number, number, number, number];
}
```

In order to work `AtomTrigger` needs dimensions and some kind of scroll event provided.

### Dimensions

Dimensions of the main content "container" (window in many cases). 

```
type Dimensions = {
  width: number;
  height: number;
};
```

### Scroll Event
 
To trigger "events" `AtomTrigger` needs some kind of simple scroll event provided.

```
type SimpleScrollEvent = { 
    scrollX: number; 
    scrollY: number 
};
```

## Usage

If you do not already have logic for getting/updating needed container dimensions or handling scroll, you can use simple `useWindowDimensions` and `useContainerScroll` hooks, which are also available to import.

## Examples

You can play with the examples: https://codesandbox.io/dashboard/all/react-atom-trigger



