# Type Factory

The Type Factory is a system for automatically generating mock data for TypeScript types using Faker.js.

## Features

- **Type Analysis**: Parses TypeScript files to extract type information
- **Mock Data Generation**: Generates realistic mock data based on type definitions
- **Import Resolution**: Handles imported types and type aliases
- **Array Support**: Generates arrays of mock data
- **Union Type Support**: Randomly selects from union type options
- **Custom Type Recognition**: Recognizes common patterns (User, Asset, etc.)

## Usage

### Basic Usage

```typescript
import { generateMockDataForFile } from "./type-factory";

// Generate mock data for a file
const mockData = await generateMockDataForFile(
  "path/to/your/file.ts",
  "/path/to/project/root",
);
```

### Generate for Specific Type

```typescript
import { generateMockDataForType } from "./type-factory";

// Generate mock data for a specific type
const mockData = await generateMockDataForType(
  "User",
  "export interface User { id: string; name: string; }",
  "/path/to/project/root",
);
```

## Supported Types

### Primitive Types

- `string` - Random string
- `number` - Random integer
- `boolean` - Random boolean
- `Date` - Recent date as ISO string

### Complex Types

- `User` - Generated user object with all User interface fields
- `Asset` - Generated asset object with all Asset interface fields
- Arrays - Generated array of mock objects
- Union types - Randomly selected from union options

### Field Pattern Recognition

The factory recognizes common field patterns:

- `id` fields → UUID
- `email` fields → Valid email
- `firstName`/`lastName` → Person names
- `role` → admin/user/viewer
- `status` → active/inactive/maintenance
- `createdAt`/`updatedAt` → Recent dates
- `organizationId` → UUID
- `manufacturer` → Company name
- `model` → Vehicle model
- `serialNumber` → Alphanumeric string
- `location` → City name

## Configuration

The type factory supports extensive configuration options for customizing mock data generation.

### Basic Configuration

```typescript
import { TypeFactory, TypeAnalyzer, createMockConfig } from "./type-factory";

const analyzer = new TypeAnalyzer(projectRoot);
const factory = new TypeFactory(analyzer, {
  seed: 123, // Consistent random seed
  arrayLength: 5, // Number of items in arrays
  skipOptional: false, // Whether to skip optional properties
  allowNull: true, // Whether to allow null values
  consistent: true, // Whether to use consistent data across runs
});
```

### Using Preset Configurations

```typescript
import { PRESET_CONFIGS, createMockConfig } from "./type-factory";

// Use a preset configuration
const config = PRESET_CONFIGS.development;

// Or customize a preset
const customConfig = createMockConfig({
  ...PRESET_CONFIGS.testing,
  arrayLength: 5,
  seed: 999,
});
```

### Available Presets

- **`minimal`**: Basic data generation with minimal arrays
- **`development`**: Varied data for development environments
- **`testing`**: Consistent data for reliable tests
- **`production`**: Realistic data for production-like scenarios

### Advanced Configuration

```typescript
import { createMockConfig, addFieldGenerators, addCustomGenerators } from "./type-factory";

// Create a custom configuration
const config = createMockConfig({
  seed: 42,
  arrayLength: 3,
  skipOptional: true,
  skipOptionalProbability: 0.5,
  allowNull: true,
  nullProbability: 0.1,
  consistent: true,
});

// Add custom field generators
const configWithCustomFields = addFieldGenerators(config, {
  customId: () => `custom-${Date.now()}`,
  priority: () => Math.floor(Math.random() * 5) + 1,
});

// Add custom type generators
const configWithCustomTypes = addCustomGenerators(config, {
  CustomType: () => ({ custom: true, timestamp: Date.now() }),
});
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `seed` | `number` | `123` | Random seed for consistent results |
| `arrayLength` | `number` | `3` | Number of items to generate for arrays |
| `skipOptional` | `boolean` | `false` | Whether to skip optional properties |
| `skipOptionalProbability` | `number` | `0.3` | Probability of skipping optional properties |
| `allowNull` | `boolean` | `true` | Whether to allow null values for nullable properties |
| `nullProbability` | `number` | `0.2` | Probability of setting nullable properties to null |
| `consistent` | `boolean` | `true` | Whether to use consistent data across runs |
| `customGenerators` | `Record<string, () => any>` | `{}` | Custom generators for specific types |
| `fieldGenerators` | `Record<string, () => any>` | `{}` | Custom generators for field name patterns |

## Integration

The type factory is designed to be integrated into the MSW mock generation plugin. It can be used to automatically populate generated mock files with realistic data.
