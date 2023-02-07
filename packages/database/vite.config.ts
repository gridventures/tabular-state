import { defineConfig } from 'vite';

import dts from 'vite-plugin-dts';

import { resolve } from 'path';

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
      name: 'createIndexedDbAdapter',
      // the proper extensions will be added
      fileName: 'index',
      formats: ['es', 'cjs', 'umd'],
    },
    rollupOptions: {
      external: ['idb-keyval'],
      output: {
        globals: {
          'idb-keyval': 'idbKeyval',
        },
      },
    },
  },
});
