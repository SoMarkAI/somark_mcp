# Somark MCP Server

[English](README.md) | [中文](README_CN.md)

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server for **Somark's document parsing API**. It converts PDF and image files into Markdown or JSON format with high accuracy.

## Quick Start

**1. Get your API Key** → [somark.tech/workbench/apikey](https://somark.tech/workbench/apikey)

**2. Add the following to your MCP client configuration** (Claude Desktop, VS Code, Cursor, etc.):

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

**3. Done!** Ask your AI assistant to parse any PDF or image file.

## Available Tools

### `check_api_key`

Check whether the Somark API key is configured and ready to use.

### `set_api_key`

Set or update the Somark API key at runtime (useful when the environment variable is not set).

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `api_key` | string | Yes | Your Somark API key from [somark.tech](https://somark.tech/workbench/apikey) |

### `extract_document`

Parse PDF or image files (PNG, JPG, JPEG) to Markdown or JSON format.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `file_path` | string | Yes | — | Absolute path to the PDF or image file |
| `output_format` | `"markdown"` \| `"json"` | No | `"markdown"` | Output format |
| `extract_images` | boolean | No | `false` | Whether to extract images from the document |
| `language` | string | No | auto-detect | Language code (e.g., `en`, `zh`, `ja`) |

**Supported file formats:** PDF (`.pdf`), PNG (`.png`), JPEG (`.jpg`, `.jpeg`)

**Example usage:**

```json
// Parse a PDF to Markdown
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

## Development

```bash
pnpm install          # Install dependencies
pnpm build            # Build the project
pnpm exec tsc --noEmit  # Type check
```

### Testing

```bash
pnpm test             # Full MCP server test
pnpm test:api         # API connection test
```

See [test/README.md](test/README.md) for details.

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "API key not configured" | Add `SOMARK_API_KEY` to your MCP client config, or use the `set_api_key` tool |
| Connection issues | Check that your API key is valid and [somark.tech](https://somark.tech) is accessible |
| Unsupported file format | Only PDF, PNG, JPG, and JPEG are supported |

## License

ISC
