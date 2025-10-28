import resolve from '@rollup/plugin-node-resolve';
import sucrase from '@rollup/plugin-sucrase';

export default {
  input: 'src/index.ts',
  plugins: [
    resolve({
      extensions: ['.ts'],
      preferBuiltins: true,
      browser: false,
    }),
    sucrase({
      include: ['src/**'],
      transforms: ['typescript'],
    }),
  ],
  output: {
    file: 'dist/compactr.js',
    name: 'compactr',
    format: 'umd',
  },
};
