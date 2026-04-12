import { mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(dirname, '..');

const reactMatrix = [
  { label: 'react16', react: '16.14.0', reactDom: '16.14.0' },
  { label: 'react17', react: '17.0.2', reactDom: '17.0.2' },
  { label: 'react18', react: '18.3.1', reactDom: '18.3.1' },
  { label: 'react19', react: '19.2.4', reactDom: '19.2.4' },
];

const smokeSource = `
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

const { AtomTrigger, useScrollPosition, useViewportSize } = await import('react-atom-trigger');

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

  throw new Error(\`Timed out while waiting for \${label}.\`);
}

async function runAtomTriggerSmoke() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const renderer = await createRenderer(container);
  renderer.render(React.createElement(AtomTrigger, { className: 'compat-sentinel' }));
  const sentinel = await waitForValue(() => container.querySelector('.compat-sentinel'), 'compat sentinel');

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

  const renderer = await createRenderer(container);
  renderer.render(
    React.createElement(
      AtomTrigger,
      {},
      React.createElement(ForwardedChild, {
        ref: childRef,
      }),
    ),
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
      \`\${position.x},\${position.y}|\${viewport.width},\${viewport.height}\`,
    );
  }

  const renderer = await createRenderer(container);
  renderer.render(React.createElement(HooksHarness, { enabled: true }));
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
    throw new Error(\`Hooks smoke failed, got "\${output.textContent}".\`);
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
    throw new Error(\`Hooks disabled smoke failed, got "\${output.textContent}".\`);
  }

  renderer.render(React.createElement(HooksHarness, { enabled: true }));
  await waitForTick();

  if (output.textContent !== '18,32|1600,960') {
    throw new Error(\`Hooks re-enable smoke failed, got "\${output.textContent}".\`);
  }

  await renderer.unmount();
  container.remove();
}

await runAtomTriggerSmoke();
await runChildModeSmoke();
await runHooksSmoke();
`;

function runCommand(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    env: process.env,
  });

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed in ${cwd}`);
  }
}

runCommand('pnpm', ['build'], repoRoot);
const packDir = await mkdtemp(path.join(os.tmpdir(), 'react-atom-trigger-pack-'));
runCommand('npm', ['pack', '--pack-destination', packDir], repoRoot);
const [packageTarball] = await readdir(packDir);

if (!packageTarball) {
  throw new Error(`npm pack did not produce an archive in ${packDir}`);
}

const packageTarballPath = path.join(packDir, packageTarball);

try {
  for (const version of reactMatrix) {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), `react-atom-trigger-${version.label}-`));

    try {
      await writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify(
          {
            private: true,
            type: 'module',
            dependencies: {
              jsdom: '^29.0.1',
              react: version.react,
              'react-dom': version.reactDom,
              'react-atom-trigger': `file:${packageTarballPath}`,
            },
          },
          null,
          2,
        ),
      );
      await writeFile(path.join(tempDir, 'smoke.mjs'), smokeSource);

      runCommand('npm', ['install', '--no-package-lock'], tempDir);
      runCommand('node', ['smoke.mjs'], tempDir);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  }
} finally {
  await rm(packDir, { recursive: true, force: true });
}
