/**
 * Creates the content for a mock data file
 *
 * @param hookName - Name of the hook (e.g., useAssetsQuery)
 * @param dataType - The data type for the hook
 * @param type - Whether this is a query or mutation
 * @param originalFilePath - Path to the original hook file
 * @param projectRoot - Project root directory for type resolution
 * @param config - Configuration for mock data generation
 * @returns The TypeScript content for the mock data file
 */
export async function createMockDataContent(
  hookName: string,
  dataType: string,
  type: "query" | "mutation",
  originalFilePath: string,
  projectRoot: string,
  _config?: any,
): Promise<string> {
  const importStatement = `import { ${hookName} } from "./${hookName}";`;
  const typeDefinition = `type QueryData = ReturnType<typeof ${hookName}>["data"];`;
  
  try {
    // Generate mock data using the type factory
    const { generateMockDataForFile } = await import("./type-factory");
    
    // Generate the mock data
    const mockData = await generateMockDataForFile(
      originalFilePath,
      projectRoot,
    );
    
    const exportStatement = `export const ${getMockDataName(
      hookName,
    )}: QueryData = ${JSON.stringify(mockData, null, 2)};`;

    return `${importStatement}

${typeDefinition}

${exportStatement}
`;
  } catch (error) {
    console.warn(
      `MSW Mock Gen: Could not generate mock data for ${hookName}:`,
      error,
    );
    
    // Fallback to the original undefined content
    const exportStatement = `export const ${getMockDataName(
      hookName,
    )}: QueryData = undefined; // TODO: Replace with mock ${type} data of type: ${dataType}`;

    return `${importStatement}

${typeDefinition}

${exportStatement}
`;
  }
}

/**
 * Gets the mock data variable name from a hook name
 *
 * @param hookName - Name of the hook (e.g., useAssetsQuery)
 * @returns The mock data variable name
 */
function getMockDataName(hookName: string): string {
  const baseName = hookName.replace(/^use/, "mock");
  return baseName.charAt(0).toLowerCase() + baseName.slice(1) + "Data";
}
