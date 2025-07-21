import { generateMockDataFiles } from "./generator";
import { parseQueryMutationFiles } from "./parser";
import { MockDataConfig } from "./types";
import {
  generateMockDataForFile,
  generateMockDataForType,
  DEFAULT_MOCK_CONFIG,
} from "./type-factory";

export {
  generateMockDataFiles,
  parseQueryMutationFiles,
  generateMockDataForFile,
  generateMockDataForType,
  DEFAULT_MOCK_CONFIG,
};
export type { MockDataConfig };
