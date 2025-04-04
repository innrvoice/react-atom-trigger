# react-atom-trigger

AtomTrigger helps solve the problem of executing code when some element "scrolls into (or out of) view". A pretty simple "[react-waypoint](https://www.npmjs.com/package/react-waypoint)" alternative written in Typescript.

## Basic features


Exposes `<AtomTrigger {...props} />` component, where `props` are:

```
interface IAtomTriggerProps {
  scrollEvent: ScrollEvent;
  dimensions: Dimensions;
  behavior?: 'default' | 'enter' | 'leave';
  callback: () => unknown;
  getDebugInfo?: (data: DebugInfo) => void;
  triggerOnce?: boolean;
  className?: string;
  offset?: [number, number, number, number];
}
```

In order to "work" `AtomTrigger` needs callback, dimensions and simple scroll event data provided.

### Callback

The function to be executed when AtomTrigger enters or leaves some container.

```
callback: () => unknown;
```


### Dimensions

Dimensions of the main "container" (window in many cases). 

```
type Dimensions = {
  width: number;
  height: number;
};
```

So if you have some logic of calculating container size and container resize handling, just provide needed data to AtomTrigger.

### Scroll Event
 
To trigger "events" `AtomTrigger` needs some kind of simple scroll event provided.

```
type ScrollEvent = { 
    scrollX: number; 
    scrollY: number;
};
```

So, if you already have some scroll event listener, just provide it to AtomTrigger.

## Utility hooks
For someone who wants everything out-of-the-box, `useWindowDimensions`, `useWindowScroll` and `useContainerScroll` hooks are also available for import.

## Examples
It is sometimes better to tweak and see for yourself: [CodeSandbox examples](https://codesandbox.io/examples/package/react-atom-trigger).

 [**More detailed react-atom-trigger overview with examples**](https://visiofutura.com/solving-scroll-into-view-problem-in-react-my-way-a8056a1bdc11)





