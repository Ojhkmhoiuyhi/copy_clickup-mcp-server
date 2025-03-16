import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { createClickUpClient } from '../clickup-client/index.js';
import { createChecklistsClient, Checklist, ChecklistItem, CreateChecklistParams, UpdateChecklistParams, CreateChecklistItemParams, UpdateChecklistItemParams } from '../clickup-client/checklists.js';

// Create clients
const clickUpClient = createClickUpClient();
const checklistsClient = createChecklistsClient(clickUpClient);

// Tool definitions
export const CHECKLIST_TOOLS = [
  {
    name: 'create_checklist',
    description: 'Create a new checklist in a task',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: {
          type: 'string',
          description: 'The ID of the task to create the checklist in',
        },
        name: {
          type: 'string',
          description: 'The name of the checklist',
        },
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'The name of the checklist item',
              },
              assignee: {
                type: 'number',
                description: 'The ID of the user to assign to the checklist item',
              },
              resolved: {
                type: 'boolean',
                description: 'Whether the checklist item is resolved',
              },
            },
            required: ['name'],
          },
          description: 'The items to add to the checklist',
        },
      },
      required: ['task_id', 'name'],
    },
  },
  {
    name: 'update_checklist',
    description: 'Update an existing checklist',
    inputSchema: {
      type: 'object',
      properties: {
        checklist_id: {
          type: 'string',
          description: 'The ID of the checklist to update',
        },
        name: {
          type: 'string',
          description: 'The new name of the checklist',
        },
      },
      required: ['checklist_id', 'name'],
    },
  },
  {
    name: 'delete_checklist',
    description: 'Delete a checklist',
    inputSchema: {
      type: 'object',
      properties: {
        checklist_id: {
          type: 'string',
          description: 'The ID of the checklist to delete',
        },
      },
      required: ['checklist_id'],
    },
  },
  {
    name: 'create_checklist_item',
    description: 'Create a new checklist item in a checklist',
    inputSchema: {
      type: 'object',
      properties: {
        checklist_id: {
          type: 'string',
          description: 'The ID of the checklist to create the item in',
        },
        name: {
          type: 'string',
          description: 'The name of the checklist item',
        },
        assignee: {
          type: 'number',
          description: 'The ID of the user to assign to the checklist item',
        },
        resolved: {
          type: 'boolean',
          description: 'Whether the checklist item is resolved',
        },
      },
      required: ['checklist_id', 'name'],
    },
  },
  {
    name: 'update_checklist_item',
    description: 'Update an existing checklist item',
    inputSchema: {
      type: 'object',
      properties: {
        checklist_id: {
          type: 'string',
          description: 'The ID of the checklist containing the item',
        },
        checklist_item_id: {
          type: 'string',
          description: 'The ID of the checklist item to update',
        },
        name: {
          type: 'string',
          description: 'The new name of the checklist item',
        },
        assignee: {
          type: 'number',
          description: 'The ID of the user to assign to the checklist item',
        },
        resolved: {
          type: 'boolean',
          description: 'Whether the checklist item is resolved',
        },
      },
      required: ['checklist_id', 'checklist_item_id'],
    },
  },
  {
    name: 'delete_checklist_item',
    description: 'Delete a checklist item',
    inputSchema: {
      type: 'object',
      properties: {
        checklist_id: {
          type: 'string',
          description: 'The ID of the checklist containing the item',
        },
        checklist_item_id: {
          type: 'string',
          description: 'The ID of the checklist item to delete',
        },
      },
      required: ['checklist_id', 'checklist_item_id'],
    },
  },
];

export function setupChecklistTools(server: Server): (request: any) => Promise<any> {
  // Return the handler function instead of registering it directly
  const checklistToolHandler = async (request: any) => {
    const toolName = request.params.name;
    const args = request.params.arguments;

    try {
      switch (toolName) {
        case 'create_checklist':
          return await handleCreateChecklist(args);
        case 'update_checklist':
          return await handleUpdateChecklist(args);
        case 'delete_checklist':
          return await handleDeleteChecklist(args);
        case 'create_checklist_item':
          return await handleCreateChecklistItem(args);
        case 'update_checklist_item':
          return await handleUpdateChecklistItem(args);
        case 'delete_checklist_item':
          return await handleDeleteChecklistItem(args);
        default:
          return {
            content: [
              {
                type: 'text',
                text: `Unknown checklist tool: ${toolName}`,
              },
            ],
            isError: true,
          };
      }
    } catch (error: any) {
      console.error(`Error in checklist tool ${toolName}:`, error);
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
  };

  return checklistToolHandler;
}

// Handler implementations

async function handleCreateChecklist(args: any) {
  const { task_id, ...checklistParams } = args;
  
  if (!task_id) {
    throw new McpError(
      ErrorCode.InvalidParams,
      'task_id is required'
    );
  }
  
  if (!checklistParams.name) {
    throw new McpError(
      ErrorCode.InvalidParams,
      'name is required'
    );
  }
  
  const checklist = await checklistsClient.createChecklist(task_id, checklistParams as CreateChecklistParams);
  
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(checklist, null, 2),
      },
    ],
  };
}

async function handleUpdateChecklist(args: any) {
  const { checklist_id, name } = args;
  
  if (!checklist_id) {
    throw new McpError(
      ErrorCode.InvalidParams,
      'checklist_id is required'
    );
  }
  
  if (!name) {
    throw new McpError(
      ErrorCode.InvalidParams,
      'name is required'
    );
  }
  
  const checklist = await checklistsClient.updateChecklist(checklist_id, { name });
  
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(checklist, null, 2),
      },
    ],
  };
}

async function handleDeleteChecklist(args: any) {
  const { checklist_id } = args;
  
  if (!checklist_id) {
    throw new McpError(
      ErrorCode.InvalidParams,
      'checklist_id is required'
    );
  }
  
  const result = await checklistsClient.deleteChecklist(checklist_id);
  
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}

async function handleCreateChecklistItem(args: any) {
  const { checklist_id, ...itemParams } = args;
  
  if (!checklist_id) {
    throw new McpError(
      ErrorCode.InvalidParams,
      'checklist_id is required'
    );
  }
  
  if (!itemParams.name) {
    throw new McpError(
      ErrorCode.InvalidParams,
      'name is required'
    );
  }
  
  const checklistItem = await checklistsClient.createChecklistItem(checklist_id, itemParams as CreateChecklistItemParams);
  
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(checklistItem, null, 2),
      },
    ],
  };
}

async function handleUpdateChecklistItem(args: any) {
  const { checklist_id, checklist_item_id, ...itemParams } = args;
  
  if (!checklist_id) {
    throw new McpError(
      ErrorCode.InvalidParams,
      'checklist_id is required'
    );
  }
  
  if (!checklist_item_id) {
    throw new McpError(
      ErrorCode.InvalidParams,
      'checklist_item_id is required'
    );
  }
  
  const checklistItem = await checklistsClient.updateChecklistItem(checklist_id, checklist_item_id, itemParams as UpdateChecklistItemParams);
  
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(checklistItem, null, 2),
      },
    ],
  };
}

async function handleDeleteChecklistItem(args: any) {
  const { checklist_id, checklist_item_id } = args;
  
  if (!checklist_id) {
    throw new McpError(
      ErrorCode.InvalidParams,
      'checklist_id is required'
    );
  }
  
  if (!checklist_item_id) {
    throw new McpError(
      ErrorCode.InvalidParams,
      'checklist_item_id is required'
    );
  }
  
  const result = await checklistsClient.deleteChecklistItem(checklist_id, checklist_item_id);
  
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}