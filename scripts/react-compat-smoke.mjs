import { JSDOM } from 'jsdom';
import React from 'react';
import * as ReactDOM from 'react-dom';

let ReactDOMClient = null;

try {
  ReactDOMClient = await import('react-dom/client');
} catch {
  ReactDOMClient = null;
}

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  pretendToBeVisual: true,
  url: 'http://localhost/',
});

for (const [key, value] of Object.entries({
  window: dom.window,
  document: dom.window.document,
  navigator: dom.window.navigator,
  HTMLElement: dom.window.HTMLElement,
  Element: dom.window.Element,
  Node: dom.window.Node,
  DOMRect: dom.window.DOMRect,
})) {
  Object.defineProperty(globalThis, key, {
    configurable: true,
    value,
    writable: true,
  });
}

globalThis.requestAnimationFrame = callback => {
  callback(Date.now());
  return 1;
};
globalThis.cancelAnimationFrame = () => {};
globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
globalThis.IntersectionObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const packageImport = process.env.REACT_ATOM_TRIGGER_IMPORT ?? '../lib/index.js';
const { AtomTrigger } = await import(packageImport);

async function createRenderer(container) {
  if (ReactDOMClient && typeof ReactDOMClient.createRoot === 'function') {
    const root = ReactDOMClient.createRoot(container);

    const render = element => {
      if (typeof ReactDOM.flushSync === 'function') {
        ReactDOM.flushSync(() => {
          root.render(element);
        });
        return;
      }

      root.render(element);
    };

    return {
      render,
      unmount: async () => {
        root.unmount();
      },
    };
  }

  return {
    render: element => {
      ReactDOM.render(element, container);
    },
    unmount: async () => {
      ReactDOM.unmountComponentAtNode(container);
    },
  };
}

async function render(element, container) {
  const renderer = await createRenderer(container);
  renderer.render(element);
  return renderer;
}

function waitForTick() {
  return new Promise(resolve => setTimeout(resolve, 0));
}

async function waitForValue(read, label) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const value = read();
    if (value) {
      return value;
    }

    await waitForTick();
  }

  throw new Error(`Timed out while waiting for ${label}.`);
}

async function runAtomTriggerSmoke() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const renderer = await render(
    React.createElement(AtomTrigger, {
      className: 'compat-sentinel',
    }),
    container,
  );
  const sentinel = await waitForValue(
    () => container.querySelector('.compat-sentinel'),
    'compat sentinel',
  );

  if (!(sentinel instanceof HTMLElement)) {
    throw new Error('AtomTrigger sentinel smoke did not render as expected.');
  }

  await renderer.unmount();
  container.remove();
}

async function runChildModeSmoke() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const childRef = React.createRef();

  const ForwardedChild = React.forwardRef(function ForwardedChild(_, ref) {
    return React.createElement('section', { ref, className: 'compat-child' }, 'child');
  });

  const renderer = await render(
    React.createElement(
      AtomTrigger,
      {},
      React.createElement(ForwardedChild, {
        ref: childRef,
      }),
    ),
    container,
  );
  await waitForTick();

  const child = container.querySelector('.compat-child');

  if (!(child instanceof HTMLElement)) {
    throw new Error('Child mode smoke failed to render the forwarded child.');
  }

  if (!(childRef.current instanceof HTMLElement)) {
    throw new Error('Child mode smoke did not preserve the user ref.');
  }

  await renderer.unmount();
  container.remove();
}

await runAtomTriggerSmoke();
await runChildModeSmoke();
