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

const { AtomTrigger, useScrollPosition, useViewportSize } = await import('../lib/index.js');

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

async function runHooksSmoke() {
  const container = document.createElement('div');
  document.body.appendChild(container);

  function HooksHarness({ enabled }) {
    const position = useScrollPosition({ throttleMs: 0, enabled });
    const viewport = useViewportSize({ throttleMs: 0, enabled });

    return React.createElement(
      'output',
      { id: 'hooks-output' },
      `${position.x},${position.y}|${viewport.width},${viewport.height}`,
    );
  }

  const renderer = await render(React.createElement(HooksHarness, { enabled: true }), container);
  await waitForTick();

  Object.defineProperty(window, 'scrollX', {
    configurable: true,
    value: 14,
    writable: true,
  });
  Object.defineProperty(window, 'scrollY', {
    configurable: true,
    value: 28,
    writable: true,
  });
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    value: 1440,
    writable: true,
  });
  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    value: 900,
    writable: true,
  });

  window.dispatchEvent(new window.Event('scroll'));
  window.dispatchEvent(new window.Event('resize'));
  await waitForTick();

  const output = container.querySelector('#hooks-output');
  if (!(output instanceof HTMLElement)) {
    throw new Error('Hooks smoke did not render output.');
  }

  if (output.textContent !== '14,28|1440,900') {
    throw new Error(`Hooks smoke failed, got "${output.textContent}".`);
  }

  renderer.render(React.createElement(HooksHarness, { enabled: false }));
  await waitForTick();

  Object.defineProperty(window, 'scrollX', {
    configurable: true,
    value: 18,
    writable: true,
  });
  Object.defineProperty(window, 'scrollY', {
    configurable: true,
    value: 32,
    writable: true,
  });
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    value: 1600,
    writable: true,
  });
  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    value: 960,
    writable: true,
  });

  window.dispatchEvent(new window.Event('scroll'));
  window.dispatchEvent(new window.Event('resize'));
  await waitForTick();

  if (output.textContent !== '14,28|1440,900') {
    throw new Error(`Hooks disabled smoke failed, got "${output.textContent}".`);
  }

  renderer.render(React.createElement(HooksHarness, { enabled: true }));
  await waitForTick();

  if (output.textContent !== '18,32|1600,960') {
    throw new Error(`Hooks re-enable smoke failed, got "${output.textContent}".`);
  }

  await renderer.unmount();
  container.remove();
}

await runAtomTriggerSmoke();
await runChildModeSmoke();
await runHooksSmoke();
