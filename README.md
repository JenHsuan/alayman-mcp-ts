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

## Adding to Claude Code

Follow these steps to add the Alayman MCP server to Claude Code:

### Step 1: Build the Project

First, clone the repository and build the project:

```bash
git clone <repository-url>
cd alayman-mcp-ts
npm install
npm run build
```

### Step 2: Locate Your Claude Code Configuration File

The configuration file location depends on your operating system:

- **macOS/Linux**: `~/.config/claude/config.json`
- **Windows**: `%APPDATA%\claude\config.json`

If the file doesn't exist, create it with an empty JSON object: `{}`

### Step 3: Add the MCP Server Configuration

Edit the configuration file and add the `mcpServers` section. **Important**: Use the absolute path to your project's build directory.

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

**Example for macOS/Linux:**
```json
{
  "mcpServers": {
    "alayman": {
      "command": "node",
      "args": [
        "/Users/yourname/Projects/alayman-mcp-ts/build/index.js"
      ]
    }
  }
}
```

**Example for Windows:**
```json
{
  "mcpServers": {
    "alayman": {
      "command": "node",
      "args": [
        "C:\\Users\\yourname\\Projects\\alayman-mcp-ts\\build\\index.js"
      ]
    }
  }
}
```

### Step 4: Restart Claude Code

Completely restart Claude Code (quit and reopen) for the changes to take effect.

### Step 5: Verify Installation

You can verify the MCP server is working by asking Claude:
- "List all alayman's articles"
- "Fetch articles about React"
- "Show me the latest 5 articles from alayman"

## Usage

Once the MCP server is configured, you can interact with it naturally through Claude Code. The server provides the `fetch-articles` tool that Claude can use automatically based on your requests.

### Example Queries

**Get all articles:**
```
List all articles from alayman.io
```

**Search for specific topics:**
```
Find all Angular articles from alayman
```

**Limit results:**
```
Show me the 10 most recent articles
```

**Pagination:**
```
Get articles 20-40 from alayman
```

### How It Works

When you make a request related to alayman.io articles, Claude Code will automatically:
1. Recognize that it should use the `fetch-articles` tool
2. Call the MCP server with appropriate parameters
3. Format and present the results to you

You don't need to manually invoke the tool - just ask naturally!

## Available Tools

### fetch-articles

Fetches articles from the alayman.io API with optional filtering and pagination.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `limit` | number | No | Maximum number of articles to return (default: 20) |
| `offset` | number | No | Number of articles to skip for pagination (default: 0) |
| `search` | string | No | Search term to filter articles by title, subtitle, or content |

**Usage Examples:**

1. **Fetch all articles (default):**
   ```json
   {}
   ```

2. **Search for specific topics:**
   ```json
   {
     "search": "Angular"
   }
   ```

3. **Limit results:**
   ```json
   {
     "limit": 10
   }
   ```

4. **Pagination (get articles 20-40):**
   ```json
   {
     "limit": 20,
     "offset": 20
   }
   ```

5. **Combined search with limit:**
   ```json
   {
     "search": "React",
     "limit": 5
   }
   ```

**Response Format:**

```json
{
  "articles": [
    {
      "id": 307,
      "title": "Article Title",
      "subtitle": "Article subtitle...",
      "image": "https://...",
      "url": "https://medium.com/...",
      "name": "Author Name",
      "time": "2025-08-23T06:07:28Z",
      "readtime": "5 min read",
      "category": 1,
      "description": "",
      "shareCount": 0,
      "checkCount": 3
    }
  ],
  "total": 30,
  "offset": 0,
  "limit": 20,
  "has_more": true
}
```

**Response Fields:**

- `articles`: Array of article objects
- `total`: Total number of articles matching the query
- `offset`: Current pagination offset
- `limit`: Maximum articles returned
- `has_more`: Boolean indicating if more articles are available

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

## Quick Reference

### Common Natural Language Queries

Once installed, you can use these natural language queries with Claude Code:

| What you want | Example query |
|---------------|---------------|
| All articles | "List all alayman's articles" |
| Search by topic | "Find all Angular articles from alayman" |
| Search by topic | "Show me React articles" |
| Limited results | "Get the latest 10 articles from alayman" |
| Pagination | "Show me articles 20-30" |
| Recent articles | "What are the newest articles on alayman.io?" |

### Direct Tool Usage

If you're building integrations or testing, you can also invoke the tool directly:

```typescript
// Through MCP client
const result = await client.callTool("fetch-articles", {
  search: "TypeScript",
  limit: 5
});
```

## Resources

- [Model Context Protocol Documentation](https://modelcontextprotocol.io/)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Claude Code Documentation](https://docs.claude.com/claude-code)
- [Alayman.io](https://alayman.io)
