# ClickUp MCP Server - AI Installation Guide

This guide provides streamlined instructions for AI assistants to install and configure the ClickUp MCP Server.

## One-Click Installation

The ClickUp MCP Server can be installed and run directly from npm without requiring any manual installation steps:

1. Add the following configuration to the MCP settings file:

```json
{
  "mcpServers": {
    "clickup": {
      "command": "npx",
      "args": [
        "-y",
        "clickup-mcp-server"
      ],
      "env": {
        "CLICKUP_API_TOKEN": "YOUR_API_TOKEN_HERE"
      },
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

2. Replace `YOUR_API_TOKEN_HERE` with a valid ClickUp API token.

## Getting a ClickUp API Token

1. Log in to the ClickUp account
2. Go to Settings > Apps
3. Click on "Generate API Token"
4. Copy the generated token

## Configuration Locations

- **Claude Desktop**: `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows)
- **Claude VSCode Extension**: `~/.vscode/extensions/saoudrizwan.claude-dev-x.x.x/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`

## Troubleshooting

If you encounter issues:

1. **Connection Error**: Ensure the user has an internet connection and can access npm
2. **Permission Error**: The user may need to run with elevated permissions
3. **API Token Error**: Verify the ClickUp API token is valid and has the necessary permissions
4. **Version Conflict**: Specify a version with `clickup-mcp-server@1.8.0` in the args array

## Testing the Installation

To verify the server is working correctly:

1. Try a simple operation like getting workspaces:
   ```javascript
   use_mcp_tool({
     server_name: "clickup",
     tool_name: "get_workspaces",
     arguments: {}
   })
   ```

2. Check for a successful response with workspace data

## Available Tools

The server provides tools for interacting with ClickUp entities:

- `get_workspaces`: Get the list of workspaces
- `get_spaces`: Get spaces within a workspace
- `get_tasks`: Get tasks from a list
- `create_task`: Create a new task
- `get_docs_from_workspace`: Get all docs from a workspace

And many more. See the [README.md](README.md) for a complete list of tools and resources.
