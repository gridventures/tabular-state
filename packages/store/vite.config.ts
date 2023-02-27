import { resolve } from 'path';

import dts from 'vite-plugin-dts';
import { defineConfig } from 'vitest/config'; // eslint-disable-line import/no-unresolved

export default defineConfig({
  plugins: [
    dts({
      outputDir: resolve(__dirname, 'lib', 'types'),
      insertTypesEntry: true,
    }),
  ],
  build: {
    outDir: resolve(__dirname, 'lib'),
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: resolve(__dirname, 'src', 'index.ts'),
      name: 'createStore',
      // the proper extensions will be added
      fileName: 'index',
      formats: ['es', 'cjs', 'umd'],
    },
    rollupOptions: {
      external: ['@legendapp/state', 'sift'],
      output: {
        globals: {
          '@legendapp/state': 'legendstate',
          'sift': 'sift',
        },
      },
    },
  },
  test: {},
});
