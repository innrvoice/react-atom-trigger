import React from 'react';
import { act, render } from '@testing-library/react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

async function mockReactWithoutUseSyncExternalStore() {
  vi.resetModules();
  vi.doMock('react', async () => {
    const actual = await vi.importActual<typeof import('react')>('react');

    return {
      ...actual,
      default: {
        ...actual,
        useSyncExternalStore: undefined,
      },
      useSyncExternalStore: undefined,
    };
  });
}

async function importFallbackModule() {
  await mockReactWithoutUseSyncExternalStore();
  return import('./utils.syncExternalStore');
}

async function importFallbackUtilsModule() {
  await mockReactWithoutUseSyncExternalStore();
  return import('./utils');
}

async function renderToStringWithoutWindow(element: React.ReactElement): Promise<string> {
  const previousWindow = globalThis.window;
  const previousDocument = globalThis.document;
  const previousNavigator = globalThis.navigator;
  const previousHTMLElement = globalThis.HTMLElement;
  const previousElement = globalThis.Element;
  const previousNode = globalThis.Node;
  const previousDOMRect = globalThis.DOMRect;

  vi.stubGlobal('window', undefined);
  vi.stubGlobal('document', undefined);
  vi.stubGlobal('navigator', undefined);
  vi.stubGlobal('HTMLElement', undefined);
  vi.stubGlobal('Element', undefined);
  vi.stubGlobal('Node', undefined);
  vi.stubGlobal('DOMRect', undefined);

  try {
    return renderToString(element);
  } finally {
    vi.stubGlobal('window', previousWindow);
    vi.stubGlobal('document', previousDocument);
    vi.stubGlobal('navigator', previousNavigator);
    vi.stubGlobal('HTMLElement', previousHTMLElement);
    vi.stubGlobal('Element', previousElement);
    vi.stubGlobal('Node', previousNode);
    vi.stubGlobal('DOMRect', previousDOMRect);
  }
}

function getHydrationMismatchCalls(errorSpy: ReturnType<typeof vi.spyOn>) {
  return errorSpy.mock.calls.filter((call: unknown[]) => {
    const [message] = call;
    const text = String(message);
    return text.includes('Hydration failed because') || text.includes("didn't match");
  });
}

function setWindowScroll(left: number, top: number): void {
  Object.defineProperty(window, 'scrollX', {
    configurable: true,
    value: left,
    writable: true,
  });
  Object.defineProperty(window, 'scrollY', {
    configurable: true,
    value: top,
    writable: true,
  });
}

function setWindowSize(width: number, height: number): void {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    value: width,
    writable: true,
  });
  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    value: height,
    writable: true,
  });
}

afterEach(() => {
  vi.doUnmock('react');
  vi.resetModules();
  vi.unstubAllGlobals();
});

describe('sync external store compat helpers', () => {
  it('falls back to an effect-driven subscription when React.useSyncExternalStore is unavailable', async () => {
    const { useCompatSyncExternalStore } = await importFallbackModule();
    const unsubscribe = vi.fn();
    let currentValue = 1;
    let notifyStoreChange: (() => void) | undefined;

    function Harness() {
      const subscribe = React.useCallback((onStoreChange: () => void) => {
        notifyStoreChange = onStoreChange;
        return unsubscribe;
      }, []);
      const getSnapshot = React.useCallback(() => currentValue, []);
      const getServerSnapshot = React.useCallback(() => 0, []);
      const value = useCompatSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

      return <output data-testid="compat-snapshot">{value}</output>;
    }

    const view = render(<Harness />);

    expect(view.getByTestId('compat-snapshot').textContent).toBe('1');

    act(() => {
      currentValue = 2;
      notifyStoreChange?.();
    });

    expect(view.getByTestId('compat-snapshot').textContent).toBe('2');

    view.unmount();

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it('uses the server snapshot in the fallback path when window is unavailable', async () => {
    const { useCompatSyncExternalStore } = await importFallbackModule();

    vi.stubGlobal('window', undefined);
    vi.stubGlobal('document', undefined);
    vi.stubGlobal('navigator', undefined);
    vi.stubGlobal('HTMLElement', undefined);
    vi.stubGlobal('Element', undefined);
    vi.stubGlobal('Node', undefined);
    vi.stubGlobal('DOMRect', undefined);

    function Harness() {
      const subscribe = React.useCallback(() => () => {}, []);
      const getSnapshot = React.useCallback(() => 1, []);
      const getServerSnapshot = React.useCallback(() => 0, []);
      const value = useCompatSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

      return <output>{value}</output>;
    }

    expect(renderToString(<Harness />)).toContain('0');
  });

  it('uses the server snapshot for the first hydrated client render before refreshing live data', async () => {
    const { useCompatSyncExternalStore } = await importFallbackModule();
    const unsubscribe = vi.fn();
    let currentValue = 7;

    function Harness() {
      const subscribe = React.useCallback(() => unsubscribe, []);
      const getSnapshot = React.useCallback(() => currentValue, []);
      const getServerSnapshot = React.useCallback(() => 0, []);
      const value = useCompatSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

      return <output>{value}</output>;
    }

    const serverMarkup = await renderToStringWithoutWindow(<Harness />);
    const container = document.createElement('div');
    document.body.appendChild(container);
    container.innerHTML = serverMarkup;
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const root = hydrateRoot(container, <Harness />);

    expect(container.innerHTML).toBe(serverMarkup);

    await act(async () => {
      await Promise.resolve();
    });

    expect(container.textContent).toBe('7');
    expect(error).not.toHaveBeenCalled();

    root.unmount();
    container.remove();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it('hydrates useScrollPosition in the fallback path without a server/client mismatch', async () => {
    const { useScrollPosition } = await importFallbackUtilsModule();

    function Harness() {
      const position = useScrollPosition();
      return (
        <output>
          {position.x},{position.y}
        </output>
      );
    }

    const serverMarkup = await renderToStringWithoutWindow(<Harness />);
    const container = document.createElement('div');
    document.body.appendChild(container);
    container.innerHTML = serverMarkup;
    setWindowScroll(12, 34);
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const root = hydrateRoot(container, <Harness />);

    expect(container.innerHTML).toBe(serverMarkup);

    await act(async () => {
      await Promise.resolve();
    });

    expect(container.textContent).toBe('12,34');
    expect(getHydrationMismatchCalls(error)).toHaveLength(0);

    root.unmount();
    container.remove();
  });

  it('hydrates useViewportSize in the fallback path without a server/client mismatch', async () => {
    const { useViewportSize } = await importFallbackUtilsModule();

    function Harness() {
      const size = useViewportSize();
      return (
        <output>
          {size.width},{size.height}
        </output>
      );
    }

    const serverMarkup = await renderToStringWithoutWindow(<Harness />);
    const container = document.createElement('div');
    document.body.appendChild(container);
    container.innerHTML = serverMarkup;
    setWindowSize(1440, 900);
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const root = hydrateRoot(container, <Harness />);

    expect(container.innerHTML).toBe(serverMarkup);

    await act(async () => {
      await Promise.resolve();
    });

    expect(container.textContent).toBe('1440,900');
    expect(getHydrationMismatchCalls(error)).toHaveLength(0);

    root.unmount();
    container.remove();
  });

  it('reuses the previous snapshot object when the next value is equal', async () => {
    const { getStableSnapshot } = await import('./utils.syncExternalStore');
    const firstValue = { width: 10, height: 20 };
    const ref = { current: firstValue };

    const equalValue = getStableSnapshot(
      ref,
      { width: 10, height: 20 },
      (current, next) => current.width === next.width && current.height === next.height,
    );

    expect(equalValue).toBe(firstValue);

    const nextValue = getStableSnapshot(
      ref,
      { width: 20, height: 30 },
      (current, next) => current.width === next.width && current.height === next.height,
    );

    expect(nextValue).toEqual({ width: 20, height: 30 });
    expect(ref.current).toBe(nextValue);
  });
});
