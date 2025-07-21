import { ParsedQueryMutation } from "./types";

/**
 * Parses TypeScript/JavaScript files to extract query and mutation hook information
 *
 * @param content - The source code content to parse
 * @param filePath - The full path to the file being parsed
 * @param excludePatterns - Array of patterns to exclude from parsing
 * @returns Array of parsed query/mutation information
 */
export function parseQueryMutationFiles(
  content: string,
  filePath: string,
  _excludePatterns: string[] = [],
): ParsedQueryMutation[] {
  // excludePatterns parameter kept for future use if needed
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const results: ParsedQueryMutation[] = [];
  const filename = filePath.split("/").pop() || "";

  // Note: excludePatterns are only used for URL detection, not for query/mutation detection
  // Query/mutation files should always be processed regardless of exclude patterns

  // Determine if this is a query or mutation file
  const isQuery = filename.includes("Query") || filename.includes("query");
  const isMutation =
    filename.includes("Mutation") || filename.includes("mutation");

  if (!isQuery && !isMutation) {
    return results;
  }

  const type = isQuery ? "query" : "mutation";

  // Find hook definitions - handle both simple and generic patterns
  const hookPatterns = [
    /export\s+(?:const|function)\s+(\w+)\s*=/g,
    /export\s+(?:const|function)\s+(\w+)\s*<[^>]*>\s*=/g,
  ];

  for (const hookPattern of hookPatterns) {
    let hookMatch;

    while ((hookMatch = hookPattern.exec(content)) !== null) {
      const hookName = hookMatch[1];

      // Skip if hook name doesn't match expected pattern
      if (
        !hookName.includes("use") ||
        !hookName.includes(type === "query" ? "Query" : "Mutation")
      ) {
        continue;
      }

      // Find the data type from the hook definition
      const dataType = extractDataType(content, hookName, type);

      if (dataType) {
        const lineNumber = getLineNumber(content, hookMatch.index);

        results.push({
          filename,
          filePath,
          type,
          hookName,
          dataType,
          lineNumber,
        });
      }
    }
  }

  return results;
}

/**
 * Extracts the data type from a hook definition
 *
 * @param content - The source code content
 * @param hookName - The name of the hook
 * @param type - Whether this is a query or mutation
 * @returns The data type string or null if not found
 */
function extractDataType(
  content: string,
  hookName: string,
  type: "query" | "mutation",
): string | null {
  // Look for useQuery or useMutation with generic type parameters
  const queryPattern = new RegExp(
    `${hookName}\\s*=\\s*(?:<[^>]*>)?\\s*\\(\\)\\s*=>\\s*{[^}]*useQuery<([^,>]+)`,
    "s",
  );
  const mutationPattern = new RegExp(
    `${hookName}\\s*=\\s*(?:<[^>]*>)?\\s*\\(\\)\\s*=>\\s*{[^}]*useMutation<([^,>]+)`,
    "s",
  );

  const pattern = type === "query" ? queryPattern : mutationPattern;
  const match = content.match(pattern);

  if (match && match[1]) {
    return match[1].trim();
  }

  // Fallback: look for type definitions in the same file
  const typePattern = /export\s+type\s+(\w+)\s*=/g;
  let typeMatch;

  while ((typeMatch = typePattern.exec(content)) !== null) {
    const typeName = typeMatch[1];
    if (
      typeName.includes("Data") ||
      typeName.includes(type === "query" ? "Query" : "Mutation")
    ) {
      return typeName;
    }
  }

  return null;
}

/**
 * Gets the line number for a given character index in the content
 *
 * @param content - The source code content
 * @param charIndex - The character index
 * @returns The line number (1-indexed)
 */
function getLineNumber(content: string, charIndex: number): number {
  const beforeChar = content.substring(0, charIndex);
  return beforeChar.split("\n").length;
}
