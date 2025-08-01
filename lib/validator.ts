import * as fs from 'fs-extra';
import * as path from 'path';
import { CLIOptions, ValidationResult } from './types';

export async function validateInputs(
  collectionPath: string,
  options: CLIOptions
): Promise<ValidationResult> {
  const errors: string[] = [];

  // Validate collection file
  try {
    if (!await fs.pathExists(collectionPath)) {
      errors.push(`Collection file not found: ${collectionPath}`);
    } else {
      const stats = await fs.stat(collectionPath);
      if (!stats.isFile()) {
        errors.push(`Collection path is not a file: ${collectionPath}`);
      } else if (path.extname(collectionPath).toLowerCase() !== '.json') {
        errors.push(`Collection file must be a JSON file: ${collectionPath}`);
      } else {
        // Validate JSON structure
        try {
          const content = await fs.readFile(collectionPath, 'utf-8');
          const parsed = JSON.parse(content);
          if (!parsed.info || !parsed.info.name) {
            errors.push('Invalid Postman collection: missing collection info');
          }
          if (!parsed.item && !parsed.items) {
            errors.push('Invalid Postman collection: no items found');
          }
        } catch (jsonError) {
          errors.push(`Invalid JSON file: ${collectionPath}`);
        }
      }
    }
  } catch (error) {
    errors.push(`Error accessing collection file: ${collectionPath}`);
  }

  // Validate language option
  if (!['ts', 'js', 'typescript', 'javascript'].includes(options.lang.toLowerCase())) {
    errors.push(`Invalid language option: ${options.lang}. Use 'ts' or 'js'`);
  }

  // Validate client option
  if (!['axios', 'fetch'].includes(options.client.toLowerCase())) {
    errors.push(`Invalid client option: ${options.client}. Use 'axios' or 'fetch'`);
  }

  // Validate output directory
  if (!options.out || options.out.trim() === '') {
    errors.push('Output directory cannot be empty');
  } else {
    try {
      const outputDir = path.resolve(options.out);
      const parentDir = path.dirname(outputDir);
      
      if (!await fs.pathExists(parentDir)) {
        errors.push(`Parent directory does not exist: ${parentDir}`);
      }
    } catch (error) {
      errors.push(`Invalid output directory path: ${options.out}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function normalizeLanguage(lang: string): 'ts' | 'js' {
  const normalized = lang.toLowerCase();
  if (normalized === 'typescript' || normalized === 'ts') {
    return 'ts';
  }
  return 'js';
}

export function normalizeClient(client: string): 'axios' | 'fetch' {
  return client.toLowerCase() === 'axios' ? 'axios' : 'fetch';
} 