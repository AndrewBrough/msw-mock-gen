import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import mswMockGen from '../dist/index.js';

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    mswMockGen({
      watchFolder: 'src/data',
      outputFolder: 'src/data/mocks',
      outputFileName: 'mswHandlers.generated',
      excludePatterns: [
        // Navigation patterns
        'navigate({',
        // Other common non-API URL patterns
        'href: "/',
        'pathname: "/',
        'redirect: "/',
        'location: "/'
      ]
    }) as any
  ]
}); 