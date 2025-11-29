#!/usr/bin/env node

import 'dotenv/config';
import { randomUUID } from 'crypto';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { CallToolRequestSchema, ListToolsRequestSchema, ListPromptsRequestSchema, GetPromptRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import fetch from 'node-fetch';
import express, { Request, Response } from 'express';
import cors from 'cors';

// Article interface for type safety
interface Article {
  id: number;
  title: string;
  subtitle: string;
  image: string;
  url: string;
  name: string;
  time: string;
  readtime: string;
  category: number;
  description: string;
  shareCount: number;
  checkCount: number;
}

// Initialize MCP Server
const server = new Server(
  {
    name: 'alayman-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      prompts: {},
    },
  }
);

// Define input schema for fetch-articles tool
const FetchArticlesSchema = z.object({
  limit: z.number().default(20).describe('Maximum number of articles to return'),
  offset: z.number().default(0).describe('Number of articles to skip'),
  search: z.string().optional().describe('Search term to filter articles')
});

// Tool handler for fetching articles
async function fetchArticles(args: z.infer<typeof FetchArticlesSchema>) {
  try {
    const { limit, offset, search } = args;

    const url = process.env.API_BASE_URL;

    if (!url) {
      throw new Error('API_BASE_URL environment variable is not set');
    }

    // Log to stderr (not stdout to avoid corrupting MCP messages)
    console.error(`[MCP] Fetching articles from: ${url}`);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json() as Article[] | { articles?: Article[] };

    // Handle different possible response formats
    let allArticles: Article[];
    if (Array.isArray(data)) {
      allArticles = data;
    } else if (data && typeof data === 'object' && 'articles' in data) {
      allArticles = data.articles || [];
    } else {
      allArticles = [];
    }

    // Apply search filter if provided
    let filteredArticles = allArticles;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredArticles = allArticles.filter(article =>
        article.title.toLowerCase().includes(searchLower) ||
        article.subtitle.toLowerCase().includes(searchLower) ||
        article.description.toLowerCase().includes(searchLower)
      );
    }

    // Calculate total before pagination
    const total = filteredArticles.length;

    // Apply pagination
    const paginatedArticles = filteredArticles.slice(offset, offset + limit);

    // Calculate if there are more articles
    const has_more = offset + limit < total;

    console.error(`[MCP] Successfully fetched ${total} articles (returning ${paginatedArticles.length})`);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            articles: paginatedArticles,
            total,
            offset,
            limit,
            has_more
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error(`[MCP] Error fetching articles: ${errorMessage}`);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            articles: [],
            total: 0,
            offset: 0,
            limit: 20,
            has_more: false,
            error: errorMessage
          }, null, 2)
        }
      ],
      isError: true
    };
  }
}

// Register request handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'fetch-articles',
        description: 'Fetches articles from alayman.io API. You can optionally filter or limit results.',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Maximum number of articles to return'
            },
            offset: {
              type: 'number',
              description: 'Number of articles to skip'
            },
            search: {
              type: 'string',
              description: 'Search term to filter articles'
            }
          }
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === 'fetch-articles') {
    const args = FetchArticlesSchema.parse(request.params.arguments || {});
    return await fetchArticles(args);
  }

  throw new Error(`Unknown tool: ${request.params.name}`);
});

// Register prompt handlers
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [
      {
        name: 'list-articles',
        description: "List {number} alayman's articles {condition}. Return detail information of these articles",
        arguments: [
          {
            name: 'number',
            description: 'Maximum number of articles to return',
            required: false
          },
          {
            name: 'condition',
            description: 'Custom condition to filter articles',
            required: false
          }
        ]
      }
    ]
  };
});

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  if (request.params.name === 'list-articles') {
    const number = request.params.arguments?.number as string | undefined;
    const condition = request.params.arguments?.condition as string | undefined;

    // Build the prompt message
    let message = 'List ';

    if (number) {
      message += `${number} `;
    }

    message += "alayman's articles";

    if (condition) {
      message += ` ${condition}`;
    }

    return {
      description: `Fetch articles from alayman.io${number ? ` (limit: ${number})` : ''}${condition ? ` with condition: ${condition}` : ''}`,
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: message
          }
        }
      ]
    };
  }

  throw new Error(`Unknown prompt: ${request.params.name}`);
});

// Main function to start the server
async function main() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // Enable CORS for all routes
  app.use(cors());
  app.use(express.json());

  // Create HTTP transport with session management
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
  });

  // Connect server to transport
  await server.connect(transport);
  console.error('[MCP] Server connected to HTTP transport');

  // Health check endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', server: 'alayman-mcp-server', version: '1.0.0' });
  });

  // MCP endpoint for HTTP transport
  app.post('/mcp', async (req: Request, res: Response) => {
    console.error('[MCP] HTTP request received');
    await transport.handleRequest(req, res, req.body);
  });

  // Start the server
  app.listen(PORT, () => {
    console.error(`[MCP] Alayman MCP Server running on http://localhost:${PORT}`);
    console.error(`[MCP] HTTP endpoint: http://localhost:${PORT}/mcp`);
    console.error(`[MCP] Health check: http://localhost:${PORT}/health`);
  });
}

main().catch((error) => {
  console.error('[MCP] Fatal error:', error);
  process.exit(1);
});
