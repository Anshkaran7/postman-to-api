import * as fs from 'fs-extra';
import { Collection, Item, ItemGroup } from 'postman-collection';
import { ParsedCollection, PostmanFolder, PostmanRequest } from './types';

export async function parseCollection(
  collectionPath: string
): Promise<ParsedCollection> {
  try {
    const collectionData = await fs.readJson(collectionPath);
    const collection = new Collection(collectionData);

    const folders: PostmanFolder[] = [];
    let hasAuth = false;
    let baseUrl: string | undefined;

    // Check for collection-level auth
    if (collection.auth) {
      hasAuth = true;
    }

    // Extract base URL from collection variables or first request
    let baseVariable: any = null;
    if (collection.variables) {
      collection.variables.each((v: any) => {
        if (v.key === 'baseUrl' || v.key === 'base_url' || v.key === 'host') {
          baseVariable = v;
        }
      });
    }
    if (baseVariable) {
      baseUrl = baseVariable.value as string;
    }

    // Process items (can be folders or direct requests)
    const rootRequests: PostmanRequest[] = [];

    collection.items.each((item: Item | ItemGroup<Item>) => {
      if (item instanceof ItemGroup) {
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
      } else {
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
      } catch {
        // Ignore if URL parsing fails
      }
    }

    return {
      name: collection.name || 'Unnamed Collection',
      folders,
      hasAuth,
      baseUrl,
    };
  } catch (error) {
    throw new Error(
      `Failed to parse collection: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

function processFolderItems(folder: ItemGroup<Item>): PostmanRequest[] {
  const requests: PostmanRequest[] = [];

  folder.items.each((item: Item | ItemGroup<Item>) => {
    if (item instanceof ItemGroup) {
      // Recursively process nested folders
      const nestedRequests = processFolderItems(item);
      requests.push(...nestedRequests);
    } else {
      // Process single request item
      const request = processRequestItem(item);
      if (request) {
        requests.push(request);
      }
    }
  });

  return requests;
}

function processRequestItem(item: Item): PostmanRequest | null {
  if (!item.request) {
    return null;
  }

  const request = item.request;

  // Extract URL
  let url = '';
  if (typeof request.url === 'string') {
    url = request.url;
  } else if (request.url && typeof request.url === 'object') {
    url = request.url.toString();
  }

  // Extract headers
  const headers: Record<string, string> = {};
  if (request.headers) {
    request.headers.each((header: any) => {
      if (!header.disabled && header.key && header.value) {
        headers[header.key] = header.value;
      }
    });
  }

  // Extract query parameters
  const query: Array<{ key: string; value: string; disabled?: boolean }> = [];
  if (request.url && typeof request.url === 'object' && request.url.query) {
    request.url.query.each((param: any) => {
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
