# MSW Mock Generator

A Vite plugin that automatically generates [MSW (Mock Service Worker)](https://www.npmjs.com/package/msw) handlers from your API calls.

## Features

- Automatically detects API endpoints from your TypeScript/JavaScript files
- Generates separate handlers for queries and mutations
- Watches for file changes and regenerates handlers automatically
- Excludes navigation URLs and other non-API patterns
- Supports custom exclusion patterns
- **NEW**: Support for multiple watch/output folder configurations

## Installation

```bash
npm install msw-mock-gen
```

## Usage

### Basic Configuration

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import mswMockGen from "msw-mock-gen";

export default defineConfig({
  plugins: [
    mswMockGen({
      configs: [
        {
          watchFolder: "src/data",
          outputFolder: "src/data/mocks",
          outputFileName: "mswHandlers.generated",
        },
      ],
    }),
  ],
});
```

### Multiple Folder Configuration

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import mswMockGen from "msw-mock-gen";

export default defineConfig({
  plugins: [
    mswMockGen({
      configs: [
        {
          watchFolder: "src/data/queries",
          outputFolder: "src/data/queries/mocks",
          outputFileName: "mswHandlers.generated",
          excludePatterns: [
            // Navigation patterns
            "navigate({",
            'to: "/',
            "router.push(",
            // Other common non-API URL patterns
            'href: "/',
            'pathname: "/',
            'redirect: "/',
            'location: "/',
          ],
        },
        {
          watchFolder: "src/api",
          outputFolder: "src/api/mocks",
          outputFileName: "apiHandlers.generated",
          excludePatterns: [],
        },
      ],
      quiet: true,
    }),
  ],
});
```

### Merged Handlers Configuration

When using multiple configurations, you can merge all handlers into a single output location for easier integration with MSW:

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import mswMockGen from "msw-mock-gen";

export default defineConfig({
  plugins: [
    mswMockGen({
      configs: [
        {
          watchFolder: "src/data/queries",
          outputFolder: "src/data/mocks",
          outputFileName: "mswHandlers.generated",
          excludePatterns: ["navigate({", 'to: "/'],
        },
        {
          watchFolder: "src/api",
          outputFolder: "src/api/mocks",
          outputFileName: "apiHandlers.generated",
          excludePatterns: [],
        },
      ],
      // Merge all handlers into a single output location (default: true)
      mergeHandlers: true,
      // Top-level output folder for merged handlers (default: "src/mocks")
      outputFolder: "src/mocks",
      // Top-level output file name for merged handlers (default: "mswHandlers.generated")
      outputFileName: "mswHandlers.generated",
      quiet: false,
    }),
  ],
});
```

This configuration will:

1. Generate individual handler files in each config's `outputFolder`
2. Additionally create merged files at `src/mocks/` containing all handlers from all configs
3. The merged files will be:
   - `src/mocks/queryHandlers.generated.ts` - All query handlers from all configs
   - `src/mocks/mutationHandlers.generated.ts` - All mutation handlers from all configs
   - `src/mocks/mswHandlers.generated.ts` - Index file combining all handlers

This makes it easy to import all your MSW handlers in one place:

```typescript
// src/mocks/browser.ts
import { handlers } from "./mswHandlers.generated";
import { setupWorker } from "msw/browser";

export const worker = setupWorker(...handlers);
```

### Advanced Configuration with Exclusions

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import mswMockGen from "msw-mock-gen";

export default defineConfig({
  plugins: [
    mswMockGen({
      configs: [
        {
          watchFolder: "src/data",
          outputFolder: "src/data/mocks",
          outputFileName: "mswHandlers.generated",
          excludePatterns: [
            // Navigation patterns
            "navigate({",
            "navigate({ to:",
            'to: "/',
            "router.push(",
            "router.navigate(",
            // Other common non-API URL patterns
            'href: "/',
            'pathname: "/',
            'redirect: "/',
            'location: "/',
          ],
        },
      ],
      // Run prettier after generating handlers
      formatScript: "format",
    }),
  ],
});
```

## Configuration Options

### Top-level Options

| Option           | Type                 | Default                   | Description                                                                                   |
| ---------------- | -------------------- | ------------------------- | --------------------------------------------------------------------------------------------- |
| `configs`        | `MSWMockGenConfig[]` | `[]`                      | Array of configuration objects for different watch/output folder pairs                        |
| `quiet`          | `boolean`            | `true`                    | Whether to suppress console output (set to `false` for verbose logging)                       |
| `mergeHandlers`  | `boolean`            | `true`                    | Whether to merge all handlers from different configs into a single output                     |
| `outputFolder`   | `string`             | `'src/mocks'`             | Top-level output folder for merged handlers                                                   |
| `outputFileName` | `string`             | `'mswHandlers.generated'` | Top-level output file name for merged handlers                                                |
| `formatScript`   | `string`             | `undefined`               | Optional npm script to run after generating handlers (e.g., "format", "prettier", "lint:fix") |

### Individual Config Options

| Option            | Type       | Default                    | Description                                     |
| ----------------- | ---------- | -------------------------- | ----------------------------------------------- |
| `watchFolder`     | `string`   | `'src/data/queries'`       | Folder to watch for API endpoint definitions    |
| `outputFolder`    | `string`   | `'src/data/queries/mocks'` | Folder where generated handlers will be written |
| `outputFileName`  | `string`   | `'mswHandlers.generated'`  | Base name for generated files                   |
| `excludePatterns` | `string[]` | `[]`                       | Array of patterns to exclude from URL detection |

### Verbose Logging

To enable verbose logging and see all plugin activity, set `quiet: false`:

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import mswMockGen from "msw-mock-gen";

export default defineConfig({
  plugins: [
    mswMockGen({
      configs: [
        {
          watchFolder: "src/data",
          outputFolder: "src/data/mocks",
          outputFileName: "mswHandlers.generated",
        },
      ],
      quiet: false, // Enable verbose logging
    }),
  ],
});
```

### Format Script

The `formatScript` option allows you to run an npm script after generating handlers to format the code according to your project's standards. This is useful for ensuring consistent formatting with tools like Prettier, ESLint, or any custom formatting script.

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import mswMockGen from "msw-mock-gen";

export default defineConfig({
  plugins: [
    mswMockGen({
      configs: [
        {
          watchFolder: "src/data",
          outputFolder: "src/data/mocks",
          outputFileName: "mswHandlers.generated",
        },
      ],
      // Run prettier after generating handlers
      formatScript: "format",
    }),
  ],
});
```

Add the corresponding script to your `package.json`:

```json
{
  "scripts": {
    "format": "prettier --write src/mocks/*.generated.ts"
  },
  "devDependencies": {
    "prettier": "^3.0.0"
  }
}
```

The format script will run automatically after each handler generation, ensuring your generated files are properly formatted.

### Exclude Patterns

The `excludePatterns` option allows you to specify patterns that should be excluded from URL detection. This is useful for filtering out navigation URLs, router paths, and other non-API endpoints.

Common patterns to exclude:

- `'navigate({'` - React Router navigation
- `'to: "/'` - Navigation destinations
- `'router.push('` - Router navigation methods
- `'href: "/'` - Link hrefs
- `'pathname: "/'` - Pathname assignments

## Generated Files

For each configuration, the plugin generates three files:

1. `queryHandlers.generated.ts` - Handlers for GET requests
2. `mutationHandlers.generated.ts` - Handlers for POST/PUT/DELETE requests
3. `{outputFileName}.ts` - Index file that combines all handlers

When `mergeHandlers` is enabled (default), the plugin also generates merged files at the top-level output location:

1. `{outputFolder}/queryHandlers.generated.ts` - All query handlers from all configs
2. `{outputFolder}/mutationHandlers.generated.ts` - All mutation handlers from all configs
3. `{outputFolder}/{outputFileName}.ts` - Index file combining all handlers from all configs

## Example

Given a file with API calls:

```typescript
// src/data/mutations/LoginMutation/useLoginMutation.ts
export const useLoginMutation = () => {
  return useMutation({
    mutationFn: (variables) => {
      return fetch("/auth/login", {
        method: "POST",
        body: JSON.stringify(variables),
      }).then((res) => res.json());
    },
    onSuccess: (data) => {
      navigate({ to: "/dashboard", params: { data } }); // This will be excluded
    },
  });
};
```

The plugin will generate:

```typescript
// src/data/mocks/mutationHandlers.generated.ts
import { http, HttpResponse } from "msw";

export const mutationHandlers = [
  http.post("/auth/login", () => {
    return HttpResponse.json({
      message: "Mock response for /auth/login",
      timestamp: new Date().toISOString(),
    });
  }),
];
```

Note that the `/dashboard` URL from the navigation is excluded and not included in the generated handlers.
