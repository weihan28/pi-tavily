/**
 * Tavily Map Tool
 */

import { Type } from "typebox";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import type { TavilyMapInput, TavilyMapResponse } from "../types.js";

const TAVILY_API_BASE = "https://api.tavily.com";

export function registerMapTool(pi: ExtensionAPI, getApiKey: () => string | undefined) {
  pi.registerTool({
    name: "tavily_map",
    label: "Tavily Map",
    description:
      "Map a website structure starting from a base URL using Tavily Map API. " +
      "Traverses websites like a graph and explores hundreds of paths in parallel " +
      "with intelligent discovery to generate comprehensive site maps.",
    promptSnippet: "Map a website to discover all URLs and generate a site structure",
    promptGuidelines: [
      "Use tavily_map when you need to discover all pages on a website or documentation site.",
      "Use this before tavily_crawl to understand the site structure.",
      "Use instructions to guide the mapper toward specific content (costs 2 credits per 10 pages instead of 1).",
      "Use select_paths/exclude_paths with regex patterns to filter URLs.",
    ],
    parameters: Type.Object({
      url: Type.String({
        description: "The root URL to begin the mapping",
        minLength: 1,
      }),
      instructions: Type.Optional(
        Type.String({
          description: "Natural language instructions for the mapper (costs 2 credits per 10 pages instead of 1)",
        })
      ),
      max_depth: Type.Optional(
        Type.Number({
          description: "Max depth of the mapping (1-5, default: 1)",
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
      timeout: Type.Optional(
        Type.Number({
          description: "Timeout in seconds (10-150, default: 150)",
          minimum: 10,
          maximum: 150,
          default: 150,
        })
      ),
    }),

    async execute(toolCallId, params: TavilyMapInput, signal, onUpdate) {
      onUpdate?.({
        content: [{ type: "text", text: `Mapping ${params.url}...` }],
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
          timeout: params.timeout ?? 150,
        };

        const response = await fetch(`${TAVILY_API_BASE}/map`, {
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

        const data = (await response.json()) as TavilyMapResponse;

        const results: string[] = [];
        results.push(`## Site Map for ${data.base_url}`);
        results.push(`**Total URLs discovered:** ${data.results.length}`);
        results.push(`**Response time:** ${data.response_time.toFixed(2)}s`);
        if (data.usage?.credits) {
          results.push(`**Credits used:** ${data.usage.credits}`);
        }
        results.push("");

        results.push("### Discovered URLs:");
        for (let i = 0; i < data.results.length; i++) {
          results.push(`${i + 1}. ${data.results[i]}`);
        }

        return {
          content: [{ type: "text", text: results.join("\n") }],
          details: {
            baseUrl: data.base_url,
            urlsFound: data.results.length,
            urls: data.results,
            responseTime: data.response_time,
            credits: data.usage?.credits,
            requestId: data.request_id,
          },
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: "text", text: `Map failed: ${message}` }],
          details: { error: message },
          isError: true,
        };
      }
    },
  });
}
