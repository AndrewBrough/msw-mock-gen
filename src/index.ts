import type { Plugin } from "vite";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { glob } from "glob";
import { MSWMockGenOptions, MSWMockGenConfig, ParsedURL } from "./types";
import { parseURLsFromFile, generateMSWHandlers } from "./parser";
import { sterilize, cleanupSourceFiles } from "./sterilize";

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
 *       quiet: true,
 *       mergeHandlers: true,
 *       outputFolder: 'src/mocks',
 *       outputFileName: 'mswHandlers.generated'
 *     })
 *   ]
 * });
 * ```
 */
export default function mswMockGen(
  options: MSWMockGenOptions = { configs: [] }
): Plugin {
  const {
    configs = [],
    quiet = true,
    mergeHandlers = true,
    outputFolder: topLevelOutputFolder = "src/mocks",
    outputFileName: topLevelOutputFileName = "mswHandlers.generated",
  } = options;

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
   * Merges multiple handler files into a single output
   * @param root - Project root directory
   * @param configs - Array of configurations
   */
  const mergeAllHandlers = async (
    root: string,
    configs: MSWMockGenConfig[]
  ) => {
    if (!mergeHandlers || configs.length <= 1) {
      return;
    }

    const startTime = Date.now();
    log("MSW Mock Gen: Starting handler merging...");

    const topLevelOutputPath = join(root, topLevelOutputFolder);

    // Ensure top-level output directory exists
    if (!existsSync(topLevelOutputPath)) {
      try {
        mkdirSync(topLevelOutputPath, { recursive: true });
      } catch {
        // Fallback for older Node.js versions that don't support recursive option
        const pathParts = topLevelOutputPath.split("/");
        let currentPath = "";
        for (const part of pathParts) {
          if (part) {
            currentPath += "/" + part;
            if (!existsSync(currentPath)) {
              mkdirSync(currentPath);
            }
          }
        }
      }
    }

    const allQueryHandlers: string[] = [];
    const allMutationHandlers: string[] = [];

    // Collect handlers from all configs
    for (const config of configs) {
      const { outputFolder = "src/data/queries/mocks" } = config;

      const configOutputPath = join(root, outputFolder);

      // Check if the config's output files exist
      const queryHandlersFile = join(
        configOutputPath,
        "queryHandlers.generated.ts"
      );
      const mutationHandlersFile = join(
        configOutputPath,
        "mutationHandlers.generated.ts"
      );

      if (existsSync(queryHandlersFile)) {
        try {
          const content = readFileSync(queryHandlersFile, "utf-8");
          // Extract the actual handlers (skip import statements)
          const handlersMatch = content.match(
            /export const queryHandlers = \[([\s\S]*?)\];/
          );
          if (handlersMatch && handlersMatch[1].trim()) {
            allQueryHandlers.push(handlersMatch[1].trim());
          }
        } catch (error) {
          console.error(
            `MSW Mock Gen: Error reading query handlers from ${queryHandlersFile}:`,
            error
          );
        }
      }

      if (existsSync(mutationHandlersFile)) {
        try {
          const content = readFileSync(mutationHandlersFile, "utf-8");
          // Extract the actual handlers (skip import statements)
          const handlersMatch = content.match(
            /export const mutationHandlers = \[([\s\S]*?)\];/
          );
          if (handlersMatch && handlersMatch[1].trim()) {
            allMutationHandlers.push(handlersMatch[1].trim());
          }
        } catch (error) {
          console.error(
            `MSW Mock Gen: Error reading mutation handlers from ${mutationHandlersFile}:`,
            error
          );
        }
      }
    }

    // Generate merged files
    const mergedQueryHandlers =
      allQueryHandlers.length > 0
        ? `import { http, HttpResponse } from 'msw';

export const queryHandlers = [
${allQueryHandlers.join(",\n")}
];`
        : `export const queryHandlers = [];`;

    const mergedMutationHandlers =
      allMutationHandlers.length > 0
        ? `import { http, HttpResponse } from 'msw';

export const mutationHandlers = [
${allMutationHandlers.join(",\n")}
];`
        : `export const mutationHandlers = [];`;

    const mergedIndexFile = `import { queryHandlers } from './queryHandlers.generated';
import { mutationHandlers } from './mutationHandlers.generated';

export const handlers = [
  ...queryHandlers,
  ...mutationHandlers
];`;

    try {
      // Write merged query handlers
      const mergedQueryHandlersFile = join(
        topLevelOutputPath,
        "queryHandlers.generated.ts"
      );
      writeFileSync(mergedQueryHandlersFile, mergedQueryHandlers, "utf-8");

      // Write merged mutation handlers
      const mergedMutationHandlersFile = join(
        topLevelOutputPath,
        "mutationHandlers.generated.ts"
      );
      writeFileSync(
        mergedMutationHandlersFile,
        mergedMutationHandlers,
        "utf-8"
      );

      // Write merged index file
      const mergedIndexFilePath = join(
        topLevelOutputPath,
        `${topLevelOutputFileName}.ts`
      );
      writeFileSync(mergedIndexFilePath, mergedIndexFile, "utf-8");

      const endTime = Date.now();
      const duration = endTime - startTime;
      log(
        `MSW Mock Gen: Generated merged handlers at ${topLevelOutputPath} (${duration}ms)`
      );

      // Clean up source files after successful merge
      cleanupSourceFiles(root, configs, log);
    } catch (error) {
      console.error(
        `MSW Mock Gen: Error writing merged handlers files:`,
        error
      );
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
        const pathParts = outputPath.split("/");
        let currentPath = "";
        for (const part of pathParts) {
          if (part) {
            currentPath += "/" + part;
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
        "mutationHandlers.generated.ts"
      );
      writeFileSync(mutationHandlersFile, handlers.mutationHandlers, "utf-8");

      // Write index file
      const indexFile = join(outputPath, `${outputFileName}.ts`);
      writeFileSync(indexFile, handlers.indexFile, "utf-8");

      log(
        `MSW Mock Gen: Generated handlers at ${outputPath} with ${allUrls.length} endpoints`
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
    const startTime = Date.now();
    log("MSW Mock Gen: Starting handler generation...");

    for (const config of finalConfigs) {
      await generateHandlers(root, config);
    }

    // Merge handlers if enabled
    await mergeAllHandlers(root, finalConfigs);

    const endTime = Date.now();
    const duration = endTime - startTime;
    log(`MSW Mock Gen: Handler generation complete (${duration}ms)`);
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

      if (mergeHandlers) {
        log(
          `MSW Mock Gen: Merged handlers will be written to ${topLevelOutputFolder}/${topLevelOutputFileName}.ts`
        );
      }

      // Sterilize output directories before starting
      sterilize(
        projectRoot,
        finalConfigs,
        mergeHandlers,
        topLevelOutputFolder,
        topLevelOutputFileName,
        log
      );

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
              generateAllHandlers(projectRoot);
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

      // Sterilize output directories before starting
      sterilize(
        projectRoot,
        finalConfigs,
        mergeHandlers,
        topLevelOutputFolder,
        topLevelOutputFileName,
        log
      );

      generateAllHandlers(projectRoot);
    },
  };
}
