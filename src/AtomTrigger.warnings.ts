const devWarnings = new Set<string>();
export const invalidChildCountWarning =
  '[react-atom-trigger] Child mode expects exactly one top-level React element. Observation is disabled for this render.';

export const invalidChildElementWarning =
  '[react-atom-trigger] Child mode expects a React element child. Observation is disabled for this render.';

export const unsupportedChildRefWarning =
  '[react-atom-trigger] Child mode expects a DOM element or a component that forwards its ref to a DOM element. Observation is disabled for this render.';

export const fragmentChildWarning =
  '[react-atom-trigger] Child mode does not support React.Fragment. Wrap the content in a single DOM element. Observation is disabled for this render.';

export const nonDomChildRefWarning =
  '[react-atom-trigger] Child mode requires the child ref to resolve to a DOM element. Observation is disabled for this render.';

export const childModeClassNameWarning =
  '[react-atom-trigger] `className` only applies to the internal sentinel. In child mode, style the child element directly.';

export const conflictingOnceModesWarning =
  '[react-atom-trigger] `once` and `oncePerDirection` were both provided. `once` takes precedence.';

export const invalidRootWarning =
  '[react-atom-trigger] `root` must be a real DOM element when provided. Observation is paused until it is.';

export const invalidRootRefWarning =
  '[react-atom-trigger] `rootRef.current` must resolve to a real DOM element. Observation is paused until it does.';

type ImportMetaEnvShape = {
  DEV?: boolean;
  MODE?: string;
};

function getImportMetaEnv(): ImportMetaEnvShape | null {
  return (import.meta as ImportMeta & { env?: ImportMetaEnvShape }).env ?? null;
}

function getKnownNodeEnv(): 'development' | 'production' | null {
  if (typeof process === 'undefined' || !process.env) {
    return null;
  }

  const nodeEnv = process.env.NODE_ENV;
  if (nodeEnv === 'development' || nodeEnv === 'production') {
    return nodeEnv;
  }

  return null;
}

function isDevelopmentRuntime(): boolean {
  return __isDevelopmentRuntimeForTests();
}

export function __isDevelopmentRuntimeForTests(overrides?: {
  nodeEnv?: 'development' | 'production' | null;
  importMetaEnv?: ImportMetaEnvShape | null;
}): boolean {
  const hasNodeEnvOverride = Object.prototype.hasOwnProperty.call(overrides ?? {}, 'nodeEnv');
  const nodeEnv = hasNodeEnvOverride ? (overrides?.nodeEnv ?? null) : getKnownNodeEnv();
  if (nodeEnv) {
    return nodeEnv === 'development';
  }

  const hasImportMetaEnvOverride = Object.prototype.hasOwnProperty.call(
    overrides ?? {},
    'importMetaEnv',
  );
  const importMetaEnv = hasImportMetaEnvOverride
    ? (overrides?.importMetaEnv ?? null)
    : getImportMetaEnv();
  if (!importMetaEnv) {
    return false;
  }

  if (typeof importMetaEnv.DEV === 'boolean') {
    return importMetaEnv.DEV;
  }

  if (typeof importMetaEnv.MODE === 'string') {
    return importMetaEnv.MODE !== 'production';
  }

  return false;
}

export function warnOnce(message: string): void {
  if (!isDevelopmentRuntime()) {
    return;
  }

  if (devWarnings.has(message)) {
    return;
  }

  devWarnings.add(message);
  if (typeof console !== 'undefined' && console.warn) {
    console.warn(message);
  }
}

export function __resetWarningsForTests(): void {
  devWarnings.clear();
}
