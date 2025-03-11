#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { setupTaskTools, TASK_TOOLS } from './tools/task-tools.js';
import { setupDocTools, DOC_TOOLS } from './tools/doc-tools.js';
import { setupSpaceTools, SPACE_TOOLS } from './tools/space-tools.js';
import { setupTaskResources } from './resources/task-resources.js';
import { setupDocResources } from './resources/doc-resources.js';
import { createClickUpClient } from './clickup-client/index.js';
import { createDocsClient } from './clickup-client/docs.js';
import { createAuthClient } from './clickup-client/auth.js';

// Environment variables are passed to the server through the MCP settings file
// See mcp-settings-example.json for an example

class ClickUpServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'clickup-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );

    // Set up error handling
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    
    // Handle process termination
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });

    // Set up tools and resources
    this.setupHandlers();
  }

  private setupHandlers() {
    // Register a combined list of all tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [...TASK_TOOLS, ...DOC_TOOLS, ...SPACE_TOOLS],
      };
    });

    // Set up task-related tools and resources
    setupTaskTools(this.server);
    setupTaskResources(this.server);
    
    // Set up space-related tools
    setupSpaceTools(this.server);
    
    // Set up doc-related tools and resources
    setupDocTools(this.server);
    setupDocResources(this.server);
    
    // Add direct handlers for doc tools
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const toolName = request.params.name;
      const args = request.params.arguments;
      
      // Handle get_doc_content tool
      if (toolName === 'get_doc_content') {
        console.log('Direct handler for get_doc_content called with args:', JSON.stringify(args, null, 2));
        
        // Type assertion to avoid TypeScript errors
        const { doc_id, workspace_id } = args as { doc_id: string; workspace_id: string };
        
        if (!doc_id || !workspace_id) {
          return {
            content: [
              {
                type: 'text',
                text: 'Error: doc_id and workspace_id are required',
              },
            ],
            isError: true,
          };
        }
        
        try {
          // Create a new docs client
          const docsClient = createDocsClient(createClickUpClient());
          
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
          return {
            content: [
              {
                type: 'text',
                text: `Error getting doc content: ${error.message}`,
              },
            ],
            isError: true,
          };
        }
      }
      
      // Handle get_workspaces tool
      if (toolName === 'get_workspaces') {
        console.log('Direct handler for get_workspaces called');
        
        try {
          // Create a new auth client
          const authClient = createAuthClient(createClickUpClient());
          
          // Get the workspaces
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
      
      // Handle get_spaces tool
      if (toolName === 'get_spaces') {
        console.log('Direct handler for get_spaces called with args:', JSON.stringify(args, null, 2));
        
        // Type assertion to avoid TypeScript errors
        const { workspace_id } = args as { workspace_id: string };
        
        if (!workspace_id) {
          return {
            content: [
              {
                type: 'text',
                text: 'Error: workspace_id is required',
              },
            ],
            isError: true,
          };
        }
        
        try {
          // Create a new auth client
          const authClient = createAuthClient(createClickUpClient());
          
          // Get the spaces
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
      
      // Handle search_docs tool
      if (toolName === 'search_docs') {
        console.log('Direct handler for search_docs called with args:', JSON.stringify(args, null, 2));
        
        // Type assertion to avoid TypeScript errors
        const { workspace_id, query, cursor } = args as { workspace_id: string; query: string; cursor?: string };
        
        if (!workspace_id) {
          return {
            content: [
              {
                type: 'text',
                text: 'Error: workspace_id is required',
              },
            ],
            isError: true,
          };
        }
        
        if (!query) {
          return {
            content: [
              {
                type: 'text',
                text: 'Error: query is required',
              },
            ],
            isError: true,
          };
        }
        
        try {
          // Create a new docs client
          const docsClient = createDocsClient(createClickUpClient());
          
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
          return {
            content: [
              {
                type: 'text',
                text: `Error searching docs: ${error.message}`,
              },
            ],
            isError: true,
          };
        }
      }
      
      // Handle get_docs_from_workspace tool
      if (toolName === 'get_docs_from_workspace') {
        console.log('Direct handler for get_docs_from_workspace called with args:', JSON.stringify(args, null, 2));
        
        // Type assertion to avoid TypeScript errors
        const { workspace_id, cursor, deleted, archived, limit } = args as { 
          workspace_id: string; 
          cursor?: string;
          deleted?: boolean;
          archived?: boolean;
          limit?: number;
        };
        
        if (!workspace_id) {
          return {
            content: [
              {
                type: 'text',
                text: 'Error: workspace_id is required',
              },
            ],
            isError: true,
          };
        }
        
        try {
          // Create a new docs client
          const docsClient = createDocsClient(createClickUpClient());
          
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
          return {
            content: [
              {
                type: 'text',
                text: `Error getting docs from workspace: ${error.message}`,
              },
            ],
            isError: true,
          };
        }
      }
      
      // Handle get_doc_pages tool
      if (toolName === 'get_doc_pages') {
        console.log('Direct handler for get_doc_pages called with args:', JSON.stringify(args, null, 2));
        
        // Type assertion to avoid TypeScript errors
        const { doc_id, workspace_id, content_format } = args as { doc_id: string; workspace_id: string; content_format?: string };
        
        if (!doc_id) {
          return {
            content: [
              {
                type: 'text',
                text: 'Error: doc_id is required',
              },
            ],
            isError: true,
          };
        }
        
        if (!workspace_id) {
          return {
            content: [
              {
                type: 'text',
                text: 'Error: workspace_id is required',
              },
            ],
            isError: true,
          };
        }
        
        try {
          // Create a new docs client
          const docsClient = createDocsClient(createClickUpClient());
          
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
          return {
            content: [
              {
                type: 'text',
                text: `Error getting doc pages: ${error.message}`,
              },
            ],
            isError: true,
          };
        }
      }
      
      // Not our tool, let other handlers process it
      return {};
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('ClickUp MCP server running on stdio');
  }
}

// Create and run the server
const server = new ClickUpServer();
server.run().catch(console.error);
