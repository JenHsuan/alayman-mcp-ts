import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// Article interface based on the API structure
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

// Cloudflare Workers environment bindings
interface Env {
	ALAYMAN_API_URL: string;
}

// Define our MCP agent for Alayman articles (exported as Durable Object)
class AlaymanMCP extends McpAgent<Env> {
	server = new McpServer({
		name: "Alayman Articles Server",
		version: "1.0.0",
	});

	private async fetchArticles(): Promise<Article[]> {
		try {
			const apiUrl = (this.env as Env).ALAYMAN_API_URL;
			const response = await fetch(apiUrl);
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			const articles = await response.json();
			return articles as Article[];
		} catch (error) {
			console.error("Error fetching articles:", error);
			throw error;
		}
	}

	private formatArticle(article: Article): string {
		return `ID: ${article.id}
Title: ${article.title}
Subtitle: ${article.subtitle}
Author: ${article.name}
Published: ${article.time}
Reading Time: ${article.readtime}
Category: ${article.category}
URL: ${article.url}
Image: ${article.image}
Shares: ${article.shareCount}
Checks: ${article.checkCount}
${article.description ? `Description: ${article.description}` : ""}`;
	}

	private formatArticles(articles: Article[]): string {
		return articles.map((article) => this.formatArticle(article)).join("\n\n---\n\n");
	}

	async init() {
		// Tool 1: Get all articles with pagination
		this.server.tool(
			"get_all_articles",
			{
				limit: z.number().int().positive().default(20).describe("Number of articles to return (default: 20)"),
				offset: z.number().int().nonnegative().default(0).describe("Number of articles to skip (default: 0)"),
			},
			async ({ limit = 20, offset = 0 }) => {
				try {
					const articles = await this.fetchArticles();
					const total = articles.length;
					const paginatedArticles = articles.slice(offset, offset + limit);
					const hasMore = offset + limit < total;

					const response = {
						articles: paginatedArticles,
						total,
						offset,
						limit,
						has_more: hasMore,
					};

					return {
						content: [
							{
								type: "text",
								text: JSON.stringify(response, null, 2),
							},
						],
					};
				} catch (error) {
					return {
						content: [
							{
								type: "text",
								text: `Error fetching articles: ${error instanceof Error ? error.message : "Unknown error"}`,
							},
						],
					};
				}
			},
		);

		// Tool 2: Search articles by title keyword
		this.server.tool(
			"search_articles",
			{
				keyword: z.string().min(1).describe("Keyword to search in article titles"),
			},
			async ({ keyword }) => {
				try {
					const articles = await this.fetchArticles();
					const searchTerm = keyword.toLowerCase();
					const matchedArticles = articles.filter((article) =>
						article.title.toLowerCase().includes(searchTerm),
					);

					if (matchedArticles.length === 0) {
						return {
							content: [
								{
									type: "text",
									text: `No articles found matching keyword: "${keyword}"`,
								},
							],
						};
					}

					return {
						content: [
							{
								type: "text",
								text: `Found ${matchedArticles.length} article(s) matching "${keyword}":\n\n${this.formatArticles(matchedArticles)}`,
							},
						],
					};
				} catch (error) {
					return {
						content: [
							{
								type: "text",
								text: `Error searching articles: ${error instanceof Error ? error.message : "Unknown error"}`,
							},
						],
					};
				}
			},
		);
	}
}

// Export the Durable Object class
export { AlaymanMCP };

export default {
	fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const url = new URL(request.url);

		// SSE endpoints
		if (url.pathname === "/sse" || url.pathname === "/sse/message") {
			return AlaymanMCP.serveSSE("/sse").fetch(request, env, ctx);
		}

		// MCP endpoint
		if (url.pathname === "/mcp") {
			return AlaymanMCP.serve("/mcp").fetch(request, env, ctx);
		}

		// Health check / info endpoint
		if (url.pathname === "/") {
			return new Response(
				JSON.stringify({
					name: "Alayman MCP Server",
					version: "1.0.0",
					description: "MCP server for fetching articles from alayman.io",
					endpoints: {
						sse: "/sse",
						mcp: "/mcp",
					},
					tools: ["get_all_articles", "get_article_by_id", "search_articles", "filter_by_category"],
				}),
				{
					status: 200,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		return new Response("Not found", { status: 404 });
	},
};
