import type { Plugin } from "vite";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { glob } from "glob";
import { createHash } from "crypto";
import { MSWMockGenOptions, MSWMockGenConfig, ParsedURL } from "./types";
import { parseURLsFromFile, generateMSWHandlers } from "./parser";
import { sterilize } from "./sterilize";
import {
  parseQueryMutationFiles,
  generateMockDataFiles,
} from "./data-generation";

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
 *           excludePatterns: ['navigate({', 'to: "/'] // Config-specific patterns
 *         }
 *       ],
 *       quiet: true,
 *       mergeHandlers: true,
 *       outputFolder: 'src/mocks',
 *       outputFileName: 'mswHandlers.generated',
 *       excludePatterns: ['navigate({', 'href: "/'] // Global patterns (applied to all configs)
 *     })
 *   ]
 * });
 * ```
 */
export default function mswMockGen(
  options: MSWMockGenOptions = { configs: [] },
): Plugin {
  const {
    configs = [],
    quiet = true,
    mergeHandlers = true,
    outputFolder: topLevelOutputFolder = "src/mocks",
    outputFileName: topLevelOutputFileName = "mswHandlers.generated",
    excludePatterns: globalExcludePatterns = [],
    formatScript,
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
  let isInitialized = false;

  /**
   * Creates a hash of the full path to ensure unique cache directory names
   * @param path - The path to hash
   * @returns A short hash string
   */
  const hashPath = (path: string): string => {
    return createHash("md5").update(path).digest("hex").substring(0, 8);
  };

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
   * Runs the format script if specified
   * @param root - Project root directory
   */
  const runFormatScript = async (root: string) => {
    if (!formatScript) {
      return;
    }

    try {
      const { exec } = await import("child_process");
      const { promisify } = await import("util");
      const execAsync = promisify(exec);

      log(`MSW Mock Gen: Running format script: ${formatScript}`);
      const startTime = Date.now();

      await execAsync(`npm run ${formatScript}`, { cwd: root });

      const endTime = Date.now();
      const duration = endTime - startTime;
      log(`MSW Mock Gen: Format script completed (${duration}ms)`);
    } catch (error) {
      console.error(`MSW Mock Gen: Error running format script:`, error);
    }
  };

  /**
   * Merges multiple handler files into a single output
   * @param root - Project root directory
   * @param configs - Array of configurations
   */
  const mergeAllHandlers = async (
    root: string,
    configs: MSWMockGenConfig[],
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
    const allImports = new Set<string>();

    // Collect handlers from all configs
    for (const config of configs) {
      const {
        watchFolder = "src/data/queries",
        outputFolder = "src/data/queries/mocks",
      } = config;

      const watchPath = join(root, watchFolder);

      // When merging is enabled, read from .cache subdirectories
      // Use the same hash-based approach for consistency
      // Otherwise, use the original output folder
      const actualOutputFolder = mergeHandlers
        ? join(topLevelOutputFolder, ".cache", hashPath(watchPath))
        : outputFolder;

      const configOutputPath = join(root, actualOutputFolder);

      // Check if the config's output files exist
      const queryHandlersFile = join(
        configOutputPath,
        "queryHandlers.generated.ts",
      );
      const mutationHandlersFile = join(
        configOutputPath,
        "mutationHandlers.generated.ts",
      );

      if (existsSync(queryHandlersFile)) {
        try {
          const content = readFileSync(queryHandlersFile, "utf-8");

          // Extract import statements (excluding MSW imports)
          const importMatches = content.matchAll(
            /import\s+{[^}]+}\s+from\s+['"`][^'"`]+['"`];/g,
          );
          for (const match of importMatches) {
            if (!match[0].includes("msw")) {
              allImports.add(match[0]);
            }
          }

          // Extract the actual handlers (skip import statements)
          const handlersMatch = content.match(
            /export const queryHandlers = \[([\s\S]*?)\];/,
          );
          if (handlersMatch && handlersMatch[1].trim()) {
            allQueryHandlers.push(handlersMatch[1].trim());
          }
        } catch (error) {
          console.error(
            `MSW Mock Gen: Error reading query handlers from ${queryHandlersFile}:`,
            error,
          );
        }
      }

      if (existsSync(mutationHandlersFile)) {
        try {
          const content = readFileSync(mutationHandlersFile, "utf-8");

          // Extract import statements (excluding MSW imports)
          const importMatches = content.matchAll(
            /import\s+{[^}]+}\s+from\s+['"`][^'"`]+['"`];/g,
          );
          for (const match of importMatches) {
            if (!match[0].includes("msw")) {
              allImports.add(match[0]);
            }
          }

          // Extract the actual handlers (skip import statements)
          const handlersMatch = content.match(
            /export const mutationHandlers = \[([\s\S]*?)\];/,
          );
          if (handlersMatch && handlersMatch[1].trim()) {
            allMutationHandlers.push(handlersMatch[1].trim());
          }
        } catch (error) {
          console.error(
            `MSW Mock Gen: Error reading mutation handlers from ${mutationHandlersFile}:`,
            error,
          );
        }
      }
    }

    // Generate merged files
    const importStatements = Array.from(allImports).join("\n");

    const mergedQueryHandlers =
      allQueryHandlers.length > 0
        ? `import { http, HttpResponse } from 'msw';
${importStatements ? `\n${importStatements}\n` : ""}
export const queryHandlers = [
${allQueryHandlers.join(",\n")}
];`
        : `export const queryHandlers = [];`;

    const mergedMutationHandlers =
      allMutationHandlers.length > 0
        ? `import { http, HttpResponse } from 'msw';
${importStatements ? `\n${importStatements}\n` : ""}
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
        "queryHandlers.generated.ts",
      );
      writeFileSync(mergedQueryHandlersFile, mergedQueryHandlers, "utf-8");

      // Write merged mutation handlers
      const mergedMutationHandlersFile = join(
        topLevelOutputPath,
        "mutationHandlers.generated.ts",
      );
      writeFileSync(
        mergedMutationHandlersFile,
        mergedMutationHandlers,
        "utf-8",
      );

      // Write merged index file
      const mergedIndexFilePath = join(
        topLevelOutputPath,
        `${topLevelOutputFileName}.ts`,
      );
      writeFileSync(mergedIndexFilePath, mergedIndexFile, "utf-8");

      const endTime = Date.now();
      const duration = endTime - startTime;
      log(
        `MSW Mock Gen: Generated merged handlers at ${topLevelOutputPath} (${duration}ms)`,
      );
    } catch (error) {
      console.error(
        `MSW Mock Gen: Error writing merged handlers files:`,
        error,
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
      excludePatterns: configExcludePatterns = [],
    } = config;

    // Merge global and config-specific exclude patterns
    const excludePatterns = [
      ...globalExcludePatterns,
      ...configExcludePatterns,
    ];

    const watchPath = join(root, watchFolder);

    // When merging is enabled, output to .cache subdirectory in the merged output folder
    // Use a hash of the full path to ensure unique cache directory names
    // Otherwise, use the original output folder
    const actualOutputFolder = mergeHandlers
      ? join(topLevelOutputFolder, ".cache", hashPath(watchPath))
      : outputFolder;

    const outputPath = join(root, actualOutputFolder);

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
      ignore: [
        `**/${outputFolder}/**`,
        `**/*.generated.{ts,js,tsx,jsx}`,
        `**/*.generated/**`,
        `**/*.mocks.gen.{ts,js,tsx,jsx}`,
        `**/*.mocks.gen/**`,
      ],
    });

    const allUrls: ParsedURL[] = [];
    const allQueryMutations: any[] = [];

    // Parse each file for URLs and query/mutation data
    for (const file of files) {
      try {
        const content = readFileSync(file, "utf-8");
        const urls = parseURLsFromFile(content, file, excludePatterns);
        allUrls.push(...urls);

        // Also parse for query/mutation data generation
        try {
          const queryMutations = parseQueryMutationFiles(
            content,
            file,
            excludePatterns,
          );
          allQueryMutations.push(...queryMutations);
        } catch (error) {
          console.error(
            `MSW Mock Gen: Error parsing query/mutation file ${file}:`,
            error,
          );
        }
      } catch (error) {
        console.error(`MSW Mock Gen: Error reading file ${file}:`, error);
      }
    }

    // Generate mock data files first
    const mockDataFiles = generateMockDataFiles(allQueryMutations, root);

    // Generate MSW handlers with mock data
    const handlers = generateMSWHandlers(allUrls, mockDataFiles);

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
        `MSW Mock Gen: Generated handlers at ${outputPath} with ${allUrls.length} endpoints and ${mockDataFiles.length} mock data files`,
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

  /**
   * Generates MSW handlers for a specific configuration and merges all handlers
   * @param root - Project root directory
   * @param changedConfig - The configuration that needs to be regenerated
   */
  const generateSingleConfigHandlers = async (
    root: string,
    changedConfig: MSWMockGenConfig,
  ) => {
    const startTime = Date.now();
    log(
      `MSW Mock Gen: Regenerating handlers for config: ${changedConfig.watchFolder}`,
    );

    // Only regenerate the changed config
    await generateHandlers(root, changedConfig);

    // Always merge handlers after any config change
    await mergeAllHandlers(root, finalConfigs);

    const endTime = Date.now();
    const duration = endTime - startTime;
    log(`MSW Mock Gen: Handler regeneration complete (${duration}ms)`);
  };

  return {
    name: "msw-mock-gen",
    apply: "serve",

    configResolved(config) {
      projectRoot = config.root;
    },

    configureServer(server) {
      // Only initialize once
      if (isInitialized) {
        return;
      }
      isInitialized = true;

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
          `MSW Mock Gen: Merged handlers will be written to ${topLevelOutputFolder}/${topLevelOutputFileName}.ts`,
        );
      }

      // Only sterilize on initial startup, not on every file change
      // This ensures .cache files are preserved between events
      sterilize(
        projectRoot,
        finalConfigs,
        mergeHandlers,
        topLevelOutputFolder,
        topLevelOutputFileName,
        log,
      );

      // Generate initial handlers for all configs
      generateAllHandlers(projectRoot).then(() => {
        // Run format script after all generation is complete
        if (formatScript) {
          runFormatScript(projectRoot);
        }
      });

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

            // Skip changes to the output folder and generated files to prevent infinite loops
            if (
              normalizedFile.startsWith(normalizedWatchPath) &&
              !normalizedFile.includes(outputFolder) &&
              !normalizedFile.includes(".generated.") &&
              !normalizedFile.includes(".mocks.gen.")
            ) {
              log(`MSW Mock Gen: File changed: ${file}`);
              generateSingleConfigHandlers(projectRoot, config).then(() => {
                // Run format script after generation is complete
                if (formatScript) {
                  runFormatScript(projectRoot);
                }
              });
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

      // Reset initialization flag for new builds
      isInitialized = false;

      // Sterilize output directories before starting
      sterilize(
        projectRoot,
        finalConfigs,
        mergeHandlers,
        topLevelOutputFolder,
        topLevelOutputFileName,
        log,
      );

      // Note: Initial generation is handled in configureServer to avoid duplication
      // Only sterilize here to ensure clean state for builds
    },
  };
}
