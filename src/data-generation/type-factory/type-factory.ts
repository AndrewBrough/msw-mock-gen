/* eslint-disable @typescript-eslint/no-explicit-any */
import { faker } from "@faker-js/faker";
import { TypeInfo, MockDataConfig } from "./types";
import { TypeAnalyzer } from "./type-analyzer";
import { DEFAULT_MOCK_CONFIG } from "./defaults";

export class TypeFactory {
  private analyzer: TypeAnalyzer;
  private config: MockDataConfig;

  constructor(analyzer: TypeAnalyzer, config: MockDataConfig = {}) {
    this.analyzer = analyzer;
    this.config = {
      ...DEFAULT_MOCK_CONFIG,
      ...config,
    };
    
    // Set faker seed if consistent mode is enabled
    if (this.config.consistent && this.config.seed) {
      faker.seed(this.config.seed);
    }
  }

  async generateMockData(typeInfo: TypeInfo): Promise<any> {
    switch (typeInfo.kind) {
      case "interface":
        return await this.generateInterfaceData(typeInfo);
      case "array":
        return await this.generateArrayData(typeInfo);
      case "union":
        return await this.generateUnionData(typeInfo);
      case "primitive":
        return this.generatePrimitiveData(typeInfo);
      case "type":
        return await this.generateCustomTypeData(typeInfo);
      default:
        throw new Error(`Unsupported type kind: ${typeInfo.kind}`);
    }
  }

    private async generateInterfaceData(typeInfo: TypeInfo): Promise<any> {
    if (!typeInfo.properties) {
      throw new Error("Interface type must have properties");
    }

    const result: any = {};
    
    for (const property of typeInfo.properties) {
      // Handle optional properties
      if (property.isOptional && this.config.skipOptional) {
        if (Math.random() < this.config.skipOptionalProbability!) {
          continue;
        }
      }

      const value = await this.generateMockData(property.type);
      
      // Handle nullable properties
      if (property.isNullable && this.config.allowNull) {
        if (Math.random() < this.config.nullProbability!) {
          result[property.name] = null;
        } else {
          result[property.name] = value;
        }
      } else {
        result[property.name] = value;
      }
    }

    return result;
  }

  private async generateArrayData(typeInfo: TypeInfo): Promise<any[]> {
    if (!typeInfo.arrayType) {
      throw new Error("Array type must have arrayType");
    }

    const length = this.config.arrayLength || 3;
    const result: any[] = [];

    for (let i = 0; i < length; i++) {
      result.push(await this.generateMockData(typeInfo.arrayType));
    }

    return result;
  }

  private async generateUnionData(typeInfo: TypeInfo): Promise<any> {
    if (!typeInfo.unionTypes || typeInfo.unionTypes.length === 0) {
      throw new Error("Union type must have unionTypes");
    }

    // Pick a random union type
    const randomIndex = Math.floor(Math.random() * typeInfo.unionTypes.length);
    const selectedType = typeInfo.unionTypes[randomIndex];

    return await this.generateMockData(selectedType);
  }

  private generatePrimitiveData(typeInfo: TypeInfo): any {
    if (!typeInfo.primitiveType) {
      throw new Error("Primitive type must have primitiveType");
    }

    switch (typeInfo.primitiveType) {
      case "string":
        return faker.string.sample();
      case "number":
        return faker.number.int();
      case "boolean":
        return faker.datatype.boolean();
      case "Date":
        return faker.date.recent().toISOString();
      default:
        return faker.string.sample();
    }
  }

    private async generateCustomTypeData(typeInfo: TypeInfo): Promise<any> {
    const typeName = typeInfo.name.toLowerCase();
    
    // Check custom generators first
    if (
      this.config.customGenerators &&
      this.config.customGenerators[typeName]
    ) {
      return this.config.customGenerators[typeName]();
    }
    
    // For custom types, we need to resolve the actual type definition
    // and generate data based on its properties
    try {
      // Try to resolve the type to get its actual definition
      const resolvedType = await this.analyzer.resolveTypeByName(typeName);
      if (resolvedType && resolvedType.kind === "interface") {
        // Generate data based on the interface properties
        return this.generateInterfaceData(resolvedType);
      }
    } catch (error) {
      // If we can't resolve the type, fall back to field-based generation
    }
    
    // Try to find a field generator for this type name
    const fieldValue = this.getFieldValue(typeName);
    if (fieldValue !== null) {
      return fieldValue;
    }
    
    // Default to string for unknown types
    return faker.string.sample();
  }

  private getFieldValue(fieldName: string): any {
    // Check field generators first
    if (this.config.fieldGenerators && this.config.fieldGenerators[fieldName]) {
      return this.config.fieldGenerators[fieldName]();
    }
    
    // Check for partial matches in field generators
    if (this.config.fieldGenerators) {
      for (const [pattern, generator] of Object.entries(this.config.fieldGenerators)) {
        if (fieldName.includes(pattern) || pattern.includes(fieldName)) {
          return generator();
        }
      }
    }
    
    return null;
  }
}
