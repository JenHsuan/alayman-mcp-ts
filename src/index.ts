#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, ListPromptsRequestSchema, GetPromptRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import fetch from 'node-fetch';

// Article interface for type safety
interface Article {
  id?: string;
  title: string;
  content?: string;
  url?: string;
  publishedAt?: string;
  [key: string]: any;
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
  limit: z.number().optional().describe('Maximum number of articles to return'),
  offset: z.number().optional().describe('Number of articles to skip'),
  search: z.string().optional().describe('Search term to filter articles')
});

// Tool handler for fetching articles
async function fetchArticles(args: z.infer<typeof FetchArticlesSchema>) {
  try {
    const { limit, offset, search } = args;

    // Build query parameters
    const params = new URLSearchParams();
    if (limit !== undefined) params.append('limit', limit.toString());
    if (offset !== undefined) params.append('offset', offset.toString());
    if (search) params.append('search', search);

    const url = `https://alayman.io/api/articles${params.toString() ? '?' + params.toString() : ''}`;

    // Log to stderr (not stdout to avoid corrupting MCP messages)
    console.error(`[MCP] Fetching articles from: ${url}`);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json() as Article[] | { articles?: Article[] };

    // Handle different possible response formats
    let articles: Article[];
    if (Array.isArray(data)) {
      articles = data;
    } else if (data && typeof data === 'object' && 'articles' in data) {
      articles = data.articles || [];
    } else {
      articles = [];
    }

    console.error(`[MCP] Successfully fetched ${articles.length} articles`);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ articles, count: articles.length, success: true }, null, 2)
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
          text: JSON.stringify({ articles: [], count: 0, success: false, error: errorMessage }, null, 2)
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
        description: "List {number} alayman's articles {condition}",
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
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[MCP] Alayman MCP Server running on stdio');
}

main().catch((error) => {
  console.error('[MCP] Fatal error:', error);
  process.exit(1);
});
