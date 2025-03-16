import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { createClickUpClient } from '../clickup-client/index.js';
import { createTasksClient, CreateTaskParams, UpdateTaskParams } from '../clickup-client/tasks.js';
import { createListsClient } from '../clickup-client/lists.js';
import { createFoldersClient } from '../clickup-client/folders.js';
import { createAuthClient } from '../clickup-client/auth.js';

// Create clients
const clickUpClient = createClickUpClient();
const tasksClient = createTasksClient(clickUpClient);
const listsClient = createListsClient(clickUpClient);
const foldersClient = createFoldersClient(clickUpClient);
const authClient = createAuthClient(clickUpClient);

export function setupTaskTools(server: McpServer): void {
  // Workspace and Auth tools
  server.tool(
    'get_workspace_seats',
    { workspace_id: z.string().describe('The ID of the workspace to get seats information for') },
    async ({ workspace_id }) => {
      try {
        const result = await authClient.getWorkspaceSeats(workspace_id);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
        };
      } catch (error: any) {
        console.error('Error getting workspace seats:', error);
        return {
          content: [{ type: 'text', text: `Error getting workspace seats: ${error.message}` }],
          isError: true
        };
      }
    }
  );

  server.tool(
    'get_workspaces',
    {},
    async () => {
      try {
        const result = await authClient.getWorkspaces();
        return {
          content: [{ type: 'text', text: JSON.stringify(result.teams, null, 2) }]
        };
      } catch (error: any) {
        console.error('Error getting workspaces:', error);
        return {
          content: [{ type: 'text', text: `Error getting workspaces: ${error.message}` }],
          isError: true
        };
      }
    }
  );

  // Task tools
  server.tool(
    'get_tasks',
    {
      list_id: z.string().describe('The ID of the list to get tasks from'),
      include_closed: z.boolean().optional().describe('Whether to include closed tasks'),
      subtasks: z.boolean().optional().describe('Whether to include subtasks in the results'),
      page: z.number().optional().describe('The page number to get'),
      order_by: z.string().optional().describe('The field to order by'),
      reverse: z.boolean().optional().describe('Whether to reverse the order')
    },
    async ({ list_id, ...params }) => {
      try {
        const result = await tasksClient.getTasksFromList(list_id, params);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
        };
      } catch (error: any) {
        console.error('Error getting tasks:', error);
        return {
          content: [{ type: 'text', text: `Error getting tasks: ${error.message}` }],
          isError: true
        };
      }
    }
  );

  server.tool(
    'get_task_details',
    {
      task_id: z.string().describe('The ID of the task to get'),
      include_subtasks: z.boolean().optional().describe('Whether to include subtasks in the task details')
    },
    async ({ task_id, include_subtasks }) => {
      try {
        const task = await tasksClient.getTask(task_id, { include_subtasks });
        return {
          content: [{ type: 'text', text: JSON.stringify(task, null, 2) }]
        };
      } catch (error: any) {
        console.error('Error getting task details:', error);
        return {
          content: [{ type: 'text', text: `Error getting task details: ${error.message}` }],
          isError: true
        };
      }
    }
  );

  server.tool(
    'create_task',
    {
      list_id: z.string().describe('The ID of the list to create the task in'),
      name: z.string().describe('The name of the task'),
      description: z.string().optional().describe('The description of the task'),
      assignees: z.array(z.number()).optional().describe('The IDs of the users to assign to the task'),
      tags: z.array(z.string()).optional().describe('The tags to add to the task'),
      status: z.string().optional().describe('The status of the task'),
      priority: z.number().optional().describe('The priority of the task (1-4)'),
      due_date: z.number().optional().describe('The due date of the task (Unix timestamp)'),
      due_date_time: z.boolean().optional().describe('Whether the due date includes a time'),
      time_estimate: z.number().optional().describe('The time estimate for the task (in milliseconds)'),
      start_date: z.number().optional().describe('The start date of the task (Unix timestamp)'),
      start_date_time: z.boolean().optional().describe('Whether the start date includes a time'),
      notify_all: z.boolean().optional().describe('Whether to notify all assignees'),
      parent: z.string().optional().describe('The ID of the parent task')
    },
    async ({ list_id, ...taskParams }) => {
      try {
        const result = await tasksClient.createTask(list_id, taskParams as CreateTaskParams);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
        };
      } catch (error: any) {
        console.error('Error creating task:', error);
        return {
          content: [{ type: 'text', text: `Error creating task: ${error.message}` }],
          isError: true
        };
      }
    }
  );

  server.tool(
    'update_task',
    {
      task_id: z.string().describe('The ID of the task to update'),
      name: z.string().optional().describe('The new name of the task'),
      description: z.string().optional().describe('The new description of the task'),
      assignees: z.array(z.number()).optional().describe('The IDs of the users to assign to the task'),
      status: z.string().optional().describe('The new status of the task'),
      priority: z.number().optional().describe('The new priority of the task (1-4)'),
      due_date: z.number().optional().describe('The new due date of the task (Unix timestamp)'),
      due_date_time: z.boolean().optional().describe('Whether the due date includes a time'),
      time_estimate: z.number().optional().describe('The new time estimate for the task (in milliseconds)'),
      start_date: z.number().optional().describe('The new start date of the task (Unix timestamp)'),
      start_date_time: z.boolean().optional().describe('Whether the start date includes a time'),
      notify_all: z.boolean().optional().describe('Whether to notify all assignees')
    },
    async ({ task_id, ...taskParams }) => {
      try {
        const result = await tasksClient.updateTask(task_id, taskParams as UpdateTaskParams);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
        };
      } catch (error: any) {
        console.error('Error updating task:', error);
        return {
          content: [{ type: 'text', text: `Error updating task: ${error.message}` }],
          isError: true
        };
      }
    }
  );

  // List and Folder tools
  server.tool(
    'get_lists',
    {
      container_type: z.enum(['folder', 'space']).describe('The type of container to get lists from'),
      container_id: z.string().describe('The ID of the container to get lists from')
    },
    async ({ container_type, container_id }) => {
      try {
        let result;
        if (container_type === 'folder') {
          result = await foldersClient.getListsFromFolder(container_id);
        } else if (container_type === 'space') {
          result = await listsClient.getListsFromSpace(container_id);
        } else {
          throw new Error('Invalid container_type. Must be one of: folder, space');
        }
        
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
        };
      } catch (error: any) {
        console.error(`Error getting lists from ${container_type}:`, error);
        return {
          content: [{ type: 'text', text: `Error getting lists: ${error.message}` }],
          isError: true
        };
      }
    }
  );

  server.tool(
    'create_folder',
    {
      space_id: z.string().describe('The ID of the space to create the folder in'),
      name: z.string().describe('The name of the folder')
    },
    async ({ space_id, name }) => {
      try {
        const result = await foldersClient.createFolder(space_id, { name });
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
        };
      } catch (error: any) {
        console.error('Error creating folder:', error);
        return {
          content: [{ type: 'text', text: `Error creating folder: ${error.message}` }],
          isError: true
        };
      }
    }
  );

  server.tool(
    'update_folder',
    {
      folder_id: z.string().describe('The ID of the folder to update'),
      name: z.string().describe('The new name of the folder')
    },
    async ({ folder_id, name }) => {
      try {
        const result = await foldersClient.updateFolder(folder_id, { name });
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
        };
      } catch (error: any) {
        console.error('Error updating folder:', error);
        return {
          content: [{ type: 'text', text: `Error updating folder: ${error.message}` }],
          isError: true
        };
      }
    }
  );

  server.tool(
    'delete_folder',
    {
      folder_id: z.string().describe('The ID of the folder to delete')
    },
    async ({ folder_id }) => {
      try {
        const result = await foldersClient.deleteFolder(folder_id);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
        };
      } catch (error: any) {
        console.error('Error deleting folder:', error);
        return {
          content: [{ type: 'text', text: `Error deleting folder: ${error.message}` }],
          isError: true
        };
      }
    }
  );

  server.tool(
    'get_folderless_lists',
    {
      space_id: z.string().describe('The ID of the space to get folderless lists from')
    },
    async ({ space_id }) => {
      try {
        const result = await listsClient.getListsFromSpace(space_id);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
        };
      } catch (error: any) {
        console.error('Error getting folderless lists:', error);
        return {
          content: [{ type: 'text', text: `Error getting folderless lists: ${error.message}` }],
          isError: true
        };
      }
    }
  );

  server.tool(
    'create_list',
    {
      container_type: z.enum(['folder', 'space']).describe('The type of container to create the list in'),
      container_id: z.string().describe('The ID of the container to create the list in'),
      name: z.string().describe('The name of the list')
    },
    async ({ container_type, container_id, name }) => {
      try {
        let result;
        if (container_type === 'folder') {
          result = await listsClient.createListInFolder(container_id, { name });
        } else if (container_type === 'space') {
          result = await listsClient.createFolderlessList(container_id, { name });
        } else {
          throw new Error('Invalid container_type. Must be one of: folder, space');
        }
        
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
        };
      } catch (error: any) {
        console.error(`Error creating list in ${container_type}:`, error);
        return {
          content: [{ type: 'text', text: `Error creating list: ${error.message}` }],
          isError: true
        };
      }
    }
  );

  server.tool(
    'create_folderless_list',
    {
      space_id: z.string().describe('The ID of the space to create the folderless list in'),
      name: z.string().describe('The name of the folderless list')
    },
    async ({ space_id, name }) => {
      try {
        const result = await listsClient.createFolderlessList(space_id, { name });
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
        };
      } catch (error: any) {
        console.error('Error creating folderless list:', error);
        return {
          content: [{ type: 'text', text: `Error creating folderless list: ${error.message}` }],
          isError: true
        };
      }
    }
  );

  server.tool(
    'get_list',
    {
      list_id: z.string().describe('The ID of the list to get')
    },
    async ({ list_id }) => {
      try {
        const result = await listsClient.getList(list_id);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
        };
      } catch (error: any) {
        console.error('Error getting list:', error);
        return {
          content: [{ type: 'text', text: `Error getting list: ${error.message}` }],
          isError: true
        };
      }
    }
  );

  server.tool(
    'update_list',
    {
      list_id: z.string().describe('The ID of the list to update'),
      name: z.string().describe('The new name of the list')
    },
    async ({ list_id, name }) => {
      try {
        const result = await listsClient.updateList(list_id, { name });
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
        };
      } catch (error: any) {
        console.error('Error updating list:', error);
        return {
          content: [{ type: 'text', text: `Error updating list: ${error.message}` }],
          isError: true
        };
      }
    }
  );

  server.tool(
    'delete_list',
    {
      list_id: z.string().describe('The ID of the list to delete')
    },
    async ({ list_id }) => {
      try {
        const result = await listsClient.deleteList(list_id);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
        };
      } catch (error: any) {
        console.error('Error deleting list:', error);
        return {
          content: [{ type: 'text', text: `Error deleting list: ${error.message}` }],
          isError: true
        };
      }
    }
  );

  server.tool(
    'add_task_to_list',
    {
      list_id: z.string().describe('The ID of the list to add the task to'),
      task_id: z.string().describe('The ID of the task to add')
    },
    async ({ list_id, task_id }) => {
      try {
        const result = await listsClient.addTaskToList(list_id, task_id);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
        };
      } catch (error: any) {
        console.error('Error adding task to list:', error);
        return {
          content: [{ type: 'text', text: `Error adding task to list: ${error.message}` }],
          isError: true
        };
      }
    }
  );

  server.tool(
    'remove_task_from_list',
    {
      list_id: z.string().describe('The ID of the list to remove the task from'),
      task_id: z.string().describe('The ID of the task to remove')
    },
    async ({ list_id, task_id }) => {
      try {
        const result = await listsClient.removeTaskFromList(list_id, task_id);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
        };
      } catch (error: any) {
        console.error('Error removing task from list:', error);
        return {
          content: [{ type: 'text', text: `Error removing task from list: ${error.message}` }],
          isError: true
        };
      }
    }
  );

  server.tool(
    'create_list_from_template_in_folder',
    {
      folder_id: z.string().describe('The ID of the folder to create the list in'),
      template_id: z.string().describe('The ID of the template to use'),
      name: z.string().describe('The name of the list')
    },
    async ({ folder_id, template_id, name }) => {
      try {
        const result = await listsClient.createListFromTemplateInFolder(folder_id, template_id, { name });
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
        };
      } catch (error: any) {
        console.error('Error creating list from template in folder:', error);
        return {
          content: [{ type: 'text', text: `Error creating list from template in folder: ${error.message}` }],
          isError: true
        };
      }
    }
  );

  server.tool(
    'create_list_from_template_in_space',
    {
      space_id: z.string().describe('The ID of the space to create the list in'),
      template_id: z.string().describe('The ID of the template to use'),
      name: z.string().describe('The name of the list')
    },
    async ({ space_id, template_id, name }) => {
      try {
        const result = await listsClient.createListFromTemplateInSpace(space_id, template_id, { name });
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
        };
      } catch (error: any) {
        console.error('Error creating list from template in space:', error);
        return {
          content: [{ type: 'text', text: `Error creating list from template in space: ${error.message}` }],
          isError: true
        };
      }
    }
  );
}
