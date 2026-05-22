/**
 * Tavily Search Tool
 */

import { Type } from "typebox";
import { StringEnum } from "@earendil-works/pi-ai";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import type { TavilyClient, TavilySearchInput } from "../types.js";

export function registerSearchTool(pi: ExtensionAPI, getClient: () => TavilyClient) {
  pi.registerTool({
    name: "tavily_search",
    label: "Tavily Search",
    description:
      "Search the web using Tavily AI Search API. Returns relevant search results " +
      "with optional AI-generated answers and raw content extraction.",
    promptSnippet: "Search the web for up-to-date information on a query",
    promptGuidelines: [
      "Use tavily_search when you need current, factual information from the web that may not be in your training data.",
      "Use tavily_search for recent news, current events, latest documentation, or specific facts you need to verify.",
      "For time-sensitive queries, specify topic='news' and an appropriate time_range.",
    ],
    parameters: Type.Object({
      query: Type.String({
        description: "The search query to execute",
        minLength: 1,
      }),
      search_depth: Type.Optional(
        StringEnum(["basic", "advanced"] as const, {
          description:
            "Search depth: 'basic' (balanced, 1 credit) or 'advanced' (highest relevance, 2 credits)",
        })
      ),
      max_results: Type.Optional(
        Type.Number({
          description: "Maximum number of results to return (1-20, default: 5)",
          minimum: 1,
          maximum: 20,
          default: 5,
        })
      ),
      topic: Type.Optional(
        StringEnum(["general", "news", "finance"] as const, {
          description:
            "Category: 'general' (default), 'news' (real-time events), 'finance' (financial data)",
        })
      ),
      time_range: Type.Optional(
        StringEnum(
          ["day", "week", "month", "year", "d", "w", "m", "y"] as const,
          {
            description:
              "Filter results by publish date (e.g., 'day' for last 24 hours, 'week' for last 7 days)",
          }
        )
      ),
      include_answer: Type.Optional(
        Type.Boolean({
          description: "Include an AI-generated answer to the query",
        })
      ),
      include_raw_content: Type.Optional(
        Type.Boolean({
          description: "Include cleaned HTML content (markdown format) from each result",
        })
      ),
      include_images: Type.Optional(
        Type.Boolean({
          description: "Include related images in the response",
        })
      ),
    }),

    async execute(toolCallId, params: TavilySearchInput, signal, onUpdate) {
      onUpdate?.({
        content: [{ type: "text", text: `Searching for: "${params.query}"...` }],
      });

      try {
        const tvly = getClient();
        const response = await tvly.search(params.query, {
          searchDepth: params.search_depth ?? "basic",
          maxResults: params.max_results ?? 5,
          topic: params.topic ?? "general",
          timeRange: params.time_range,
          includeAnswer: params.include_answer ?? false,
          includeRawContent: params.include_raw_content ?? false,
          includeImages: params.include_images ?? false,
        });

        const results: string[] = [];

        if (response.answer) {
          results.push(`## AI-Generated Answer\n\n${response.answer}\n`);
        }

        if (response.results && response.results.length > 0) {
          results.push(`## Search Results (${response.results.length} found)`);

          for (const result of response.results) {
            const score = result.score ? ` (relevance: ${(result.score * 100).toFixed(1)}%)` : "";
            results.push(`\n### ${result.title}${score}`);
            results.push(`**URL:** ${result.url}`);

            if (result.content) {
              results.push(`\n**Snippet:**\n${result.content}`);
            }

            if (result.rawContent) {
              const content = result.rawContent.slice(0, 2000);
              results.push(`\n**Raw Content (truncated):**\n\n${content}${result.rawContent.length > 2000 ? "\n\n[Content truncated...]" : ""}`);
            }

            if (result.publishedDate) {
              results.push(`\n**Published:** ${result.publishedDate}`);
            }
          }
        }

        if (response.images && response.images.length > 0) {
          results.push(`\n## Images (${response.images.length} found)`);
          for (const image of response.images.slice(0, 10)) {
            const desc = image.description ? ` - ${image.description}` : "";
            results.push(`- ${image.url}${desc}`);
          }
        }

        if (response.responseTime) {
          results.push(`\n---\n*Response time: ${response.responseTime.toFixed(2)}s*`);
        }

        return {
          content: [{ type: "text", text: results.join("\n") }],
          details: {
            query: response.query,
            resultsCount: response.results?.length ?? 0,
            responseTime: response.responseTime,
            hasAnswer: !!response.answer,
            imagesCount: response.images?.length ?? 0,
          },
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: "text", text: `Search failed: ${message}` }],
          details: { error: message },
          isError: true,
        };
      }
    },
  });
}
