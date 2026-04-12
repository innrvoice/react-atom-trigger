import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  __isDevelopmentRuntimeForTests,
  __resetWarningsForTests,
  warnOnce,
} from './AtomTrigger.warnings';

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

    vi.stubGlobal('process', {} as NodeJS.Process);
    warnOnce('[react-atom-trigger] test warning');

    expect(warn).toHaveBeenCalledWith('[react-atom-trigger] test warning');
  });
});
