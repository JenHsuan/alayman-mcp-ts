# Alayman MCP Server

A Model Context Protocol (MCP) server for fetching and querying articles from [alayman.io](https://alayman.io) with API key authentication. Built with TypeScript and deployed on Cloudflare Workers.

## Features

This MCP server provides tools and prompts for interacting with the alayman.io articles API with API key authentication:

### Authentication Tools
1. **verify_api_key** - Verify your alayman.io API key
2. **get_auth_status** - Check current authentication status

### Article Tools (Requires Authentication)
1. **get_all_articles** - Fetch articles with pagination support
2. **search_articles** - Search articles by keyword in titles

### Prompts
1. **authenticate** - Interactive prompt to verify your API key
2. **list_articles** - Generate a prompt to list articles with custom conditions

## Quick Start

### Prerequisites

- Node.js 18+ installed
- A Cloudflare account (for deployment)
- Wrangler CLI configured
- An alayman.io API key (for authentication)

### Installation

```bash
npm install
```

### Configuration

The server requires the Alayman API URL to be configured as an environment variable. The API URL is set in `wrangler.jsonc`:

```jsonc
{
  "vars": {
    "ARTICLES_API_URL": "https://example.com/api"
  }
}
```

For local development, you can also create a `.env` file (see `.env.example` for reference).

### Development

* Run the server locally:

```bash
npm run dev
```

* Add the MCP server URL to Claude Code with your API key:

```bash
# With API key (recommended)
claude mcp add --scope user --transport sse \
  --env ALAYMAN_API_KEY=your-api-key \
  alayman http://localhost:8787/sse

# Or without API key (will need to authenticate interactively)
claude mcp add --scope user --transport sse \
  alayman http://localhost:8787/sse
```

The server will be available at `http://localhost:8787`

### Deployment

Deploy to Cloudflare Workers:

```bash
npm run deploy
```

## How to Use

### Authentication

This MCP server requires API key authentication to access article tools. You can authenticate in two ways:

#### Option A: Environment Variable (Recommended)

Configure your API key when adding the MCP server. The server will auto-verify on startup.

```bash
# Remove old server configuration (if exists)
claude mcp remove alayman

# Add server with API key
claude mcp add --scope user --transport sse \
  --env ALAYMAN_API_KEY=your-api-key-here \
  alayman https://alayman-mcp-server.ofalpha.workers.dev/sse
```

**Benefits:**
- ✅ Auto-verified on startup
- ✅ No manual authentication needed
- ✅ Seamless experience

#### Option B: Interactive Verification

Add the server without an API key and verify through the MCP prompt.

```bash
# Add server without API key
claude mcp add --scope user --transport sse \
  alayman https://alayman-mcp-server.ofalpha.workers.dev/sse
```

Then in your Claude Code conversation:

1. Try using a tool: `"Get the latest 10 articles from alayman"`
2. You'll receive an error: `"API key verification required..."`
3. Use the **"Authenticate with Alayman"** prompt from the MCP prompts menu
4. Enter your API key when prompted
5. Once verified, all tools will work!

### Getting Your API Key

To get your alayman.io API key:
1. Visit [alayman.io](https://alayman.io)
2. Login to your account
3. Navigate to your account settings or API section
4. Generate or copy your API key

### Usage Examples

Once authenticated, you can use the article tools:

**Get articles:**
```
You: "Get the latest 10 articles from alayman"
Claude Code: [Uses get_all_articles tool]
```

**Search articles:**
```
You: "Search alayman articles for 'Angular'"
Claude Code: [Uses search_articles tool]
```

**Check authentication status:**
```
You: "Check my alayman authentication status"
Claude Code: [Uses get_auth_status tool]
```

**List articles with custom conditions:**
```
You: "Use the list articles prompt to show 5 articles about React"
Claude Code: [Uses list_articles prompt]
```

## API Endpoints

- **/** - Health check and server info (returns available tools and endpoints)
- **/sse** - Server-Sent Events endpoint for MCP communication
- **/sse/message** - SSE message endpoint
- **/mcp** - MCP protocol endpoint

## Available Tools

### Authentication Tools

#### verify_api_key

Verifies your alayman.io API key.

**Parameters:**
- `apiKey` (string, required): Your alayman.io API key

**Example:**
```json
{
  "apiKey": "your-api-key-here"
}
```

**Response:**
```
✅ API key verified successfully!

You can now use all article tools (get_all_articles, search_articles).
```

#### get_auth_status

Checks your current authentication status.

**Parameters:** None

**Response:**
```
✅ API key verified

You can use all article tools.
```

### Article Tools

#### 1. get_all_articles

Fetches articles from the alayman.io API with pagination support.

**Parameters:**
- `limit` (number, optional): Number of articles to return (default: 20)
- `offset` (number, optional): Number of articles to skip (default: 0)

**Example:**
```json
{
  "limit": 10,
  "offset": 0
}
```

**Example Response:**
```json
{
  "articles": [...],
  "total": 307,
  "offset": 0,
  "limit": 10,
  "has_more": true
}
```

### 2. search_articles

Searches for articles matching a keyword in their titles.

**Parameters:**
- `keyword` (string, required): Keyword to search in article titles

**Example:**
```json
{
  "keyword": "Angular"
}
```

**Example Response:**
```
Found 30 article(s) matching "Angular":

ID: 307
Title: Add Interactive Abilities with D3.js in Angular
Subtitle: Through previous articles...
Author: Jen-Hsuan Hsieh (Sean)
Published: 2025-08-23T06:07:28Z
Reading Time:
Category: 1
URL: https://medium.com/a-layman/...
...
```

## Available Prompts

### authenticate

Interactive prompt to verify your alayman.io API key. Appears in the MCP prompts menu.

**Arguments:**
- `apiKey` (string, required): Your alayman.io API key

**Example:**
```json
{
  "apiKey": "your-api-key-here"
}
```

This will trigger the `verify_api_key` tool to authenticate your session.

### list_articles

Generates a prompt to list a specific number of alayman's articles with optional custom conditions.

**Arguments:**
- `number` (number, optional): Number of articles to list (default: 10)
- `condition` (string, optional): Custom condition or filter criteria for the articles

**Example:**
```json
{
  "number": 10,
  "condition": "about Angular"
}
```

This will generate a prompt: "List 10 alayman's articles about Angular"

## Project Structure

```
alayman-mcp-ts/
├── src/
│   └── index.ts          # Main MCP server implementation
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── wrangler.jsonc        # Cloudflare Workers configuration
├── .gitignore           # Git ignore patterns
└── README.md            # This file
```

## Article Data Structure

Each article contains the following fields:

- `id` - Unique identifier
- `title` - Article title
- `subtitle` - Brief description
- `image` - Featured image URL
- `url` - Full article URL
- `name` - Author name
- `time` - Publication timestamp (ISO 8601)
- `readtime` - Estimated reading duration
- `category` - Category classification number
- `description` - Additional metadata
- `shareCount` - Social sharing count
- `checkCount` - Engagement metric (likes/bookmarks)

## Development Scripts

- `npm run dev` - Start local development server
- `npm run deploy` - Deploy to Cloudflare Workers
- `npm run check` - Run Biome linter and formatter
- `npm run typecheck` - Run TypeScript type checking

## Technologies Used

- [Model Context Protocol SDK](https://github.com/modelcontextprotocol/sdk) - MCP implementation
- [Cloudflare Workers](https://workers.cloudflare.com/) - Serverless deployment platform
- [TypeScript](https://www.typescriptlang.org/) - Type-safe development
- [Zod](https://zod.dev/) - Schema validation
- [Wrangler](https://developers.cloudflare.com/workers/wrangler/) - Cloudflare Workers CLI

## License

MIT

## Reference

Based on the [Cloudflare AI authless MCP demo](https://github.com/cloudflare/ai/tree/main/demos/remote-mcp-authless)
