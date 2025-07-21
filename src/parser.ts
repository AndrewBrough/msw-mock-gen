import { ParsedURL } from "./types";

/**
 * Parses TypeScript/JavaScript files to extract API endpoint URLs
 *
 * This function analyzes source code to find URL patterns that represent API endpoints.
 * It uses regex patterns to match URLs in various contexts like string literals, object properties,
 * and array elements. The function also determines if the file is a query or mutation based on
 * the filename and attempts to infer the HTTP method from the context.
 *
 * @param content - The source code content to parse
 * @param filename - The name of the file being parsed (used to determine query vs mutation)
 * @param excludePatterns - Array of patterns to exclude from URL detection
 * @returns Array of parsed URLs with metadata
 *
 * @example
 * ```typescript
 * const urls = parseURLsFromFile(
 *   'fetch("/api/users")',
 *   'useUsersQuery.ts',
 *   ['navigate({']
 * );
 * // Returns: [{ path: '/api/users', method: 'get', source: 'useUsersQuery.ts', line: 1, type: 'query' }]
 * ```
 */
export function parseURLsFromFile(
  content: string,
  filename: string,
  excludePatterns: string[] = [],
): ParsedURL[] {
  const urls: ParsedURL[] = [];
  const lines = content.split("\n");

  // Enhanced regex to match URL patterns in various contexts
  const urlPatterns = [
    // String literals with URLs
    /['"`]([\/][^'"`]+)['"`]/g,
    // Object property assignments
    /:\s*['"`]([\/][^'"`]+)['"`]/g,
    // Array elements
    /['"`]([\/][^'"`]+)['"`],?/g,
  ];

  // Determine if this is a query or mutation file based on filename
  const isQuery = filename.includes("Query") || filename.includes("query");
  const isMutation =
    filename.includes("Mutation") || filename.includes("mutation");

  lines.forEach((line, index) => {
    // Skip comments
    if (line.trim().startsWith("//") || line.trim().startsWith("/*")) {
      return;
    }

    // Check if this line should be excluded based on patterns
    const shouldExcludeLine = excludePatterns.some((pattern) =>
      line.includes(pattern),
    );

    if (shouldExcludeLine) {
      return;
    }

    urlPatterns.forEach((pattern) => {
      let match;
      while ((match = pattern.exec(line)) !== null) {
        const url = match[1];

        // Include API-like paths and simple endpoint paths
        if (
          url.startsWith("/api/") ||
          url.startsWith("/v1/") ||
          url.startsWith("/v2/") ||
          (url.startsWith("/") && url.length > 1 && !url.includes("."))
        ) {
          // Check if this URL is already added
          const exists = urls.some((existing) => existing.path === url);
          if (!exists) {
            console.log(`DEBUG: Found URL in line ${index + 1}: ${url}`);
            // Determine HTTP method based on context
            let method = "get"; // Default for queries
            if (isMutation) {
              // Try to determine method from context
              const lowerLine = line.toLowerCase();
              if (
                lowerLine.includes("post") ||
                lowerLine.includes("create") ||
                lowerLine.includes("add")
              ) {
                method = "post";
              } else if (
                lowerLine.includes("put") ||
                lowerLine.includes("update")
              ) {
                method = "put";
              } else if (
                lowerLine.includes("delete") ||
                lowerLine.includes("remove")
              ) {
                method = "delete";
              } else if (lowerLine.includes("patch")) {
                method = "patch";
              } else {
                method = "post"; // Default for mutations
              }
            }

            urls.push({
              path: url,
              method,
              source: filename,
              line: index + 1,
              type: isQuery ? "query" : isMutation ? "mutation" : "unknown",
            });
          }
        }
      }
    });
  });

  return urls;
}

/**
 * Generates MSW handler code from parsed URLs
 *
 * This function takes an array of parsed URLs and generates the corresponding MSW handler code.
 * It separates URLs by type (query, mutation, unknown) and generates appropriate HTTP handlers
 * for each endpoint. The generated code includes proper imports and exports for use with MSW.
 *
 * @param urls - Array of parsed URLs to generate handlers for
 * @returns Object containing generated handler code for queries, mutations, and index file
 *
 * @example
 * ```typescript
 * const handlers = generateMSWHandlers([
 *   { path: '/api/users', method: 'get', source: 'file.ts', type: 'query' },
 *   { path: '/api/users', method: 'post', source: 'file.ts', type: 'mutation' }
 * ]);
 *
 * // Returns:
 * // {
 * //   queryHandlers: "import { http, HttpResponse } from 'msw';...",
 * //   mutationHandlers: "import { http, HttpResponse } from 'msw';...",
 * //   indexFile: "import { queryHandlers } from './queryHandlers.generated';..."
 * // }
 * ```
 */
export function generateMSWHandlers(
  urls: ParsedURL[],
  mockDataFiles: Array<{
    originalFilePath: string;
    mockDataFilePath: string;
    hookName: string;
    dataType: string;
    type: "query" | "mutation";
  }> = [],
): {
  queryHandlers: string;
  mutationHandlers: string;
  indexFile: string;
} {
  if (urls.length === 0) {
    return {
      queryHandlers: `export const queryHandlers = [];`,
      mutationHandlers: `export const mutationHandlers = [];`,
      indexFile: `import { queryHandlers } from './queryHandlers.generated';
import { mutationHandlers } from './mutationHandlers.generated';

export const handlers = [
  ...queryHandlers,
  ...mutationHandlers
];`,
    };
  }

  // Separate URLs by type
  const queryUrls = urls.filter((url) => url.type === "query");
  const mutationUrls = urls.filter((url) => url.type === "mutation");
  const unknownUrls = urls.filter((url) => url.type === "unknown");

  // Deduplicate URLs by path within each category
  const uniqueQueryUrls = queryUrls.filter(
    (url, index, self) => index === self.findIndex((u) => u.path === url.path),
  );
  const uniqueMutationUrls = mutationUrls.filter(
    (url, index, self) => index === self.findIndex((u) => u.path === url.path),
  );
  const uniqueUnknownUrls = unknownUrls.filter(
    (url, index, self) => index === self.findIndex((u) => u.path === url.path),
  );

  // Helper function to convert hook name to mock data variable name
  const getMockDataVarName = (hookName: string) => {
    const baseName = hookName.replace(/^use/, "mock");
    return baseName.charAt(0).toLowerCase() + baseName.slice(1) + "Data";
  };

  // Helper function to find mock data for a URL
  const findMockDataForUrl = (url: ParsedURL) => {
    // Try to find a mock data file that matches this URL pattern
    // This is a simple heuristic - we'll match based on the URL path
    return mockDataFiles.find((mockData) => {
      // For now, we'll use a simple approach: if the URL path contains keywords
      // that might match the hook name, we'll use that mock data
      const urlPath = url.path.toLowerCase();
      const hookName = mockData.hookName.toLowerCase();

      // Check if URL path contains parts of the hook name
      const hookParts = hookName
        .replace(/use|query|mutation/g, "")
        .split(/(?=[A-Z])/);
      return hookParts.some((part) => urlPath.includes(part.toLowerCase()));
    });
  };

  // Generate query handlers
  const queryHandlers = uniqueQueryUrls.map((url) => {
    const method = url.method || "get";
    const mockData = findMockDataForUrl(url);

    if (mockData) {
      // Use the mock data variable name
      const mockDataVarName = getMockDataVarName(mockData.hookName);
      return `  http.${method}('${url.path}', () => {
    return HttpResponse.json(${mockDataVarName});
  })`;
    } else {
      return `  http.${method}('${url.path}', () => {
    return HttpResponse.json({
      message: 'Mock response for ${url.path}',
      timestamp: new Date().toISOString()
    });
  })`;
    }
  });

  // Generate mutation handlers
  const mutationHandlers = uniqueMutationUrls.map((url) => {
    const method = url.method || "post";
    const mockData = findMockDataForUrl(url);

    if (mockData) {
      // Use the mock data variable name
      const mockDataVarName = getMockDataVarName(mockData.hookName);
      return `  http.${method}('${url.path}', () => {
    return HttpResponse.json(${mockDataVarName});
  })`;
    } else {
      return `  http.${method}('${url.path}', () => {
    return HttpResponse.json({
      message: 'Mock response for ${url.path}',
      timestamp: new Date().toISOString()
    });
  })`;
    }
  });

  // Generate unknown handlers (treat as queries)
  const unknownHandlers = uniqueUnknownUrls.map((url) => {
    const method = url.method || "get";
    const mockData = findMockDataForUrl(url);

    if (mockData) {
      // Use the mock data variable name
      const mockDataVarName = getMockDataVarName(mockData.hookName);
      return `  http.${method}('${url.path}', () => {
    return HttpResponse.json(${mockDataVarName});
  })`;
    } else {
      return `  http.${method}('${url.path}', () => {
    return HttpResponse.json({
      message: 'Mock response for ${url.path}',
      timestamp: new Date().toISOString()
    });
  })`;
    }
  });

  // Collect all unique mock data imports with their variable names
  const mockDataImports = new Map<string, string>();

  // Add imports for all mock data files
  mockDataFiles.forEach((mockData) => {
    const mockDataVarName = getMockDataVarName(mockData.hookName);

    // Calculate the full path from the project root to the mock data file
    // Extract the path relative to the project root (everything after the project root)
    const projectRootIndex = mockData.mockDataFilePath.indexOf("/src/");
    const fullPath = mockData.mockDataFilePath.substring(projectRootIndex + 1); // Remove leading slash
    const importPath = fullPath.replace(".ts", "");

    mockDataImports.set(mockDataVarName, importPath);
  });

  // Helper to extract used mock data variable names from handler code
  function extractUsedMockVars(handlers: string[]): Set<string> {
    const used = new Set<string>();
    const regex = /HttpResponse\.json\((\w+)\)/g;
    for (const handler of handlers) {
      let match;
      while ((match = regex.exec(handler))) {
        used.add(match[1]);
      }
    }
    return used;
  }

  const usedQueryVars = extractUsedMockVars([
    ...queryHandlers,
    ...unknownHandlers,
  ]);
  const usedMutationVars = extractUsedMockVars(mutationHandlers);

  // Generate import statements for mock data, filtered by type
  const queryMockDataImports = Array.from(mockDataImports.entries())
    .filter(([varName]) => usedQueryVars.has(varName))
    .map(
      ([varName, importPath]) => `import { ${varName} } from '${importPath}';`,
    )
    .join("\n");

  const mutationMockDataImports = Array.from(mockDataImports.entries())
    .filter(([varName]) => usedMutationVars.has(varName))
    .map(
      ([varName, importPath]) => `import { ${varName} } from '${importPath}';`,
    )
    .join("\n");

  const queryHandlersCode =
    queryHandlers.concat(unknownHandlers).length > 0
      ? `import { http, HttpResponse } from 'msw';
${queryMockDataImports ? `\n${queryMockDataImports}\n` : ""}
export const queryHandlers = [
${queryHandlers.concat(unknownHandlers).join(",\n")}
];`
      : `export const queryHandlers = [];`;

  const mutationHandlersCode =
    mutationHandlers.length > 0
      ? `import { http, HttpResponse } from 'msw';
${mutationMockDataImports ? `\n${mutationMockDataImports}\n` : ""}
export const mutationHandlers = [
${mutationHandlers.join(",\n")}
];`
      : `export const mutationHandlers = [];`;

  const indexFileCode = `import { queryHandlers } from './queryHandlers.generated';
import { mutationHandlers } from './mutationHandlers.generated';

export const handlers = [
  ...queryHandlers,
  ...mutationHandlers
];`;

  return {
    queryHandlers: queryHandlersCode,
    mutationHandlers: mutationHandlersCode,
    indexFile: indexFileCode,
  };
}
