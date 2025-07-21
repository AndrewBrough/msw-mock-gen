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
        },
        {
          watchFolder: "src/otherQueries",
        },
      ],
      quiet: false,
      // Merge all handlers into a single output location (default: true)
      mergeHandlers: true,
      // Top-level output folder for merged handlers (default: "src/mocks")
      outputFolder: "src/mocks",
      // Top-level output file name for merged handlers (default: "mswHandlers.generated")
      outputFileName: "mswHandlers.generated",
      excludePatterns: [
        // Navigation patterns
        "navigate({",
        // Other common non-API URL patterns
        'href: "/',
        'pathname: "/',
        'redirect: "/',
        'location: "/',
        'to: "/',
      ],
    }) as any,
  ],
});
