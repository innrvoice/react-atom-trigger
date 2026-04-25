import type { OutputOptions } from 'rolldown';
import { defineConfig, type UserConfig } from 'tsdown';

const baseConfig = {
  entry: './src/index.ts',
  outDir: 'lib',
  minify: true,
  clean: true,
  hash: false,
  platform: 'browser',
  target: 'es2020',
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  deps: {
    neverBundle: ['react'],
  },
} satisfies UserConfig;

function getOutExtensions(format: string): { js: string; dts?: string } {
  if (format === 'es') {
    return {
      js: '.js',
      dts: '.d.ts',
    };
  }

  return {
    js: '.umd.js',
  };
}

function withReactGlobals(options: OutputOptions, format: string): OutputOptions {
  const globals = {
    ...options.globals,
    react: 'React',
  };

  if (format === 'umd') {
    return {
      ...options,
      name: 'reactAtomTrigger',
      globals,
      entryFileNames: '[name].umd.js',
      chunkFileNames: '[name]-chunk.umd.js',
    };
  }

  return {
    ...options,
    globals,
  };
}

export default defineConfig([
  {
    ...baseConfig,
    format: 'esm',
    dts: true,
    clean: true,
    outExtensions: ({ format }) => getOutExtensions(format),
    outputOptions: (options, format) => withReactGlobals(options, format),
  },
  {
    ...baseConfig,
    format: 'umd',
    dts: false,
    clean: false,
    define: {
      'process.env.NODE_ENV': '"production"',
      'import.meta': '{}',
    },
    outExtensions: ({ format }) => getOutExtensions(format),
    outputOptions: (options, format) => withReactGlobals(options, format),
  },
]);
