# MSW Mock Generator

A Vite plugin that automatically generates MSW (Mock Service Worker) handlers from your API calls.

## Features

- Automatically detects API endpoints from your TypeScript/JavaScript files
- Generates separate handlers for queries and mutations
- Watches for file changes and regenerates handlers automatically
- Excludes navigation URLs and other non-API patterns
- Supports custom exclusion patterns

## Installation

```bash
npm install msw-mock-gen
```

## Usage

### Basic Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import mswMockGen from 'msw-mock-gen';

export default defineConfig({
  plugins: [
    mswMockGen({
      watchFolder: 'src/data',
      outputFolder: 'src/data/mocks',
      outputFileName: 'mswHandlers.generated'
    })
  ]
});
```

### Advanced Configuration with Exclusions

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import mswMockGen from 'msw-mock-gen';

export default defineConfig({
  plugins: [
    mswMockGen({
      watchFolder: 'src/data',
      outputFolder: 'src/data/mocks',
      outputFileName: 'mswHandlers.generated',
      excludePatterns: [
        // Navigation patterns
        'navigate({',
        'navigate({ to:',
        'to: "/',
        'router.push(',
        'router.navigate(',
        // Other common non-API URL patterns
        'href: "/',
        'pathname: "/',
        'redirect: "/',
        'location: "/'
      ]
    })
  ]
});
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `watchFolder` | `string` | `'data'` | Folder to watch for API endpoint definitions |
| `outputFolder` | `string` | `'src'` | Folder where generated handlers will be written |
| `outputFileName` | `string` | `'mswHandlers.generated'` | Base name for generated files |
| `excludePatterns` | `string[]` | `[]` | Array of patterns to exclude from URL detection |
| `quiet` | `boolean` | `true` | Whether to suppress console output (set to `false` for verbose logging) |

### Verbose Logging

To enable verbose logging and see all plugin activity, set `quiet: false`:

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import mswMockGen from 'msw-mock-gen';

export default defineConfig({
  plugins: [
    mswMockGen({
      watchFolder: 'src/data',
      outputFolder: 'src/data/mocks',
      outputFileName: 'mswHandlers.generated',
      quiet: false // Enable verbose logging
    })
  ]
});
```

### Exclude Patterns

The `excludePatterns` option allows you to specify patterns that should be excluded from URL detection. This is useful for filtering out navigation URLs, router paths, and other non-API endpoints.

Common patterns to exclude:
- `'navigate({'` - React Router navigation
- `'to: "/'` - Navigation destinations
- `'router.push('` - Router navigation methods
- `'href: "/'` - Link hrefs
- `'pathname: "/'` - Pathname assignments

## Generated Files

The plugin generates three files:

1. `queryHandlers.generated.ts` - Handlers for GET requests
2. `mutationHandlers.generated.ts` - Handlers for POST/PUT/DELETE requests
3. `mswHandlers.generated.ts` - Index file that combines all handlers

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
import { http, HttpResponse } from 'msw';

export const mutationHandlers = [
  http.post('/auth/login', () => {
    return HttpResponse.json({
      message: 'Mock response for /auth/login',
      timestamp: new Date().toISOString()
    });
  })
];
```

Note that the `/dashboard` URL from the navigation is excluded and not included in the generated handlers.