import { writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { ParsedQueryMutation, MockDataFile } from "./types";
import { createMockDataContent } from "./content-generator";

/**
 * Generates mock data files for query and mutation hooks
 *
 * @param parsedFiles - Array of parsed query/mutation information
 * @param root - Project root directory
 * @returns Array of generated mock data file information
 */
export async function generateMockDataFiles(
  parsedFiles: ParsedQueryMutation[],
  _root: string
): Promise<MockDataFile[]> {
  const generatedFiles: MockDataFile[] = [];

  for (const parsedFile of parsedFiles) {
    const mockDataFile = await createMockDataFile(parsedFile, _root);

    if (mockDataFile) {
      generatedFiles.push(mockDataFile);
    }
  }

  return generatedFiles;
}

/**
 * Creates a single mock data file for a query or mutation
 *
 * @param parsedFile - Parsed query/mutation information
 * @param root - Project root directory
 * @returns Mock data file information or null if creation failed
 */
async function createMockDataFile(
  parsedFile: ParsedQueryMutation,
  _root: string
): Promise<MockDataFile | null> {
  // root parameter is kept for future use when we need to resolve relative paths
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { filePath, hookName, dataType, type } = parsedFile;

  // Create the mock data file path
  const mockDataFilePath = createMockDataFilePath(filePath, hookName);

  // Generate the content for the mock data file
  const content = await createMockDataContent(
    hookName,
    dataType,
    type,
    filePath,
    _root
  );

  // Ensure the output directory exists
  const outputDir = dirname(mockDataFilePath);
  if (!existsSync(outputDir)) {
    try {
      mkdirSync(outputDir, { recursive: true });
    } catch (error) {
      console.error(
        `MSW Mock Gen: Error creating directory ${outputDir}:`,
        error
      );
      return null;
    }
  }

  // Write the mock data file
  try {
    writeFileSync(mockDataFilePath, content, "utf-8");

    return {
      originalFilePath: filePath,
      mockDataFilePath,
      hookName,
      dataType,
      type
    };
  } catch (error) {
    console.error(
      `MSW Mock Gen: Error writing mock data file ${mockDataFilePath}:`,
      error
    );
    return null;
  }
}

/**
 * Creates the file path for the mock data file
 *
 * @param originalFilePath - Path to the original query/mutation file
 * @param hookName - Name of the hook
 * @returns Path for the mock data file
 */
function createMockDataFilePath(
  originalFilePath: string,
  _hookName: string
): string {
  // hookName parameter kept for future use
  const dir = dirname(originalFilePath);
  const baseName =
    originalFilePath
      .split("/")
      .pop()
      ?.replace(/\.(ts|js|tsx|jsx)$/, "") || "";

  return join(dir, `${baseName}.mocks.gen.ts`);
}
