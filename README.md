# ClickUp MCP Server

This project implements a Model Context Protocol (MCP) server for interacting with the ClickUp API. It provides tools and resources for accessing ClickUp data, such as workspaces, spaces, tasks, and docs.

## Architecture

The server is built using the MCP SDK and follows a modular architecture:

- `src/index.ts`: Main server entry point and handler registration
- `src/clickup-client/`: API clients for interacting with ClickUp
- `src/tools/`: Tool implementations for various ClickUp features
- `src/resources/`: Resource implementations for accessing ClickUp data

## Configuration

To use this server, you need to configure it with your ClickUp API token. This is done through the MCP settings file:

1. Copy the `mcp-settings-example.json` file to your MCP settings location:
   - For Claude Desktop: `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows)
   - For Claude VSCode Extension: `~/.vscode/extensions/saoudrizwan.claude-dev-x.x.x/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`

2. Replace `"your_api_token_here"` with your actual ClickUp API token
3. Update the `"args"` path to point to the correct location of the server on your system

Example configuration:
```json
{
  "mcpServers": {
    "clickup": {
      "command": "node",
      "args": ["/path/to/clickup-server/build/index.js"],
      "env": {
        "CLICKUP_API_TOKEN": "your_api_token_here"
      },
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

### Getting a ClickUp API Token

To get a ClickUp API token:

1. Log in to your ClickUp account
2. Go to Settings > Apps
3. Click on "Generate API Token"
4. Copy the generated token and use it in your MCP settings file

## Available Tools

This server provides the following tools for interacting with ClickUp:

### Workspace and Space Tools
- `get_workspaces`: Get the list of workspaces the user has access to
- `get_spaces`: Get the spaces in a workspace

### Document Tools
- `get_docs_from_workspace`: Get all docs from a workspace with filtering options
- `get_doc_content`: Get the content of a specific doc
- `get_doc_pages`: Get the pages of a doc with formatting options
- `search_docs`: Search for docs in a workspace (limited functionality)

### Task Tools
- `get_tasks`: Get tasks from a list, folder, or space
- `get_task_details`: Get detailed information about a task
- `create_task`: Create a new task in a list
- `update_task`: Update an existing task

## Example Usage

Here are some examples of how to use the tools:

```javascript
// Get all workspaces
get_workspaces()

// Get spaces in a workspace
get_spaces({ workspace_id: "9011839976" })

// Get all docs in a workspace
get_docs_from_workspace({ 
  workspace_id: "9011839976",
  deleted: false,
  archived: false,
  limit: 50
})

// Get content of a specific doc
get_doc_content({ 
  doc_id: "8cjbgz8-911", 
  workspace_id: "9011839976" 
})

// Get tasks from a list
get_tasks({
  container_type: "list",
  container_id: "123456789",
  include_closed: false
})
```

## MCP Tool Implementation Guide

### Direct Handler Registration

This approach registers handlers directly in the main server file, which ensures proper response formatting:

1. Add tool definitions to the appropriate module (e.g., `src/tools/doc-tools.ts`)
2. Implement direct handlers in `src/index.ts`

Example:
```typescript
// In src/index.ts
this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const toolName = request.params.name;
  const args = request.params.arguments;
  
  // Handle get_feature tool
  if (toolName === 'get_feature') {
    console.log('Direct handler for get_feature called with args:', JSON.stringify(args, null, 2));
    
    // Type assertion to avoid TypeScript errors
    const { feature_id } = args as { feature_id: string };
    
    if (!feature_id) {
      return {
        content: [
          {
            type: 'text',
            text: 'Error: feature_id is required',
          },
        ],
        isError: true,
      };
    }
    
    try {
      // Create clients
      const featureClient = createFeatureClient(createClickUpClient());
      
      // Get the feature data
      const result = await featureClient.getFeature(feature_id);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text',
            text: `Error getting feature: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }
  
  // Not our tool, let other handlers process it
  return {};
});
```

## Important Implementation Details

### Response Format

The most critical aspect of implementing MCP tools is ensuring the correct response format. All tool handlers must return an object with a `content` array property:

```typescript
return {
  content: [
    {
      type: 'text',
      text: 'Your response text here',
    },
  ],
};
```

For error responses:

```typescript
return {
  content: [
    {
      type: 'text',
      text: 'Error message here',
    },
  ],
  isError: true,
};
```

### Error Handling

Always implement proper error handling in tool handlers:

```typescript
try {
  // Implementation...
} catch (error: any) {
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
```

### Type Safety

Use TypeScript type assertions when extracting arguments:

```typescript
const { param1, param2 } = args as { param1: string; param2: number };
```

## Testing Tools

To test your tools:

1. Build the server: `npm run build`
2. Run the server: `node test-server.js`
3. Use the MCP client to call your tools

## Resource Implementation

Resources provide a way to access ClickUp data using URI templates. Implement resources in the `src/resources/` directory following the same pattern as tools.

Example resource URI: `clickup://workspace/{workspace_id}/doc/{doc_id}`

## Troubleshooting

If you encounter issues with tool responses:

1. Check the response format - ensure it has a `content` array property
2. Add logging to see what's happening in the handler
3. Try implementing a direct handler in `src/index.ts`
4. Verify the ClickUp API client is working correctly

## Contributing

When adding new tools:

1. Add the tool definition to the appropriate module
2. Implement the handler function
3. Register the tool in the main server file
4. Add tests for the tool
5. Update this README with any new information

## License

MIT
