import { MockDataConfig, TypeFactoryOptions } from "./types";
import { DEFAULT_MOCK_CONFIG } from "./defaults";

/**
 * Create a custom mock data configuration by merging with defaults
 */
export function createMockConfig(overrides: Partial<MockDataConfig> = {}): MockDataConfig {
  return {
    ...DEFAULT_MOCK_CONFIG,
    ...overrides,
    // Deep merge field generators
    fieldGenerators: {
      ...DEFAULT_MOCK_CONFIG.fieldGenerators,
      ...overrides.fieldGenerators,
    },
    // Deep merge custom generators
    customGenerators: {
      ...DEFAULT_MOCK_CONFIG.customGenerators,
      ...overrides.customGenerators,
    },
  };
}

/**
 * Create type factory options with default configuration
 */
export function createTypeFactoryOptions(
  projectRoot: string,
  config?: Partial<MockDataConfig>,
  debug = false,
): TypeFactoryOptions {
  return {
    projectRoot,
    config: config ? createMockConfig(config) : DEFAULT_MOCK_CONFIG,
    debug,
  };
}

/**
 * Preset configurations for common use cases
 */
export const PRESET_CONFIGS = {
  /** Minimal configuration - just basic data generation */
  minimal: createMockConfig({
    arrayLength: 1,
    skipOptional: true,
    allowNull: false,
  }),

  /** Development configuration - more varied data */
  development: createMockConfig({
    arrayLength: 5,
    skipOptional: false,
    allowNull: true,
    nullProbability: 0.1,
  }),

  /** Testing configuration - consistent data for tests */
  testing: createMockConfig({
    seed: 42,
    arrayLength: 2,
    skipOptional: false,
    allowNull: false,
    consistent: true,
  }),

  /** Production-like configuration - realistic data */
  production: createMockConfig({
    arrayLength: 10,
    skipOptional: false,
    allowNull: true,
    nullProbability: 0.05,
    consistent: false,
  }),
} as const;

/**
 * Add custom field generators to an existing configuration
 */
export function addFieldGenerators(
  config: MockDataConfig,
  generators: Record<string, () => any>,
): MockDataConfig {
  return {
    ...config,
    fieldGenerators: {
      ...config.fieldGenerators,
      ...generators,
    },
  };
}

/**
 * Add custom type generators to an existing configuration
 */
export function addCustomGenerators(
  config: MockDataConfig,
  generators: Record<string, () => any>,
): MockDataConfig {
  return {
    ...config,
    customGenerators: {
      ...config.customGenerators,
      ...generators,
    },
  };
} 