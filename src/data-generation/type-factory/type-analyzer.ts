import * as fs from "fs";
import * as path from "path";
import { TypeInfo, PropertyInfo, FileInfo } from "./types";

export class TypeAnalyzer {
  private projectRoot: string;
  private typeCache = new Map<string, TypeInfo>();

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  async analyzeFile(filePath: string): Promise<FileInfo> {
    const fullPath = path.resolve(this.projectRoot, filePath);
    const content = fs.readFileSync(fullPath, "utf-8");

    // For mutation files, we need to find the data type from the useMutation generic
    const mutationMatch = content.match(/useMutation<([^,]+)/);
    if (mutationMatch) {
      const dataType = mutationMatch[1].trim();
      const typeInfo = await this.resolveType(
        dataType,
        content,
        path.dirname(fullPath),
      );

      return {
        filePath,
        typeName: dataType,
        typeInfo,
      };
    }

    // Extract type name from the file content
    const typeNameMatch = content.match(/export\s+(?:type|interface)\s+(\w+)/);
    if (!typeNameMatch) {
      throw new Error(`Could not find exported type in ${filePath}`);
    }

    const typeName = typeNameMatch[1];
    const typeInfo = await this.analyzeType(typeName, content);

    return {
      filePath,
      typeName,
      typeInfo,
    };
  }

  async resolveType(
    typeName: string,
    content: string,
    fileDir: string,
  ): Promise<TypeInfo> {
    // Check cache first
    if (this.typeCache.has(typeName)) {
      return this.typeCache.get(typeName)!;
    }

    // First try to find the type in the current file
    try {
      return await this.analyzeType(typeName, content);
    } catch (error) {
      // If not found in current file, try to resolve imports
      const imports = this.extractImports(content);

      for (const importInfo of imports) {
        if (importInfo.types.includes(typeName)) {
          const importPath = this.resolveImportPath(importInfo.path, fileDir);
          const importContent = fs.readFileSync(importPath, "utf-8");
          return await this.analyzeType(typeName, importContent);
        }
      }

      throw new Error(`Could not resolve type ${typeName}`);
    }
  }

  /**
   * Resolve a type by name across all known files in the project
   */
  async resolveTypeByName(typeName: string): Promise<TypeInfo | null> {
    // Check cache first
    if (this.typeCache.has(typeName)) {
      return this.typeCache.get(typeName)!;
    }

    // Search for the type in common locations
    const commonPaths = [
      `src/data/types/${typeName}.ts`,
      `src/types/${typeName}.ts`,
      `src/@data/types/${typeName}.ts`,
      `src/data/${typeName}.ts`,
    ];

    for (const relativePath of commonPaths) {
      try {
        const fullPath = path.resolve(this.projectRoot, relativePath);
        if (fs.existsSync(fullPath)) {
          const content = fs.readFileSync(fullPath, "utf-8");
          return await this.analyzeType(typeName, content);
        }
      } catch (error) {
        // Continue to next path
      }
    }

    // If not found in common paths, try to search more broadly
    try {
      const glob = await import("glob");
      const pattern = `**/${typeName}.ts`;
      const files = await glob.glob(pattern, { cwd: this.projectRoot });
      
      for (const file of files) {
        try {
          const fullPath = path.resolve(this.projectRoot, file);
          const content = fs.readFileSync(fullPath, "utf-8");
          return await this.analyzeType(typeName, content);
        } catch (error) {
          // Continue to next file
        }
      }
    } catch (error) {
      // glob might not be available
    }

    return null;
  }

  async analyzeType(typeName: string, content: string): Promise<TypeInfo> {
    // Check cache first
    if (this.typeCache.has(typeName)) {
      return this.typeCache.get(typeName)!;
    }

    // Find the type definition
    const typeRegex = new RegExp(
      `export\\s+(?:type|interface)\\s+${typeName}\\s*=\\s*(.+?)(?:;|\\n|$)`,
      "s",
    );
    const interfaceRegex = new RegExp(
      `export\\s+interface\\s+${typeName}\\s*{([^}]+)}`,
      "s",
    );

    let typeInfo: TypeInfo;

    // Try to match as interface first
    const interfaceMatch = content.match(interfaceRegex);
    if (interfaceMatch) {
      typeInfo = this.parseInterface(typeName, interfaceMatch[1]);
    } else {
      // Try to match as type alias
      const typeMatch = content.match(typeRegex);
      if (typeMatch) {
        typeInfo = this.parseTypeAlias(typeName, typeMatch[1]);
      } else {
        throw new Error(`Could not find type definition for ${typeName}`);
      }
    }

    this.typeCache.set(typeName, typeInfo);
    return typeInfo;
  }

  private parseInterface(name: string, body: string): TypeInfo {
    const properties: PropertyInfo[] = [];

    // Parse interface properties
    const propertyRegex = /(\w+)(\??):\s*([^;\n]+)/g;
    let match;

    while ((match = propertyRegex.exec(body)) !== null) {
      const [, propName, optional, typeString] = match;
      const isOptional = optional === "?";
      const isNullable =
        typeString.includes("| null") || typeString.includes("null |");

      const propertyType = this.parseTypeString(typeString.trim());
      properties.push({
        name: propName,
        type: propertyType,
        isOptional,
        isNullable,
      });
    }

    return {
      name,
      kind: "interface",
      properties,
    };
  }

  private parseTypeAlias(name: string, typeString: string): TypeInfo {
    return this.parseTypeString(typeString.trim());
  }

  private parseTypeString(typeString: string): TypeInfo {
    // Handle arrays
    if (typeString.endsWith("[]")) {
      const elementType = this.parseTypeString(typeString.slice(0, -2));
      return {
        name: `${elementType.name}[]`,
        kind: "array",
        arrayType: elementType,
      };
    }

    // Handle union types
    if (typeString.includes("|")) {
      const unionTypes = typeString
        .split("|")
        .map((t) => t.trim())
        .map((t) => this.parseTypeString(t));
      return {
        name: `Union<${unionTypes.map((t) => t.name).join(" | ")}>`,
        kind: "union",
        unionTypes,
      };
    }

    // Handle primitive types
    const primitiveTypes = ["string", "number", "boolean", "Date"];
    if (primitiveTypes.includes(typeString)) {
      return {
        name: typeString,
        kind: "primitive",
        primitiveType: typeString,
      };
    }

    // Handle imported types (simplified - just return the name)
    return {
      name: typeString,
      kind: "type",
    };
  }

  private extractImports(
    content: string,
  ): Array<{ path: string; types: string[] }> {
    const imports: Array<{ path: string; types: string[] }> = [];
    const importRegex = /import\s+{([^}]+)}\s+from\s+["']([^"']+)["']/g;

    let match;
    while ((match = importRegex.exec(content)) !== null) {
      const [, typesStr, importPath] = match;
      const types = typesStr.split(",").map((t) => t.trim());
      imports.push({ path: importPath, types });
    }

    return imports;
  }

  private resolveImportPath(importPath: string, fileDir: string): string {
    // Handle relative imports
    if (importPath.startsWith(".")) {
      return path.resolve(fileDir, importPath + ".ts");
    }

    // Handle absolute imports (like @data/types/User)
    if (importPath.startsWith("@")) {
      const relativePath = importPath.replace("@", "");
      return path.resolve(this.projectRoot, relativePath + ".ts");
    }

    return path.resolve(fileDir, importPath + ".ts");
  }
}
