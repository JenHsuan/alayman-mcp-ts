# Alayman MCP Server

A Model Context Protocol (MCP) server that provides access to articles from [alayman.io](https://alayman.io) via STDIO transport for use with Claude Code and other MCP clients.

## Features

- **Tool: `fetch-articles`** - Fetch articles from the alayman.io API with optional filtering
- **STDIO Transport** - Compatible with Claude Code and other STDIO-based MCP clients
- **Type-safe** - Built with TypeScript and Zod validation

## Installation

```bash
npm install
```

## Building

```bash
npm run build
```

## Usage with Claude Code

To use this MCP server with Claude Code:

1. Build the project:
```bash
npm run build
```

2. Add the server to your Claude Code configuration file:
   - macOS/Linux: `~/.config/claude/config.json`
   - Windows: `%APPDATA%\claude\config.json`

3. Add this configuration (replace with your actual path):
```json
{
  "mcpServers": {
    "alayman": {
      "command": "node",
      "args": [
        "/absolute/path/to/alayman-mcp-ts/build/index.js"
      ]
    }
  }
}
```

4. Restart Claude Code

5. Test by asking Claude to "use the fetch-articles tool to get the latest articles"

## Available Tools

### fetch-articles

Fetches articles from the alayman.io API.

**Parameters:**
- `limit` (optional, number) - Maximum number of articles to return
- `offset` (optional, number) - Number of articles to skip
- `search` (optional, string) - Search term to filter articles

**Example:**
```json
{
  "limit": 5,
  "search": "technology"
}
```

**Returns:**
```json
{
  "articles": [...],
  "count": 5,
  "success": true
}
```

## Project Structure

```
alayman-mcp-ts/
├── src/
│   └── index.ts          # Main server implementation
├── build/                # Compiled JavaScript (generated)
├── package.json          # Project dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── .gitignore           # Git ignore rules
└── README.md            # This file
```

## Development

### Watch Mode

```bash
npm run watch
```

This will recompile TypeScript files automatically when they change.

### Logging

All server logs are written to `stderr` (not `stdout`) to avoid corrupting MCP protocol messages. Look for logs prefixed with `[MCP]`.

## API Documentation

The server fetches data from: `https://alayman.io/api/articles`

Query parameters supported:
- `limit` - Maximum results
- `offset` - Pagination offset
- `search` - Search filter

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Troubleshooting

### Server not appearing in Claude Code
- Verify the path in your `config.json` is absolute, not relative
- Make sure you ran `npm run build` after making changes
- Restart Claude Code completely after configuration changes
- Check Claude Code logs for MCP server errors

### API errors
- Verify that `https://alayman.io/api/articles` is accessible
- Check your internet connection
- Review server logs in stderr for detailed error messages

## Resources

- [Model Context Protocol Documentation](https://modelcontextprotocol.io/)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Alayman.io](https://alayman.io)
