import { afterEach, describe, expect, it, vi } from 'vitest';
import { __resetWarningsForTests, warnOnce } from './AtomTrigger.warnings';

afterEach(() => {
  __resetWarningsForTests();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('AtomTrigger warnings', () => {
  it('stays silent when process.env is unavailable', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    vi.stubGlobal('process', {} as NodeJS.Process);
    warnOnce('[react-atom-trigger] test warning');

    expect(warn).not.toHaveBeenCalled();
  });
});
