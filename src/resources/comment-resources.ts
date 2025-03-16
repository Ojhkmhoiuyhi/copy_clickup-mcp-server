import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  ErrorCode,
  ListResourceTemplatesRequestSchema,
  McpError,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { createClickUpClient } from '../clickup-client/index.js';
import { createCommentsClient } from '../clickup-client/comments.js';

// Create clients
const clickUpClient = createClickUpClient();
const commentsClient = createCommentsClient(clickUpClient);

// URI patterns
const TASK_COMMENTS_URI_PATTERN = /^clickup:\/\/task\/([^/]+)\/comments$/;
const CHAT_VIEW_COMMENTS_URI_PATTERN = /^clickup:\/\/view\/([^/]+)\/comments$/;
const LIST_COMMENTS_URI_PATTERN = /^clickup:\/\/list\/([^/]+)\/comments$/;
const THREADED_COMMENTS_URI_PATTERN = /^clickup:\/\/comment\/([^/]+)\/reply$/;

// Define comment resources
export const COMMENT_RESOURCES = [
  {
    uri: 'clickup://task/868czp2t3/comments',
    name: 'Comments for task 868czp2t3',
    mimeType: 'application/json',
    description: 'Comments for a specific task',
  },
  {
    uri: 'clickup://list/901109776097/comments',
    name: 'Comments for list 901109776097',
    mimeType: 'application/json',
    description: 'Comments for a specific list',
  },
  {
    uri: 'clickup://comment/90110125009748/reply',
    name: 'Threaded comments',
    mimeType: 'application/json',
    description: 'Threaded comments for a specific comment',
  },
  {
    uri: 'clickup://view/123456/comments',
    name: 'Chat view comments',
    mimeType: 'application/json',
    description: 'Comments for a specific chat view',
  }
];

export function setupCommentResources(server: Server): void {

  // Register the list of available resource templates
  server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => {
    return {
      resourceTemplates: [
        {
          uriTemplate: 'clickup://task/{task_id}/comments',
          name: 'Task comments',
          mimeType: 'application/json',
          description: 'Comments for a specific task',
        },
        {
          uriTemplate: 'clickup://view/{view_id}/comments',
          name: 'Chat view comments',
          mimeType: 'application/json',
          description: 'Comments for a specific chat view',
        },
        {
          uriTemplate: 'clickup://list/{list_id}/comments',
          name: 'List comments',
          mimeType: 'application/json',
          description: 'Comments for a specific list',
        },
        {
          uriTemplate: 'clickup://comment/{comment_id}/reply',
          name: 'Threaded comments',
          mimeType: 'application/json',
          description: 'Threaded comments for a specific comment',
        },
      ],
    };
  });

  // Handle resource reads
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri;
    console.log(`[CommentResources] Handling resource read for URI: ${uri}`);
    
    // Check if this is a task comments resource
    const taskCommentsMatch = uri.match(TASK_COMMENTS_URI_PATTERN);
    if (taskCommentsMatch) {
      const taskId = taskCommentsMatch[1];
      console.log(`[CommentResources] Matched task comments pattern, taskId: ${taskId}`);
      const result = await handleTaskCommentsResource(taskId);
      console.log(`[CommentResources] Result from handleTaskCommentsResource:`, result);
      return result;
    }
    
    // Check if this is a chat view comments resource
    const chatViewCommentsMatch = uri.match(CHAT_VIEW_COMMENTS_URI_PATTERN);
    if (chatViewCommentsMatch) {
      const viewId = chatViewCommentsMatch[1];
      console.log(`[CommentResources] Matched chat view comments pattern, viewId: ${viewId}`);
      const result = await handleChatViewCommentsResource(viewId);
      console.log(`[CommentResources] Result from handleChatViewCommentsResource:`, result);
      return result;
    }
    
    // Check if this is a list comments resource
    const listCommentsMatch = uri.match(LIST_COMMENTS_URI_PATTERN);
    if (listCommentsMatch) {
      const listId = listCommentsMatch[1];
      console.log(`[CommentResources] Matched list comments pattern, listId: ${listId}`);
      const result = await handleListCommentsResource(listId);
      console.log(`[CommentResources] Result from handleListCommentsResource:`, result);
      return result;
    }
    
    // Check if this is a threaded comments resource
    const threadedCommentsMatch = uri.match(THREADED_COMMENTS_URI_PATTERN);
    if (threadedCommentsMatch) {
      const commentId = threadedCommentsMatch[1];
      console.log(`[CommentResources] Matched threaded comments pattern, commentId: ${commentId}`);
      const result = await handleThreadedCommentsResource(commentId);
      console.log(`[CommentResources] Result from handleThreadedCommentsResource:`, result);
      return result;
    }
    
    // If no match, return an empty object to let other handlers process it
    console.log(`[CommentResources] No match for URI: ${uri}`);
    return {};
  });
}

async function handleTaskCommentsResource(taskId: string) {
  try {
    console.log(`[CommentResources] Fetching comments for task: ${taskId}`);
    const comments = await commentsClient.getTaskComments(taskId);
    console.log(`[CommentResources] Got comments:`, comments);
    
    // Format the response exactly like the list resources implementation
    const result = {
      contents: [
        {
          uri: `clickup://task/${taskId}/comments`,
          mimeType: 'application/json',
          text: JSON.stringify(comments, null, 2),
        },
      ],
    };
    console.log(`[CommentResources] Returning result:`, result);
    return result;
  } catch (error: any) {
    console.error(`[CommentResources] Error fetching task comments:`, error);
    throw new McpError(
      ErrorCode.InternalError,
      `Error fetching task comments: ${error.message}`
    );
  }
}

async function handleChatViewCommentsResource(viewId: string) {
  try {
    console.log(`[CommentResources] Fetching comments for chat view: ${viewId}`);
    const comments = await commentsClient.getChatViewComments(viewId);
    console.log(`[CommentResources] Got comments:`, comments);
    
    return {
      contents: [
        {
          uri: `clickup://view/${viewId}/comments`,
          mimeType: 'application/json',
          text: JSON.stringify(comments, null, 2),
        },
      ],
    };
  } catch (error: any) {
    console.error(`[CommentResources] Error fetching chat view comments:`, error);
    throw new McpError(
      ErrorCode.InternalError,
      `Error fetching chat view comments: ${error.message}`
    );
  }
}

async function handleListCommentsResource(listId: string) {
  try {
    console.log(`[CommentResources] Fetching comments for list: ${listId}`);
    const comments = await commentsClient.getListComments(listId);
    console.log(`[CommentResources] Got comments:`, comments);
    
    return {
      contents: [
        {
          uri: `clickup://list/${listId}/comments`,
          mimeType: 'application/json',
          text: JSON.stringify(comments, null, 2),
        },
      ],
    };
  } catch (error: any) {
    console.error(`[CommentResources] Error fetching list comments:`, error);
    throw new McpError(
      ErrorCode.InternalError,
      `Error fetching list comments: ${error.message}`
    );
  }
}

async function handleThreadedCommentsResource(commentId: string) {
  try {
    console.log(`[CommentResources] Fetching threaded comments for comment: ${commentId}`);
    const comments = await commentsClient.getThreadedComments(commentId);
    console.log(`[CommentResources] Got comments:`, comments);
    
    return {
      contents: [
        {
          uri: `clickup://comment/${commentId}/reply`,
          mimeType: 'application/json',
          text: JSON.stringify(comments, null, 2),
        },
      ],
    };
  } catch (error: any) {
    console.error(`[CommentResources] Error fetching threaded comments:`, error);
    throw new McpError(
      ErrorCode.InternalError,
      `Error fetching threaded comments: ${error.message}`
    );
  }
}
