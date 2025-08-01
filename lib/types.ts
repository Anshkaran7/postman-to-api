export interface CLIOptions {
  out: string;
  lang: string;
  client: string;
  interactive: boolean;
}

export interface GeneratorConfig {
  collectionPath: string;
  outputDir: string;
  language: 'ts' | 'js';
  httpClient: 'axios' | 'fetch';
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface GenerationResult {
  generatedFiles: string[];
  warnings: string[];
}

export interface PostmanRequest {
  name: string;
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: any;
  auth?: any;
  query?: Array<{ key: string; value: string; disabled?: boolean }>;
}

export interface PostmanFolder {
  name: string;
  requests: PostmanRequest[];
}

export interface ParsedCollection {
  name: string;
  folders: PostmanFolder[];
  hasAuth: boolean;
  baseUrl?: string;
}

export interface ApiFunction {
  name: string;
  method: string;
  path: string;
  hasBody: boolean;
  hasQuery: boolean;
  description?: string;
  parameters: FunctionParameter[];
}

export interface FunctionParameter {
  name: string;
  type: string;
  required: boolean;
  description?: string;
} 