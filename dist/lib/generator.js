"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateApiFiles = generateApiFiles;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const prettier = __importStar(require("prettier"));
const parser_1 = require("./parser");
const templates_1 = require("./templates");
async function generateApiFiles(config) {
    const generatedFiles = [];
    const warnings = [];
    try {
        // Parse Postman collection
        const collection = await (0, parser_1.parseCollection)(config.collectionPath);
        // Ensure output directory exists
        await fs.ensureDir(config.outputDir);
        // Generate base URL file
        const baseUrlContent = (0, templates_1.generateBaseUrlFile)(config, collection);
        const baseUrlPath = path.join(config.outputDir, `baseUrl.${config.language}`);
        await writeFormattedFile(baseUrlPath, baseUrlContent, config);
        generatedFiles.push(baseUrlPath);
        // Generate HTTP client instance file
        const instanceContent = (0, templates_1.generateInstanceFile)(config, collection);
        const instancePath = path.join(config.outputDir, `instance.${config.language}`);
        await writeFormattedFile(instancePath, instanceContent, config);
        generatedFiles.push(instancePath);
        // Generate single routes file with all route definitions
        const routesContent = (0, templates_1.generateRoutesFile)(config, collection);
        const routesPath = path.join(config.outputDir, `routes.${config.language}`);
        await writeFormattedFile(routesPath, routesContent, config);
        generatedFiles.push(routesPath);
        // Generate auth functions file if needed
        if (collection.hasAuth) {
            const authFunctionsContent = (0, templates_1.generateAuthFunctionsFile)(config, collection);
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
            if (folder.name.toLowerCase().includes('auth') ||
                folder.name.toLowerCase().includes('login')) {
                continue;
            }
            const apiFunctionsContent = (0, templates_1.generateApiFunctionsFile)(config, folder, collection);
            const fileName = sanitizeFileName(folder.name);
            const filePath = path.join(config.outputDir, `${fileName}.${config.language}`);
            await writeFormattedFile(filePath, apiFunctionsContent, config);
            generatedFiles.push(filePath);
        }
        // Generate index file to export all services
        if (generatedFiles.length > 0) {
            const indexContent = (0, templates_1.generateIndexFile)(config, collection);
            const indexPath = path.join(config.outputDir, `index.${config.language}`);
            await writeFormattedFile(indexPath, indexContent, config);
            generatedFiles.push(indexPath);
        }
        return {
            generatedFiles,
            warnings,
        };
    }
    catch (error) {
        throw new Error(`Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
async function writeFormattedFile(filePath, content, config) {
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
    }
    catch (formatError) {
        // If formatting fails, write unformatted content
        await fs.writeFile(filePath, content, 'utf-8');
    }
}
function sanitizeFileName(name) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .replace(/^(\d)/, '_$1'); // Prefix with underscore if starts with number
}
//# sourceMappingURL=generator.js.map