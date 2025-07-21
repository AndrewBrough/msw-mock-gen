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
          excludePatterns: ["to: "],
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
      /**
       * This is the default exclude patterns, but you can override them by adding them to the excludePatterns array in the config.
       * Both will not work, you need to use one or the other.
       */
      excludePatterns: [
        // Other common patterns
        // 'to: "/',
        // 'href: "/',
        // 'pathname: "/',
        // 'redirect: "/',
        // 'location: "/',
      ],
      formatScript: "lint:fix",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any,
  ],
});
