import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import mswMockGen from "../dist/index.js";

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    mswMockGen({
      configs: [
        {
          watchFolder: "src/data",
          outputFolder: "src/data/mocks",
          outputFileName: "mswHandlers.generated",
          excludePatterns: [
            // Navigation patterns
            "navigate({",
            // Other common non-API URL patterns
            'href: "/',
            'pathname: "/',
            'redirect: "/',
            'location: "/',
          ],
        },
        {
          watchFolder: "src/otherQueries",
          outputFolder: "src/otherQueries/mocks",
          outputFileName: "mswHandlers.generated",
          excludePatterns: [
            // Navigation patterns
            "navigate({",
            // Other common non-API URL patterns
            'href: "/',
            'pathname: "/',
            'redirect: "/',
            'location: "/',
          ],
        },
        // Example of additional configuration
        // {
        //   watchFolder: 'src/api',
        //   outputFolder: 'src/api/mocks',
        //   outputFileName: 'apiHandlers.generated',
        //   excludePatterns: []
        // }
      ],
      quiet: false,
      // Merge all handlers into a single output location (default: true)
      mergeHandlers: true,
      // Top-level output folder for merged handlers (default: "src/mocks")
      outputFolder: "src/mocks",
      // Top-level output file name for merged handlers (default: "mswHandlers.generated")
      outputFileName: "mswHandlers.generated",
    }) as any,
  ],
});
