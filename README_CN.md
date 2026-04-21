# SoMark MCP Server

[English](README.md) | [中文](README_CN.md)

基于 [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) 的 **SoMark 文档解析服务器**，支持将 PDF 和图片文件高精度解析为 Markdown、JSON 格式。

## 快速开始

**1. 获取 API Key** → [somark.tech/workbench/apikey](https://somark.tech/workbench/apikey)

**2. 将以下配置添加到你的 MCP 客户端**（Claude Desktop、VS Code、Cursor 等）：

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

**3. 完成！** 让你的 AI 助手解析任意 PDF 或图片文件即可。

## 可用工具

### `check_api_key`

检查 SoMark API Key 是否已配置并可用。

### `set_api_key`

在运行时设置或更新 SoMark API Key（未设置环境变量时使用）。

| 参数      | 类型   | 必填 | 说明                                                                             |
| --------- | ------ | ---- | -------------------------------------------------------------------------------- |
| `api_key` | string | 是   | 你的 SoMark API Key，从 [somark.tech](https://somark.tech/workbench/apikey) 获取 |

### `extract_document`

将 PDF 或图片文件（PNG、JPG、JPEG、BMP、TIFF、JP2、DIB、PPM、PGM、PBM、GIF、HEIC、HEIF、WebP、XPM、TGA、DDS、XBM）解析为 `markdown`、`json` 格式。

| 参数              | 类型                          | 必填 | 默认值               | 说明                                                     |
| ----------------- | ----------------------------- | ---- | -------------------- | -------------------------------------------------------- |
| `file_path`       | string                        | 是   | —                    | PDF 或图片文件的绝对路径                                 |
| `output_formats`  | `Array<"json" \| "markdown">` | 否   | ["json", "markdown"] | 输出格式列表。允许值：`json`、`markdown`。不允许重复值。 |
| `element_formats` | object                        | 否   | 见下文               | 元素渲染格式配置。                                       |
| `feature_config`  | object                        | 否   | 见下文               | 提取选项配置。                                           |

**`element_formats` 字段：**

- `image`：`"url" | "base64" | "none"`，默认 `url`
- `formula`：`"latex" | "mathml" | "ascii"`，默认 `latex`
- `table`：`"html" | "markdown" | "image"`，默认 `html`
- `cs`：`"image"`，默认 `image`

**`feature_config` 字段：**

- `enable_text_cross_page`：boolean，默认 `false`
- `enable_table_cross_page`：boolean，默认 `false`
- `enable_title_level_recognition`：boolean，默认 `false`
- `enable_inline_image`：boolean，默认 `true`
- `enable_table_image`：boolean，默认 `true`
- `enable_image_understanding`：boolean，默认 `true`
- `keep_header_footer`：boolean，默认 `false`

**支持的文件格式：**

- PDF (`.pdf`)
- PNG (`.png`)
- JPEG (`.jpg`、`.jpeg`)
- BMP (`.bmp`、`.dib`)
- TIFF (`.tiff`、`.tif`)
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

**使用示例：**

```json
// 将 PDF 解析为 Markdown
{
  "file_path": "/path/to/document.pdf",
  "output_formats": ["markdown"]
}

// 将图片解析为 JSON
{
  "file_path": "/path/to/image.png",
  "output_formats": ["json"]
}
```

## 开发

```bash
pnpm install          # 安装依赖
pnpm build            # 构建项目
pnpm exec tsc --noEmit  # 类型检查
```

### 测试

```bash
pnpm test             # 完整 MCP 服务器测试
pnpm test:api         # API 连接测试
```

## 常见问题

| 问题                     | 解决方案                                                                                                     |
| ------------------------ | ------------------------------------------------------------------------------------------------------------ |
| "API key not configured" | 在 MCP 客户端配置中添加 `SOMARK_API_KEY`，或使用 `set_api_key` 工具                                          |
| 连接问题                 | 检查 API Key 是否有效，确认 [somark.tech](https://somark.tech) 可以访问                                      |
| 不支持的文件格式         | 支持 PDF、PNG、JPG、JPEG、BMP、TIFF、JP2、DIB、PPM、PGM、PBM、GIF、HEIC、HEIF、WebP、XPM、TGA、DDS、XBM 格式 |

## 许可证

ISC
