import { codecovRollupPlugin } from '@codecov/rollup-plugin';
import { defineConfig } from 'tsdown';

const codecovToken = process.env.CODECOV_TOKEN;
const enableBundleAnalysis = process.env.CI === 'true' && Boolean(codecovToken);

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
  deps: {
    neverBundle: ['react'],
  },
  plugins: codecovRollupPlugin({
    enableBundleAnalysis,
    bundleName: 'react-atom-trigger',
    uploadToken: codecovToken,
  }),
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
  },
});
