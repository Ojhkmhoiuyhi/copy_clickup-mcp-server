import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { createClickUpClient } from '../clickup-client/index.js';
import { createSpacesClient, Space } from '../clickup-client/spaces.js';

// Create clients
const clickUpClient = createClickUpClient();
const spacesClient = createSpacesClient(clickUpClient);

// Tool definitions
export const SPACE_TOOLS = [
  {
    name: 'get_spaces',
    description: 'Get the spaces in a workspace',
    inputSchema: {
      type: 'object',
      properties: {
        workspace_id: {
          type: 'string',
          description: 'The ID of the workspace to get spaces from',
        },
      },
      required: ['workspace_id'],
    },
  },
  {
    name: 'get_space',
    description: 'Get details of a specific space',
    inputSchema: {
      type: 'object',
      properties: {
        space_id: {
          type: 'string',
          description: 'The ID of the space to get',
        },
      },
      required: ['space_id'],
    },
  },
];

export function setupSpaceTools(server: Server): void {
  // Handle tool calls only - ListToolsRequestSchema is handled in index.ts
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const toolName = request.params.name;
    const args = request.params.arguments;

    // Check if this is one of our space tools
    const isSpaceTool = SPACE_TOOLS.some(tool => tool.name === toolName);
    if (!isSpaceTool) {
      // Not one of our tools, let other handlers process it
      return {};
    }

    try {
      switch (toolName) {
        case 'get_spaces':
          return await handleGetSpaces(args);
        case 'get_space':
          return await handleGetSpace(args);
        default:
          return {
            content: [
              {
                type: 'text',
                text: `Unknown space tool: ${toolName}`,
              },
            ],
            isError: true,
          };
      }
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  });
}

// Handler implementations

async function handleGetSpaces(args: any) {
  const { workspace_id } = args;
  
  if (!workspace_id) {
    throw new McpError(
      ErrorCode.InvalidParams,
      'workspace_id is required'
    );
  }
  
  try {
    console.log(`Getting spaces for workspace ${workspace_id}...`);
    const spaces = await spacesClient.getSpacesFromWorkspace(workspace_id);
    console.log(`Got ${spaces.length} spaces`);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(spaces, null, 2),
        },
      ],
    };
  } catch (error: any) {
    console.error('Error getting spaces:', error);
    return {
      content: [
        {
          type: 'text',
          text: `Error getting spaces: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}

async function handleGetSpace(args: any) {
  const { space_id } = args;
  
  if (!space_id) {
    throw new McpError(
      ErrorCode.InvalidParams,
      'space_id is required'
    );
  }
  
  try {
    console.log(`Getting space ${space_id}...`);
    const space = await spacesClient.getSpace(space_id);
    console.log(`Got space: ${space.name}`);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(space, null, 2),
        },
      ],
    };
  } catch (error: any) {
    console.error('Error getting space:', error);
    return {
      content: [
        {
          type: 'text',
          text: `Error getting space: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}
