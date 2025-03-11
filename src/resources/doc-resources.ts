import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  ErrorCode,
  ListResourcesRequestSchema,
  ListResourceTemplatesRequestSchema,
  McpError,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { createClickUpClient } from '../clickup-client/index.js';
import { createDocsClient } from '../clickup-client/docs.js';

// Create clients
const clickUpClient = createClickUpClient();
const docsClient = createDocsClient(clickUpClient);

// URI patterns - only support explicit workspace specification
const WORKSPACE_DOC_URI_PATTERN = /^clickup:\/\/workspace\/([^/]+)\/doc\/([^/]+)$/;

export function setupDocResources(server: Server): void {
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
          uriTemplate: 'clickup://workspace/{workspace_id}/doc/{doc_id}',
          name: 'Doc content',
          mimeType: 'application/json',
          description: 'Content of a specific doc in the specified workspace',
        },
      ],
    };
  });

  // Handle resource reads
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri;
    
    // Check if this is a doc resource with explicit workspace
    const workspaceDocMatch = uri.match(WORKSPACE_DOC_URI_PATTERN);
    if (workspaceDocMatch) {
      const workspaceId = workspaceDocMatch[1];
      const docId = workspaceDocMatch[2];
      return await handleDocResource(docId, workspaceId);
    }
    
    // If no match, return an empty object to let other handlers process it
    return {};
  });
}

async function handleDocResource(docId: string, workspaceId: string) {
  try {
    console.log(`Getting doc ${docId} from workspace ${workspaceId}`);
    
    // Get the pages of the doc
    const pages = await docsClient.getDocPages(workspaceId, docId);
    
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
      contents: [
        {
          uri: `clickup://workspace/${workspaceId}/doc/${docId}`,
          mimeType: 'application/json',
          text: combinedContent || 'No content found in this doc.',
        },
      ],
    };
  } catch (error: any) {
    throw new McpError(
      ErrorCode.InternalError,
      `Error fetching doc: ${error.message}`
    );
  }
}
