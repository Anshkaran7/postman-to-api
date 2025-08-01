import { GeneratorConfig, PostmanFolder, ParsedCollection } from './types';
export declare function generateApiFile(config: GeneratorConfig, folder: PostmanFolder, collection: ParsedCollection): string;
export declare function generateAuthFile(config: GeneratorConfig, collection: ParsedCollection): string;
export declare function generateIndexFile(config: GeneratorConfig, collection: ParsedCollection): string;
export declare function generateBaseUrlFile(config: GeneratorConfig, collection: ParsedCollection): string;
export declare function generateInstanceFile(config: GeneratorConfig, collection: ParsedCollection): string;
export declare function generateRoutesFile(config: GeneratorConfig, collection: ParsedCollection): string;
export declare function generateAuthFunctionsFile(config: GeneratorConfig, collection: ParsedCollection): string;
export declare function generateApiFunctionsFile(config: GeneratorConfig, folder: PostmanFolder, collection: ParsedCollection): string;
//# sourceMappingURL=templates.d.ts.map