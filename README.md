# Somark MCP Server

[English](README.md) | [中文](README_CN.md)

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server for **Somark's document parsing API**. It parses PDF and image files into Markdown, JSON format with high accuracy.

## Quick Start

**1. Get your API Key** → [somark.tech/workbench/apikey](https://somark.tech/workbench/apikey)

**2. Add the following to your MCP client configuration** (Claude Desktop, VS Code, Cursor, etc.):

```json
{
  "mcpServers": {
    "somark": {
      "command": "npx",
      "args": ["-y", "somark-mcp"],
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

Parse PDF or image files (PNG, JPG, JPEG, BMP, TIFF, JP2, DIB, PPM, PGM, PBM, GIF, HEIC, HEIF, WebP, XPM, TGA, DDS, XBM) into `markdown`, `json` format.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `file_path` | string | Yes | — | Absolute path to the PDF or image file |
| `output_formats` | `Array<"json" \| "markdown">` | No | — | Output formats. Allowed values: `json`, `markdown`. Duplicate values are not allowed. |
| `element_formats` | object | No | See below | Element rendering formats. |
| `feature_config` | object | No | See below | Extraction options. |

**`element_formats` fields:**
- `image`: `"url" | "base64" | "none"`, default `url`
- `formula`: `"latex" | "mathml" | "ascii"`, default `latex`
- `table`: `"html" | "markdown" | "image"`, default `html`
- `cs`: `"image"`, default `image`

**`feature_config` fields:**
- `enable_text_cross_page`: boolean, default `false`
- `enable_table_cross_page`: boolean, default `false`
- `enable_title_level_recognition`: boolean, default `false`
- `enable_inline_image`: boolean, default `true`
- `enable_table_image`: boolean, default `true`
- `enable_image_understanding`: boolean, default `true`
- `keep_header_footer`: boolean, default `false`


**Supported file formats:**
- PDF (`.pdf`)
- PNG (`.png`)
- JPEG (`.jpg`, `.jpeg`)
- BMP (`.bmp`, `.dib`)
- TIFF (`.tiff`, `.tif`)
- JPEG 2000 (`.jp2`)
- Portable Pixmap (`.ppm`)
- Portable Graymap (`.pgm`)
- Portable Bitmap (`.pbm`)
- GIF (`.gif`)
- HEIC (`.heic`)
- HEIF (`.heif`)
- WebP (`.webp`)
- X PixMap (`.xpm`)
- Targa (`.tga`)
- DirectDraw Surface (`.dds`)
- X BitMap (`.xbm`)

**Example usage:**

```json
// Parse a PDF to Markdown
{
  "file_path": "/path/to/document.pdf",
  "output_formats": ["markdown"]
}

// Parse an image to JSON
{
  "file_path": "/path/to/image.png",
  "output_formats": ["json"],
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
| Unsupported file format | Supports PDF, PNG, JPG, JPEG, BMP, TIFF, JP2, DIB, PPM, PGM, PBM, GIF, HEIC, HEIF, WebP, XPM, TGA, DDS, XBM formats |

## License

ISC
