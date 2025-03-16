# ClickUp MCP Server - AI Installation Guide

This guide provides streamlined instructions for AI assistants to install and configure the ClickUp MCP Server.

## Prerequisites

Before installing the ClickUp MCP Server, ensure the following prerequisites are installed:

### Node.js and npm

The ClickUp MCP Server requires Node.js (which includes npm) version 18.0.0 or higher:

1. **Check if Node.js is already installed**:
   ```bash
   node --version
   npm --version
   ```
   If these commands return version numbers, and the Node.js version is 18.0.0 or higher, you can skip to the next section.

2. **Install Node.js and npm if needed**:
   - **Windows**: 
     - Using winget (Windows Package Manager):
       ```bash
       # Check if winget is available
       winget --version
       
       # If available, install Node.js LTS
       winget install OpenJS.NodeJS.LTS
       ```
       Note: winget is pre-installed on Windows 11 and newer Windows 10 versions. If the command is not found, use the installer method below.
     - Or download and run the installer from [nodejs.org](https://nodejs.org/)
   - **macOS**: 
     - Using Homebrew: `brew install node`
     - Or download from [nodejs.org](https://nodejs.org/)
   - **Linux**:
     - Ubuntu/Debian: `sudo apt update && sudo apt install nodejs npm`
     - Other distributions: See [nodejs.org](https://nodejs.org/)

3. **Verify installation**:
   ```bash
   node --version
   npm --version
   ```

## One-Click Installation

Once Node.js and npm are installed, the ClickUp MCP Server can be installed and run directly from npm without requiring any additional manual installation steps.

### About npx

The configuration below uses `npx`, which is a package runner tool that comes with npm (Node Package Manager). It allows you to:

- Run packages without installing them globally
- Execute commands from locally installed packages
- Run packages directly from the npm registry

When you use the configuration below, npx will automatically download and run the latest version of the clickup-mcp-server package from the npm registry each time it's needed, ensuring you always have the most up-to-date version.

### Configuration

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
