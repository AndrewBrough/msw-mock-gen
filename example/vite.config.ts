import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import mswMockGen from '../dist/index.js';

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    mswMockGen({
      watchFolder: 'src/data',
      outputFolder: 'src/data/mocks'
    }) as any
  ]
}); 