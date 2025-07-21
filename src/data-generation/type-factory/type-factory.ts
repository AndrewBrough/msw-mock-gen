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

  generateMockData(typeInfo: TypeInfo): any {
    switch (typeInfo.kind) {
      case "interface":
        return this.generateInterfaceData(typeInfo);
      case "array":
        return this.generateArrayData(typeInfo);
      case "union":
        return this.generateUnionData(typeInfo);
      case "primitive":
        return this.generatePrimitiveData(typeInfo);
      case "type":
        return this.generateCustomTypeData(typeInfo);
      default:
        throw new Error(`Unsupported type kind: ${typeInfo.kind}`);
    }
  }

    private generateInterfaceData(typeInfo: TypeInfo): any {
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

      const value = this.generateMockData(property.type);
      
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

  private generateArrayData(typeInfo: TypeInfo): any[] {
    if (!typeInfo.arrayType) {
      throw new Error("Array type must have arrayType");
    }

    const length = this.config.arrayLength || 3;
    const result: any[] = [];

    for (let i = 0; i < length; i++) {
      result.push(this.generateMockData(typeInfo.arrayType));
    }

    return result;
  }

  private generateUnionData(typeInfo: TypeInfo): any {
    if (!typeInfo.unionTypes || typeInfo.unionTypes.length === 0) {
      throw new Error("Union type must have unionTypes");
    }

    // Pick a random union type
    const randomIndex = Math.floor(Math.random() * typeInfo.unionTypes.length);
    const selectedType = typeInfo.unionTypes[randomIndex];

    return this.generateMockData(selectedType);
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

    private generateCustomTypeData(typeInfo: TypeInfo): any {
    const typeName = typeInfo.name.toLowerCase();
    
    // Check custom generators first
    if (this.config.customGenerators && this.config.customGenerators[typeName]) {
      return this.config.customGenerators[typeName]();
    }
    
    // Handle specific known types
    if (typeName === "user") {
      return {
        id: this.getFieldValue("id"),
        email: this.getFieldValue("email"),
        firstName: this.getFieldValue("firstName"),
        lastName: this.getFieldValue("lastName"),
        role: this.getFieldValue("role"),
        organizationId: this.getFieldValue("organizationId"),
        createdAt: this.getFieldValue("createdAt"),
        updatedAt: this.getFieldValue("updatedAt"),
      };
    }
    
    if (typeName === "asset") {
      return {
        id: this.getFieldValue("id"),
        name: faker.commerce.productName(),
        type: faker.commerce.product(),
        manufacturer: this.getFieldValue("manufacturer"),
        model: this.getFieldValue("model"),
        serialNumber: this.getFieldValue("serialNumber"),
        location: this.getFieldValue("location"),
        status: this.getFieldValue("status"),
        createdAt: this.getFieldValue("createdAt"),
        updatedAt: this.getFieldValue("updatedAt"),
      };
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
