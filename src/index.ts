import type { Plugin } from 'vite';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { glob } from 'glob';
import { MSWMockGenOptions } from './types';
import { parseURLsFromFile, generateMSWHandlers } from './parser';

export type { MSWMockGenOptions } from './types';

export default function mswMockGen(options: MSWMockGenOptions = {}): Plugin {
  const {
    watchFolder = 'data',
    outputFolder = 'src'
  } = options;

  let projectRoot: string;

  const generateHandlers = async (root: string) => {
    const watchPath = join(root, watchFolder);
    const outputPath = join(root, outputFolder);
    
    if (!existsSync(watchPath)) {
      console.log(`MSW Mock Gen: Watch folder ${watchPath} does not exist`);
      return;
    }

    // Ensure output directory exists
    if (!existsSync(outputPath)) {
      mkdirSync(outputPath, { recursive: true });
    }

    // Find all TypeScript/JavaScript files in the watch folder
    const files = await glob('**/*.{ts,js,tsx,jsx}', { 
      cwd: watchPath,
      absolute: true 
    });

    const allUrls: any[] = [];

    // Parse each file for URLs
    for (const file of files) {
      try {
        const content = readFileSync(file, 'utf-8');
        const urls = parseURLsFromFile(content, file);
        allUrls.push(...urls);
      } catch (error) {
        console.error(`MSW Mock Gen: Error reading file ${file}:`, error);
      }
    }

    // Generate MSW handlers
    const handlersCode = generateMSWHandlers(allUrls);
    const outputFile = join(outputPath, 'msw-handlers.ts');
    
    try {
      writeFileSync(outputFile, handlersCode, 'utf-8');
      console.log(`MSW Mock Gen: Generated handlers at ${outputFile} with ${allUrls.length} endpoints`);
    } catch (error) {
      console.error(`MSW Mock Gen: Error writing handlers file:`, error);
    }
  };

  return {
    name: 'msw-mock-gen',
    apply: 'serve',
    
    configResolved(config) {
      projectRoot = config.root;
    },

    configureServer(server) {
      console.log(`MSW Mock Gen: Watching ${watchFolder} for changes`);
      console.log(`MSW Mock Gen: Output will be written to ${outputFolder}`);

      // Generate initial handlers
      generateHandlers(projectRoot);

      // Watch for file changes, but exclude the output folder
      const watchPath = join(projectRoot, watchFolder);
      if (existsSync(watchPath)) {
        server.watcher.add(watchPath);
        server.watcher.on('change', (file) => {
          // Check if the changed file is within the watchFolder or its subdirectories
          const normalizedFile = file.replace(/\\/g, '/'); // Normalize path separators
          const normalizedWatchPath = watchPath.replace(/\\/g, '/');
          
          // Skip changes to the output folder to prevent infinite loops
          if (normalizedFile.startsWith(normalizedWatchPath) && !normalizedFile.includes(outputFolder)) {
            console.log(`MSW Mock Gen: File changed: ${file}`);
            generateHandlers(projectRoot);
          }
        });
      }
    },

    buildStart() {
      console.log('MSW Mock Gen: Build started');
      generateHandlers(projectRoot);
    }
  };
} 