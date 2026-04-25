const devWarnings = new Set<string>();
export type AtomTriggerWarning =
  | 'invalidChildCount'
  | 'invalidChildElement'
  | 'unsupportedChildRef'
  | 'fragmentChild'
  | 'nonDomChildRef'
  | 'childModeClassName'
  | 'conflictingOnceModes'
  | 'invalidRoot'
  | 'invalidRootRef';

export const invalidChildCountWarning = 'invalidChildCount' satisfies AtomTriggerWarning;

export const invalidChildElementWarning = 'invalidChildElement' satisfies AtomTriggerWarning;

export const unsupportedChildRefWarning = 'unsupportedChildRef' satisfies AtomTriggerWarning;

export const fragmentChildWarning = 'fragmentChild' satisfies AtomTriggerWarning;

export const nonDomChildRefWarning = 'nonDomChildRef' satisfies AtomTriggerWarning;

export const childModeClassNameWarning = 'childModeClassName' satisfies AtomTriggerWarning;

export const conflictingOnceModesWarning = 'conflictingOnceModes' satisfies AtomTriggerWarning;

export const invalidRootWarning = 'invalidRoot' satisfies AtomTriggerWarning;

export const invalidRootRefWarning = 'invalidRootRef' satisfies AtomTriggerWarning;

export function getWarningMessage(warning: AtomTriggerWarning): string {
  switch (warning) {
    case 'invalidChildCount':
      return '[react-atom-trigger] Child mode expects exactly one top-level React element. Observation is disabled for this render.';
    case 'invalidChildElement':
      return '[react-atom-trigger] Child mode expects a React element child. Observation is disabled for this render.';
    case 'unsupportedChildRef':
      return '[react-atom-trigger] Child mode expects a DOM element or a component that forwards its ref to a DOM element. Observation is disabled for this render.';
    case 'fragmentChild':
      return '[react-atom-trigger] Child mode does not support React.Fragment. Wrap the content in a single DOM element. Observation is disabled for this render.';
    case 'nonDomChildRef':
      return '[react-atom-trigger] Child mode requires the child ref to resolve to a DOM element. Observation is disabled for this render.';
    case 'childModeClassName':
      return '[react-atom-trigger] `className` only applies to the internal sentinel. In child mode, style the child element directly.';
    case 'conflictingOnceModes':
      return '[react-atom-trigger] `once` and `oncePerDirection` were both provided. `once` takes precedence.';
    case 'invalidRoot':
      return '[react-atom-trigger] `root` must be a real DOM element when provided. Observation is paused until it is.';
    case 'invalidRootRef':
      return '[react-atom-trigger] `rootRef.current` must resolve to a real DOM element. Observation is paused until it does.';
  }
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

export function __isDevelopmentRuntimeForTests(overrides?: {
  nodeEnv?: 'development' | 'production' | null;
}): boolean {
  const hasNodeEnvOverride = Object.prototype.hasOwnProperty.call(overrides ?? {}, 'nodeEnv');
  const nodeEnv = hasNodeEnvOverride ? (overrides?.nodeEnv ?? null) : getKnownNodeEnv();
  return nodeEnv === 'development';
}

export function warnOnce(message: string): void {
  if (getKnownNodeEnv() !== 'development') {
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
