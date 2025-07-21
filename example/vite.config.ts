import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import mswMockGen from '../dist/index.js';

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    mswMockGen({
      configs: [
        {
          watchFolder: 'src/data/queries',
          outputFolder: 'src/data/queries/mocks',
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
        },
        // Example of additional configuration
        // {
        //   watchFolder: 'src/api',
        //   outputFolder: 'src/api/mocks',
        //   outputFileName: 'apiHandlers.generated',
        //   excludePatterns: []
        // }
      ],
      quiet: true
    }) as any
  ]
}); 