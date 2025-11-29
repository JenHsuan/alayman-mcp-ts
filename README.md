# Alayman MCP Server

A Model Context Protocol (MCP) server for fetching and querying articles from [alayman.io](https://alayman.io). Built with TypeScript and deployed on Cloudflare Workers.

## Features

This MCP server provides four tools for interacting with the alayman.io articles API:

1. **get_all_articles** - Fetch all available articles
2. **get_article_by_id** - Retrieve a specific article by its ID
3. **search_articles** - Search articles by keyword in titles
4. **filter_by_category** - Filter articles by category number

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
    "ALAYMAN_API_URL": "https://alayman.io/api/articles"
  }
}
```

For local development, you can also create a `.env` file (see `.env.example` for reference).

### Development

Run the server locally:

```bash
npm run dev
```

The server will be available at `http://localhost:8787`

### Deployment

Deploy to Cloudflare Workers:

```bash
npm run deploy
```

## API Endpoints

- **/** - Health check and server info
- **/sse** - Server-Sent Events endpoint
- **/sse/message** - SSE message endpoint
- **/mcp** - MCP protocol endpoint

## Available Tools

### 1. get_all_articles

Fetches all articles from the alayman.io API.

**Parameters:** None

**Example Response:**
```
Found 50 articles:

ID: 1
Title: Article Title
Subtitle: Brief description
Author: Author Name
Published: 2024-01-15T10:00:00Z
Reading Time: 5 min read
Category: 1
URL: https://alayman.io/article-url
...
```

### 2. get_article_by_id

Retrieves a specific article by its ID.

**Parameters:**
- `id` (number, required): The ID of the article to fetch

**Example:**
```json
{
  "id": 42
}
```

### 3. search_articles

Searches for articles matching a keyword in their titles.

**Parameters:**
- `keyword` (string, required): Keyword to search in article titles

**Example:**
```json
{
  "keyword": "JavaScript"
}
```

### 4. filter_by_category

Filters articles by category number.

**Parameters:**
- `category` (number, required): Category number to filter articles

**Example:**
```json
{
  "category": 1
}
```

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
