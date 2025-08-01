# Postman to API Generator

A powerful CLI tool that converts Postman collections into complete API service files with TypeScript/JavaScript support and Axios/Fetch integration.

## Features

- 🚀 **One-command generation** - Convert entire Postman collections instantly
- 📁 **Organized output** - Creates clean folder structure with one file per API group
- 🔒 **Authentication support** - Automatically generates auth wrappers for secured APIs
- 🎯 **Multiple clients** - Support for both Axios and Fetch API
- 📝 **TypeScript ready** - Full TypeScript support with proper type annotations
- ✨ **Prettier formatting** - All generated code is automatically formatted
- 🛠️ **Interactive mode** - Choose options via CLI prompts or flags

## Installation

```bash
npm install -g postman-to-api
```

Or use directly with npx:

```bash
npx postman-to-api ./collection.json --out ./src/api
```

## Quick Start

### Basic Usage

```bash
# Generate TypeScript API files with Axios
postman-to-api ./my-collection.json --out ./src/api --lang ts --client axios

# Generate JavaScript API files with Fetch
postman-to-api ./my-collection.json --out ./src/api --lang js --client fetch

# Interactive mode (prompts for options)
postman-to-api ./my-collection.json
```

### CLI Options

| Option             | Description                           | Default     | Values           |
| ------------------ | ------------------------------------- | ----------- | ---------------- |
| `<collection>`     | Path to Postman collection JSON file  | Required    | File path        |
| `--out, -o`        | Output directory for generated files  | `./src/api` | Directory path   |
| `--lang, -l`       | Programming language                  | `ts`        | `ts`, `js`       |
| `--client, -c`     | HTTP client library                   | `axios`     | `axios`, `fetch` |
| `--no-interactive` | Skip prompts and use provided options | `false`     | Boolean          |

## Generated Structure

```
src/api/
├── auth.ts              # Auth wrapper (if auth detected)
├── users.ts             # User management APIs
├── posts.ts             # Post-related APIs
├── comments.ts          # Comment APIs
└── index.ts             # Exports all services
```

## Example Output

### TypeScript + Axios

```typescript
import { apiClient } from './auth';

// Types
interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
}

export async function getUsers(): Promise<ApiResponse> {
  return await apiClient.get('/users');
}

export async function getUserById(id: string): Promise<ApiResponse> {
  return await apiClient.get(`/users/${id}`);
}

export async function createUser(data: any): Promise<ApiResponse> {
  return await apiClient.post('/users', { data });
}
```

### JavaScript + Fetch

```javascript
import { getAuthHeaders } from './auth';

export async function getUsers() {
  const url = '/users';
  const options = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  };

  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();

  return {
    data,
    status: response.status,
    statusText: response.statusText,
  };
}
```

### Authentication File (Axios)

```typescript
import axios, { AxiosInstance } from 'axios';

const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.API_BASE_URL || 'https://api.example.com',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  config => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      clearAuthToken();
    }
    return Promise.reject(error);
  }
);

function getAuthToken(): string | null {
  return localStorage.getItem('authToken');
}

function setAuthToken(token: string): void {
  localStorage.setItem('authToken', token);
}

function clearAuthToken(): void {
  localStorage.removeItem('authToken');
}

export { apiClient, setAuthToken, clearAuthToken, getAuthToken };
```

## Postman Collection Requirements

Your Postman collection should be exported as a JSON file. The tool supports:

- ✅ **Folders/Groups** - Organized into separate API files
- ✅ **Request methods** - GET, POST, PUT, PATCH, DELETE
- ✅ **Path parameters** - `{{userId}}` or `{userId}` format
- ✅ **Query parameters** - Automatically detected and included
- ✅ **Request bodies** - JSON, form-data, urlencoded
- ✅ **Authentication** - Bearer tokens, API keys
- ✅ **Environment variables** - Base URLs and common values

## Development

```bash
# Clone the repository
git clone <repo-url>
cd postman-to-api

# Install dependencies
npm install

# Build the project
npm run build

# Run in development
npm run dev ./examples/collection.json --out ./output

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format
```

## Examples

Check out the `examples/` directory for sample Postman collections and generated output.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## Changelog

### v1.0.0

- Initial release
- TypeScript and JavaScript support
- Axios and Fetch API support
- Authentication wrapper generation
- Interactive CLI prompts
- Prettier code formatting
