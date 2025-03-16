# ClickUp MCP Server

## Project Overview

The ClickUp MCP Server is a Model Context Protocol (MCP) server that provides a standardized interface for AI assistants to interact with the ClickUp API. This server enables AI systems to access and manipulate ClickUp data such as workspaces, spaces, folders, lists, tasks, docs, comments, and checklists through a consistent protocol.

## Core Functionality

This server acts as a bridge between AI assistants and the ClickUp platform by:

1. Exposing ClickUp data as MCP resources with standardized URIs
2. Providing MCP tools for performing operations on ClickUp entities
3. Handling authentication and API communication with ClickUp
4. Formatting responses according to the MCP specification

## Architecture

The project follows a modular architecture organized by ClickUp entity types:

```
clickup-server/
├── src/
│   ├── index.ts                 # Main server entry point
│   ├── app.ts                   # Express app setup (for HTTP transport)
│   ├── clickup-client/          # API clients for ClickUp
│   │   ├── auth.ts              # Authentication handling
│   │   ├── tasks.ts             # Task-related API calls
│   │   ├── lists.ts             # List-related API calls
│   │   ├── spaces.ts            # Space-related API calls
│   │   ├── folders.ts           # Folder-related API calls
│   │   ├── docs.ts              # Doc-related API calls
│   │   ├── comments.ts          # Comment-related API calls
│   │   ├── checklists.ts        # Checklist-related API calls
│   │   └── index.ts             # Client exports
│   ├── tools/                   # MCP tool implementations
│   │   ├── task-tools.ts        # Task operations
│   │   ├── doc-tools.ts         # Doc operations
│   │   ├── space-tools.ts       # Space operations
│   │   ├── checklist-tools.ts   # Checklist operations
│   │   └── comment-tools.ts     # Comment operations
│   ├── resources/               # MCP resource implementations
│   │   ├── task-resources.ts    # Task data access
│   │   ├── list-resources.ts    # List data access
│   │   ├── space-resources.ts   # Space data access
│   │   ├── folder-resources.ts  # Folder data access
│   │   ├── doc-resources.ts     # Doc data access
│   │   ├── checklist-resources.ts # Checklist data access
│   │   └── comment-resources.ts # Comment data access
│   ├── controllers/             # Business logic controllers
│   ├── routes/                  # Express routes (for HTTP)
│   └── services/                # Service layer
└── scripts/
    └── get-access-token.js      # Helper for OAuth token retrieval
```

## Available Tools and Resources

### Tools

The server provides tools for interacting with various ClickUp entities:

#### Workspace and Space Tools
- `get_workspaces`: Retrieve workspaces the user has access to
- `get_spaces`: Get spaces within a workspace
- `get_space`: Get details of a specific space

#### List and Folder Tools
- `get_lists`: Get lists in a folder or space
- `get_folderless_lists`: Get lists not in any folder
- `get_list`: Get details of a specific list
- `create_folder`: Create a new folder in a space
- `update_folder`: Update an existing folder
- `delete_folder`: Delete a folder
- `create_list`: Create a new list in a folder or space
- `create_folderless_list`: Create a list not in any folder
- `update_list`: Update an existing list
- `delete_list`: Delete a list

#### Task Tools
- `get_tasks`: Get tasks from a list
- `get_task_details`: Get detailed information about a task
- `create_task`: Create a new task
- `update_task`: Update an existing task
- `add_task_to_list`: Add a task to a list
- `remove_task_from_list`: Remove a task from a list

#### Doc Tools
- `get_docs_from_workspace`: Get all docs from a workspace
- `get_doc_content`: Get the content of a specific doc
- `get_doc_pages`: Get the pages of a doc
- `search_docs`: Search for docs in a workspace

#### Checklist Tools
- `create_checklist`: Create a new checklist in a task
- `update_checklist`: Update an existing checklist
- `delete_checklist`: Delete a checklist
- `create_checklist_item`: Create a new checklist item
- `update_checklist_item`: Update an existing checklist item
- `delete_checklist_item`: Delete a checklist item

#### Comment Tools
- `get_task_comments`: Get comments for a task
- `create_task_comment`: Create a comment on a task
- `get_chat_view_comments`: Get comments for a chat view
- `create_chat_view_comment`: Create a comment on a chat view
- `get_list_comments`: Get comments for a list
- `create_list_comment`: Create a comment on a list
- `update_comment`: Update an existing comment
- `delete_comment`: Delete a comment
- `get_threaded_comments`: Get threaded comments for a parent comment
- `create_threaded_comment`: Create a threaded comment

### Resources

The server exposes ClickUp data through URI-addressable resources:

- `clickup://folder/{folder_id}/lists`: Lists in a specific folder
- `clickup://space/{space_id}/lists`: Folderless lists in a specific space
- `clickup://list/{list_id}`: Details of a specific list
- `clickup://task/{task_id}/comments`: Comments for a specific task
- `clickup://view/{view_id}/comments`: Comments for a specific chat view
- `clickup://list/{list_id}/comments`: Comments for a specific list
- `clickup://comment/{comment_id}/reply`: Threaded comments for a specific comment

## Configuration

The server requires a ClickUp API token for authentication, which is provided through environment variables in the MCP settings file:

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

## Implementation Details

### MCP Server Setup

The server is built using the MCP SDK and follows the standard MCP server pattern:

1. Create a Server instance with capabilities
2. Register request handlers for tools and resources
3. Set up error handling
4. Connect to a transport (stdio by default)

### Tool Implementation Pattern

Tools follow a consistent implementation pattern:

1. Define tool metadata (name, description, input schema)
2. Implement handler function that:
   - Validates input parameters
   - Calls the appropriate ClickUp API client
   - Formats the response according to MCP specifications
   - Handles errors properly

### Resource Implementation Pattern

Resources are implemented using:

1. Static resource definitions for direct access
2. Resource templates for parameterized access
3. Handler functions that retrieve and format data

## Usage Examples

### Working with Tasks

```javascript
// Get tasks from a list
use_mcp_tool({
  server_name: "clickup",
  tool_name: "get_tasks",
  arguments: {
    list_id: "123456789",
    include_closed: false
  }
})

// Create a new task
use_mcp_tool({
  server_name: "clickup",
  tool_name: "create_task",
  arguments: {
    list_id: "123456789",
    name: "New task",
    description: "Task description",
    priority: 3,
    due_date: 1714521600000
  }
})
```

### Working with Documents

```javascript
// Get all docs in a workspace
use_mcp_tool({
  server_name: "clickup",
  tool_name: "get_docs_from_workspace",
  arguments: {
    workspace_id: "9011839976",
    deleted: false,
    archived: false
  }
})

// Get content of a specific doc
use_mcp_tool({
  server_name: "clickup",
  tool_name: "get_doc_content",
  arguments: {
    doc_id: "8cjbgz8-911",
    workspace_id: "9011839976"
  }
})
```

### Accessing Resources

```javascript
// Get comments for a task
access_mcp_resource({
  server_name: "clickup",
  uri: "clickup://task/868czp2t3/comments"
})

// Get lists in a folder
access_mcp_resource({
  server_name: "clickup",
  uri: "clickup://folder/90115795569/lists"
})
```

## Development Notes

- The server uses axios for HTTP requests to the ClickUp API
- Error handling follows the MCP specification for consistent error reporting
- The server is designed to be run as a standalone process, typically launched by an MCP client
- Authentication is handled via API token, not OAuth (for simplicity)
