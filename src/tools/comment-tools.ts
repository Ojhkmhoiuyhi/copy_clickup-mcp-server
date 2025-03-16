import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { createClickUpClient } from '../clickup-client/index.js';
import { 
  createCommentsClient, 
  CreateTaskCommentParams, 
  CreateChatViewCommentParams,
  CreateListCommentParams,
  UpdateCommentParams,
  CreateThreadedCommentParams
} from '../clickup-client/comments.js';

// Create clients
const clickUpClient = createClickUpClient();
const commentsClient = createCommentsClient(clickUpClient);

// Tool definitions
export const COMMENT_TOOLS = [
  {
    name: 'get_task_comments',
    description: 'Get comments for a specific task',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: {
          type: 'string',
          description: 'The ID of the task to get comments for',
        },
        start: {
          type: 'number',
          description: 'Pagination start (timestamp)',
        },
        start_id: {
          type: 'string',
          description: 'Pagination start ID',
        },
      },
      required: ['task_id'],
    },
  },
  {
    name: 'create_task_comment',
    description: 'Create a new comment on a task',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: {
          type: 'string',
          description: 'The ID of the task to comment on',
        },
        comment_text: {
          type: 'string',
          description: 'The text content of the comment',
        },
        assignee: {
          type: 'number',
          description: 'The ID of the user to assign to the comment',
        },
        notify_all: {
          type: 'boolean',
          description: 'Whether to notify all assignees',
        },
      },
      required: ['task_id', 'comment_text'],
    },
  },
  {
    name: 'get_chat_view_comments',
    description: 'Get comments for a chat view',
    inputSchema: {
      type: 'object',
      properties: {
        view_id: {
          type: 'string',
          description: 'The ID of the chat view to get comments for',
        },
        start: {
          type: 'number',
          description: 'Pagination start (timestamp)',
        },
        start_id: {
          type: 'string',
          description: 'Pagination start ID',
        },
      },
      required: ['view_id'],
    },
  },
  {
    name: 'create_chat_view_comment',
    description: 'Create a new comment on a chat view',
    inputSchema: {
      type: 'object',
      properties: {
        view_id: {
          type: 'string',
          description: 'The ID of the chat view to comment on',
        },
        comment_text: {
          type: 'string',
          description: 'The text content of the comment',
        },
        notify_all: {
          type: 'boolean',
          description: 'Whether to notify all assignees',
        },
      },
      required: ['view_id', 'comment_text'],
    },
  },
  {
    name: 'get_list_comments',
    description: 'Get comments for a list',
    inputSchema: {
      type: 'object',
      properties: {
        list_id: {
          type: 'string',
          description: 'The ID of the list to get comments for',
        },
        start: {
          type: 'number',
          description: 'Pagination start (timestamp)',
        },
        start_id: {
          type: 'string',
          description: 'Pagination start ID',
        },
      },
      required: ['list_id'],
    },
  },
  {
    name: 'create_list_comment',
    description: 'Create a new comment on a list',
    inputSchema: {
      type: 'object',
      properties: {
        list_id: {
          type: 'string',
          description: 'The ID of the list to comment on',
        },
        comment_text: {
          type: 'string',
          description: 'The text content of the comment',
        },
        assignee: {
          type: 'number',
          description: 'The ID of the user to assign to the comment',
        },
        notify_all: {
          type: 'boolean',
          description: 'Whether to notify all assignees',
        },
      },
      required: ['list_id', 'comment_text'],
    },
  },
  {
    name: 'update_comment',
    description: 'Update an existing comment',
    inputSchema: {
      type: 'object',
      properties: {
        comment_id: {
          type: 'string',
          description: 'The ID of the comment to update',
        },
        comment_text: {
          type: 'string',
          description: 'The new text content of the comment',
        },
        assignee: {
          type: 'number',
          description: 'The ID of the user to assign to the comment',
        },
        resolved: {
          type: 'boolean',
          description: 'Whether the comment is resolved',
        },
      },
      required: ['comment_id', 'comment_text'],
    },
  },
  {
    name: 'delete_comment',
    description: 'Delete a comment',
    inputSchema: {
      type: 'object',
      properties: {
        comment_id: {
          type: 'string',
          description: 'The ID of the comment to delete',
        },
      },
      required: ['comment_id'],
    },
  },
  {
    name: 'get_threaded_comments',
    description: 'Get threaded comments for a parent comment',
    inputSchema: {
      type: 'object',
      properties: {
        comment_id: {
          type: 'string',
          description: 'The ID of the parent comment',
        },
        start: {
          type: 'number',
          description: 'Pagination start (timestamp)',
        },
        start_id: {
          type: 'string',
          description: 'Pagination start ID',
        },
      },
      required: ['comment_id'],
    },
  },
  {
    name: 'create_threaded_comment',
    description: 'Create a new threaded comment on a parent comment',
    inputSchema: {
      type: 'object',
      properties: {
        comment_id: {
          type: 'string',
          description: 'The ID of the parent comment',
        },
        comment_text: {
          type: 'string',
          description: 'The text content of the comment',
        },
        notify_all: {
          type: 'boolean',
          description: 'Whether to notify all assignees',
        },
      },
      required: ['comment_id', 'comment_text'],
    },
  },
];

export function setupCommentTools(server: Server): (request: any) => Promise<any> {
  // Return the handler function instead of registering it directly
  const commentToolHandler = async (request: any) => {
    const toolName = request.params.name;
    const args = request.params.arguments;

    try {
      switch (toolName) {
        case 'get_task_comments':
          return await handleGetTaskComments(args);
        case 'create_task_comment':
          return await handleCreateTaskComment(args);
        case 'get_chat_view_comments':
          return await handleGetChatViewComments(args);
        case 'create_chat_view_comment':
          return await handleCreateChatViewComment(args);
        case 'get_list_comments':
          return await handleGetListComments(args);
        case 'create_list_comment':
          return await handleCreateListComment(args);
        case 'update_comment':
          return await handleUpdateComment(args);
        case 'delete_comment':
          return await handleDeleteComment(args);
        case 'get_threaded_comments':
          return await handleGetThreadedComments(args);
        case 'create_threaded_comment':
          return await handleCreateThreadedComment(args);
        default:
          return {
            content: [
              {
                type: 'text',
                text: `Unknown comment tool: ${toolName}`,
              },
            ],
            isError: true,
          };
      }
    } catch (error: any) {
      console.error(`Error in comment tool ${toolName}:`, error);
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

  return commentToolHandler;
}

// Handler implementations

async function handleGetTaskComments(args: any) {
  const { task_id, ...params } = args;
  try {
    const result = await commentsClient.getTaskComments(task_id, params);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error: any) {
    console.error('Error getting task comments:', error);
    return {
      content: [
        {
          type: 'text',
          text: `Error getting task comments: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}

async function handleCreateTaskComment(args: any) {
  const { task_id, ...commentParams } = args;
  try {
    const result = await commentsClient.createTaskComment(task_id, commentParams as CreateTaskCommentParams);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error: any) {
    console.error('Error creating task comment:', error);
    return {
      content: [
        {
          type: 'text',
          text: `Error creating task comment: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}

async function handleGetChatViewComments(args: any) {
  const { view_id, ...params } = args;
  try {
    const result = await commentsClient.getChatViewComments(view_id, params);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error: any) {
    console.error('Error getting chat view comments:', error);
    return {
      content: [
        {
          type: 'text',
          text: `Error getting chat view comments: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}

async function handleCreateChatViewComment(args: any) {
  const { view_id, ...commentParams } = args;
  try {
    const result = await commentsClient.createChatViewComment(view_id, commentParams as CreateChatViewCommentParams);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error: any) {
    console.error('Error creating chat view comment:', error);
    return {
      content: [
        {
          type: 'text',
          text: `Error creating chat view comment: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}

async function handleGetListComments(args: any) {
  const { list_id, ...params } = args;
  try {
    const result = await commentsClient.getListComments(list_id, params);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error: any) {
    console.error('Error getting list comments:', error);
    return {
      content: [
        {
          type: 'text',
          text: `Error getting list comments: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}

async function handleCreateListComment(args: any) {
  const { list_id, ...commentParams } = args;
  try {
    const result = await commentsClient.createListComment(list_id, commentParams as CreateListCommentParams);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error: any) {
    console.error('Error creating list comment:', error);
    return {
      content: [
        {
          type: 'text',
          text: `Error creating list comment: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}

async function handleUpdateComment(args: any) {
  const { comment_id, ...commentParams } = args;
  try {
    const result = await commentsClient.updateComment(comment_id, commentParams as UpdateCommentParams);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error: any) {
    console.error('Error updating comment:', error);
    return {
      content: [
        {
          type: 'text',
          text: `Error updating comment: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}

async function handleDeleteComment(args: any) {
  const { comment_id } = args;
  try {
    const result = await commentsClient.deleteComment(comment_id);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error: any) {
    console.error('Error deleting comment:', error);
    return {
      content: [
        {
          type: 'text',
          text: `Error deleting comment: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}

async function handleGetThreadedComments(args: any) {
  const { comment_id, ...params } = args;
  try {
    const result = await commentsClient.getThreadedComments(comment_id, params);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error: any) {
    console.error('Error getting threaded comments:', error);
    return {
      content: [
        {
          type: 'text',
          text: `Error getting threaded comments: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}

async function handleCreateThreadedComment(args: any) {
  const { comment_id, ...commentParams } = args;
  try {
    const result = await commentsClient.createThreadedComment(comment_id, commentParams as CreateThreadedCommentParams);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error: any) {
    console.error('Error creating threaded comment:', error);
    return {
      content: [
        {
          type: 'text',
          text: `Error creating threaded comment: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}
