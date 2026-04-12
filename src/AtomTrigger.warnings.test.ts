import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  __isDevelopmentRuntimeForTests,
  __resetWarningsForTests,
  warnOnce,
} from './AtomTrigger.warnings';

function stubProcess(processValue: Partial<Pick<NodeJS.Process, 'env'>>): void {
  vi.stubGlobal('process', processValue as unknown as NodeJS.Process);
}

afterEach(() => {
  __resetWarningsForTests();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('AtomTrigger warnings', () => {
  it('prefers an explicit node env override when deciding whether to warn', () => {
    expect(__isDevelopmentRuntimeForTests({ nodeEnv: 'development' })).toBe(true);
    expect(__isDevelopmentRuntimeForTests({ nodeEnv: 'production' })).toBe(false);
  });

  it('falls back to import meta env overrides when node env is unknown', () => {
    expect(__isDevelopmentRuntimeForTests({ nodeEnv: null, importMetaEnv: { DEV: true } })).toBe(
      true,
    );
    expect(__isDevelopmentRuntimeForTests({ nodeEnv: null, importMetaEnv: { DEV: false } })).toBe(
      false,
    );
    expect(
      __isDevelopmentRuntimeForTests({ nodeEnv: null, importMetaEnv: { MODE: 'development' } }),
    ).toBe(true);
    expect(
      __isDevelopmentRuntimeForTests({ nodeEnv: null, importMetaEnv: { MODE: 'production' } }),
    ).toBe(false);
    expect(__isDevelopmentRuntimeForTests({ nodeEnv: null, importMetaEnv: {} })).toBe(false);
    expect(__isDevelopmentRuntimeForTests({ nodeEnv: null, importMetaEnv: null })).toBe(false);
  });

  it('falls back to import.meta-driven development detection when process.env is unavailable', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    stubProcess({});
    warnOnce('[react-atom-trigger] test warning');

    expect(warn).toHaveBeenCalledWith('[react-atom-trigger] test warning');
  });

  it('stays silent outside development runtimes', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    stubProcess({
      env: {
        NODE_ENV: 'production',
      },
    });
    warnOnce('[react-atom-trigger] production warning');

    expect(warn).not.toHaveBeenCalled();
  });

  it('does not throw when console.warn is unavailable in development', () => {
    stubProcess({
      env: {
        NODE_ENV: 'development',
      },
    });

    const originalWarn = console.warn;
    Object.defineProperty(console, 'warn', {
      configurable: true,
      value: undefined,
    });

    expect(() => warnOnce('[react-atom-trigger] no-console-warn')).not.toThrow();

    Object.defineProperty(console, 'warn', {
      configurable: true,
      value: originalWarn,
    });
  });
});
