export interface MSWMockGenOptions {
  watchFolder?: string;
  outputFolder?: string;
}

export interface ParsedURL {
  path: string;
  method?: string;
  source: string;
  line?: number;
}

export interface MSWHandler {
  path: string;
  method: string;
  handler: string;
} 