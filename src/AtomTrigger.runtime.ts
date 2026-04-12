export function isDomElementLike(value: unknown): value is Element {
  return Boolean(
    value &&
    typeof value === 'object' &&
    'nodeType' in value &&
    (value as { nodeType?: number }).nodeType === 1 &&
    'getBoundingClientRect' in value &&
    typeof (value as { getBoundingClientRect?: unknown }).getBoundingClientRect === 'function' &&
    'addEventListener' in value &&
    typeof (value as { addEventListener?: unknown }).addEventListener === 'function' &&
    'removeEventListener' in value &&
    typeof (value as { removeEventListener?: unknown }).removeEventListener === 'function',
  );
}

export function isWindowLike(value: unknown): value is Window {
  return Boolean(
    value &&
    typeof value === 'object' &&
    'window' in value &&
    (value as { window?: unknown }).window === value,
  );
}
