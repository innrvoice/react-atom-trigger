const mod = await import('../lib/index.js');

for (const exportName of ['AtomTrigger', 'useScrollPosition', 'useViewportSize']) {
  if (!(exportName in mod)) {
    throw new Error(`Missing expected export: ${exportName}`);
  }
}
