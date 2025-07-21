import type { Plugin } from "vite";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { glob } from "glob";
import { MSWMockGenOptions, MSWMockGenConfig, ParsedURL } from "./types";
import { parseURLsFromFile, generateMSWHandlers } from "./parser";

export type { MSWMockGenOptions, MSWMockGenConfig } from "./types";

/**
 * MSW Mock Generator - A Vite plugin that automatically generates MSW (Mock Service Worker) handlers
 * from your API calls by watching specified folders and parsing TypeScript/JavaScript files for URL patterns.
 *
 * @param options - Configuration options for the plugin
 * @returns Vite plugin instance
 *
 * @example
 * ```typescript
 * // vite.config.ts
 * import { defineConfig } from 'vite';
 * import mswMockGen from 'msw-mock-gen';
 *
 * export default defineConfig({
 *   plugins: [
 *     mswMockGen({
 *       configs: [
 *         {
 *           watchFolder: 'src/data/queries',
 *           outputFolder: 'src/data/queries/mocks',
 *           outputFileName: 'mswHandlers.generated',
 *           excludePatterns: ['navigate({', 'to: "/']
 *         }
 *       ],
 *       quiet: true
 *     })
 *   ]
 * });
 * ```
 */
export default function mswMockGen(
  options: MSWMockGenOptions = { configs: [] },
): Plugin {
  const { configs = [], quiet = true } = options;

  // Default config if none provided
  const defaultConfig: MSWMockGenConfig = {
    watchFolder: "src/data/queries",
    outputFolder: "src/data/queries/mocks",
    outputFileName: "mswHandlers.generated",
    excludePatterns: [],
  };

  // Use default config if no configs provided, otherwise use provided configs
  const finalConfigs = configs.length === 0 ? [defaultConfig] : configs;

  let projectRoot: string;

  /**
   * Logs messages to console if quiet mode is disabled
   * @param args - Arguments to log
   */
  const log = (...args: string[]) => {
    if (!quiet) {
      console.log(...args);
    }
  };

  /**
   * Generates MSW handlers for a single configuration
   * @param root - Project root directory
   * @param config - Configuration for this watch/output folder pair
   */
  const generateHandlers = async (root: string, config: MSWMockGenConfig) => {
    const {
      watchFolder = "src/data/queries",
      outputFolder = "src/data/queries/mocks",
      outputFileName = "mswHandlers.generated",
      excludePatterns = [],
    } = config;

    const watchPath = join(root, watchFolder);
    const outputPath = join(root, outputFolder);

    if (!existsSync(watchPath)) {
      log(`MSW Mock Gen: Watch folder ${watchPath} does not exist`);
      return;
    }

    // Ensure output directory exists
    if (!existsSync(outputPath)) {
      try {
        mkdirSync(outputPath, { recursive: true });
      } catch {
        // Fallback for older Node.js versions that don't support recursive option
        const pathParts = outputPath.split('/');
        let currentPath = '';
        for (const part of pathParts) {
          if (part) {
            currentPath += '/' + part;
            if (!existsSync(currentPath)) {
              mkdirSync(currentPath);
            }
          }
        }
      }
    }

    // Find all TypeScript/JavaScript files in the watch folder
    const files = await glob("**/*.{ts,js,tsx,jsx}", {
      cwd: watchPath,
      absolute: true,
      ignore: [`**/${outputFolder}/**`],
    });

    const allUrls: ParsedURL[] = [];

    // Parse each file for URLs
    for (const file of files) {
      try {
        const content = readFileSync(file, "utf-8");
        const urls = parseURLsFromFile(content, file, excludePatterns);
        allUrls.push(...urls);
      } catch (error) {
        console.error(`MSW Mock Gen: Error reading file ${file}:`, error);
      }
    }

    // Generate MSW handlers
    const handlers = generateMSWHandlers(allUrls);

    try {
      // Write query handlers
      const queryHandlersFile = join(outputPath, "queryHandlers.generated.ts");
      writeFileSync(queryHandlersFile, handlers.queryHandlers, "utf-8");

      // Write mutation handlers
      const mutationHandlersFile = join(
        outputPath,
        "mutationHandlers.generated.ts",
      );
      writeFileSync(mutationHandlersFile, handlers.mutationHandlers, "utf-8");

      // Write index file
      const indexFile = join(outputPath, `${outputFileName}.ts`);
      writeFileSync(indexFile, handlers.indexFile, "utf-8");

      log(
        `MSW Mock Gen: Generated handlers at ${outputPath} with ${allUrls.length} endpoints`,
      );
    } catch (error) {
      console.error(`MSW Mock Gen: Error writing handlers files:`, error);
    }
  };

  /**
   * Generates MSW handlers for all configurations
   * @param root - Project root directory
   */
  const generateAllHandlers = async (root: string) => {
    for (const config of finalConfigs) {
      await generateHandlers(root, config);
    }
  };

  return {
    name: "msw-mock-gen",
    apply: "serve",

    configResolved(config) {
      projectRoot = config.root;
    },

    configureServer(server) {
      log(`MSW Mock Gen: Watching ${finalConfigs.length} configuration(s)`);

      for (const config of finalConfigs) {
        const {
          watchFolder = "src/data/queries",
          outputFolder = "src/data/queries/mocks",
        } = config;
        log(`MSW Mock Gen: Watching ${watchFolder} for changes`);
        log(`MSW Mock Gen: Output will be written to ${outputFolder}`);
      }

      // Generate initial handlers for all configs
      generateAllHandlers(projectRoot);

      // Watch for file changes and deletions for each config
      for (const config of finalConfigs) {
        const {
          watchFolder = "src/data/queries",
          outputFolder = "src/data/queries/mocks",
        } = config;
        const watchPath = join(projectRoot, watchFolder);

        if (existsSync(watchPath)) {
          server.watcher.add(watchPath);
          const handleFileEvent = (file: string) => {
            // Check if the changed file is within the watchFolder or its subdirectories
            const normalizedFile = file.replace(/\\/g, "/"); // Normalize path separators
            const normalizedWatchPath = watchPath.replace(/\\/g, "/");

            // Skip changes to the output folder to prevent infinite loops
            if (
              normalizedFile.startsWith(normalizedWatchPath) &&
              !normalizedFile.includes(outputFolder)
            ) {
              log(`MSW Mock Gen: File changed: ${file}`);
              generateHandlers(projectRoot, config);
            }
          };

          server.watcher.on("change", (file) => handleFileEvent(file));
          server.watcher.on("unlink", (file) => handleFileEvent(file));
          server.watcher.on("add", (file) => handleFileEvent(file));
        }
      }
    },

    buildStart() {
      log("MSW Mock Gen: Build started");
      generateAllHandlers(projectRoot);
    },
  };
}
