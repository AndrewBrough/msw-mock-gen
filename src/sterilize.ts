import { existsSync, unlinkSync } from "fs";
import { join } from "path";
import { MSWMockGenConfig } from "./types";

/**
 * Deletes a file if it exists
 * @param filePath - Path to the file to delete
 * @param log - Logging function
 */
export const deleteFileIfExists = (
  filePath: string,
  log: (...args: string[]) => void
) => {
  if (existsSync(filePath)) {
    try {
      unlinkSync(filePath);
      log(`MSW Mock Gen: Deleted ${filePath}`);
    } catch (error) {
      console.error(`MSW Mock Gen: Error deleting file ${filePath}:`, error);
    }
  }
};

/**
 * Sterilizes all output directories by deleting old generated files
 * @param root - Project root directory
 * @param configs - Array of configurations
 * @param mergeHandlers - Whether merging is enabled
 * @param topLevelOutputFolder - Top-level output folder for merged handlers
 * @param topLevelOutputFileName - Top-level output file name for merged handlers
 * @param log - Logging function
 */
export const sterilize = (
  root: string,
  configs: MSWMockGenConfig[],
  mergeHandlers: boolean,
  topLevelOutputFolder: string,
  topLevelOutputFileName: string,
  log: (...args: string[]) => void
) => {
  const startTime = Date.now();
  log("MSW Mock Gen: Sterilizing output directories...");

  // Delete files from each config's output folder
  for (const config of configs) {
    const {
      outputFolder = "src/data/queries/mocks",
      outputFileName = "mswHandlers.generated",
    } = config;

    const outputPath = join(root, outputFolder);

    // Delete individual generated files
    deleteFileIfExists(join(outputPath, "queryHandlers.generated.ts"), log);
    deleteFileIfExists(join(outputPath, "mutationHandlers.generated.ts"), log);
    deleteFileIfExists(join(outputPath, `${outputFileName}.ts`), log);
  }

  // Delete merged handler files if merging is enabled
  if (mergeHandlers) {
    const topLevelOutputPath = join(root, topLevelOutputFolder);

    // Delete merged generated files
    deleteFileIfExists(
      join(topLevelOutputPath, "queryHandlers.generated.ts"),
      log
    );
    deleteFileIfExists(
      join(topLevelOutputPath, "mutationHandlers.generated.ts"),
      log
    );
    deleteFileIfExists(
      join(topLevelOutputPath, `${topLevelOutputFileName}.ts`),
      log
    );
  }

  const endTime = Date.now();
  const duration = endTime - startTime;
  log(`MSW Mock Gen: Sterilization complete (${duration}ms)`);
};

/**
 * Cleans up source generated files after merging is complete
 * @param root - Project root directory
 * @param configs - Array of configurations
 * @param log - Logging function
 */
export const cleanupSourceFiles = (
  root: string,
  configs: MSWMockGenConfig[],
  log: (...args: string[]) => void
) => {
  const startTime = Date.now();
  log("MSW Mock Gen: Cleaning up source generated files...");

  // Delete source files from each config's output folder
  for (const config of configs) {
    const {
      outputFolder = "src/data/queries/mocks",
      outputFileName = "mswHandlers.generated",
    } = config;

    const outputPath = join(root, outputFolder);

    // Delete individual generated files (keep only merged ones)
    deleteFileIfExists(join(outputPath, "queryHandlers.generated.ts"), log);
    deleteFileIfExists(join(outputPath, "mutationHandlers.generated.ts"), log);
    deleteFileIfExists(join(outputPath, `${outputFileName}.ts`), log);
  }

  const endTime = Date.now();
  const duration = endTime - startTime;
  log(`MSW Mock Gen: Source file cleanup complete (${duration}ms)`);
};
