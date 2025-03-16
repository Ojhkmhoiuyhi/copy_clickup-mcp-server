import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  ErrorCode,
  ListResourcesRequestSchema,
  ListResourceTemplatesRequestSchema,
  McpError,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { createClickUpClient } from '../clickup-client/index.js';
import { createTasksClient } from '../clickup-client/tasks.js';

// Create clients
const clickUpClient = createClickUpClient();
const tasksClient = createTasksClient(clickUpClient);

// URI patterns
const TASK_URI_PATTERN = /^clickup:\/\/task\/([^/]+)$/;

export function setupTaskResources(server: Server): void {
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
          uriTemplate: 'clickup://task/{task_id}',
          name: 'Task details',
          mimeType: 'application/json',
          description: 'Details of a specific task',
        },
      ],
    };
  });

  // Handle resource reads
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri;
    console.log(`[TaskResources] Handling resource read for URI: ${uri}`);
    
    // Check if this is a task resource
    const taskMatch = uri.match(TASK_URI_PATTERN);
    if (taskMatch) {
      const taskId = taskMatch[1];
      console.log(`[TaskResources] Matched task pattern, taskId: ${taskId}`);
      const result = await handleTaskResource(taskId);
      console.log(`[TaskResources] Result from handleTaskResource:`, result);
      return result;
    }
    
    // If no match, return an empty object to let other handlers process it
    console.log(`[TaskResources] No match for URI: ${uri}`);
    return {};
  });
}

async function handleTaskResource(taskId: string) {
  try {
    console.log(`[TaskResources] Fetching task: ${taskId}`);
    const task = await tasksClient.getTask(taskId);
    console.log(`[TaskResources] Got task:`, task);
    
    return {
      contents: [
        {
          uri: `clickup://task/${taskId}`,
          mimeType: 'application/json',
          text: JSON.stringify(task, null, 2),
        },
      ],
    };
  } catch (error: any) {
    console.error(`[TaskResources] Error fetching task:`, error);
    throw new McpError(
      ErrorCode.InternalError,
      `Error fetching task: ${error.message}`
    );
  }
}
