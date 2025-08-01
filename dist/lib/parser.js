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
exports.parseCollection = parseCollection;
const fs = __importStar(require("fs-extra"));
const postman_collection_1 = require("postman-collection");
async function parseCollection(collectionPath) {
    try {
        const collectionData = await fs.readJson(collectionPath);
        const collection = new postman_collection_1.Collection(collectionData);
        const folders = [];
        let hasAuth = false;
        let baseUrl;
        // Check for collection-level auth
        if (collection.auth) {
            hasAuth = true;
        }
        // Extract base URL from collection variables or first request
        let baseVariable = null;
        if (collection.variables) {
            collection.variables.each((v) => {
                if (v.key === 'baseUrl' || v.key === 'base_url' || v.key === 'host') {
                    baseVariable = v;
                }
            });
        }
        if (baseVariable) {
            baseUrl = baseVariable.value;
        }
        // Process items (can be folders or direct requests)
        const rootRequests = [];
        collection.items.each((item) => {
            if (item instanceof postman_collection_1.ItemGroup) {
                // It's a folder
                const folderRequests = processFolderItems(item);
                if (folderRequests.length > 0) {
                    folders.push({
                        name: item.name || 'Unnamed Folder',
                        requests: folderRequests,
                    });
                    // Check for auth in any request
                    if (!hasAuth && folderRequests.some(req => req.auth)) {
                        hasAuth = true;
                    }
                }
            }
            else {
                // It's a direct request in the root
                const request = processRequestItem(item);
                if (request) {
                    rootRequests.push(request);
                    if (!hasAuth && request.auth) {
                        hasAuth = true;
                    }
                }
            }
        });
        // If there are root requests, create a default folder
        if (rootRequests.length > 0) {
            folders.unshift({
                name: 'Root',
                requests: rootRequests,
            });
        }
        // Try to extract base URL from first request if not found in variables
        if (!baseUrl && folders.length > 0 && folders[0].requests.length > 0) {
            const firstUrl = folders[0].requests[0].url;
            try {
                const url = new URL(firstUrl);
                baseUrl = `${url.protocol}//${url.host}`;
            }
            catch {
                // Ignore if URL parsing fails
            }
        }
        return {
            name: collection.name || 'Unnamed Collection',
            folders,
            hasAuth,
            baseUrl,
        };
    }
    catch (error) {
        throw new Error(`Failed to parse collection: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
function processFolderItems(folder) {
    const requests = [];
    folder.items.each((item) => {
        if (item instanceof postman_collection_1.ItemGroup) {
            // Recursively process nested folders
            const nestedRequests = processFolderItems(item);
            requests.push(...nestedRequests);
        }
        else {
            // Process single request item
            const request = processRequestItem(item);
            if (request) {
                requests.push(request);
            }
        }
    });
    return requests;
}
function processRequestItem(item) {
    if (!item.request) {
        return null;
    }
    const request = item.request;
    // Extract URL
    let url = '';
    if (typeof request.url === 'string') {
        url = request.url;
    }
    else if (request.url && typeof request.url === 'object') {
        url = request.url.toString();
    }
    // Extract headers
    const headers = {};
    if (request.headers) {
        request.headers.each((header) => {
            if (!header.disabled && header.key && header.value) {
                headers[header.key] = header.value;
            }
        });
    }
    // Extract query parameters
    const query = [];
    if (request.url && typeof request.url === 'object' && request.url.query) {
        request.url.query.each((param) => {
            query.push({
                key: param.key || '',
                value: param.value || '',
                disabled: param.disabled,
            });
        });
    }
    // Extract auth
    let auth = null;
    if (request.auth) {
        auth = request.auth;
    }
    // Extract body
    let body = null;
    if (request.body && request.body.mode) {
        switch (request.body.mode) {
            case 'raw':
                body = request.body.raw;
                break;
            case 'urlencoded':
                body = request.body.urlencoded;
                break;
            case 'formdata':
                body = request.body.formdata;
                break;
            case 'file':
                body = request.body.file;
                break;
        }
    }
    return {
        name: item.name || 'Unnamed Request',
        method: (request.method || 'GET').toUpperCase(),
        url,
        headers,
        body,
        auth,
        query,
    };
}
//# sourceMappingURL=parser.js.map