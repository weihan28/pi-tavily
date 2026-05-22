/**
 * Shared types for Tavily extension
 */

// Tavily client type from SDK
export type TavilyClient = {
  search: Function;
  extract: Function;
};

// Search tool parameters
export type TavilySearchInput = {
  query: string;
  search_depth?: "basic" | "advanced";
  max_results?: number;
  topic?: "general" | "news" | "finance";
  time_range?: "day" | "week" | "month" | "year" | "d" | "w" | "m" | "y";
  include_answer?: boolean;
  include_raw_content?: boolean;
  include_images?: boolean;
};

// Extract tool parameters
export type TavilyExtractInput = {
  urls: string | string[];
  extract_depth?: "basic" | "advanced";
  include_images?: boolean;
};

// Crawl tool parameters
export type TavilyCrawlInput = {
  url: string;
  instructions?: string;
  max_depth?: number;
  max_breadth?: number;
  limit?: number;
  select_paths?: string[];
  select_domains?: string[];
  exclude_paths?: string[];
  exclude_domains?: string[];
  allow_external?: boolean;
  include_images?: boolean;
  extract_depth?: "basic" | "advanced";
  format?: "markdown" | "text";
  timeout?: number;
};

// Crawl response
export type TavilyCrawlResponse = {
  base_url: string;
  results: Array<{
    url: string;
    raw_content: string;
    favicon?: string;
  }>;
  response_time: number;
  usage?: { credits: number };
  request_id?: string;
};

// Map tool parameters
export type TavilyMapInput = {
  url: string;
  instructions?: string;
  max_depth?: number;
  max_breadth?: number;
  limit?: number;
  select_paths?: string[];
  select_domains?: string[];
  exclude_paths?: string[];
  exclude_domains?: string[];
  allow_external?: boolean;
  timeout?: number;
};

// Map response
export type TavilyMapResponse = {
  base_url: string;
  results: string[];
  response_time: number;
  usage?: { credits: number };
  request_id?: string;
};
