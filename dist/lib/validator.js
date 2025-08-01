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
exports.validateInputs = validateInputs;
exports.normalizeLanguage = normalizeLanguage;
exports.normalizeClient = normalizeClient;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
async function validateInputs(collectionPath, options) {
    const errors = [];
    // Validate collection file
    try {
        if (!await fs.pathExists(collectionPath)) {
            errors.push(`Collection file not found: ${collectionPath}`);
        }
        else {
            const stats = await fs.stat(collectionPath);
            if (!stats.isFile()) {
                errors.push(`Collection path is not a file: ${collectionPath}`);
            }
            else if (path.extname(collectionPath).toLowerCase() !== '.json') {
                errors.push(`Collection file must be a JSON file: ${collectionPath}`);
            }
            else {
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
                }
                catch (jsonError) {
                    errors.push(`Invalid JSON file: ${collectionPath}`);
                }
            }
        }
    }
    catch (error) {
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
    }
    else {
        try {
            const outputDir = path.resolve(options.out);
            const parentDir = path.dirname(outputDir);
            if (!await fs.pathExists(parentDir)) {
                errors.push(`Parent directory does not exist: ${parentDir}`);
            }
        }
        catch (error) {
            errors.push(`Invalid output directory path: ${options.out}`);
        }
    }
    return {
        isValid: errors.length === 0,
        errors
    };
}
function normalizeLanguage(lang) {
    const normalized = lang.toLowerCase();
    if (normalized === 'typescript' || normalized === 'ts') {
        return 'ts';
    }
    return 'js';
}
function normalizeClient(client) {
    return client.toLowerCase() === 'axios' ? 'axios' : 'fetch';
}
//# sourceMappingURL=validator.js.map