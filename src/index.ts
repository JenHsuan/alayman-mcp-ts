import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpAgent } from "agents/mcp";
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

// Authentication state interface for Durable Object storage
interface AuthState {
	verified: boolean;
	timestamp: number;
	expiresAt: number;
}

// Cloudflare Workers environment bindings
interface Env {
	ARTICLES_API_URL: string;
	API_VERIFY_URL: string;
	ALAYMAN_API_KEY?: string;
	RATE_LIMITER: {
		limit: (options: { key: string }) => Promise<{ success: boolean }>;
	};
}

// Define our MCP agent for Alayman articles (exported as Durable Object)
class AlaymanMCP extends McpAgent<Env> {
	server = new McpServer({
		name: "Alayman Articles Server",
		version: "1.0.0",
	});

	// Authentication validity period: 7 days
	private readonly AUTH_VALIDITY_PERIOD = 7 * 24 * 60 * 60 * 1000;

	private async fetchArticles(): Promise<Article[]> {
		try {
			const apiUrl = (this.env as Env).ARTICLES_API_URL;
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
		return articles
			.map((article) => this.formatArticle(article))
			.join("\n\n---\n\n");
	}

	/**
	 * Verify API key with alayman.io API
	 */
	private async verifyApiKey(
		apiKey: string,
	): Promise<{ success: boolean; message: string }> {
		try {
			const verifyUrl = (this.env as Env).API_VERIFY_URL;

			const response = await fetch(verifyUrl, {
				method: "GET",
				headers: {
					"X-API-Key": apiKey,
				},
			});

			if (response.status === 200) {
				// Save verification state to Durable Object storage
				const authState: AuthState = {
					verified: true,
					timestamp: Date.now(),
					expiresAt: Date.now() + this.AUTH_VALIDITY_PERIOD,
				};

				await this.ctx.storage.put("authState", authState);

				return {
					success: true,
					message: "API key verified successfully",
				};
			}

			return {
				success: false,
				message: `API key verification failed: HTTP ${response.status}`,
			};
		} catch (error) {
			return {
				success: false,
				message: `API key verification error: ${error instanceof Error ? error.message : "Unknown error"}`,
			};
		}
	}

	/**
	 * Check if API key has been verified
	 */
	private async isVerified(): Promise<boolean> {
		const state = await this.ctx.storage.get<AuthState>("authState");

		if (!state?.verified) {
			return false;
		}

		// Check if verification has expired
		if (Date.now() >= state.expiresAt) {
			await this.ctx.storage.delete("authState");
			return false;
		}

		return true;
	}

	/**
	 * Authentication guard - throws error if not verified
	 */
	private async requireAuth(): Promise<void> {
		if (!(await this.isVerified())) {
			throw new Error(
				"API key verification required. Please use the 'Authenticate with Alayman' prompt or call the 'verify_api_key' tool first.",
			);
		}
	}

	async init() {
		// ========================================
		// Stage 1: Try to restore verification state from storage
		// ========================================
		const storedState = await this.ctx.storage.get<AuthState>("authState");

		if (storedState?.verified && Date.now() < storedState.expiresAt) {
			console.log("✅ Restored authentication from storage");
			// Already verified, no need to do anything
		} else {
			// Storage doesn't have valid state
			if (storedState) {
				console.log("⚠️ Stored authentication has expired");
				await this.ctx.storage.delete("authState");
			}

			// ========================================
			// Stage 2: Try auto-verify with environment variable
			// ========================================
			const apiKey = (this.env as Env).ALAYMAN_API_KEY;

			if (apiKey) {
				console.log("🔄 Auto-verifying with environment variable");
				const result = await this.verifyApiKey(apiKey);

				if (result.success) {
					console.log("✅ Environment variable auto-verification successful");
				} else {
					console.error(
						"❌ Environment variable verification failed:",
						result.message,
					);
				}
			} else {
				console.log(
					"ℹ️ No environment variable, waiting for manual verification",
				);
			}
		}

		// ============================================
		// AUTHENTICATION TOOLS
		// ============================================

		// Tool: Verify API Key
		this.server.tool(
			"verify_api_key",
			{
				apiKey: z.string().min(1).describe("Your alayman.io API key"),
			},
			async ({ apiKey }) => {
				try {
					const result = await this.verifyApiKey(apiKey);

					if (result.success) {
						return {
							content: [
								{
									type: "text",
									text: `✅ API key verified successfully!

You can now use all article tools (get_all_articles, search_articles).`,
								},
							],
						};
					}

					return {
						content: [
							{
								type: "text",
								text: `❌ ${result.message}

Please check your API key and try again.`,
							},
						],
					};
				} catch (error) {
					return {
						content: [
							{
								type: "text",
								text: `Error during API key verification: ${error instanceof Error ? error.message : "Unknown error"}`,
							},
						],
					};
				}
			},
		);

		// Tool: Get authentication status
		this.server.tool("get_auth_status", {}, async () => {
			if (await this.isVerified()) {
				return {
					content: [
						{
							type: "text",
							text: `✅ API key verified

You can use all article tools.`,
						},
					],
				};
			}

			return {
				content: [
					{
						type: "text",
						text: `❌ Not verified

Please use the 'Authenticate with Alayman' prompt or call the 'verify_api_key' tool to verify your API key.`,
					},
				],
			};
		});

		// ============================================
		// ARTICLE TOOLS (Protected)
		// ============================================

		// Tool 1: Get all articles with pagination
		this.server.tool(
			"get_all_articles",
			{
				limit: z
					.number()
					.int()
					.positive()
					.default(20)
					.describe("Number of articles to return (default: 20)"),
				offset: z
					.number()
					.int()
					.nonnegative()
					.default(0)
					.describe("Number of articles to skip (default: 0)"),
			},
			async ({ limit = 20, offset = 0 }) => {
				try {
					// Require API key verification
					await this.requireAuth();

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
				keyword: z
					.string()
					.min(1)
					.describe("Keyword to search in article titles"),
			},
			async ({ keyword }) => {
				try {
					// Require API key verification
					await this.requireAuth();

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

		// ============================================
		// PROMPTS
		// ============================================

		// Prompt: Authenticate (appears in MCP prompts menu)
		this.server.registerPrompt(
			"authenticate",
			{
				title: "Authenticate with Alayman",
				description: "Verify your alayman.io API key to access article tools",
				argsSchema: {
					apiKey: z.string().min(1).describe("Your alayman.io API key"),
				},
			},
			async ({ apiKey }) => {
				return {
					messages: [
						{
							role: "user" as const,
							content: {
								type: "text" as const,
								text: `Verify alayman API key: ${apiKey}`,
							},
						},
					],
				};
			},
		);

		// Prompt: List articles with custom condition
		this.server.registerPrompt(
			"list_articles",
			{
				title: "list_alayman_articles",
				description:
					"Generate a prompt to list a specific number of alayman's articles with custom conditions",
				argsSchema: {
					number: z.coerce
						.number()
						.int()
						.positive()
						.default(10)
						.describe("Number of articles to list (default: 10)"),
					condition: z
						.string()
						.optional()
						.describe("Custom condition or filter criteria for the articles"),
				},
			},
			async ({ number = 10, condition }) => {
				const text = `List ${number} alayman's articles${condition ? ` ${condition}` : ""}`;
				return {
					messages: [
						{
							role: "user" as const,
							content: {
								type: "text" as const,
								text: text,
							},
						},
					],
				};
			},
		);
	}
}

// Export the Durable Object class
export { AlaymanMCP };

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const url = new URL(request.url);

		// Extract rate limiting key from Mcp-session-id header
		const sessionId =
			request.headers.get("Mcp-session-id") ||
			request.headers.get("mcp-session-id") ||
			"unknown";

		// Apply rate limiting to all endpoints
		const { success } = await env.RATE_LIMITER.limit({ key: sessionId });

		if (!success) {
			return new Response(
				JSON.stringify({
					error: "Rate limit exceeded",
					message:
						"You have exceeded the rate limit of 60 requests per 60 seconds. Please try again later.",
					limit: 60,
					period: 60,
				}),
				{
					status: 429,
					headers: {
						"Content-Type": "application/json",
						"Retry-After": "60",
					},
				},
			);
		}

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
					description:
						"MCP server for fetching articles from alayman.io with API key authentication",
					endpoints: {
						sse: "/sse",
						mcp: "/mcp",
					},
					tools: [
						"verify_api_key",
						"get_auth_status",
						"get_all_articles",
						"search_articles",
					],
					prompts: ["authenticate", "list_articles"],
					authentication: {
						required: true,
						method: "API Key",
						verifyEndpoint: "/api/auth/me/",
					},
					rateLimit: {
						limit: 60,
						period: 60,
						key: "Mcp-session-id header",
					},
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
