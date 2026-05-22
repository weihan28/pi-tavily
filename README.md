# pi-tavily

A [pi](https://pi.dev) extension that adds web search and content extraction capabilities using the [Tavily](https://tavily.com) API. Tavily is a search engine optimized for AI agents and RAG, providing fast, accurate results with optional AI-generated answers.

## Features

- **🔍 tavily_search** - Search the web with AI-optimized results, including AI-generated answers and source citations
- **📄 tavily_extract** - Extract full content from specific URLs with support for multiple pages
- **🕷️ tavily_crawl** - Crawl entire websites with intelligent, graph-based traversal
- **🗺️ tavily_map** - Generate comprehensive site maps and discover all pages on a website

## Installation

### Install from npm

```bash
pi install npm:pi-tavily
```

### Try without installing

```bash
pi -e npm:pi-tavily
```

### Manual installation

Add to your `~/.pi/agent/settings.json` or `.pi/settings.json`:

```json
{
  "packages": [
    "npm:pi-tavily"
  ]
}
```

## Setup

### Get an API Key

1. Sign up for free at [tavily.com](https://tavily.com)
2. Generate an API key (starts with `tvly-`)
3. Set the `TAVILY_API_KEY` environment variable:

```bash
export TAVILY_API_KEY=tvly-your-key-here
```

Add this to your shell profile (`.bashrc`, `.zshrc`, etc.) to make it permanent.
For me i load it into my docker container.

## Usage

Once installed, pi will automatically register the tools. The LLM will use them when appropriate based on the guidelines below.

### Available Tools

#### `tavily_search`

Search the web for up-to-date information.

**When to use:**
- Current events, news, latest documentation
- Facts that may not be in the training data
- Time-sensitive queries

**Parameters:**
- `query` (required) - Search query
- `search_depth` - `"basic"` (1 credit) or `"advanced"` (2 credits, higher relevance)
- `max_results` - 1-20 results (default: 5)
- `topic` - `"general"`, `"news"`, or `"finance"`
- `time_range` - `"day"`, `"week"`, `"month"`, or `"year"`
- `include_answer` - Include AI-generated answer
- `include_raw_content` - Include full page content in markdown
- `include_images` - Include related images

**Example:**
```
Search for recent developments in quantum computing
```

#### `tavily_extract`

Extract full content from specific URLs.

**When to use:**
- After finding URLs via search, get the full article content
- Extract documentation from known sources
- Get detailed content from specific pages

**Parameters:**
- `urls` (required) - Single URL or array of URLs (max 20)
- `extract_depth` - `"basic"` (1 credit/5 URLs) or `"advanced"` (2 credits/5 URLs, includes tables)
- `include_images` - Extract images from the page

**Example:**
```
Extract the full content from https://example.com/article
```

#### `tavily_crawl`

Crawl an entire website starting from a base URL.

**When to use:**
- Explore entire documentation sites
- Scrape multiple pages from a website
- Build a knowledge base from a site's content

**Parameters:**
- `url` (required) - Starting URL
- `instructions` - Natural language guidance for the crawler (2 credits/10 pages)
- `max_depth` - Crawl depth 1-5 (default: 1)
- `max_breadth` - Links per level 1-500 (default: 20)
- `limit` - Total pages to process (default: 50)
- `select_paths`, `exclude_paths` - Regex patterns to filter URLs
- `select_domains`, `exclude_domains` - Regex patterns for domains
- `allow_external` - Follow external links (default: true)
- `include_images` - Include images in results
- `extract_depth` - `"basic"` or `"advanced"`
- `format` - `"markdown"` (default) or `"text"`
- `timeout` - Seconds 10-150 (default: 150)

**Example:**
```
Crawl https://docs.example.com for API documentation
```

#### `tavily_map`

Generate a site map by discovering all URLs on a website.

**When to use:**
- Before crawling to understand site structure
- Discover all pages on a website
- Audit site structure

**Parameters:**
- `url` (required) - Starting URL
- `instructions` - Natural language guidance (2 credits/10 pages)
- `max_depth` - Discovery depth 1-5 (default: 1)
- `max_breadth` - Links per level 1-500 (default: 20)
- `limit` - Total URLs to discover (default: 50)
- `select_paths`, `exclude_paths` - Regex patterns to filter URLs
- `select_domains`, `exclude_domains` - Regex patterns for domains
- `allow_external` - Include external domains (default: true)
- `timeout` - Seconds 10-150 (default: 150)

**Example:**
```
Map the structure of https://example.com
```

## Pricing

Tavily offers a generous free tier:
- **Free**: 1,000 API credits/month
- **Pro**: $29/month for 4,000 credits
- **Max**: $49/month for 8,000 credits

Credit costs:
- Basic search/extract: 1 credit
- Advanced search/extract: 2 credits
- Basic crawl/map: 1 credit per 10 pages
- Crawl/map with instructions: 2 credits per 10 pages

See [tavily.com/pricing](https://tavily.com/pricing) for details.

## Development

```bash
# Clone the repository
git clone https://github.com/yourusername/pi-tavily.git
cd pi-tavily

# Install dependencies
npm install

# Test locally
pi -e ./src/index.ts
```

## Project Structure

```
pi-tavily/
├── src/
│   ├── index.ts          # Extension entry point
│   ├── types.ts          # Shared TypeScript types
│   └── tools/
│       ├── search.ts     # tavily_search tool
│       ├── extract.ts    # tavily_extract tool
│       ├── crawl.ts      # tavily_crawl tool
│       └── map.ts        # tavily_map tool
├── package.json          # Package manifest
├── README.md             # This file
└── LICENSE               # MIT License
```

## License

Do whatever you want

## Links

- [Tavily API Documentation](https://docs.tavily.com)
- [Pi Extension Documentation](https://pi.dev/docs/extensions)
- [Pi Package Gallery](https://pi.dev/packages)
