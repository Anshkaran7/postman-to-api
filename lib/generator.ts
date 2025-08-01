import * as fs from 'fs-extra';
import * as path from 'path';
import { Collection } from 'postman-collection';
import * as prettier from 'prettier';
import { GeneratorConfig, GenerationResult, ParsedCollection } from './types';
import { parseCollection } from './parser';
import {
  generateApiFile,
  generateAuthFile,
  generateIndexFile,
  generateBaseUrlFile,
  generateInstanceFile,
  generateRoutesFile,
  generateAuthFunctionsFile,
  generateApiFunctionsFile,
} from './templates';

export async function generateApiFiles(
  config: GeneratorConfig
): Promise<GenerationResult> {
  const generatedFiles: string[] = [];
  const warnings: string[] = [];

  try {
    // Parse Postman collection
    const collection = await parseCollection(config.collectionPath);

    // Ensure output directory exists
    await fs.ensureDir(config.outputDir);

    // Generate base URL file
    const baseUrlContent = generateBaseUrlFile(config, collection);
    const baseUrlPath = path.join(
      config.outputDir,
      `baseUrl.${config.language}`
    );
    await writeFormattedFile(baseUrlPath, baseUrlContent, config);
    generatedFiles.push(baseUrlPath);

    // Generate HTTP client instance file
    const instanceContent = generateInstanceFile(config, collection);
    const instancePath = path.join(
      config.outputDir,
      `instance.${config.language}`
    );
    await writeFormattedFile(instancePath, instanceContent, config);
    generatedFiles.push(instancePath);

    // Generate single routes file with all route definitions
    const routesContent = generateRoutesFile(config, collection);
    const routesPath = path.join(config.outputDir, `routes.${config.language}`);
    await writeFormattedFile(routesPath, routesContent, config);
    generatedFiles.push(routesPath);

    // Generate auth functions file if needed
    if (collection.hasAuth) {
      const authFunctionsContent = generateAuthFunctionsFile(
        config,
        collection
      );
      const authPath = path.join(config.outputDir, `auth.${config.language}`);
      await writeFormattedFile(authPath, authFunctionsContent, config);
      generatedFiles.push(authPath);
    }

    // Generate API function files for each folder
    for (const folder of collection.folders) {
      if (folder.requests.length === 0) {
        warnings.push(`Skipping empty folder: ${folder.name}`);
        continue;
      }

      // Skip auth folder since it's handled separately
      if (
        folder.name.toLowerCase().includes('auth') ||
        folder.name.toLowerCase().includes('login')
      ) {
        continue;
      }

      const apiFunctionsContent = generateApiFunctionsFile(
        config,
        folder,
        collection
      );
      const fileName = sanitizeFileName(folder.name);
      const filePath = path.join(
        config.outputDir,
        `${fileName}.${config.language}`
      );

      await writeFormattedFile(filePath, apiFunctionsContent, config);
      generatedFiles.push(filePath);
    }

    // Generate index file to export all services
    if (generatedFiles.length > 0) {
      const indexContent = generateIndexFile(config, collection);
      const indexPath = path.join(config.outputDir, `index.${config.language}`);
      await writeFormattedFile(indexPath, indexContent, config);
      generatedFiles.push(indexPath);
    }

    return {
      generatedFiles,
      warnings,
    };
  } catch (error) {
    throw new Error(
      `Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

async function writeFormattedFile(
  filePath: string,
  content: string,
  config: GeneratorConfig
): Promise<void> {
  try {
    // Format with Prettier
    const formattedContent = await prettier.format(content, {
      parser: config.language === 'ts' ? 'typescript' : 'babel',
      printWidth: 80,
      tabWidth: 2,
      semi: true,
      singleQuote: true,
      trailingComma: 'es5',
    });

    await fs.writeFile(filePath, formattedContent, 'utf-8');
  } catch (formatError) {
    // If formatting fails, write unformatted content
    await fs.writeFile(filePath, content, 'utf-8');
  }
}

function sanitizeFileName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .replace(/^(\d)/, '_$1'); // Prefix with underscore if starts with number
}
