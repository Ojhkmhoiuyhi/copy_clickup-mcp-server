import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  ErrorCode,
  ListResourcesRequestSchema,
  ListResourceTemplatesRequestSchema,
  McpError,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { createClickUpClient } from '../clickup-client/index.js';
import { createSpacesClient } from '../clickup-client/spaces.js';

// Create clients
const clickUpClient = createClickUpClient();
const spacesClient = createSpacesClient(clickUpClient);

// URI patterns
const WORKSPACE_SPACES_URI_PATTERN = /^clickup:\/\/workspace\/([^/]+)\/spaces$/;
const SPACE_URI_PATTERN = /^clickup:\/\/space\/([^/]+)$/;

export function setupSpaceResources(server: Server): void {
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
          uriTemplate: 'clickup://workspace/{workspace_id}/spaces',
          name: 'Workspace spaces',
          mimeType: 'application/json',
          description: 'Spaces in a specific workspace',
        },
        {
          uriTemplate: 'clickup://space/{space_id}',
          name: 'Space details',
          mimeType: 'application/json',
          description: 'Details of a specific space',
        },
      ],
    };
  });

  // Handle resource reads
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri;
    console.log(`[SpaceResources] Handling resource read for URI: ${uri}`);
    
    // Check if this is a workspace spaces resource
    const workspaceSpacesMatch = uri.match(WORKSPACE_SPACES_URI_PATTERN);
    if (workspaceSpacesMatch) {
      const workspaceId = workspaceSpacesMatch[1];
      console.log(`[SpaceResources] Matched workspace spaces pattern, workspaceId: ${workspaceId}`);
      const result = await handleWorkspaceSpacesResource(workspaceId);
      console.log(`[SpaceResources] Result from handleWorkspaceSpacesResource:`, result);
      return result;
    }
    
    // Check if this is a space resource
    const spaceMatch = uri.match(SPACE_URI_PATTERN);
    if (spaceMatch) {
      const spaceId = spaceMatch[1];
      console.log(`[SpaceResources] Matched space pattern, spaceId: ${spaceId}`);
      const result = await handleSpaceResource(spaceId);
      console.log(`[SpaceResources] Result from handleSpaceResource:`, result);
      return result;
    }
    
    // If no match, return an empty object to let other handlers process it
    console.log(`[SpaceResources] No match for URI: ${uri}`);
    return {};
  });
}

async function handleWorkspaceSpacesResource(workspaceId: string) {
  try {
    console.log(`[SpaceResources] Fetching spaces for workspace: ${workspaceId}`);
    // The getSpacesFromWorkspace method returns an array of spaces directly
    const spaces = await spacesClient.getSpacesFromWorkspace(workspaceId);
    console.log(`[SpaceResources] Got spaces:`, spaces);
    
    // Return the spaces array directly, without wrapping it in an object
    // This matches the format used by the space tools
    const result = {
      contents: [
        {
          uri: `clickup://workspace/${workspaceId}/spaces`,
          mimeType: 'application/json',
          text: JSON.stringify(spaces, null, 2),
        },
      ],
    };
    console.log(`[SpaceResources] Returning result:`, result);
    return result;
  } catch (error: any) {
    console.error(`[SpaceResources] Error fetching workspace spaces:`, error);
    throw new McpError(
      ErrorCode.InternalError,
      `Error fetching workspace spaces: ${error.message}`
    );
  }
}

async function handleSpaceResource(spaceId: string) {
  try {
    console.log(`[SpaceResources] Fetching space: ${spaceId}`);
    const space = await spacesClient.getSpace(spaceId);
    console.log(`[SpaceResources] Got space:`, space);
    
    const result = {
      contents: [
        {
          uri: `clickup://space/${spaceId}`,
          mimeType: 'application/json',
          text: JSON.stringify(space, null, 2),
        },
      ],
    };
    console.log(`[SpaceResources] Returning result:`, result);
    return result;
  } catch (error: any) {
    console.error(`[SpaceResources] Error fetching space:`, error);
    throw new McpError(
      ErrorCode.InternalError,
      `Error fetching space: ${error.message}`
    );
  }
}
