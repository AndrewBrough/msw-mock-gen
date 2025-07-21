export interface TypeInfo {
  name: string;
  kind: "interface" | "type" | "union" | "array" | "primitive";
  properties?: PropertyInfo[];
  unionTypes?: TypeInfo[];
  arrayType?: TypeInfo;
  primitiveType?: string;
  isOptional?: boolean;
  isNullable?: boolean;
}

export interface PropertyInfo {
  name: string;
  type: TypeInfo;
  isOptional: boolean;
  isNullable: boolean;
}

export interface FileInfo {
  filePath: string;
  typeName: string;
  typeInfo: TypeInfo;
}

export interface MockDataConfig {
  /** Random seed for consistent results (default: 123) */
  seed?: number;
  /** Number of items to generate for arrays (default: 3) */
  arrayLength?: number;
  /** Custom generators for specific types */
  customGenerators?: Record<string, () => any>;
  /** Whether to skip optional properties (default: false) */
  skipOptional?: boolean;
  /** Probability of skipping optional properties (0-1, default: 0.3) */
  skipOptionalProbability?: number;
  /** Whether to allow null values for nullable properties (default: true) */
  allowNull?: boolean;
  /** Probability of setting nullable properties to null (0-1, default: 0.2) */
  nullProbability?: number;
  /** Custom field generators based on field name patterns */
  fieldGenerators?: Record<string, () => any>;
  /** Whether to use consistent data across runs (default: true) */
  consistent?: boolean;
}

export interface TypeFactoryOptions {
  /** Project root directory */
  projectRoot: string;
  /** Mock data configuration */
  config?: MockDataConfig;
  /** Whether to enable debug logging */
  debug?: boolean;
}
