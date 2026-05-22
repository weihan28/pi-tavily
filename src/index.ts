/**
 * Tavily Web Search Extension
 *
 * Provides web search and content extraction capabilities using Tavily's API.
 * Tools:
 * - tavily_search: Search the web for information
 * - tavily_extract: Extract content from specific URLs
 * - tavily_crawl: Crawl websites with graph-based traversal
 * - tavily_map: Generate site maps by discovering URLs
 *
 * Setup:
 * - Set TAVILY_API_KEY environment variable
 * - Get a free key at https://tavily.com
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { tavily } from "@tavily/core";
import type { TavilyClient } from "./types.js";
import { registerSearchTool } from "./tools/search.js";
import { registerExtractTool } from "./tools/extract.js";
import { registerCrawlTool } from "./tools/crawl.js";
import { registerMapTool } from "./tools/map.js";


export default function tavilyExtension(pi: ExtensionAPI) {
  let client: TavilyClient | null = null;
  let apiKeyWarningShown = false;

  /**
   * Get API key from environment variable
   */
  function getApiKey(): string | undefined {
    return process.env.TAVILY_API_KEY;
  }

  // Initialize Tavily client lazily
  function getClient(): TavilyClient {
    if (!client) {
      const apiKey = getApiKey();
      if (!apiKey) {
        throw new Error(
          "TAVILY_API_KEY not found. Please set TAVILY_API_KEY environment variable.\n\n" +
            "Get a free key at https://tavily.com"
        );
      }
      client = tavily({ apiKey });
    }
    return client;
  }

  // Check API key on startup
  pi.on("session_start", async (_event, ctx) => {
    // Check API key availability
    const apiKey = getApiKey();
    if (!apiKey && !apiKeyWarningShown) {
      ctx.ui.notify(
        "TAVILY_API_KEY not configured. Set TAVILY_API_KEY environment variable.",
        "warning"
      );
      apiKeyWarningShown = true;
    }
  });

  // Register all tools
  registerSearchTool(pi, getClient);
  registerExtractTool(pi, getClient);
  registerCrawlTool(pi, getApiKey);
  registerMapTool(pi, getApiKey);


}
