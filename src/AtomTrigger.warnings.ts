const devWarnings = new Set<string>();

export const upgradeBehaviorWarning =
  '[react-atom-trigger] v2 uses a new internal observation engine. If you upgraded from v1.x, verify trigger behavior for timing, threshold and rootMargin.';

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
