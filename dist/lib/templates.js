"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateApiFile = generateApiFile;
exports.generateAuthFile = generateAuthFile;
exports.generateIndexFile = generateIndexFile;
exports.generateBaseUrlFile = generateBaseUrlFile;
exports.generateInstanceFile = generateInstanceFile;
exports.generateRoutesFile = generateRoutesFile;
exports.generateAuthFunctionsFile = generateAuthFunctionsFile;
exports.generateApiFunctionsFile = generateApiFunctionsFile;
// Helper function to check if URL contains URL-related placeholders
function containsUrlPlaceholder(url) {
    const urlPatterns = [
        /\{url\}/i,
        /\{baseurl\}/i,
        /\{base_url\}/i,
        /\{URL\}/i,
        /\{BASE_URL\}/i,
        /\{BASEURL\}/i,
        /\{\{url\}\}/i,
        /\{\{baseurl\}\}/i,
        /\{\{base_url\}\}/i,
        /\{\{URL\}\}/i,
        /\{\{BASE_URL\}\}/i,
        /\{\{BASEURL\}\}/i,
    ];
    return urlPatterns.some(pattern => pattern.test(url));
}
// Helper function to clean URL placeholders and make them usable
function cleanUrlPlaceholders(url) {
    return url
        .replace(/\{\{url\}\}/gi, '')
        .replace(/\{\{baseurl\}\}/gi, '')
        .replace(/\{\{base_url\}\}/gi, '')
        .replace(/\{\{URL\}\}/gi, '')
        .replace(/\{\{BASE_URL\}\}/gi, '')
        .replace(/\{\{BASEURL\}\}/gi, '')
        .replace(/\{url\}/gi, '')
        .replace(/\{baseurl\}/gi, '')
        .replace(/\{base_url\}/gi, '')
        .replace(/\{URL\}/gi, '')
        .replace(/\{BASE_URL\}/gi, '')
        .replace(/\{BASEURL\}/gi, '')
        .replace(/\/+/g, '/') // Clean up multiple slashes
        .replace(/^\/+/, '/') // Ensure starts with single slash
        .replace(/\/+$/, ''); // Remove trailing slashes
}
function generateApiFile(config, folder, collection) {
    const isTypeScript = config.language === 'ts';
    const useAxios = config.httpClient === 'axios';
    const imports = generateImports(config, collection);
    const functions = folder.requests
        .map(request => generateApiFunction(config, request, collection))
        .join('\n\n');
    return `${imports}\n\n${functions}\n`;
}
function generateAuthFile(config, collection) {
    const isTypeScript = config.language === 'ts';
    const useAxios = config.httpClient === 'axios';
    if (useAxios) {
        return generateAxiosAuthFile(config);
    }
    else {
        return generateFetchAuthFile(config);
    }
}
function generateIndexFile(config, collection) {
    // Export core files
    let exports = `// Core configuration
export * from './baseUrl';
export * from './instance';
export * from './routes';
`;
    // Export auth functions if present
    if (collection.hasAuth) {
        exports += `\n// Authentication functions\nexport * from './auth';\n`;
    }
    // Export API function files for each folder
    const apiExports = collection.folders
        .filter(folder => folder.requests.length > 0)
        .filter(folder => !folder.name.toLowerCase().includes('auth') &&
        !folder.name.toLowerCase().includes('login'))
        .map(folder => {
        const fileName = sanitizeFileName(folder.name);
        return `export * from './${fileName}';`;
    })
        .join('\n');
    if (apiExports) {
        exports += `\n// API functions\n${apiExports}\n`;
    }
    return exports;
}
function generateImports(config, collection) {
    const isTypeScript = config.language === 'ts';
    const useAxios = config.httpClient === 'axios';
    let imports = '';
    if (useAxios) {
        if (collection.hasAuth) {
            imports += `import { apiClient } from './auth';\n`;
        }
        else {
            imports += `import axios from 'axios';\n`;
        }
    }
    if (isTypeScript) {
        imports += `\n// Types\ninterface ApiResponse<T = any> {\n  data: T;\n  status: number;\n  statusText: string;\n}\n`;
    }
    return imports;
}
function generateApiFunction(config, request, collection) {
    const isTypeScript = config.language === 'ts';
    const useAxios = config.httpClient === 'axios';
    const functionName = generateFunctionName(request.name);
    const method = request.method.toLowerCase();
    const hasBody = ['post', 'put', 'patch'].includes(method) && request.body;
    const hasQuery = Boolean(request.query && request.query.length > 0);
    // Generate parameters
    const params = [];
    // Path parameters
    const pathParams = extractPathParams(request.url);
    pathParams.forEach(param => {
        params.push(`${param}${isTypeScript ? ': string' : ''}`);
    });
    // Body parameter
    if (hasBody) {
        params.push(`data${isTypeScript ? ': any' : ''}`);
    }
    // Query parameters
    if (hasQuery) {
        params.push(`params${isTypeScript ? '?: Record<string, any>' : ''}`);
    }
    const paramString = params.join(', ');
    const returnType = isTypeScript ? ': Promise<ApiResponse>' : '';
    // Generate URL construction
    let urlConstruction = `'${processUrl(request.url)}'`;
    if (pathParams.length > 0) {
        pathParams.forEach(param => {
            urlConstruction = urlConstruction.replace(`{${param}}`, `\${${param}}`);
        });
        urlConstruction = '`' + urlConstruction.replace(/'/g, '') + '`';
    }
    // Generate request options
    const requestOptions = generateRequestOptions(config, request, hasBody, hasQuery);
    if (useAxios) {
        const client = collection.hasAuth ? 'apiClient' : 'axios';
        return `export async function ${functionName}(${paramString})${returnType} {
  return await ${client}.${method}(${urlConstruction}${requestOptions});
}`;
    }
    else {
        return generateFetchFunction(functionName, method, urlConstruction, requestOptions, paramString, returnType, collection);
    }
}
function generateRequestOptions(config, request, hasBody, hasQuery) {
    const useAxios = config.httpClient === 'axios';
    const options = [];
    if (hasBody && useAxios) {
        options.push('data');
    }
    if (hasQuery && useAxios) {
        options.push('params');
    }
    if (options.length === 0) {
        return '';
    }
    if (useAxios) {
        return `, { ${options.join(', ')} }`;
    }
    return '';
}
function generateFetchFunction(functionName, method, urlConstruction, requestOptions, paramString, returnType, collection) {
    const baseUrl = collection.baseUrl ? `'${collection.baseUrl}' + ` : '';
    return `export async function ${functionName}(${paramString})${returnType} {
  const url = ${baseUrl}${urlConstruction};
  const options${returnType ? ': RequestInit' : ''} = {
    method: '${method.toUpperCase()}',
    headers: {
      'Content-Type': 'application/json',
      ${collection.hasAuth ? '...getAuthHeaders(),' : ''}
    },${method !== 'get' && paramString.includes('data') ? '\n    body: JSON.stringify(data),' : ''}
  };

  const response = await fetch(url, options);
  
  if (!response.ok) {
    throw new Error(\`HTTP error! status: \${response.status}\`);
  }

  const data = await response.json();
  
  return {
    data,
    status: response.status,
    statusText: response.statusText,
  };
}`;
}
function generateAxiosAuthFile(config) {
    const isTypeScript = config.language === 'ts';
    return `import axios${isTypeScript ? ', { AxiosInstance }' : ''} from 'axios';

// Create axios instance with default config
const apiClient${isTypeScript ? ': AxiosInstance' : ''} = axios.create({
  baseURL: process.env.API_BASE_URL || 'https://api.example.com',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = \`Bearer \${token}\`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      clearAuthToken();
      // Redirect to login or refresh token
    }
    return Promise.reject(error);
  }
);

// Auth token management
function getAuthToken()${isTypeScript ? ': string | null' : ''} {
  return localStorage.getItem('authToken');
}

function setAuthToken(token${isTypeScript ? ': string' : ''})${isTypeScript ? ': void' : ''} {
  localStorage.setItem('authToken', token);
}

function clearAuthToken()${isTypeScript ? ': void' : ''} {
  localStorage.removeItem('authToken');
}

export { apiClient, setAuthToken, clearAuthToken, getAuthToken };
`;
}
function generateFetchAuthFile(config) {
    const isTypeScript = config.language === 'ts';
    return `// Auth token management
function getAuthToken()${isTypeScript ? ': string | null' : ''} {
  return localStorage.getItem('authToken');
}

function setAuthToken(token${isTypeScript ? ': string' : ''})${isTypeScript ? ': void' : ''} {
  localStorage.setItem('authToken', token);
}

function clearAuthToken()${isTypeScript ? ': void' : ''} {
  localStorage.removeItem('authToken');
}

// Get auth headers for fetch requests
function getAuthHeaders()${isTypeScript ? ': Record<string, string>' : ''} {
  const token = getAuthToken();
  return token ? { Authorization: \`Bearer \${token}\` } : {};
}

// Base fetch wrapper with auth
async function fetchWithAuth(
  url${isTypeScript ? ': string' : ''}, 
  options${isTypeScript ? ': RequestInit = {}' : ' = {}'}
)${isTypeScript ? ': Promise<Response>' : ''} {
  const authHeaders = getAuthHeaders();
  
  const finalOptions${isTypeScript ? ': RequestInit' : ''} = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...options.headers,
    },
  };

  const response = await fetch(url, finalOptions);
  
  if (response.status === 401) {
    clearAuthToken();
    // Handle unauthorized access
    throw new Error('Unauthorized access');
  }

  return response;
}

export { setAuthToken, clearAuthToken, getAuthToken, getAuthHeaders, fetchWithAuth };
`;
}
function generateFunctionName(requestName) {
    return requestName
        .replace(/[^a-zA-Z0-9]/g, ' ')
        .split(' ')
        .filter(word => word.length > 0)
        .map((word, index) => index === 0
        ? word.toLowerCase()
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('');
}
function extractPathParams(url) {
    // First clean the URL similar to how we do in route generation
    let cleanUrl = url
        .replace(/\{\{base_url\}\}/g, '')
        .replace(/\{\{baseUrl\}\}/g, '')
        .replace(/\{\{apiVersion\}\}/g, '');
    // Convert double braces to single braces for remaining parameters
    cleanUrl = cleanUrl.replace(/\{\{([^}]+)\}\}/g, '{$1}');
    // Clean URL placeholders that should not be treated as path parameters
    cleanUrl = cleanUrl
        .replace(/\{url\}/gi, '')
        .replace(/\{baseurl\}/gi, '')
        .replace(/\{base_url\}/gi, '')
        .replace(/\{URL\}/gi, '')
        .replace(/\{BASE_URL\}/gi, '')
        .replace(/\{BASEURL\}/gi, '');
    // Now extract single-brace parameters (only actual path parameters)
    const matches = cleanUrl.match(/\{([^}]+)\}/g);
    if (!matches)
        return [];
    return matches.map(match => match.slice(1, -1));
}
function processUrl(url) {
    // Remove base URL if it looks like a full URL
    try {
        const urlObj = new URL(url);
        return urlObj.pathname + urlObj.search;
    }
    catch {
        // If not a valid URL, return as is
        return url;
    }
}
function sanitizeFileName(name) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .replace(/^(\d)/, '_$1');
}
// NEW TEMPLATE FUNCTIONS FOR RESTRUCTURED OUTPUT
function generateBaseUrlFile(config, collection) {
    const isTypeScript = config.language === 'ts';
    const baseUrl = collection.baseUrl || 'https://api.example.com';
    return `// Base URL configuration
const BASE_URL${isTypeScript ? ': string' : ''} = process.env.API_BASE_URL || '${baseUrl}';

export function getBaseUrl()${isTypeScript ? ': string' : ''} {
  return BASE_URL;
}

export function setBaseUrl(url${isTypeScript ? ': string' : ''})${isTypeScript ? ': void' : ''} {
  if (typeof process !== 'undefined' && process.env) {
    process.env.API_BASE_URL = url;
  }
}

export default BASE_URL;
`;
}
function generateInstanceFile(config, collection) {
    const isTypeScript = config.language === 'ts';
    const useAxios = config.httpClient === 'axios';
    if (useAxios) {
        return `import axios${isTypeScript ? ', { AxiosInstance }' : ''} from 'axios';
import { getBaseUrl } from './baseUrl';

// Create axios instance with default config
const apiInstance${isTypeScript ? ': AxiosInstance' : ''} = axios.create({
  baseURL: getBaseUrl(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiInstance.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = \`Bearer \${token}\`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuthToken();
    }
    return Promise.reject(error);
  }
);

// Auth token management
function getAuthToken()${isTypeScript ? ': string | null' : ''} {
  return localStorage.getItem('authToken');
}

function setAuthToken(token${isTypeScript ? ': string' : ''})${isTypeScript ? ': void' : ''} {
  localStorage.setItem('authToken', token);
}

function clearAuthToken()${isTypeScript ? ': void' : ''} {
  localStorage.removeItem('authToken');
}

export { apiInstance, setAuthToken, clearAuthToken, getAuthToken };
`;
    }
    else {
        return `import { getBaseUrl } from './baseUrl';

// Auth token management
function getAuthToken()${isTypeScript ? ': string | null' : ''} {
  return localStorage.getItem('authToken');
}

function setAuthToken(token${isTypeScript ? ': string' : ''})${isTypeScript ? ': void' : ''} {
  localStorage.setItem('authToken', token);
}

function clearAuthToken()${isTypeScript ? ': void' : ''} {
  localStorage.removeItem('authToken');
}

// Get auth headers for fetch requests
function getAuthHeaders()${isTypeScript ? ': Record<string, string>' : ''} {
  const token = getAuthToken();
  return token ? { Authorization: \`Bearer \${token}\` } : {};
}

// Base fetch wrapper
async function fetchWithAuth(
  url${isTypeScript ? ': string' : ''}, 
  options${isTypeScript ? ': RequestInit = {}' : ' = {}'}
)${isTypeScript ? ': Promise<Response>' : ''} {
  const authHeaders = getAuthHeaders();
  const baseUrl = getBaseUrl();
  
  const finalOptions${isTypeScript ? ': RequestInit' : ''} = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...options.headers,
    },
  };

  const response = await fetch(\`\${baseUrl}\${url}\`, finalOptions);
  
  if (response.status === 401) {
    clearAuthToken();
    throw new Error('Unauthorized access');
  }

  return response;
}

export { setAuthToken, clearAuthToken, getAuthToken, getAuthHeaders, fetchWithAuth };
`;
    }
}
function generateRoutesFile(config, collection) {
    const isTypeScript = config.language === 'ts';
    let routes = '';
    collection.folders.forEach(folder => {
        if (folder.requests.length === 0)
            return;
        routes += `\n// ${folder.name} Routes\n`;
        folder.requests.forEach(request => {
            const routeName = generateFunctionName(request.name);
            let path = processUrl(request.url);
            // Clean URL placeholders if they exist
            if (containsUrlPlaceholder(request.url)) {
                path = cleanUrlPlaceholders(path);
            }
            // Clean up variable substitutions - remove {{base_url}} and {{baseUrl}}
            path = path
                .replace(/\{\{base_url\}\}/g, '')
                .replace(/\{\{baseUrl\}\}/g, '')
                .replace(/\{\{apiVersion\}\}/g, '/v1');
            // Convert double braces {{param}} to single braces {param} for path parameters (except base_url)
            path = path.replace(/\{\{([^}]+)\}\}/g, '{$1}');
            // Clean up multiple slashes and ensure proper path format
            path = path.replace(/\/+/g, '/');
            if (!path.startsWith('/'))
                path = '/' + path;
            const method = request.method.toUpperCase();
            routes += `export const ${routeName.toUpperCase()}_ROUTE${isTypeScript ? ': string' : ''} = '${path}';\n`;
            routes += `export const ${routeName.toUpperCase()}_METHOD${isTypeScript ? ': string' : ''} = '${method}';\n`;
        });
    });
    return `// All API route definitions

${routes}

// Route helper functions
export function buildRoute(route${isTypeScript ? ': string' : ''}, params${isTypeScript ? '?: Record<string, any>' : ''})${isTypeScript ? ': string' : ''} {
  if (!params) return route;
  
  let finalRoute = route;
  Object.keys(params).forEach(key => {
    finalRoute = finalRoute.replace(\`{\${key}}\`, params[key]);
  });
  
  return finalRoute;
}
`;
}
function generateAuthFunctionsFile(config, collection) {
    const isTypeScript = config.language === 'ts';
    const useAxios = config.httpClient === 'axios';
    const authFolder = collection.folders.find(folder => folder.name.toLowerCase().includes('auth') ||
        folder.name.toLowerCase().includes('login'));
    if (!authFolder) {
        return `// No authentication endpoints found in collection
export {};
`;
    }
    let functions = '';
    let routeImports = '';
    authFolder.requests.forEach(request => {
        const functionName = generateFunctionName(request.name);
        const routeConstName = `${functionName.toUpperCase()}_ROUTE`;
        routeImports += `  ${routeConstName},\n`;
        const hasBody = ['post', 'put', 'patch'].includes(request.method.toLowerCase()) &&
            request.body;
        functions +=
            generateFunctionWithTryCatch(config, request, functionName, hasBody, useAxios) + '\n\n';
    });
    const imports = useAxios
        ? `import { apiInstance } from './instance';`
        : `import { fetchWithAuth } from './instance';`;
    return `${imports}
import {
  buildRoute,
${routeImports}} from './routes';

${isTypeScript
        ? `// Types
interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  message?: string;
}
`
        : ''}
${functions}`;
}
function generateApiFunctionsFile(config, folder, collection) {
    const isTypeScript = config.language === 'ts';
    const useAxios = config.httpClient === 'axios';
    let functions = '';
    let routeImports = '';
    folder.requests.forEach(request => {
        const functionName = generateFunctionName(request.name);
        const routeConstName = `${functionName.toUpperCase()}_ROUTE`;
        routeImports += `  ${routeConstName},\n`;
        const hasBody = ['post', 'put', 'patch'].includes(request.method.toLowerCase()) &&
            request.body;
        functions +=
            generateFunctionWithTryCatch(config, request, functionName, hasBody, useAxios) + '\n\n';
    });
    const imports = useAxios
        ? `import { apiInstance } from './instance';`
        : `import { fetchWithAuth } from './instance';`;
    return `${imports}
import {
  buildRoute,
${routeImports}} from './routes';

${isTypeScript
        ? `// Types
interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  message?: string;
}
`
        : ''}
${functions}`;
}
function generateFunctionWithTryCatch(config, request, functionName, hasBody, useAxios) {
    const isTypeScript = config.language === 'ts';
    const method = request.method.toLowerCase();
    const hasQuery = Boolean(request.query && request.query.length > 0);
    // Generate parameters
    const params = [];
    const pathParams = extractPathParams(request.url);
    pathParams.forEach(param => {
        params.push(`${param}${isTypeScript ? ': string' : ''}`);
    });
    if (hasBody) {
        params.push(`data${isTypeScript ? ': any' : ''}`);
    }
    if (hasQuery) {
        params.push(`params${isTypeScript ? '?: Record<string, any>' : ''}`);
    }
    const paramString = params.join(', ');
    const returnType = isTypeScript ? ': Promise<ApiResponse>' : '';
    // Generate route constant name
    const routeConstName = `${functionName.toUpperCase()}_ROUTE`;
    // Build parameters object for buildRoute
    let routeParams = '';
    if (pathParams.length > 0) {
        const pathParamsObj = pathParams
            .map(param => `${param}: ${param}`)
            .join(', ');
        routeParams = `{ ${pathParamsObj} }`;
    }
    if (useAxios) {
        let axiosOptions = '';
        if (hasBody)
            axiosOptions += ', { data }';
        else if (hasQuery)
            axiosOptions += ', { params }';
        else if (hasBody && hasQuery)
            axiosOptions += ', { data, params }';
        return `export async function ${functionName}(${paramString})${returnType} {
  try {
    const route = buildRoute(${routeConstName}${routeParams ? `, ${routeParams}` : ''});
    const response = await apiInstance.${method}(route${axiosOptions});
    
    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText,
      message: 'Success'
    };
  } catch (error) {
    console.error('Error in ${functionName}:', error);
    const errorObj = error as any;
    throw {
      data: null,
      status: errorObj.response?.status || 500,
      statusText: errorObj.response?.statusText || 'Internal Server Error',
      message: errorObj.message || 'An error occurred'
    };
  }
}`;
    }
    else {
        const fetchOptions = `{
    method: '${method.toUpperCase()}',${hasBody ? '\n    body: JSON.stringify(data),' : ''}
  }`;
        return `export async function ${functionName}(${paramString})${returnType} {
  try {
    const route = buildRoute(${routeConstName}${routeParams ? `, ${routeParams}` : ''});
    const response = await fetchWithAuth(route, ${fetchOptions});
    
    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }

    const data = await response.json();
    
    return {
      data,
      status: response.status,
      statusText: response.statusText,
      message: 'Success'
    };
  } catch (error) {
    console.error('Error in ${functionName}:', error);
    const errorObj = error as any;
    throw {
      data: null,
      status: errorObj.status || 500,
      statusText: errorObj.statusText || 'Internal Server Error',
      message: errorObj.message || 'An error occurred'
    };
  }
}`;
    }
}
//# sourceMappingURL=templates.js.map