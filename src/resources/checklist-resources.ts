import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  ErrorCode,
  ListResourceTemplatesRequestSchema,
  McpError,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { createClickUpClient } from '../clickup-client/index.js';
import { createTasksClient } from '../clickup-client/tasks.js';
import { createChecklistsClient } from '../clickup-client/checklists.js';
import { Checklist } from '../clickup-client/checklists.js';

// Create clients
const clickUpClient = createClickUpClient();
const tasksClient = createTasksClient(clickUpClient);
// Keep this client for future implementation
const checklistsClient = createChecklistsClient(clickUpClient);

// URI patterns
const CHECKLIST_URI_PATTERN = /^clickup:\/\/task\/([^/]+)\/checklist$/;
const CHECKLIST_ITEM_URI_PATTERN = /^clickup:\/\/checklist\/([^/]+)\/items$/;

export function setupChecklistResources(server: Server): void {
  // Register the list of available resource templates
  server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => {
    return {
      resourceTemplates: [
        {
          uriTemplate: 'clickup://task/{task_id}/checklist',
          name: 'Task checklists',
          mimeType: 'application/json',
          description: 'Checklists for a specific task',
        },
        {
          uriTemplate: 'clickup://checklist/{checklist_id}/items',
          name: 'Checklist items',
          mimeType: 'application/json',
          description: 'Items in a specific checklist',
        },
      ],
    };
  });

  // Handle resource reads
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri;
    
    // Check if this is a task checklists resource
    const checklistMatch = uri.match(CHECKLIST_URI_PATTERN);
    if (checklistMatch) {
      const taskId = checklistMatch[1];
      return await handleChecklistsResource(taskId);
    }
    
    // Check if this is a checklist items resource
    const checklistItemMatch = uri.match(CHECKLIST_ITEM_URI_PATTERN);
    if (checklistItemMatch) {
      const checklistId = checklistItemMatch[1];
      return await handleChecklistItemsResource(checklistId);
    }
    
    // If no match, return an empty object to let other handlers process it
    return {};
  });
}

async function handleChecklistsResource(taskId: string) {
  try {
    // Get the task details
    const task = await tasksClient.getTask(taskId);
    
    // Note: The ClickUp API doesn't return checklists directly with task data
    // We would need to make a separate call to get checklists for a task
    // This would need to be implemented in the checklistsClient if API supports it
    
    // For now, return an empty array with proper typing
    const checklists: Checklist[] = [];
    
    // In a real implementation, we might do something like:
    // const checklists = await checklistsClient.getChecklistsForTask(taskId);
    
    return {
      contents: [
        {
          uri: `clickup://task/${taskId}/checklist`,
          mimeType: 'application/json',
          text: JSON.stringify({
            task_id: taskId,
            task_name: task.name,
            checklists: checklists
          }, null, 2),
        },
      ],
    };
  } catch (error: any) {
    throw new McpError(
      ErrorCode.InternalError,
      `Error fetching checklists: ${error.message}`
    );
  }
}

async function handleChecklistItemsResource(checklistId: string) {
  try {
    // For now, this is a placeholder as we'd need to implement a method
    // to get all items for a checklist - we'll need to implement this endpoint
    // or extract this data from the checklist details
    
    // Placeholder for response format
    const checklistItems = {
      checklist_id: checklistId,
      items: []
    };
    
    return {
      contents: [
        {
          uri: `clickup://checklist/${checklistId}/items`,
          mimeType: 'application/json',
          text: JSON.stringify(checklistItems, null, 2),
        },
      ],
    };
  } catch (error: any) {
    throw new McpError(
      ErrorCode.InternalError,
      `Error fetching checklist items: ${error.message}`
    );
  }
}