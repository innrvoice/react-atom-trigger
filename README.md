# react-atom-trigger

Simple react-waypoint alternative.

[More detailed overview](https://innrvoice.medium.com/solving-scroll-into-view-problem-in-react-my-way-a8056a1bdc11) is available as Medium story.

## Basic features


Exposes `<AtomTrigger {...props} />` component, where `props` are:

```
interface IAtomTriggerProps {
  scrollEvent: ScrollEvent;
  dimensions: Dimensions | null;
  behavior?: 'default' | 'enter' | 'leave';
  callback: () => void | Promise<void>;
  getDebugInfo?: (data: DebugInfo) => void;
  triggerOnce?: boolean;
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
type ScrollEvent = { 
    scrollX: number; 
    scrollY: number;
};
```

## Utility hooks
For someone who wants everything out-of-the-box, `useWindowDimensions`, `useWindowScroll` and `useContainerScroll` hooks are also available for import.

## Examples
It is sometimes better to tweak and see for yourself. You can play with [CodeSandbox examples](https://codesandbox.io/dashboard/all/react-atom-trigger).





