export interface MSWMockGenOptions {
  watchFolder?: string;
  outputFolder?: string;
  outputFileName?: string;
  excludePatterns?: string[];
}

export interface ParsedURL {
  path: string;
  method?: string;
  source: string;
  line?: number;
  type?: 'query' | 'mutation' | 'unknown';
}

export interface MSWHandler {
  path: string;
  method: string;
  handler: string;
} 