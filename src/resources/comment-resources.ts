import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  ListResourcesRequestSchema,
  ListResourceTemplatesRequestSchema,
  ReadResourceRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { createClickUpClient } from '../clickup-client/index.js';
import { createCommentsClient } from '../clickup-client/comments.js';

// Create clients
const clickUpClient = createClickUpClient();
const commentsClient = createCommentsClient(clickUpClient);

export function setupCommentResources(server: Server): void {
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
          uriTemplate: 'clickup://task/{task_id}/comments',
          name: 'Task comments',
          description: 'Comments for a specific task',
          mimeType: 'application/json',
        },
        {
          uriTemplate: 'clickup://comment/{comment_id}/reply',
          name: 'Threaded comments',
          description: 'Threaded comments for a specific comment',
          mimeType: 'application/json',
        },
        {
          uriTemplate: 'clickup://list/{list_id}/comments',
          name: 'List comments',
          description: 'Comments for a specific list',
          mimeType: 'application/json',
        },
        {
          uriTemplate: 'clickup://view/{view_id}/comments',
          name: 'Chat view comments',
          description: 'Comments for a specific chat view',
          mimeType: 'application/json',
        },
      ],
    };
  });

  // Register resource handler
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    // Check if this is a comment resource
    const taskCommentsMatch = request.params.uri.match(/^clickup:\/\/task\/([^/]+)\/comments$/);
    const threadedCommentsMatch = request.params.uri.match(/^clickup:\/\/comment\/([^/]+)\/reply$/);
    const listCommentsMatch = request.params.uri.match(/^clickup:\/\/list\/([^/]+)\/comments$/);
    const viewCommentsMatch = request.params.uri.match(/^clickup:\/\/view\/([^/]+)\/comments$/);

    // If not a comment resource, return empty to let other handlers process it
    if (!taskCommentsMatch && !threadedCommentsMatch && !listCommentsMatch && !viewCommentsMatch) {
      return {};
    }

    try {
      let result;
      let title;

      if (taskCommentsMatch) {
        const taskId = taskCommentsMatch[1];
        result = await commentsClient.getTaskComments(taskId);
        title = `Comments for task ${taskId}`;
      } else if (threadedCommentsMatch) {
        const commentId = threadedCommentsMatch[1];
        result = await commentsClient.getThreadedComments(commentId);
        title = `Threaded comments for comment ${commentId}`;
      } else if (listCommentsMatch) {
        const listId = listCommentsMatch[1];
        result = await commentsClient.getListComments(listId);
        title = `Comments for list ${listId}`;
      } else if (viewCommentsMatch) {
        const viewId = viewCommentsMatch[1];
        result = await commentsClient.getChatViewComments(viewId);
        title = `Comments for chat view ${viewId}`;
      } else {
        throw new McpError(ErrorCode.InvalidRequest, `Invalid comment resource URI: ${request.params.uri}`);
      }

      return {
        contents: [
          {
            uri: request.params.uri,
            title,
            mimeType: 'application/json',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error: any) {
      console.error(`Error reading comment resource ${request.params.uri}:`, error);
      throw new McpError(
        ErrorCode.InternalError,
        `Error reading comment resource: ${error.message}`
      );
    }
  });
}
