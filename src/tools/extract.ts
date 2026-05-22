/**
 * Tavily Extract Tool
 */

import { Type } from "typebox";
import { StringEnum } from "@earendil-works/pi-ai";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import type { TavilyClient, TavilyExtractInput } from "../types.js";

export function registerExtractTool(pi: ExtensionAPI, getClient: () => TavilyClient) {
  pi.registerTool({
    name: "tavily_extract",
    label: "Tavily Extract",
    description:
      "Extract and parse web page content from specific URLs using Tavily Extract API. " +
      "Useful for getting full article text, documentation, or detailed content from known sources.",
    promptSnippet: "Extract full content from specific web page URLs",
    promptGuidelines: [
      "Use tavily_extract when you need detailed content from a specific URL or set of URLs.",
      "Use this tool after getting URLs from tavily_search to get full article content.",
      "Specify extract_depth='advanced' for tables and embedded content (costs 2 credits per 5 URLs).",
    ],
    parameters: Type.Object({
      urls: Type.Union(
        [
          Type.String({
            description: "A single URL to extract content from",
            minLength: 1,
          }),
          Type.Array(Type.String({ minLength: 1 }), {
            description: "Multiple URLs to extract content from (max 20)",
          }),
        ],
        { description: "URL(s) to extract content from" }
      ),
      extract_depth: Type.Optional(
        StringEnum(["basic", "advanced"] as const, {
          description:
            "'basic' (1 credit per 5 URLs) or 'advanced' (2 credits per 5 URLs, includes tables/embedded content)",
        })
      ),
      include_images: Type.Optional(
        Type.Boolean({
          description: "Include images extracted from the pages",
        })
      ),
    }),

    async execute(toolCallId, params: TavilyExtractInput, signal, onUpdate) {
      const urlList = Array.isArray(params.urls) ? params.urls : [params.urls];

      if (urlList.length === 0) {
        return {
          content: [{ type: "text", text: "Error: No URLs provided" }],
          isError: true,
        };
      }

      if (urlList.length > 20) {
        return {
          content: [{ type: "text", text: "Error: Maximum 20 URLs allowed per request" }],
          isError: true,
        };
      }

      onUpdate?.({
        content: [{ type: "text", text: `Extracting content from ${urlList.length} URL(s)...` }],
      });

      try {
        const tvly = getClient();
        const response = await tvly.extract(urlList, {
          extractDepth: params.extract_depth ?? "basic",
          includeImages: params.include_images ?? false,
        });

        const results: string[] = [];

        if (response.results && response.results.length > 0) {
          results.push(`## Successfully Extracted ${response.results.length} URL(s):\n`);

          for (const result of response.results) {
            results.push(`\n---\n\n### Source: ${result.url}`);

            if (result.rawContent) {
              const content = result.rawContent.slice(0, 8000);
              results.push(`\n**Content:**\n\n${content}${result.rawContent.length > 8000 ? "\n\n[Content truncated...]" : ""}`);
            }

            if (result.images && result.images.length > 0) {
              results.push(`\n**Images found:** ${result.images.length}`);
              for (const img of result.images.slice(0, 5)) {
                results.push(`- ${img}`);
              }
            }
          }
        }

        if (response.failedResults && response.failedResults.length > 0) {
          results.push(`\n---\n\n## Failed to Extract ${response.failedResults.length} URL(s):`);
          for (const failed of response.failedResults) {
            results.push(`\n- **${failed.url}**: ${failed.error}`);
          }
        }

        if (response.responseTime) {
          results.push(`\n---\n*Response time: ${response.responseTime.toFixed(2)}s*`);
        }

        return {
          content: [{ type: "text", text: results.join("\n") }],
          details: {
            urls: urlList,
            successful: response.results?.length ?? 0,
            failed: response.failedResults?.length ?? 0,
            responseTime: response.responseTime,
          },
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: "text", text: `Extraction failed: ${message}` }],
          details: { error: message },
          isError: true,
        };
      }
    },
  });
}
