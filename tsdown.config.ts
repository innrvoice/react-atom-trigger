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
        js: '.es.js',
        dts: '.d.ts',
      };
    }

    return {
      js: '.js',
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
        entryFileNames: '[name].js',
        chunkFileNames: '[name]-chunk.js',
      };
    }

    return {
      ...options,
      globals,
    };
  },
});
