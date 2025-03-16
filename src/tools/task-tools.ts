import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { createClickUpClient } from '../clickup-client/index.js';
import { createTasksClient, Task, CreateTaskParams, UpdateTaskParams } from '../clickup-client/tasks.js';
import { createListsClient } from '../clickup-client/lists.js';
import { createFoldersClient } from '../clickup-client/folders.js';
import { createAuthClient } from '../clickup-client/auth.js';

// Create clients
const clickUpClient = createClickUpClient();
const tasksClient = createTasksClient(clickUpClient);
const listsClient = createListsClient(clickUpClient);
const foldersClient = createFoldersClient(clickUpClient);
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
    description: 'Get tasks from a list',
    inputSchema: {
      type: 'object',
      properties: {
        list_id: {
          type: 'string',
          description: 'The ID of the list to get tasks from',
        },
        include_closed: {
          type: 'boolean',
          description: 'Whether to include closed tasks',
        },
        subtasks: {
          type: 'boolean',
          description: 'Whether to include subtasks in the results',
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
      required: ['list_id'],
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
        include_subtasks: {
          type: 'boolean',
          description: 'Whether to include subtasks in the task details',
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
  {
    name: 'create_folder',
    description: 'Create a new folder in a space',
    inputSchema: {
      type: 'object',
      properties: {
        space_id: {
          type: 'string',
          description: 'The ID of the space to create the folder in',
        },
        name: {
          type: 'string',
          description: 'The name of the folder',
        },
      },
      required: ['space_id', 'name'],
    },
  },
  {
    name: 'update_folder',
    description: 'Update an existing folder',
    inputSchema: {
      type: 'object',
      properties: {
        folder_id: {
          type: 'string',
          description: 'The ID of the folder to update',
        },
        name: {
          type: 'string',
          description: 'The new name of the folder',
        },
      },
      required: ['folder_id', 'name'],
    },
  },
  {
    name: 'delete_folder',
    description: 'Delete a folder',
    inputSchema: {
      type: 'object',
      properties: {
        folder_id: {
          type: 'string',
          description: 'The ID of the folder to delete',
        },
      },
      required: ['folder_id'],
    },
  },
  {
    name: 'create_list',
    description: 'Create a new list in a folder or space',
    inputSchema: {
      type: 'object',
      properties: {
        container_type: {
          type: 'string',
          enum: ['folder', 'space'],
          description: 'The type of container to create the list in',
        },
        container_id: {
          type: 'string',
          description: 'The ID of the container to create the list in',
        },
        name: {
          type: 'string',
          description: 'The name of the list',
        },
      },
      required: ['container_type', 'container_id', 'name'],
    },
  },
  {
    name: 'get_folderless_lists',
    description: 'Get folderless lists from a space',
    inputSchema: {
      type: 'object',
      properties: {
        space_id: {
          type: 'string',
          description: 'The ID of the space to get folderless lists from',
        },
      },
      required: ['space_id'],
    },
  },
  {
    name: 'create_folderless_list',
    description: 'Create a new folderless list in a space',
    inputSchema: {
      type: 'object',
      properties: {
        space_id: {
          type: 'string',
          description: 'The ID of the space to create the folderless list in',
        },
        name: {
          type: 'string',
          description: 'The name of the folderless list',
        },
      },
      required: ['space_id', 'name'],
    },
  },
  {
    name: 'get_list',
    description: 'Get a specific list by ID',
    inputSchema: {
      type: 'object',
      properties: {
        list_id: {
          type: 'string',
          description: 'The ID of the list to get',
        },
      },
      required: ['list_id'],
    },
  },
  {
    name: 'update_list',
    description: 'Update an existing list',
    inputSchema: {
      type: 'object',
      properties: {
        list_id: {
          type: 'string',
          description: 'The ID of the list to update',
        },
        name: {
          type: 'string',
          description: 'The new name of the list',
        },
      },
      required: ['list_id', 'name'],
    },
  },
  {
    name: 'delete_list',
    description: 'Delete a list',
    inputSchema: {
      type: 'object',
      properties: {
        list_id: {
          type: 'string',
          description: 'The ID of the list to delete',
        },
      },
      required: ['list_id'],
    },
  },
  {
    name: 'add_task_to_list',
    description: 'Add a task to a list',
    inputSchema: {
      type: 'object',
      properties: {
        list_id: {
          type: 'string',
          description: 'The ID of the list to add the task to',
        },
        task_id: {
          type: 'string',
          description: 'The ID of the task to add',
        },
      },
      required: ['list_id', 'task_id'],
    },
  },
  {
    name: 'remove_task_from_list',
    description: 'Remove a task from a list',
    inputSchema: {
      type: 'object',
      properties: {
        list_id: {
          type: 'string',
          description: 'The ID of the list to remove the task from',
        },
        task_id: {
          type: 'string',
          description: 'The ID of the task to remove',
        },
      },
      required: ['list_id', 'task_id'],
    },
  },
  {
    name: 'create_list_from_template_in_folder',
    description: 'Create a new list from a template in a folder',
    inputSchema: {
      type: 'object',
      properties: {
        folder_id: {
          type: 'string',
          description: 'The ID of the folder to create the list in',
        },
        template_id: {
          type: 'string',
          description: 'The ID of the template to use',
        },
        name: {
          type: 'string',
          description: 'The name of the list',
        },
      },
      required: ['folder_id', 'template_id', 'name'],
    },
  },
  {
    name: 'create_list_from_template_in_space',
    description: 'Create a new list from a template in a space',
    inputSchema: {
      type: 'object',
      properties: {
        space_id: {
          type: 'string',
          description: 'The ID of the space to create the list in',
        },
        template_id: {
          type: 'string',
          description: 'The ID of the template to use',
        },
        name: {
          type: 'string',
          description: 'The name of the list',
        },
      },
      required: ['space_id', 'template_id', 'name'],
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
        case 'create_folder':
          return await handleCreateFolder(args);
        case 'update_folder':
          return await handleUpdateFolder(args);
        case 'delete_folder':
          return await handleDeleteFolder(args);
        case 'create_list':
          return await handleCreateList(args);
        case 'get_folderless_lists':
          return await handleGetFolderlessLists(args);
        case 'create_folderless_list':
          return await handleCreateFolderlessList(args);
        case 'get_list':
          return await handleGetList(args);
        case 'update_list':
          return await handleUpdateList(args);
        case 'delete_list':
          return await handleDeleteList(args);
        case 'add_task_to_list':
          return await handleAddTaskToList(args);
        case 'remove_task_from_list':
          return await handleRemoveTaskFromList(args);
        case 'create_list_from_template_in_folder':
          return await handleCreateListFromTemplateInFolder(args);
        case 'create_list_from_template_in_space':
          return await handleCreateListFromTemplateInSpace(args);
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
  const { list_id, ...params } = args;
  try {
    const result = await tasksClient.getTasksFromList(list_id, params);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error: any) {
    console.error('Error getting tasks:', error);
    return {
      content: [
        {
          type: 'text',
          text: `Error getting tasks: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}

async function handleGetTaskDetails(args: any) {
  const { task_id, include_subtasks } = args;
  try {
    // Pass include_subtasks directly to the getTask method
    const task = await tasksClient.getTask(task_id, { include_subtasks });
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(task, null, 2),
        },
      ],
    };
  } catch (error: any) {
    console.error('Error getting task details:', error);
    return {
      content: [
        {
          type: 'text',
          text: `Error getting task details: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}

async function handleCreateTask(args: any) {
  const { list_id, ...taskParams } = args;
  try {
    const result = await tasksClient.createTask(list_id, taskParams as CreateTaskParams);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error: any) {
    console.error('Error creating task:', error);
    return {
      content: [
        {
          type: 'text',
          text: `Error creating task: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}

async function handleUpdateTask(args: any) {
  const { task_id, ...taskParams } = args;
  try {
    const result = await tasksClient.updateTask(task_id, taskParams as UpdateTaskParams);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error: any) {
    console.error('Error updating task:', error);
    return {
      content: [
        {
          type: 'text',
          text: `Error updating task: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
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
  try {
    const result = await authClient.getSpaces(workspace_id);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result.spaces, null, 2),
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

async function handleGetLists(args: any) {
  const { container_type, container_id } = args;
  try {
    let result;
    if (container_type === 'folder') {
      result = await foldersClient.getListsFromFolder(container_id);
    } else if (container_type === 'space') {
      result = await listsClient.getListsFromSpace(container_id);
    } else {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Invalid container_type. Must be one of: folder, space'
      );
    }
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error: any) {
    console.error(`Error getting lists from ${container_type}:`, error);
    return {
      content: [
        {
          type: 'text',
          text: `Error getting lists: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}

async function handleGetWorkspaceSeats(args: any) {
  const { workspace_id } = args;
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

async function handleCreateFolder(args: any) {
  const { space_id, name } = args;
  try {
    const result = await foldersClient.createFolder(space_id, { name });
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error: any) {
    console.error('Error creating folder:', error);
    return {
      content: [
        {
          type: 'text',
          text: `Error creating folder: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}

async function handleUpdateFolder(args: any) {
  const { folder_id, name } = args;
  try {
    const result = await foldersClient.updateFolder(folder_id, { name });
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error: any) {
    console.error('Error updating folder:', error);
    return {
      content: [
        {
          type: 'text',
          text: `Error updating folder: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}

async function handleDeleteFolder(args: any) {
  const { folder_id } = args;
  try {
    const result = await foldersClient.deleteFolder(folder_id);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error: any) {
    console.error('Error deleting folder:', error);
    return {
      content: [
        {
          type: 'text',
          text: `Error deleting folder: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}

async function handleCreateList(args: any) {
  const { container_type, container_id, name } = args;
  try {
    let result;
    if (container_type === 'folder') {
      result = await listsClient.createListInFolder(container_id, { name });
    } else if (container_type === 'space') {
      result = await listsClient.createFolderlessList(container_id, { name });
    } else {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Invalid container_type. Must be one of: folder, space'
      );
    }
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error: any) {
    console.error(`Error creating list in ${container_type}:`, error);
    return {
      content: [
        {
          type: 'text',
          text: `Error creating list: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}

async function handleGetFolderlessLists(args: any) {
  const { space_id } = args;
  try {
    const result = await listsClient.getListsFromSpace(space_id);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error: any) {
    console.error('Error getting folderless lists:', error);
    return {
      content: [
        {
          type: 'text',
          text: `Error getting folderless lists: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}

async function handleCreateFolderlessList(args: any) {
  const { space_id, name } = args;
  try {
    const result = await listsClient.createFolderlessList(space_id, { name });
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error: any) {
    console.error('Error creating folderless list:', error);
    return {
      content: [
        {
          type: 'text',
          text: `Error creating folderless list: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}

async function handleGetList(args: any) {
  const { list_id } = args;
  try {
    const result = await listsClient.getList(list_id);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error: any) {
    console.error('Error getting list:', error);
    return {
      content: [
        {
          type: 'text',
          text: `Error getting list: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}

async function handleUpdateList(args: any) {
  const { list_id, name } = args;
  try {
    const result = await listsClient.updateList(list_id, { name });
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error: any) {
    console.error('Error updating list:', error);
    return {
      content: [
        {
          type: 'text',
          text: `Error updating list: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}

async function handleDeleteList(args: any) {
  const { list_id } = args;
  try {
    const result = await listsClient.deleteList(list_id);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error: any) {
    console.error('Error deleting list:', error);
    return {
      content: [
        {
          type: 'text',
          text: `Error deleting list: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}

async function handleAddTaskToList(args: any) {
  const { list_id, task_id } = args;
  try {
    const result = await listsClient.addTaskToList(list_id, task_id);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error: any) {
    console.error('Error adding task to list:', error);
    return {
      content: [
        {
          type: 'text',
          text: `Error adding task to list: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}

async function handleRemoveTaskFromList(args: any) {
  const { list_id, task_id } = args;
  try {
    const result = await listsClient.removeTaskFromList(list_id, task_id);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error: any) {
    console.error('Error removing task from list:', error);
    return {
      content: [
        {
          type: 'text',
          text: `Error removing task from list: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}

async function handleCreateListFromTemplateInFolder(args: any) {
  const { folder_id, template_id, name } = args;
  try {
    const result = await listsClient.createListFromTemplateInFolder(folder_id, template_id, { name });
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error: any) {
    console.error('Error creating list from template in folder:', error);
    return {
      content: [
        {
          type: 'text',
          text: `Error creating list from template in folder: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}

async function handleCreateListFromTemplateInSpace(args: any) {
  const { space_id, template_id, name } = args;
  try {
    const result = await listsClient.createListFromTemplateInSpace(space_id, template_id, { name });
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error: any) {
    console.error('Error creating list from template in space:', error);
    return {
      content: [
        {
          type: 'text',
          text: `Error creating list from template in space: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}
