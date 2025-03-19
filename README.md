# ClickUp MCP Server

<p align="center">
  <img src="assets/images/clickupserverlogo.png" width="256" alt="ClickUp MCP Server Logo" />
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/clickup-mcp-server"><img src="https://img.shields.io/npm/v/clickup-mcp-server.svg" alt="npm version"></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT"></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen" alt="Node.js Version"></a>
  <a href="https://github.com/modelcontextprotocol/typescript-sdk"><img src="https://img.shields.io/badge/MCP%20SDK-1.6.1-orange" alt="MCP SDK"></a>
</p>

A Model Context Protocol (MCP) server that provides a standardized interface for AI assistants to interact with the ClickUp API. This server enables AI systems to access and manipulate ClickUp data such as workspaces, spaces, folders, lists, tasks, docs, comments, and checklists.

## Available Tools

- `get_workspaces`: Get the list of workspaces
- `get_spaces`: Get spaces within a workspace
- `get_tasks`: Get tasks from a list
- `create_task`: Create a new task
- `update_task`: Update an existing task
- `get_docs_from_workspace`: Get all docs from a workspace
- `create_folder`: Create a new folder in a space
- `get_lists`: Get lists in a folder or space
- `create_list`: Create a new list

## Installation

```bash
git clone https://github.com/nsxdavid/clickup-mcp-server.git
cd clickup-mcp-server
npm install
```

## Get ClickUp API Token

1. Log in to ClickUp account
2. Go to Settings > Apps
3. Click "Generate API Token"
4. Copy the token

## Configuration

Add to the MCP settings file:

```json
{
  "mcpServers": {
    "clickup": {
      "command": "node",
      "args": ["/path/to/clickup-mcp-server/build/index.js"],
      "env": {
        "CLICKUP_API_TOKEN": "YOUR_API_TOKEN_HERE"
      },
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

* Make sure to correct the path
* Make sure to supply your API token

## Alternate Installation (npx)

For users who prefer not to clone the repository, the package can be run directly using npx:

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

* Replace `YOUR_API_TOKEN_HERE` with your API token
* No installation or cloning is required with this method

## Configuration File Locations

- Cline VSCode Extension: `~/.vscode/extensions/saoudrizwan.claude-dev/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`
- Claude Desktop Apps:
  - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
  - Windows: `%APPDATA%\Claude\claude_desktop_config.json`

## Development

### Building

```bash
npm run build
```

### Running Tests

```bash
npm test
```

## License

MIT
