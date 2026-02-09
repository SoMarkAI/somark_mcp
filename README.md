# Somark MCP Server

This is a Model Context Protocol (MCP) server for Somark's document parsing API. It converts PDF and image files to markdown or JSON format.

## Prerequisites

- Node.js 18+
- pnpm (or npm/yarn)
- A Somark API key from https://somark.tech

## Installation

### Via npx from GitHub (recommended)

```bash
npx -y github:SoMarkAI/somark_mcp
```

### Via npm (when published)

```bash
npm install -g somark_mcp
somark_mcp
```

### From source

```bash
# Clone the repository
git clone https://github.com/SoMarkAI/somark_mcp.git
cd somark_mcp

# Install dependencies
pnpm install

# Build
pnpm build

# Run directly
node build/index.js
```

## Configuration

### Environment Variable

Set the `SOMARK_API_KEY` environment variable with your API key:

```bash
export SOMARK_API_KEY="your-api-key-here"
```

### MCP Client Configuration

When configuring the MCP server in your client (e.g., Claude Desktop, VS Code, Cursor), add it to your MCP settings:

**Using GitHub repository (recommended):**

```json
{
  "mcpServers": {
    "somark": {
      "command": "npx",
      "args": ["-y", "github:SoMarkAI/somark_mcp"],
      "env": {
        "SOMARK_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

**Using local installation:**

```json
{
  "mcpServers": {
    "somark": {
      "command": "somark_mcp",
      "env": {
        "SOMARK_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

**Using local source:**

```json
{
  "mcpServers": {
    "somark": {
      "command": "node",
      "args": ["/path/to/somark_mcp/build/index.js"],
      "env": {
        "SOMARK_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

## Available Tool

### `extract_document`
Parse PDF or image files (PNG, JPG, JPEG) to markdown or JSON format using Somark's document parsing API (`/extract/acc_sync`).

**Parameters:**
- `file_path` (required): Absolute path to the PDF or image file to parse
- `output_format` (optional): Output format - "markdown" or "json" (default: "markdown")
- `extract_images` (optional): Whether to extract images from the document (default: false)
- `language` (optional): Document language code (e.g., 'en', 'zh', 'ja'). Auto-detect if not specified

**Example usage:**
```typescript
// Parse a PDF to markdown
{
  "file_path": "/path/to/document.pdf",
  "output_format": "markdown"
}

// Parse an image to JSON with image extraction
{
  "file_path": "/path/to/image.png",
  "output_format": "json",
  "extract_images": true,
  "language": "en"
}
```

**Supported formats:**
- PDF (.pdf)
- PNG (.png)
- JPEG (.jpg, .jpeg)

## Development

### Commands

```bash
# Install dependencies
pnpm install

# Type check
pnpm exec tsc --noEmit

# Build
pnpm build

# Run
pnpm exec node build/index.js
```

### Testing

The project includes comprehensive test scripts in the `test/` directory:

```bash
# Run full MCP server test (recommended)
pnpm test

# Test API connection and file upload
pnpm test:api

# Or run tests directly
export SOMARK_API_KEY="your-api-key"
node test/test-mcp.js        # Full MCP server test
node test/debug-test.js      # API connection test
```

See [test/README.md](test/README.md) for detailed testing documentation.

## Troubleshooting

### "API key not configured"

Make sure you've set the `SOMARK_API_KEY` environment variable before starting the server.

### Connection issues

If the server fails to start, check that:
1. Your API key is valid
2. The Somark API is accessible
3. There are no network/firewall restrictions

## License

ISC
