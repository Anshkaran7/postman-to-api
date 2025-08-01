import { CLIOptions, ValidationResult } from './types';
export declare function validateInputs(collectionPath: string, options: CLIOptions): Promise<ValidationResult>;
export declare function normalizeLanguage(lang: string): 'ts' | 'js';
export declare function normalizeClient(client: string): 'axios' | 'fetch';
//# sourceMappingURL=validator.d.ts.map