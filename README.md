# Alayman MCP Server

A Model Context Protocol (MCP) server that provides access to articles from [alayman.io](https://alayman.io) via HTTP transport for use with Claude Code and other MCP clients.

## Features

- **Tool: `fetch-articles`** - Fetch articles from the alayman.io API with optional filtering
- **SSE Transport** - HTTP-based Server-Sent Events for real-time communication
- **REST API** - Includes health check and message endpoints
- **Type-safe** - Built with TypeScript and Zod validation
- **CORS Support** - Accessible from web applications

## Installation

```bash
npm install
```

## Building

```bash
npm run build
```

## Quick Start

### Step 1: Installation and Configuration

Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd alayman-mcp-ts
npm install
```

### Step 2: Environment Setup

Copy the example environment file and configure:

```bash
cp .env.example .env
```

Edit `.env` if needed (default values should work):

```env
# API Configuration
API_BASE_URL=https://alayman.io/api/articles

# Server Configuration
PORT=3000
```

### Step 3: Build and Start the Server

Build the TypeScript code:

```bash
npm run build
```

Start the server:

```bash
npm start
```

You should see output like:
```
[MCP] Alayman MCP Server running on http://localhost:3000
[MCP] SSE endpoint: http://localhost:3000/sse
[MCP] Health check: http://localhost:3000/health
```

### Step 4: Verify Server is Running

Test the health endpoint:

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{"status":"ok","server":"alayman-mcp-server","version":"1.0.0"}
```

## Adding to Claude Code

Follow these steps to connect the SSE server to Claude Code:

### Step 1: Locate Your Claude Code Configuration File

The configuration file location depends on your operating system:

- **macOS/Linux**: `~/.config/claude/config.json`
- **Windows**: `%APPDATA%\claude\config.json`

If the file doesn't exist, create it with an empty JSON object: `{}`

### Step 2: Add the MCP Server Configuration

Edit the configuration file and add the `mcpServers` section with SSE transport:

```json
{
  "mcpServers": {
    "alayman": {
      "url": "http://localhost:3000/sse"
    }
  }
}
```

**Note:** Make sure the MCP server is running before starting Claude Code.

### Step 3: Restart Claude Code

Completely restart Claude Code (quit and reopen) for the changes to take effect.

### Step 4: Verify Integration

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

### Development Mode

For development with auto-rebuild:

```bash
npm run watch
```

In another terminal, start the server:

```bash
npm start
```

### Logging

All server logs are written to `stderr` (not `stdout`) to maintain clean SSE communication. Look for logs prefixed with `[MCP]`.

### API Endpoints

The server exposes the following endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check endpoint |
| `/sse` | GET | SSE endpoint for MCP communication |
| `/message` | POST | Endpoint for receiving MCP messages |

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
- **Verify the server is running**: Check that `http://localhost:3000/health` returns a successful response
- **Check the URL in config.json**: Ensure it matches `http://localhost:3000/sse`
- **Port conflicts**: If port 3000 is in use, change the `PORT` in your `.env` file and update the config
- **Restart Claude Code**: Completely quit and reopen Claude Code after configuration changes
- **Check Claude Code logs**: Look for MCP connection errors

### Server won't start
- **Port already in use**: Change the `PORT` in `.env` to a different value (e.g., 3001)
- **Dependencies not installed**: Run `npm install` to ensure all packages are installed
- **Build errors**: Run `npm run build` and check for TypeScript compilation errors
- **Environment file missing**: Copy `.env.example` to `.env`

### Connection errors
- **SSE connection fails**: Ensure the server is running before starting Claude Code
- **CORS issues**: The server has CORS enabled by default, but check if any firewall is blocking requests
- **Network issues**: Verify you can access `http://localhost:3000/health` from your browser

### API errors
- **Articles not fetching**: Verify that `https://alayman.io/api/articles` is accessible
- **Check your internet connection**: The server needs internet access to fetch articles
- **Review server logs**: Check stderr output for detailed error messages prefixed with `[MCP]`

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
