import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: './src/index.ts',
  format: ['esm', 'umd'],
  outDir: 'lib',
  dts: true,
  minify: true,
  clean: true,
  hash: false,
  platform: 'browser',
  target: 'es2020',
  globalName: 'reactAtomTrigger',
  deps: {
    neverBundle: ['react'],
  },
  outExtensions: ({ format }) => {
    if (format === 'es') {
      return {
        js: '.js',
        dts: '.d.ts',
      };
    }

    return {
      js: '.umd.js',
    };
  },
  outputOptions: (options, format) => {
    const globals = {
      ...options.globals,
      react: 'React',
    };

    if (format === 'umd') {
      return {
        ...options,
        globals,
        entryFileNames: '[name].umd.js',
        chunkFileNames: '[name]-chunk.umd.js',
      };
    }

    return {
      ...options,
      globals,
    };
  },
});
