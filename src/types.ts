/**
 * Configuration for a single watch/output folder pair
 */
export interface MSWMockGenConfig {
  /** Folder to watch for API endpoint definitions */
  watchFolder?: string;
  /** Folder where generated handlers will be written */
  outputFolder?: string;
  /** Base name for generated files (without extension) */
  outputFileName?: string;
  /** Array of patterns to exclude from URL detection */
  excludePatterns?: string[];
}

/**
 * Main configuration options for the MSW Mock Generator plugin
 */
export interface MSWMockGenOptions {
  /** Array of configuration objects for different watch/output folder pairs */
  configs: MSWMockGenConfig[];
  /** Whether to suppress console output (set to false for verbose logging) */
  quiet?: boolean;
  /** Whether to merge all handlers from different configs into a single output (default: true) */
  mergeHandlers?: boolean;
  /** Top-level output folder for merged handlers (default: "src/mocks") */
  outputFolder?: string;
  /** Top-level output file name for merged handlers (default: "mswHandlers.generated") */
  outputFileName?: string;
  /** Global array of patterns to exclude from URL detection (can be overridden by individual configs) */
  excludePatterns?: string[];
  /** Optional npm script to run after generating handlers (e.g., "format", "prettier", "lint:fix") */
  formatScript?: string;
}

/**
 * Represents a parsed URL from source code
 */
export interface ParsedURL {
  /** The API endpoint path */
  path: string;
  /** HTTP method (GET, POST, PUT, DELETE, etc.) */
  method?: string;
  /** Source file where the URL was found */
  source: string;
  /** Line number in the source file */
  line?: number;
  /** Type of operation (query for GET, mutation for POST/PUT/DELETE) */
  type?: "query" | "mutation" | "unknown";
}

/**
 * Represents a generated MSW handler
 */
export interface MSWHandler {
  /** The API endpoint path */
  path: string;
  /** HTTP method */
  method: string;
  /** Generated MSW handler code */
  handler: string;
}
