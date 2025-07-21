/* eslint-disable @typescript-eslint/no-explicit-any */
import { faker } from "@faker-js/faker";
import { TypeFactory } from "./type-factory";
import { TypeAnalyzer } from "./type-analyzer";
import { DEFAULT_MOCK_CONFIG } from "./defaults";

export { TypeFactory, TypeAnalyzer };
export { DEFAULT_MOCK_CONFIG };
export * from "./types";
export * from "./config";

// Initialize faker with a consistent seed for reproducible results
faker.seed(123);

/**
 * Main function to generate mock data for a given type
 */
export async function generateMockDataForType(
  typeName: string,
  typeDefinition: string,
  projectRoot: string,
): Promise<any> {
  const analyzer = new TypeAnalyzer(projectRoot);
  const factory = new TypeFactory(analyzer);

  const typeInfo = await analyzer.analyzeType(typeName, typeDefinition);
  return factory.generateMockData(typeInfo);
}

/**
 * Generate mock data for a specific file
 */
export async function generateMockDataForFile(
  filePath: string,
  projectRoot: string,
): Promise<any> {
  const analyzer = new TypeAnalyzer(projectRoot);
  const factory = new TypeFactory(analyzer);

  const fileInfo = await analyzer.analyzeFile(filePath);
  return factory.generateMockData(fileInfo.typeInfo);
}
