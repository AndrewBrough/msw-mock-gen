import type { Plugin } from 'vite';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { glob } from 'glob';
import { MSWMockGenOptions } from './types';
import { parseURLsFromFile, generateMSWHandlers } from './parser';

export type { MSWMockGenOptions } from './types';

export default function mswMockGen(options: MSWMockGenOptions = {}): Plugin {
  const {
    watchFolder = 'src/data/queries',
    outputFolder = 'src/data/queries/mocks',
    outputFileName = 'mswHandlers.generated',
    excludePatterns = [],
    quiet = true
  } = options;

  let projectRoot: string;

  const log = (...args: any[]) => {
    if (!quiet) {
      console.log(...args);
    }
  };

  const generateHandlers = async (root: string) => {
    const watchPath = join(root, watchFolder);
    const outputPath = join(root, outputFolder);
    
    if (!existsSync(watchPath)) {
      log(`MSW Mock Gen: Watch folder ${watchPath} does not exist`);
      return;
    }

    // Ensure output directory exists
    if (!existsSync(outputPath)) {
      mkdirSync(outputPath, { recursive: true });
    }

    // Find all TypeScript/JavaScript files in the watch folder
    const files = await glob('**/*.{ts,js,tsx,jsx}', { 
      cwd: watchPath,
      absolute: true,
      ignore: [`**/${outputFolder}/**`]
    });

    const allUrls: any[] = [];

    // Parse each file for URLs
    for (const file of files) {
      try {
        const content = readFileSync(file, 'utf-8');
        const urls = parseURLsFromFile(content, file, excludePatterns);
        allUrls.push(...urls);
      } catch (error) {
        console.error(`MSW Mock Gen: Error reading file ${file}:`, error);
      }
    }

    // Generate MSW handlers
    const handlers = generateMSWHandlers(allUrls);
    
    try {
      // Write query handlers
      const queryHandlersFile = join(outputPath, 'queryHandlers.generated.ts');
      writeFileSync(queryHandlersFile, handlers.queryHandlers, 'utf-8');
      
      // Write mutation handlers
      const mutationHandlersFile = join(outputPath, 'mutationHandlers.generated.ts');
      writeFileSync(mutationHandlersFile, handlers.mutationHandlers, 'utf-8');
      
      // Write index file
      const indexFile = join(outputPath, `${outputFileName}.ts`);
      writeFileSync(indexFile, handlers.indexFile, 'utf-8');
      
      log(`MSW Mock Gen: Generated handlers at ${outputPath} with ${allUrls.length} endpoints`);
    } catch (error) {
      console.error(`MSW Mock Gen: Error writing handlers files:`, error);
    }
  };

  return {
    name: 'msw-mock-gen',
    apply: 'serve',
    
    configResolved(config) {
      projectRoot = config.root;
    },

    configureServer(server) {
      log(`MSW Mock Gen: Watching ${watchFolder} for changes`);
      log(`MSW Mock Gen: Output will be written to ${outputFolder}`);

      // Generate initial handlers
      generateHandlers(projectRoot);

      // Watch for file changes and deletions, but exclude the output folder
      const watchPath = join(projectRoot, watchFolder);
      if (existsSync(watchPath)) {
        server.watcher.add(watchPath);
        const handleFileEvent = (file: string) => {
          // Check if the changed file is within the watchFolder or its subdirectories
          const normalizedFile = file.replace(/\\/g, '/'); // Normalize path separators
          const normalizedWatchPath = watchPath.replace(/\\/g, '/');
          
          // Skip changes to the output folder to prevent infinite loops
          if (normalizedFile.startsWith(normalizedWatchPath) && !normalizedFile.includes(outputFolder)) {
            log(`MSW Mock Gen: File changed: ${file}`);
            generateHandlers(projectRoot);
          }
        };

        server.watcher.on('change', (file) => handleFileEvent(file));
        server.watcher.on('unlink', (file) => handleFileEvent(file));
        server.watcher.on('add', (file) => handleFileEvent(file));
      }
    },

    buildStart() {
      log('MSW Mock Gen: Build started');
      generateHandlers(projectRoot);
    }
  };
} 