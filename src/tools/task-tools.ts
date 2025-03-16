import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { createClickUpClient } from '../clickup-client/index.js';
import { createTasksClient, Task, CreateTaskParams, UpdateTaskParams } from '../clickup-client/tasks.js';
import { createAuthClient } from '../clickup-client/auth.js';

// Create clients
const clickUpClient = createClickUpClient();
const tasksClient = createTasksClient(clickUpClient);
const authClient = createAuthClient(clickUpClient);

// Tool definitions
export const TASK_TOOLS = [
  {
    name: 'get_workspace_seats',
    description: 'Get the seats information for a workspace',
    inputSchema: {
      type: 'object',
      properties: {
        workspace_id: {
          type: 'string',
          description: 'The ID of the workspace to get seats information for',
        },
      },
      required: ['workspace_id'],
    },
  },
  {
    name: 'get_tasks',
    description: 'Get tasks from a list, folder, or space',
    inputSchema: {
      type: 'object',
      properties: {
        container_type: {
          type: 'string',
          enum: ['list', 'folder', 'space'],
          description: 'The type of container to get tasks from',
        },
        container_id: {
          type: 'string',
          description: 'The ID of the container to get tasks from',
        },
        include_closed: {
          type: 'boolean',
          description: 'Whether to include closed tasks',
        },
        page: {
          type: 'number',
          description: 'The page number to get',
        },
        order_by: {
          type: 'string',
          description: 'The field to order by',
        },
        reverse: {
          type: 'boolean',
          description: 'Whether to reverse the order',
        },
      },
      required: ['container_type', 'container_id'],
    },
  },
  {
    name: 'get_task_details',
    description: 'Get detailed information about a task',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: {
          type: 'string',
          description: 'The ID of the task to get',
        },
      },
      required: ['task_id'],
    },
  },
  {
    name: 'create_task',
    description: 'Create a new task in a list',
    inputSchema: {
      type: 'object',
      properties: {
        list_id: {
          type: 'string',
          description: 'The ID of the list to create the task in',
        },
        name: {
          type: 'string',
          description: 'The name of the task',
        },
        description: {
          type: 'string',
          description: 'The description of the task',
        },
        assignees: {
          type: 'array',
          items: {
            type: 'number',
          },
          description: 'The IDs of the users to assign to the task',
        },
        tags: {
          type: 'array',
          items: {
            type: 'string',
          },
          description: 'The tags to add to the task',
        },
        status: {
          type: 'string',
          description: 'The status of the task',
        },
        priority: {
          type: 'number',
          description: 'The priority of the task (1-4)',
        },
        due_date: {
          type: 'number',
          description: 'The due date of the task (Unix timestamp)',
        },
        due_date_time: {
          type: 'boolean',
          description: 'Whether the due date includes a time',
        },
        time_estimate: {
          type: 'number',
          description: 'The time estimate for the task (in milliseconds)',
        },
        start_date: {
          type: 'number',
          description: 'The start date of the task (Unix timestamp)',
        },
        start_date_time: {
          type: 'boolean',
          description: 'Whether the start date includes a time',
        },
        notify_all: {
          type: 'boolean',
          description: 'Whether to notify all assignees',
        },
        parent: {
          type: 'string',
          description: 'The ID of the parent task',
        },
      },
      required: ['list_id', 'name'],
    },
  },
  {
    name: 'update_task',
    description: 'Update an existing task',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: {
          type: 'string',
          description: 'The ID of the task to update',
        },
        name: {
          type: 'string',
          description: 'The new name of the task',
        },
        description: {
          type: 'string',
          description: 'The new description of the task',
        },
        assignees: {
          type: 'array',
          items: {
            type: 'number',
          },
          description: 'The IDs of the users to assign to the task',
        },
        status: {
          type: 'string',
          description: 'The new status of the task',
        },
        priority: {
          type: 'number',
          description: 'The new priority of the task (1-4)',
        },
        due_date: {
          type: 'number',
          description: 'The new due date of the task (Unix timestamp)',
        },
        due_date_time: {
          type: 'boolean',
          description: 'Whether the due date includes a time',
        },
        time_estimate: {
          type: 'number',
          description: 'The new time estimate for the task (in milliseconds)',
        },
        start_date: {
          type: 'number',
          description: 'The new start date of the task (Unix timestamp)',
        },
        start_date_time: {
          type: 'boolean',
          description: 'Whether the start date includes a time',
        },
        notify_all: {
          type: 'boolean',
          description: 'Whether to notify all assignees',
        },
      },
      required: ['task_id'],
    },
  },
  {
    name: 'get_workspaces',
    description: 'Get the workspaces that the authorized user belongs to',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
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
    name: 'get_lists',
    description: 'Get the lists in a folder or space',
    inputSchema: {
      type: 'object',
      properties: {
        container_type: {
          type: 'string',
          enum: ['folder', 'space'],
          description: 'The type of container to get lists from',
        },
        container_id: {
          type: 'string',
          description: 'The ID of the container to get lists from',
        },
      },
      required: ['container_type', 'container_id'],
    },
  },
];

export function setupTaskTools(server: Server): (request: any) => Promise<any> {
  // Return the handler function instead of registering it directly
  const taskToolHandler = async (request: any) => {
    const toolName = request.params.name;
    const args = request.params.arguments;

    try {
      switch (toolName) {
        case 'get_workspace_seats':
          return await handleGetWorkspaceSeats(args);
        case 'get_tasks':
          return await handleGetTasks(args);
        case 'get_task_details':
          return await handleGetTaskDetails(args);
        case 'create_task':
          return await handleCreateTask(args);
        case 'update_task':
          return await handleUpdateTask(args);
        case 'get_workspaces':
          return await handleGetWorkspaces();
        case 'get_spaces':
          return await handleGetSpaces(args);
        case 'get_lists':
          return await handleGetLists(args);
        default:
          return {
            content: [
              {
                type: 'text',
                text: `Unknown task tool: ${toolName}`,
              },
            ],
            isError: true,
          };
      }
    } catch (error: any) {
      console.error(`Error in task tool ${toolName}:`, error);
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

  return taskToolHandler;
}

// Handler implementations

async function handleGetTasks(args: any) {
  const { container_type, container_id, ...params } = args;
  
  let tasks: Task[] = [];
  
  switch (container_type) {
    case 'list':
      const listResult = await tasksClient.getTasksFromList(container_id, params);
      tasks = listResult.tasks;
      break;
    case 'folder':
      const folderResult = await tasksClient.getTasksFromFolder(container_id, params);
      tasks = folderResult.tasks;
      break;
    case 'space':
      const spaceResult = await tasksClient.getTasksFromSpace(container_id, params);
      tasks = spaceResult.tasks;
      break;
    default:
      throw new McpError(
        ErrorCode.InvalidParams,
        `Invalid container_type: ${container_type}. Must be one of: list, folder, space`
      );
  }
  
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(tasks, null, 2),
      },
    ],
  };
}

async function handleGetTaskDetails(args: any) {
  const { task_id } = args;
  
  if (!task_id) {
    throw new McpError(
      ErrorCode.InvalidParams,
      'task_id is required'
    );
  }
  
  const task = await tasksClient.getTask(task_id);
  
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(task, null, 2),
      },
    ],
  };
}

async function handleCreateTask(args: any) {
  const { list_id, ...taskParams } = args;
  
  if (!list_id) {
    throw new McpError(
      ErrorCode.InvalidParams,
      'list_id is required'
    );
  }
  
  if (!taskParams.name) {
    throw new McpError(
      ErrorCode.InvalidParams,
      'name is required'
    );
  }
  
  const task = await tasksClient.createTask(list_id, taskParams as CreateTaskParams);
  
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(task, null, 2),
      },
    ],
  };
}

async function handleUpdateTask(args: any) {
  const { task_id, ...taskParams } = args;
  
  if (!task_id) {
    throw new McpError(
      ErrorCode.InvalidParams,
      'task_id is required'
    );
  }
  
  const task = await tasksClient.updateTask(task_id, taskParams as UpdateTaskParams);
  
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(task, null, 2),
      },
    ],
  };
}

async function handleGetWorkspaces() {
  try {
    const result = await authClient.getWorkspaces();
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result.teams, null, 2),
        },
      ],
    };
  } catch (error: any) {
    console.error('Error getting workspaces:', error);
    return {
      content: [
        {
          type: 'text',
          text: `Error getting workspaces: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}

async function handleGetSpaces(args: any) {
  const { workspace_id } = args;
  
  if (!workspace_id) {
    throw new McpError(
      ErrorCode.InvalidParams,
      'workspace_id is required'
    );
  }
  
  const result = await authClient.getSpaces(workspace_id);
  
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result.spaces, null, 2),
      },
    ],
  };
}

async function handleGetLists(args: any) {
  const { container_type, container_id } = args;
  
  if (!container_type || !container_id) {
    throw new McpError(
      ErrorCode.InvalidParams,
      'container_type and container_id are required'
    );
  }
  
  let lists;
  
  switch (container_type) {
    case 'folder':
      const folderResult = await authClient.getLists(container_id);
      lists = folderResult.lists;
      break;
    case 'space':
      const spaceResult = await authClient.getListsFromSpace(container_id);
      lists = spaceResult.lists;
      break;
    default:
      throw new McpError(
        ErrorCode.InvalidParams,
        `Invalid container_type: ${container_type}. Must be one of: folder, space`
      );
  }
  
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(lists, null, 2),
      },
    ],
  };
}

async function handleGetWorkspaceSeats(args: any) {
  const { workspace_id } = args;
  
  if (!workspace_id) {
    throw new McpError(
      ErrorCode.InvalidParams,
      'workspace_id is required'
    );
  }
  
  try {
    const result = await authClient.getWorkspaceSeats(workspace_id);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error: any) {
    console.error('Error getting workspace seats:', error);
    return {
      content: [
        {
          type: 'text',
          text: `Error getting workspace seats: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}
