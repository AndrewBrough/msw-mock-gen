# MSW Mock Generator

A vite plugin to generate handlers for MSW (Mock Service Worker). Watches a folder for changes, parses files for urls and updates mswHandlers.ts with a http.all handler for the found url with an empty object return data type.

## Features Spec

- vite plugin
- config: watch folder, output folder
- watches data folder for changes
- parses files for URL patterns (starting with /api/, /v1/, /v2/)
- generates MSW handlers with http.all and empty object responses
- TypeScript support with @data path alias

## Project Structure

```
msw-mock-gen/
├── src/
│   ├── index.ts          # Main plugin entry point
│   ├── types.ts          # TypeScript interfaces
│   └── parser.ts         # URL parsing and handler generation
├── example/              # Example project demonstrating usage
│   ├── src/
│   │   ├── main.ts       # Example entry point
│   │   └── data/
│   │       └── routes.ts # Example routes (uses @data alias)
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json     # TypeScript config with @data path alias
│   └── vite.config.ts    # Example Vite config using the plugin
├── package.json
└── tsconfig.json         # Plugin TypeScript config
```

## Development

The plugin is set up with:
- TypeScript configuration
- Vite plugin structure
- URL parsing logic
- MSW handler generation

To install dependencies and start development:
```bash
npm install
npm run dev
```

## Example Usage

The `example/` folder contains a complete example project that demonstrates:
- Using the MSW Mock Generator plugin
- TypeScript path aliases with `@data/*` using `vite-tsconfig-paths`
- Importing routes from the data folder

To run the example:
```bash
cd example
npm install
npm run dev
```

The example uses `vite-tsconfig-paths` to enable TypeScript path resolution in Vite, making the `@data/*` imports work seamlessly.