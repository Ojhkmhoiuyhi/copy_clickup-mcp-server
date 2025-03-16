import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  ErrorCode,
  ListResourceTemplatesRequestSchema,
  McpError,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { createClickUpClient } from '../clickup-client/index.js';
import { createListsClient } from '../clickup-client/lists.js';
import { createFoldersClient } from '../clickup-client/folders.js';

// Create clients
const clickUpClient = createClickUpClient();
const listsClient = createListsClient(clickUpClient);
const foldersClient = createFoldersClient(clickUpClient);

// URI patterns
const FOLDER_LISTS_URI_PATTERN = /^clickup:\/\/folder\/([^/]+)\/lists$/;
const SPACE_LISTS_URI_PATTERN = /^clickup:\/\/space\/([^/]+)\/lists$/;
const LIST_URI_PATTERN = /^clickup:\/\/list\/([^/]+)$/;

// Define list resources
export const LIST_RESOURCES = [
  {
    uri: 'clickup://list/901109776097',
    name: 'List details',
    mimeType: 'application/json',
    description: 'Details of a specific list',
  },
  {
    uri: 'clickup://folder/90115795569/lists',
    name: 'Folder lists',
    mimeType: 'application/json',
    description: 'Lists in a specific folder',
  },
  {
    uri: 'clickup://space/90113637923/lists',
    name: 'Space lists',
    mimeType: 'application/json',
    description: 'Lists in a specific space',
  }
];

export function setupListResources(server: Server): void {

  // Register the list of available resource templates
  server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => {
    return {
      resourceTemplates: [
        {
          uriTemplate: 'clickup://folder/{folder_id}/lists',
          name: 'Folder lists',
          mimeType: 'application/json',
          description: 'Lists in a specific folder',
        },
        {
          uriTemplate: 'clickup://space/{space_id}/lists',
          name: 'Space lists',
          mimeType: 'application/json',
          description: 'Folderless lists in a specific space',
        },
        {
          uriTemplate: 'clickup://list/{list_id}',
          name: 'List details',
          mimeType: 'application/json',
          description: 'Details of a specific list',
        },
      ],
    };
  });

  // Handle resource reads
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri;
    console.log(`[ListResources] Handling resource read for URI: ${uri}`);
    
    // Check if this is a folder lists resource
    const folderListsMatch = uri.match(FOLDER_LISTS_URI_PATTERN);
    if (folderListsMatch) {
      const folderId = folderListsMatch[1];
      console.log(`[ListResources] Matched folder lists pattern, folderId: ${folderId}`);
      const result = await handleFolderListsResource(folderId);
      console.log(`[ListResources] Result from handleFolderListsResource:`, result);
      return result;
    }
    
    // Check if this is a space lists resource
    const spaceListsMatch = uri.match(SPACE_LISTS_URI_PATTERN);
    if (spaceListsMatch) {
      const spaceId = spaceListsMatch[1];
      console.log(`[ListResources] Matched space lists pattern, spaceId: ${spaceId}`);
      const result = await handleSpaceListsResource(spaceId);
      console.log(`[ListResources] Result from handleSpaceListsResource:`, result);
      return result;
    }
    
    // Check if this is a list resource
    const listMatch = uri.match(LIST_URI_PATTERN);
    if (listMatch) {
      const listId = listMatch[1];
      console.log(`[ListResources] Matched list pattern, listId: ${listId}`);
      const result = await handleListResource(listId);
      console.log(`[ListResources] Result from handleListResource:`, result);
      return result;
    }
    
    // If no match, return an empty object to let other handlers process it
    console.log(`[ListResources] No match for URI: ${uri}`);
    return {};
  });
}

async function handleFolderListsResource(folderId: string) {
  try {
    console.log(`[ListResources] Fetching lists for folder: ${folderId}`);
    const result = await foldersClient.getListsFromFolder(folderId);
    console.log(`[ListResources] Got lists:`, result);
    
    return {
      contents: [
        {
          uri: `clickup://folder/${folderId}/lists`,
          mimeType: 'application/json',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error: any) {
    console.error(`[ListResources] Error fetching folder lists:`, error);
    throw new McpError(
      ErrorCode.InternalError,
      `Error fetching folder lists: ${error.message}`
    );
  }
}

async function handleSpaceListsResource(spaceId: string) {
  try {
    console.log(`[ListResources] Fetching lists for space: ${spaceId}`);
    const result = await listsClient.getListsFromSpace(spaceId);
    console.log(`[ListResources] Got lists:`, result);
    
    return {
      contents: [
        {
          uri: `clickup://space/${spaceId}/lists`,
          mimeType: 'application/json',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error: any) {
    console.error(`[ListResources] Error fetching space lists:`, error);
    throw new McpError(
      ErrorCode.InternalError,
      `Error fetching space lists: ${error.message}`
    );
  }
}

async function handleListResource(listId: string) {
  try {
    console.log(`[ListResources] Fetching list: ${listId}`);
    const list = await listsClient.getList(listId);
    console.log(`[ListResources] Got list:`, list);
    
    return {
      contents: [
        {
          uri: `clickup://list/${listId}`,
          mimeType: 'application/json',
          text: JSON.stringify(list, null, 2),
        },
      ],
    };
  } catch (error: any) {
    console.error(`[ListResources] Error fetching list:`, error);
    throw new McpError(
      ErrorCode.InternalError,
      `Error fetching list: ${error.message}`
    );
  }
}
