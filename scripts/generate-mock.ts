import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { 
  generateMockDataForFile, 
  createMockConfig, 
  PRESET_CONFIGS 
} from "../src/data-generation/type-factory";

async function main() {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const projectRoot = path.resolve(__dirname, "..");
    
    // Test with different configurations
    console.log("=== Testing with different configurations ===");
    
    // Test with development preset
    console.log("\n--- Development Configuration ---");
    const devConfig = createMockConfig({
      ...PRESET_CONFIGS.development,
      arrayLength: 2, // Smaller for testing
    });
    
    const loginFile =
      "example/src/data/mutations/LoginMutation/useLoginMutation.ts";
    const loginMockData = await generateMockDataForFile(loginFile, projectRoot);
    
    const loginMockFilePath =
      "example/src/data/mutations/LoginMutation/useLoginMutation.mocks.gen.ts";
    const loginMockFileContent = `import { useLoginMutation } from "./useLoginMutation";

type QueryData = ReturnType<typeof useLoginMutation>["data"];

export const mockLoginMutationData: QueryData = ${JSON.stringify(loginMockData, null, 2)};`;
    
    fs.writeFileSync(loginMockFilePath, loginMockFileContent);
    console.log("✓ Updated LoginMutation mock file");
    
    // Test AssetsQuery
    console.log("\n--- AssetsQuery with Development Config ---");
    const assetsFile = "example/src/otherQueries/useAssetsQuery.ts";
    const assetsMockData = await generateMockDataForFile(
      assetsFile,
      projectRoot,
    );
    
    const assetsMockFilePath =
      "example/src/otherQueries/useAssetsQuery.mocks.gen.ts";
    const assetsMockFileContent = `import { useAssetsQuery } from "./useAssetsQuery";

type QueryData = ReturnType<typeof useAssetsQuery>["data"];

export const mockAssetsQueryData: QueryData = ${JSON.stringify(assetsMockData, null, 2)};`;
    
    fs.writeFileSync(assetsMockFilePath, assetsMockFileContent);
    console.log("✓ Updated AssetsQuery mock file");
    
    // Test with custom configuration
    console.log("\n--- Custom Configuration ---");
    const customConfig = createMockConfig({
      seed: 999,
      arrayLength: 1,
      skipOptional: true,
      allowNull: false,
      fieldGenerators: {
        customField: () => "custom-value",
      },
    });
    
    console.log("Custom config created with seed:", customConfig.seed);
    console.log("Array length:", customConfig.arrayLength);
    console.log("Skip optional:", customConfig.skipOptional);
    
    console.log("\n=== Summary ===");
    console.log(
      "Generated mock data with different configurations successfully!",
    );
    console.log("Available presets:", Object.keys(PRESET_CONFIGS).join(", "));
  } catch (error) {
    console.error("Error generating mock data:", error);
    process.exit(1);
  }
}

main();
