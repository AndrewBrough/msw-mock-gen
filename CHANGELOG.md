# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Type Factory System**: Comprehensive mock data generation system using Faker.js
  - **TypeAnalyzer**: Parses TypeScript files and extracts type information from interfaces, types, and imports
  - **TypeFactory**: Generates realistic mock data based on type definitions with configurable behavior
  - **Smart Type Recognition**: Automatically recognizes common patterns (User, Asset, etc.) and generates appropriate data
  - **Array Support**: Generates arrays of mock objects with configurable length
  - **Union Type Support**: Randomly selects from union type options
  - **Import Resolution**: Handles imported types and type aliases across files
- **Configuration System**: Extensive configuration options for customizing mock data generation
  - **Preset Configurations**: Pre-built configs for different use cases (minimal, development, testing, production)
  - **Custom Field Generators**: Add custom generators for specific field name patterns
  - **Custom Type Generators**: Add custom generators for specific types
  - **Configurable Behavior**: Control optional/nullable property handling, array lengths, and data consistency
- **Field Pattern Recognition**: Intelligent field generation based on common naming patterns
  - ID fields (UUID generation)
  - Email fields (valid email addresses)
  - Name fields (firstName, lastName, fullName)
  - Role fields (admin, user, viewer)
  - Status fields (active, inactive, maintenance)
  - Date fields (createdAt, updatedAt)
  - Organization fields
  - Asset fields (manufacturer, model, serialNumber, location)
  - Address fields (city, state, country, zipCode)
  - Phone fields
  - URL fields
  - Description fields
  - Price fields
  - Code fields
- **Configuration Utilities**: Helper functions for creating and customizing configurations
  - `createMockConfig()`: Create custom configurations with defaults
  - `addFieldGenerators()`: Add custom field generators
  - `addCustomGenerators()`: Add custom type generators
  - `PRESET_CONFIGS`: Pre-built configurations for common scenarios
- **Test Script**: Added `npm run generate-mock` script for testing type factory functionality
- **Documentation**: Comprehensive README with configuration examples and usage patterns

### Changed

- **Enhanced Mock Data Generation**: Improved mock data quality with realistic, type-safe data generation
- **Better Type Safety**: Generated mock data now properly satisfies TypeScript type constraints
- **Configurable Data Consistency**: Option to use consistent seeds for reproducible results

## [1.0.4] - 2025-01-21

### Added

- **Mock data generation**: Automatically generates TypeScript mock data files for query and mutation hooks
- **Query/Mutation parsing**: Enhanced parser to detect and extract hook information from TypeScript files
- **Mock data file generation**: Creates `.mocks.gen.ts` files alongside original query/mutation files
- **Type-safe mock data**: Generated mock data files include proper TypeScript types based on hook return types
- **Automatic mock data integration**: Generated mock data is automatically imported and used in MSW handlers

### Changed

- **Dependency updates**: Updated all development dependencies to latest versions
  - TypeScript: ^4.5.0 → ^5.8.3
  - ESLint: ^8.0.0 → ^8.57.1
  - Prettier: ^2.0.0 → ^3.6.2
  - Vite: ^4.0.0 → ^5.4.19
  - Added ESLint Prettier integration and unused imports plugin
- **Enhanced code quality**: Improved ESLint and Prettier configurations for better code formatting
- **Example improvements**: Updated example project with comprehensive mock data generation examples

### Fixed

- **Exclude patterns**: Improved pattern matching for better query/mutation parsing
- **Code formatting**: Enhanced linting rules and formatting consistency across the project

## [1.0.3] - 2025-01-21

### Changed

- **Repository links**: Updated all GitHub repository links to point to the correct repository
- **Author information**: Updated author email address in package.json
- **Documentation**: Added changelog link to README for better discoverability

## [1.0.2] - 2025-01-21

### Changed

- **Repository links**: Updated all GitHub repository links to point to the correct repository
- **Author information**: Updated author email address in package.json
- **Documentation**: Added changelog link to README for better discoverability

## [1.0.1] - 2024-12-19

### Added

- **Multiple folder configuration support**: Now supports watching and generating handlers for multiple source folders simultaneously
- **Merged handlers configuration**: Option to merge all generated handlers into a single output location for easier MSW integration
- **Custom formatting support**: New `formatScript` option to run custom formatting commands after file generation
- **Enhanced cache handling**: Improved file cleaning and merged handler file updates with better cache management
- **Broader version compatibility**: Added minimum version support for broader compatibility with different TypeScript/Node.js versions
- **Enhanced exclude patterns**: More sophisticated URL exclusion patterns and configuration management
- **Improved logging**: Better logging for debugging and monitoring the generation process

### Changed

- **Configuration structure**: Updated to support multiple `configs` array instead of single configuration
- **Dependency updates**: Updated package dependencies for better compatibility and security
- **ESLint configuration**: Migrated from `eslint.config.js` to `.eslintrc.cjs` for better compatibility

### Fixed

- **File cleaning bugs**: Fixed issues with cleaning files and updating merged handler files
- **URL exclusion patterns**: Improved pattern matching for better API endpoint detection
- **Formatting command**: Updated and refined exclude patterns in configuration

### Examples

- Added comprehensive examples showing multiple paths and exported mock handlers
- Updated example configuration to demonstrate new multi-folder setup

## [1.0.0] - 2024-12-19

### Added

- Initial release of MSW Mock Generator
- Automatic API endpoint detection from TypeScript/JavaScript files
- Separate handler generation for queries and mutations
- File watching with automatic regeneration
- URL pattern exclusion for navigation and non-API patterns
- Custom exclusion pattern support
- Vite plugin integration
- TypeScript support
