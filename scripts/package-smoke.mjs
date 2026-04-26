const mod = await import('../lib/index.js');

for (const exportName of ['AtomTrigger']) {
  if (!(exportName in mod)) {
    throw new Error(`Missing expected export: ${exportName}`);
  }
}

for (const exportName of ['useScrollPosition', 'useViewportSize']) {
  if (exportName in mod) {
    throw new Error(`Unexpected removed export: ${exportName}`);
  }
}
