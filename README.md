# ClickUp MCP Server

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![MCP SDK](https://img.shields.io/badge/MCP%20SDK-1.6.1-orange)](https://github.com/modelcontextprotocol/typescript-sdk)

A Model Context Protocol (MCP) server that provides a standardized interface for AI assistants to interact with the ClickUp API. This server enables AI systems to access and manipulate ClickUp data such as workspaces, spaces, folders, lists, tasks, docs, comments, and checklists through a consistent protocol.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage Examples](#usage-examples)
- [Available Tools](#available-tools)
- [Available Resources](#available-resources)
- [Implementation Details](#implementation-details)
- [Security](#security)
- [Contributing](#contributing)
- [Author](#author)
- [License](#license)

## Overview

The ClickUp MCP Server acts as a bridge between AI assistants and the ClickUp platform by:

1. Exposing ClickUp data as MCP resources with standardized URIs
2. Providing MCP tools for performing operations on ClickUp entities
3. Handling authentication and API communication with ClickUp
4. Formatting responses according to the MCP specification

This enables AI assistants to seamlessly interact with ClickUp data and functionality without needing to understand the specifics of the ClickUp API.

## Features

- **Comprehensive API Coverage**: Access to workspaces, spaces, folders, lists, tasks, docs, comments, and checklists
- **Standardized Interface**: Consistent MCP-compliant tools and resources
- **Flexible Authentication**: Support for both API token and OAuth authentication methods
- **Error Handling**: Robust error handling and reporting
- **Resource-Based Access**: URI-addressable resources for data retrieval
- **Tool-Based Operations**: Function-like tools for performing actions

## Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn
- A ClickUp account with API access

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/nsxdavid/clickup-server.git
   cd clickup-server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the server:
   ```bash
   npm run build
   ```

## Configuration

### Authentication

The server requires authentication with the ClickUp API. You can use either an API token (simplest) or OAuth credentials.

#### Option 1: API Token (Recommended)

1. Log in to your ClickUp account
2. Go to Settings > Apps
3. Click on "Generate API Token"
4. Copy the generated token

#### Option 2: OAuth

1. Create a ClickUp OAuth application at https://clickup.com/api/developer/
2. Get your Client ID and Client Secret
3. Run the helper script to get an access token:
   ```bash
   node scripts/get-access-token.js
   ```

### MCP Settings Configuration

To use this server with an MCP client (like Claude), you need to configure it in the MCP settings file:

1. For Claude Desktop:
   - Open the existing config file at `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows)
   - Add or modify the `mcpServers` section as shown below

2. For Claude VSCode Extension:
   - Locate the settings file at `~/.vscode/extensions/saoudrizwan.claude-dev-x.x.x/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`
   - Add or modify the `mcpServers` section as shown below

3. Add the following configuration, replacing placeholders with your actual values:

```json
{
  "mcpServers": {
    "clickup": {
      "command": "node",
      "args": ["path/to/clickup-server/build/index.js"],
      "env": {
        "CLICKUP_API_TOKEN": "your_api_token_here"
      },
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

## Usage Examples

### Working with Workspaces and Spaces

```javascript
// Get all workspaces
use_mcp_tool({
  server_name: "clickup",
  tool_name: "get_workspaces",
  arguments: {}
})

// Get spaces in a workspace
use_mcp_tool({
  server_name: "clickup",
  tool_name: "get_spaces",
  arguments: { 
    workspace_id: "9011839976" 
  }
})

// Get a specific space
use_mcp_tool({
  server_name: "clickup",
  tool_name: "get_space",
  arguments: { 
    space_id: "90113637923" 
  }
})
```

### Working with Tasks

```javascript
// Get tasks from a list
use_mcp_tool({
  server_name: "clickup",
  tool_name: "get_tasks",
  arguments: {
    list_id: "901109776097",
    include_closed: false
  }
})

// Get detailed information about a task
use_mcp_tool({
  server_name: "clickup",
  tool_name: "get_task_details",
  arguments: {
    task_id: "86rkjvttt",
    include_subtasks: true
  }
})

// Create a new task
use_mcp_tool({
  server_name: "clickup",
  tool_name: "create_task",
  arguments: {
    list_id: "901109776097",
    name: "New task from MCP",
    description: "This task was created using the ClickUp MCP Server",
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

// Search for docs in a workspace
use_mcp_tool({
  server_name: "clickup",
  tool_name: "search_docs",
  arguments: { 
    workspace_id: "9011839976",
    query: "project plan"
  }
})
```

### Accessing Resources

```javascript
// Get task details
access_mcp_resource({
  server_name: "clickup",
  uri: "clickup://task/86rkjvttt"
})

// Get lists in a folder
access_mcp_resource({
  server_name: "clickup",
  uri: "clickup://folder/90115795569/lists"
})

// Get comments for a task
access_mcp_resource({
  server_name: "clickup",
  uri: "clickup://task/868czp2t3/comments"
})
```

## Available Tools

The server provides the following tools for interacting with ClickUp:

### Workspace and Authentication Tools
- `get_workspaces`: Get the list of workspaces the user has access to
- `get_workspace_seats`: Get information about seats in a workspace

### Space Tools
- `get_spaces`: Get spaces within a workspace
- `get_space`: Get details of a specific space

### Folder Tools
- `create_folder`: Create a new folder in a space
- `update_folder`: Update an existing folder
- `delete_folder`: Delete a folder

### List Tools
- `get_lists`: Get lists in a folder or space
- `get_folderless_lists`: Get lists not in any folder
- `get_list`: Get details of a specific list
- `create_list`: Create a new list in a folder or space
- `create_folderless_list`: Create a list not in any folder
- `update_list`: Update an existing list
- `delete_list`: Delete a list
- `create_list_from_template_in_folder`: Create a list from a template in a folder
- `create_list_from_template_in_space`: Create a list from a template in a space

### Task Tools
- `get_tasks`: Get tasks from a list
- `get_task_details`: Get detailed information about a task
- `create_task`: Create a new task
- `update_task`: Update an existing task
- `add_task_to_list`: Add a task to a list
- `remove_task_from_list`: Remove a task from a list

### Document Tools
- `get_docs_from_workspace`: Get all docs from a workspace
- `get_doc_content`: Get the content of a specific doc
- `get_doc_pages`: Get the pages of a doc
- `search_docs`: Search for docs in a workspace

### Checklist Tools
- `create_checklist`: Create a new checklist in a task
- `update_checklist`: Update an existing checklist
- `delete_checklist`: Delete a checklist
- `create_checklist_item`: Create a new checklist item
- `update_checklist_item`: Update an existing checklist item
- `delete_checklist_item`: Delete a checklist item

### Comment Tools
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

## Available Resources

The server exposes ClickUp data through URI-addressable resources:

### Task Resources
- `clickup://task/{task_id}`: Details of a specific task
- `clickup://task/{task_id}/comments`: Comments for a specific task
- `clickup://task/{task_id}/checklist`: Checklists for a specific task

### List Resources
- `clickup://list/{list_id}`: Details of a specific list
- `clickup://list/{list_id}/comments`: Comments for a specific list

### Folder Resources
- `clickup://folder/{folder_id}`: Details of a specific folder
- `clickup://folder/{folder_id}/lists`: Lists in a specific folder

### Space Resources
- `clickup://space/{space_id}`: Details of a specific space
- `clickup://space/{space_id}/folders`: Folders in a specific space
- `clickup://space/{space_id}/lists`: Folderless lists in a specific space

### Workspace Resources
- `clickup://workspace/{workspace_id}/spaces`: Spaces in a specific workspace
- `clickup://workspace/{workspace_id}/doc/{doc_id}`: Content of a specific doc

### Comment Resources
- `clickup://view/{view_id}/comments`: Comments for a specific chat view
- `clickup://comment/{comment_id}/reply`: Threaded comments for a specific comment

### Checklist Resources
- `clickup://checklist/{checklist_id}/items`: Items in a specific checklist

## Implementation Details

### Architecture

The server follows a modular architecture organized by ClickUp entity types:

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
│   ├── resources/               # MCP resource implementations
│   ├── controllers/             # Business logic controllers
│   ├── routes/                  # Express routes (for HTTP)
│   └── services/                # Service layer
└── scripts/
    └── get-access-token.js      # Helper for OAuth token retrieval
```

### Response Format

All tool handlers return an object with a `content` array property:

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

## Security

The ClickUp MCP Server takes security seriously and includes several features to help protect your data:

### Secure Authentication

- Support for both API token and OAuth authentication methods
- Environment variable-based configuration to avoid hardcoding credentials
- Helper script for secure OAuth token retrieval

### Vulnerability Reporting

We've implemented GitHub's private vulnerability reporting feature to allow security researchers to report vulnerabilities securely. If you discover a security issue:

1. Go to the repository's Security tab
2. Click on "Report a vulnerability"
3. Provide details about the vulnerability

For more information, see our [Security Policy](SECURITY.md).

### Automated Security Updates

The project uses Dependabot to automatically monitor dependencies for security vulnerabilities and create pull requests for security updates. This helps ensure that:

- Dependencies are kept up-to-date with security patches
- Security vulnerabilities are addressed promptly
- The maintenance burden for security updates is reduced

### Best Practices

We follow security best practices including:

- Input validation using Zod schemas
- Error handling that doesn't expose sensitive information
- Proper API token management
- Secure defaults in configuration

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines on how to contribute to this project.

### Development Notes

- The project has some linting issues that need to be fixed. If you're contributing, please help fix these issues by following the ESLint rules in `.eslintrc.json`.
- You can run `npm run lint --fix` to automatically fix some of the issues.
- The CI workflow currently skips the linting step to allow for successful builds while these issues are being addressed.

## Author

This project was created by [David Whatley](https://davidwhatley.com) as the original author.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
