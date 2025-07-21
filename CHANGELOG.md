# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
