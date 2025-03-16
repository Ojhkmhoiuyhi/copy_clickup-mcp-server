import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  ErrorCode,
  ListResourcesRequestSchema,
  ListResourceTemplatesRequestSchema,
  McpError,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { createClickUpClient } from '../clickup-client/index.js';
import { createFoldersClient } from '../clickup-client/folders.js';

// Create clients
const clickUpClient = createClickUpClient();
const foldersClient = createFoldersClient(clickUpClient);

// URI patterns
const SPACE_FOLDERS_URI_PATTERN = /^clickup:\/\/space\/([^/]+)\/folders$/;
const FOLDER_URI_PATTERN = /^clickup:\/\/folder\/([^/]+)$/;

export function setupFolderResources(server: Server): void {
  // Register the list of available resources
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
      resources: [],
    };
  });

  // Register the list of available resource templates
  server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => {
    return {
      resourceTemplates: [
        {
          uriTemplate: 'clickup://space/{space_id}/folders',
          name: 'Space folders',
          mimeType: 'application/json',
          description: 'Folders in a specific space',
        },
        {
          uriTemplate: 'clickup://folder/{folder_id}',
          name: 'Folder details',
          mimeType: 'application/json',
          description: 'Details of a specific folder',
        },
      ],
    };
  });

  // Handle resource reads
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri;
    console.log(`[FolderResources] Handling resource read for URI: ${uri}`);
    
    // Check if this is a space folders resource
    const spaceFoldersMatch = uri.match(SPACE_FOLDERS_URI_PATTERN);
    if (spaceFoldersMatch) {
      const spaceId = spaceFoldersMatch[1];
      console.log(`[FolderResources] Matched space folders pattern, spaceId: ${spaceId}`);
      const result = await handleSpaceFoldersResource(spaceId);
      console.log(`[FolderResources] Result from handleSpaceFoldersResource:`, result);
      return result;
    }
    
    // Check if this is a folder resource
    const folderMatch = uri.match(FOLDER_URI_PATTERN);
    if (folderMatch) {
      const folderId = folderMatch[1];
      console.log(`[FolderResources] Matched folder pattern, folderId: ${folderId}`);
      const result = await handleFolderResource(folderId);
      console.log(`[FolderResources] Result from handleFolderResource:`, result);
      return result;
    }
    
    // If no match, return an empty object to let other handlers process it
    console.log(`[FolderResources] No match for URI: ${uri}`);
    return {};
  });
}

async function handleSpaceFoldersResource(spaceId: string) {
  try {
    console.log(`[FolderResources] Fetching folders for space: ${spaceId}`);
    // The getFoldersFromSpace method already returns an object with a 'folders' property
    const foldersResponse = await foldersClient.getFoldersFromSpace(spaceId);
    console.log(`[FolderResources] Got folders:`, foldersResponse);
    
    return {
      contents: [
        {
          uri: `clickup://space/${spaceId}/folders`,
          mimeType: 'application/json',
          text: JSON.stringify(foldersResponse, null, 2),
        },
      ],
    };
  } catch (error: any) {
    console.error(`[FolderResources] Error fetching space folders:`, error);
    throw new McpError(
      ErrorCode.InternalError,
      `Error fetching space folders: ${error.message}`
    );
  }
}

async function handleFolderResource(folderId: string) {
  try {
    console.log(`[FolderResources] Fetching folder: ${folderId}`);
    // Note: The ClickUp API doesn't have a direct endpoint to get folder details
    // We would need to implement this in the foldersClient if API supports it
    // For now, return a placeholder response
    
    // Create a folder object with the ID and a message
    const folder = {
      id: folderId,
      message: "Folder details endpoint not available in ClickUp API"
    };
    
    return {
      contents: [
        {
          uri: `clickup://folder/${folderId}`,
          mimeType: 'application/json',
          text: JSON.stringify(folder, null, 2),
        },
      ],
    };
  } catch (error: any) {
    console.error(`[FolderResources] Error fetching folder:`, error);
    throw new McpError(
      ErrorCode.InternalError,
      `Error fetching folder: ${error.message}`
    );
  }
}
