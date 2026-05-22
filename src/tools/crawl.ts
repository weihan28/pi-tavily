/**
 * Tavily Crawl Tool
 */

import { Type } from "typebox";
import { StringEnum } from "@earendil-works/pi-ai";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import type { TavilyCrawlInput, TavilyCrawlResponse } from "../types.js";

const TAVILY_API_BASE = "https://api.tavily.com";

export function registerCrawlTool(pi: ExtensionAPI, getApiKey: () => string | undefined) {
  pi.registerTool({
    name: "tavily_crawl",
    label: "Tavily Crawl",
    description:
      "Crawl a website starting from a base URL using Tavily Crawl API. " +
      "Graph-based website traversal that explores hundreds of paths in parallel " +
      "with built-in extraction and intelligent discovery.",
    promptSnippet: "Crawl a website to discover and extract content from multiple pages",
    promptGuidelines: [
      "Use tavily_crawl when you need to explore an entire website or documentation site.",
      "Use instructions to guide the crawler toward specific content (costs 2 credits per 10 pages instead of 1).",
      "Use select_paths/exclude_paths with regex patterns to filter URLs (e.g., '/docs/.*', '/api/v1.*').",
      "Adjust max_depth (1-5) and max_breadth (1-500) to control crawl scope.",
    ],
    parameters: Type.Object({
      url: Type.String({
        description: "The root URL to begin the crawl",
        minLength: 1,
      }),
      instructions: Type.Optional(
        Type.String({
          description: "Natural language instructions for the crawler (costs 2 credits per 10 pages instead of 1)",
        })
      ),
      max_depth: Type.Optional(
        Type.Number({
          description: "Max depth of the crawl (1-5, default: 1)",
          minimum: 1,
          maximum: 5,
          default: 1,
        })
      ),
      max_breadth: Type.Optional(
        Type.Number({
          description: "Max links to follow per level (1-500, default: 20)",
          minimum: 1,
          maximum: 500,
          default: 20,
        })
      ),
      limit: Type.Optional(
        Type.Number({
          description: "Total number of links to process before stopping (default: 50)",
          minimum: 1,
          default: 50,
        })
      ),
      select_paths: Type.Optional(
        Type.Array(Type.String(), {
          description: "Regex patterns to select URLs with specific paths (e.g., '/docs/.*', '/api/v1.*')",
        })
      ),
      select_domains: Type.Optional(
        Type.Array(Type.String(), {
          description: "Regex patterns to select specific domains (e.g., '^docs\\.example\\.com$')",
        })
      ),
      exclude_paths: Type.Optional(
        Type.Array(Type.String(), {
          description: "Regex patterns to exclude URLs with specific paths (e.g., '/private/.*')",
        })
      ),
      exclude_domains: Type.Optional(
        Type.Array(Type.String(), {
          description: "Regex patterns to exclude specific domains (e.g., '^private\\.example\\.com$')",
        })
      ),
      allow_external: Type.Optional(
        Type.Boolean({
          description: "Include external domain links in results (default: true)",
          default: true,
        })
      ),
      include_images: Type.Optional(
        Type.Boolean({
          description: "Include images in the crawl results",
          default: false,
        })
      ),
      extract_depth: Type.Optional(
        StringEnum(["basic", "advanced"] as const, {
          description:
            "'basic' (1 credit per 5 pages) or 'advanced' (2 credits per 5 pages, includes tables/embedded content)",
        })
      ),
      format: Type.Optional(
        StringEnum(["markdown", "text"] as const, {
          description: "Output format: 'markdown' (default) or 'text'",
          default: "markdown",
        })
      ),
      timeout: Type.Optional(
        Type.Number({
          description: "Timeout in seconds (10-150, default: 150)",
          minimum: 10,
          maximum: 150,
          default: 150,
        })
      ),
    }),

    async execute(toolCallId, params: TavilyCrawlInput, signal, onUpdate) {
      onUpdate?.({
        content: [{ type: "text", text: `Crawling ${params.url}...` }],
      });

      try {
        const apiKey = getApiKey();
        if (!apiKey) {
          throw new Error(
            "TAVILY_API_KEY not found. Please set TAVILY_API_KEY environment variable."
          );
        }

        const requestBody = {
          url: params.url,
          instructions: params.instructions,
          max_depth: params.max_depth ?? 1,
          max_breadth: params.max_breadth ?? 20,
          limit: params.limit ?? 50,
          select_paths: params.select_paths,
          select_domains: params.select_domains,
          exclude_paths: params.exclude_paths,
          exclude_domains: params.exclude_domains,
          allow_external: params.allow_external ?? true,
          include_images: params.include_images ?? false,
          extract_depth: params.extract_depth ?? "basic",
          format: params.format ?? "markdown",
          timeout: params.timeout ?? 150,
        };

        const response = await fetch(`${TAVILY_API_BASE}/crawl`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.detail?.error || `HTTP ${response.status}: ${response.statusText}`
          );
        }

        const data = (await response.json()) as TavilyCrawlResponse;

        const results: string[] = [];
        results.push(`## Crawl Results for ${data.base_url}`);
        results.push(`**Pages crawled:** ${data.results.length}`);
        results.push(`**Response time:** ${data.response_time.toFixed(2)}s`);
        if (data.usage?.credits) {
          results.push(`**Credits used:** ${data.usage.credits}`);
        }
        results.push("");

        for (const result of data.results) {
          results.push(`\n---\n`);
          results.push(`### ${result.url}`);
          if (result.favicon) {
            results.push(`**Favicon:** ${result.favicon}`);
          }
          if (result.raw_content) {
            const content = result.raw_content.slice(0, 3000);
            results.push(`\n**Content:**\n\n${content}${result.raw_content.length > 3000 ? "\n\n[Content truncated...]" : ""}`);
          }
        }

        return {
          content: [{ type: "text", text: results.join("\n") }],
          details: {
            baseUrl: data.base_url,
            pagesCrawled: data.results.length,
            responseTime: data.response_time,
            credits: data.usage?.credits,
            requestId: data.request_id,
          },
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: "text", text: `Crawl failed: ${message}` }],
          details: { error: message },
          isError: true,
        };
      }
    },
  });
}
