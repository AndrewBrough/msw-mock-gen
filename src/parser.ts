import { ParsedURL } from './types';

export function parseURLsFromFile(content: string, filename: string): ParsedURL[] {
  const urls: ParsedURL[] = [];
  const lines = content.split('\n');
  
  // Enhanced regex to match URL patterns in various contexts
  const urlPatterns = [
    // String literals with URLs
    /['"`]([\/][^'"`]+)['"`]/g,
    // Object property assignments
    /:\s*['"`]([\/][^'"`]+)['"`]/g,
    // Array elements
    /['"`]([\/][^'"`]+)['"`],?/g
  ];
  
  lines.forEach((line, index) => {
    // Skip comments
    if (line.trim().startsWith('//') || line.trim().startsWith('/*')) {
      return;
    }
    
    urlPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(line)) !== null) {
        const url = match[1];
        
        // Include API-like paths and simple endpoint paths
        if (url.startsWith('/api/') || url.startsWith('/v1/') || url.startsWith('/v2/') || 
            (url.startsWith('/') && url.length > 1 && !url.includes('.'))) {
          // Check if this URL is already added
          const exists = urls.some(existing => existing.path === url);
          if (!exists) {
            urls.push({
              path: url,
              source: filename,
              line: index + 1
            });
          }
        }
      }
    });
  });
  
  return urls;
}

export function generateMSWHandlers(urls: ParsedURL[]): string {
  if (urls.length === 0) {
    return `import { http, HttpResponse } from 'msw';

export const handlers = [
  // No API endpoints found
];`;
  }

  // Deduplicate URLs by path
  const uniqueUrls = urls.filter((url, index, self) => 
    index === self.findIndex(u => u.path === url.path)
  );

  const handlers = uniqueUrls.map(url => {
    const method = url.method || 'all';
    return `  http.${method}('${url.path}', () => {
    return HttpResponse.json({
      message: 'Mock response for ${url.path}',
      timestamp: new Date().toISOString()
    });
  })`;
  });
  
  return `import { http, HttpResponse } from 'msw';

export const handlers = [
${handlers.join(',\n')}
];`;
} 