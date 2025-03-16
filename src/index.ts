#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListResourcesRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { setupTaskTools, TASK_TOOLS } from './tools/task-tools.js';
import { setupDocTools, DOC_TOOLS } from './tools/doc-tools.js';
import { setupSpaceTools, SPACE_TOOLS } from './tools/space-tools.js';
import { setupChecklistTools, CHECKLIST_TOOLS } from './tools/checklist-tools.js';
import { setupCommentTools, COMMENT_TOOLS } from './tools/comment-tools.js';
import { setupTaskResources } from './resources/task-resources.js';
import { setupDocResources } from './resources/doc-resources.js';
import { setupChecklistResources } from './resources/checklist-resources.js';
import { setupCommentResources, COMMENT_RESOURCES } from './resources/comment-resources.js';
import { setupSpaceResources } from './resources/space-resources.js';
import { setupFolderResources } from './resources/folder-resources.js';
import { setupListResources, LIST_RESOURCES } from './resources/list-resources.js';

// Environment variables are passed to the server through the MCP settings file
// See mcp-settings-example.json for an example

class ClickUpServer {
  private server: Server;
  private taskToolHandler: any;
  private docToolHandler: any;
  private spaceToolHandler: any;
  private checklistToolHandler: any;
  private commentToolHandler: any;

  constructor() {
    this.server = new Server(
      {
        name: 'clickup-server',
        version: '1.4.0',
      },
      {
        capabilities: {
          resources: {
            list: true,
            read: true,
          },
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
        tools: [...TASK_TOOLS, ...DOC_TOOLS, ...SPACE_TOOLS, ...CHECKLIST_TOOLS, ...COMMENT_TOOLS],
      };
    });

    // Register a combined list of all resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: [
          ...LIST_RESOURCES,
          ...COMMENT_RESOURCES,
          // Add other resource exports as they're implemented
        ],
      };
    });

    // Central handler for all tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const toolName = request.params.name;
      
      // Determine which category this tool belongs to
      const isTaskTool = TASK_TOOLS.some(tool => tool.name === toolName);
      const isDocTool = DOC_TOOLS.some(tool => tool.name === toolName);
      const isSpaceTool = SPACE_TOOLS.some(tool => tool.name === toolName);
      const isChecklistTool = CHECKLIST_TOOLS.some(tool => tool.name === toolName);
      const isCommentTool = COMMENT_TOOLS.some(tool => tool.name === toolName);
      
      try {
        // Call the appropriate handler
        if (isTaskTool && this.taskToolHandler) {
          return await this.taskToolHandler(request);
        } else if (isDocTool && this.docToolHandler) {
          return await this.docToolHandler(request);
        } else if (isSpaceTool && this.spaceToolHandler) {
          return await this.spaceToolHandler(request);
        } else if (isChecklistTool && this.checklistToolHandler) {
          return await this.checklistToolHandler(request);
        } else if (isCommentTool && this.commentToolHandler) {
          return await this.commentToolHandler(request);
        } else {
          return {
            content: [
              {
                type: 'text',
                text: `Unknown tool: ${toolName}`,
              },
            ],
            isError: true,
          };
        }
      } catch (error: any) {
        console.error(`Error handling tool call to ${toolName}:`, error);
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
    });

    // Set up task-related tools and resources
    this.taskToolHandler = setupTaskTools(this.server);
    setupTaskResources(this.server);
    
    // Set up space-related tools
    this.spaceToolHandler = setupSpaceTools(this.server);
    
    // Set up doc-related tools and resources
    this.docToolHandler = setupDocTools(this.server);
    setupDocResources(this.server);
    
    // Set up checklist-related tools and resources
    this.checklistToolHandler = setupChecklistTools(this.server);
    setupChecklistResources(this.server);
    
    // Set up comment-related tools and resources
    this.commentToolHandler = setupCommentTools(this.server);
    setupCommentResources(this.server);
    
    // Set up space, folder, and list resources
    setupSpaceResources(this.server);
    setupFolderResources(this.server);
    setupListResources(this.server);
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
