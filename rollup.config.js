import typescript from 'rollup-plugin-typescript2';
import resolve from '@rollup/plugin-node-resolve';
import commonJS from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import pkg from './package.json';

export default {
  input: './src/index.ts',

  output: [
    {
      format: 'es',
      file: pkg.module,
      sourcemap: true,
      globals: {
        react: 'React',
      },
    },
    {
      format: 'umd',
      file: pkg.main,
      name: pkg.name,
      sourcemap: true,
      globals: {
        react: 'React',
      },
    },
  ],

  plugins: [
    resolve(),
    commonJS({
      include: 'node_modules/**',
    }),
    typescript(),
    terser(),
  ],
  external: ['react'],
};
