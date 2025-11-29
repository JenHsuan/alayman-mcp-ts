# Alayman MCP Server

A Model Context Protocol (MCP) server for fetching and querying articles from [alayman.io](https://alayman.io). Built with TypeScript and deployed on Cloudflare Workers.

## Features

This MCP server provides tools and prompts for interacting with the alayman.io articles API:

### Tools
1. **get_all_articles** - Fetch articles with pagination support
2. **search_articles** - Search articles by keyword in titles

### Prompts
1. **list_articles** - Generate a prompt to list articles with custom conditions

## Quick Start

### Prerequisites

- Node.js 18+ installed
- A Cloudflare account (for deployment)
- Wrangler CLI configured

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

* Add the MCP server URL to your Claude code

```
claude mcp add --scope user --transport sse alayman http://localhost:8788/sse
```

The server will be available at `http://localhost:8787`

### Deployment

Deploy to Cloudflare Workers:

```bash
npm run deploy
```

## API Endpoints

- **/** - Health check and server info (returns available tools and endpoints)
- **/sse** - Server-Sent Events endpoint for MCP communication
- **/sse/message** - SSE message endpoint
- **/mcp** - MCP protocol endpoint

## Available Tools

### 1. get_all_articles

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
├── wrangler.toml         # Cloudflare Workers configuration
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
