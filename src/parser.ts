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
  excludePatterns: string[] = []
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
      line.includes(pattern)
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
export function generateMSWHandlers(urls: ParsedURL[]): {
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
    (url, index, self) => index === self.findIndex((u) => u.path === url.path)
  );
  const uniqueMutationUrls = mutationUrls.filter(
    (url, index, self) => index === self.findIndex((u) => u.path === url.path)
  );
  const uniqueUnknownUrls = unknownUrls.filter(
    (url, index, self) => index === self.findIndex((u) => u.path === url.path)
  );

  // Generate query handlers
  const queryHandlers = uniqueQueryUrls.map((url) => {
    const method = url.method || "get";
    return `  http.${method}('${url.path}', () => {
    return HttpResponse.json({
      message: 'Mock response for ${url.path}',
      timestamp: new Date().toISOString()
    });
  })`;
  });

  // Generate mutation handlers
  const mutationHandlers = uniqueMutationUrls.map((url) => {
    const method = url.method || "post";
    return `  http.${method}('${url.path}', () => {
    return HttpResponse.json({
      message: 'Mock response for ${url.path}',
      timestamp: new Date().toISOString()
    });
  })`;
  });

  // Generate unknown handlers (treat as queries)
  const unknownHandlers = uniqueUnknownUrls.map((url) => {
    const method = url.method || "get";
    return `  http.${method}('${url.path}', () => {
    return HttpResponse.json({
      message: 'Mock response for ${url.path}',
      timestamp: new Date().toISOString()
    });
  })`;
  });

  const queryHandlersCode =
    queryHandlers.concat(unknownHandlers).length > 0
      ? `import { http, HttpResponse } from 'msw';

export const queryHandlers = [
${queryHandlers.concat(unknownHandlers).join(",\n")}
];`
      : `export const queryHandlers = [];`;

  const mutationHandlersCode =
    mutationHandlers.length > 0
      ? `import { http, HttpResponse } from 'msw';

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
