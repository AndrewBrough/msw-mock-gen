/**
 * Creates the content for a mock data file
 *
 * @param hookName - Name of the hook (e.g., useAssetsQuery)
 * @param dataType - The data type for the hook
 * @param type - Whether this is a query or mutation
 * @returns The TypeScript content for the mock data file
 */
export function createMockDataContent(
  hookName: string,
  dataType: string,
  type: "query" | "mutation",
): string {
  const importStatement = `import { ${hookName} } from "./${hookName}";`;
  const typeDefinition = `type QueryData = ReturnType<typeof ${hookName}>["data"];`;
  const exportStatement = `export const ${getMockDataName(
    hookName,
  )}: QueryData = undefined; // TODO: Replace with mock ${type} data of type: ${dataType}`;

  return `${importStatement}

${typeDefinition}

${exportStatement}
`;
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
