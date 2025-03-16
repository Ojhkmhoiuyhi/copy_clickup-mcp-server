import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { createClickUpClient } from '../clickup-client/index.js';
import { createDocsClient } from '../clickup-client/docs.js';
import { createAuthClient } from '../clickup-client/auth.js';

// Create clients
const clickUpClient = createClickUpClient();
const docsClient = createDocsClient(clickUpClient);
const authClient = createAuthClient(clickUpClient);

// Tool definitions
export const DOC_TOOLS = [
  {
    name: 'get_workspaces',
    description: 'Get the list of workspaces the user has access to',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_doc_content',
    description: 'Get the content of a specific doc',
    inputSchema: {
      type: 'object',
      properties: {
        doc_id: {
          type: 'string',
          description: 'The ID of the doc to get',
        },
        workspace_id: {
          type: 'string',
          description: 'The ID of the workspace containing the doc',
        },
      },
      required: ['doc_id', 'workspace_id'],
    },
  },
  {
    name: 'search_docs',
    description: 'Search for docs in a workspace',
    inputSchema: {
      type: 'object',
      properties: {
        workspace_id: {
          type: 'string',
          description: 'The ID of the workspace to search in',
        },
        query: {
          type: 'string',
          description: 'The search query',
        },
        cursor: {
          type: 'string',
          description: 'Cursor for pagination',
        },
      },
      required: ['workspace_id', 'query'],
    },
  },
  {
    name: 'get_docs_from_workspace',
    description: 'Get all docs from a workspace',
    inputSchema: {
      type: 'object',
      properties: {
        workspace_id: {
          type: 'string',
          description: 'The ID of the workspace to get docs from',
        },
        cursor: {
          type: 'string',
          description: 'Cursor for pagination',
        },
        deleted: {
          type: 'boolean',
          description: 'Whether to include deleted docs',
        },
        archived: {
          type: 'boolean',
          description: 'Whether to include archived docs',
        },
        limit: {
          type: 'number',
          description: 'The maximum number of docs to return',
        },
      },
      required: ['workspace_id'],
    },
  },
  {
    name: 'get_doc_pages',
    description: 'Get the pages of a doc',
    inputSchema: {
      type: 'object',
      properties: {
        doc_id: {
          type: 'string',
          description: 'The ID of the doc to get pages from',
        },
        workspace_id: {
          type: 'string',
          description: 'The ID of the workspace containing the doc',
        },
        content_format: {
          type: 'string',
          description: 'The format to return the content in (text/md or text/plain)',
          enum: ['text/md', 'text/plain'],
        },
      },
      required: ['doc_id', 'workspace_id'],
    },
  },
];

export function setupDocTools(server: Server): (request: any) => Promise<any> {
  // Return the handler function instead of registering it directly
  const docToolHandler = async (request: any) => {
    const toolName = request.params.name;
    const args = request.params.arguments;

    try {
      switch (toolName) {
        case 'get_workspaces':
          return await handleGetWorkspaces();
        case 'get_doc_content':
          return await handleGetDocContent(args);
        case 'search_docs':
          return await handleSearchDocs(args);
        case 'get_docs_from_workspace':
          return await handleGetDocsFromWorkspace(args);
        case 'get_doc_pages':
          return await handleGetDocPages(args);
        default:
          return {
            content: [
              {
                type: 'text',
                text: `Unknown doc tool: ${toolName}`,
              },
            ],
            isError: true,
          };
      }
    } catch (error: any) {
      console.error(`Error in doc tool ${toolName}:`, error);
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

  return docToolHandler;
}

// Handler implementations

async function handleGetWorkspaces() {
  try {
    // Get all workspaces the user has access to
    const workspaces = await authClient.getWorkspaces();
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(workspaces.teams, null, 2),
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

async function handleGetDocContent(args: any) {
  console.log('handleGetDocContent called with args:', JSON.stringify(args, null, 2));
  
  const { doc_id, workspace_id } = args;
  
  if (!doc_id) {
    throw new McpError(
      ErrorCode.InvalidParams,
      'doc_id is required'
    );
  }
  
  if (!workspace_id) {
    throw new McpError(
      ErrorCode.InvalidParams,
      'workspace_id is required'
    );
  }
  
  try {
    // Get the pages of the doc
    const pages = await docsClient.getDocPages(workspace_id, doc_id);
    
    // Combine the content of all pages
    let combinedContent = '';
    if (Array.isArray(pages)) {
      for (const page of pages) {
        if (page.content) {
          combinedContent += page.content + '\n\n';
        }
      }
    }
    
    return {
      content: [
        {
          type: 'text',
          text: combinedContent || 'No content found in this doc.',
        },
      ],
    };
  } catch (error: any) {
    console.error('Error getting doc content:', error);
    throw error;
  }
}

async function handleSearchDocs(args: any) {
  console.log('handleSearchDocs called with args:', JSON.stringify(args, null, 2));
  
  const { workspace_id, query, cursor } = args;
  
  if (!workspace_id) {
    throw new McpError(
      ErrorCode.InvalidParams,
      'workspace_id is required'
    );
  }
  
  if (!query) {
    throw new McpError(
      ErrorCode.InvalidParams,
      'query is required'
    );
  }
  
  try {
    // Search for docs in the workspace
    const result = await docsClient.searchDocs(workspace_id, { query, cursor });
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result.docs, null, 2),
        },
      ],
    };
  } catch (error: any) {
    console.error('Error searching docs:', error);
    throw error;
  }
}

async function handleGetDocsFromWorkspace(args: any) {
  console.log('handleGetDocsFromWorkspace called with args:', JSON.stringify(args, null, 2));
  
  const { workspace_id, cursor, deleted, archived, limit } = args;
  
  if (!workspace_id) {
    throw new McpError(
      ErrorCode.InvalidParams,
      'workspace_id is required'
    );
  }
  
  try {
    // Get docs from the workspace
    const result = await docsClient.getDocsFromWorkspace(workspace_id, { 
      cursor,
      deleted: deleted !== undefined ? deleted : false,
      archived: archived !== undefined ? archived : false,
      limit: limit || 50
    });
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result.docs, null, 2),
        },
      ],
    };
  } catch (error: any) {
    console.error('Error getting docs from workspace:', error);
    throw error;
  }
}

async function handleGetDocPages(args: any) {
  console.log('handleGetDocPages called with args:', JSON.stringify(args, null, 2));
  
  const { doc_id, workspace_id, content_format } = args;
  
  if (!doc_id) {
    throw new McpError(
      ErrorCode.InvalidParams,
      'doc_id is required'
    );
  }
  
  if (!workspace_id) {
    throw new McpError(
      ErrorCode.InvalidParams,
      'workspace_id is required'
    );
  }
  
  try {
    // Get the pages of the doc
    const pages = await docsClient.getDocPages(workspace_id, doc_id, content_format);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(pages, null, 2),
        },
      ],
    };
  } catch (error: any) {
    console.error('Error getting doc pages:', error);
    throw error;
  }
}
