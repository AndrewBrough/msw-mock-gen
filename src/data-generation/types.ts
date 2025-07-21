export interface MockDataConfig {
  watchFolder: string;
  outputFolder: string;
  excludePatterns: string[];
}

export interface ParsedQueryMutation {
  filename: string;
  filePath: string;
  type: "query" | "mutation";
  hookName: string;
  dataType: string;
  lineNumber: number;
}

export interface MockDataFile {
  originalFilePath: string;
  mockDataFilePath: string;
  hookName: string;
  dataType: string;
  type: "query" | "mutation";
}
