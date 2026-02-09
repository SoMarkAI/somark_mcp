# Somark MCP Server

[English](README.md) | [中文](README_CN.md)

基于 [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) 的 **Somark 文档解析服务器**，支持将 PDF 和图片文件高精度转换为 Markdown 或 JSON 格式。

## 快速开始

**1. 获取 API Key** → [somark.tech/workbench/apikey](https://somark.tech/workbench/apikey)

**2. 将以下配置添加到你的 MCP 客户端**（Claude Desktop、VS Code、Cursor 等）：

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

**3. 完成！** 让你的 AI 助手解析任意 PDF 或图片文件即可。

## 可用工具

### `check_api_key`

检查 Somark API Key 是否已配置并可用。

### `set_api_key`

在运行时设置或更新 Somark API Key（未设置环境变量时使用）。

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `api_key` | string | 是 | 你的 Somark API Key，从 [somark.tech](https://somark.tech/workbench/apikey) 获取 |

### `extract_document`

将 PDF 或图片文件（PNG、JPG、JPEG）解析为 Markdown 或 JSON 格式。

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `file_path` | string | 是 | — | PDF 或图片文件的绝对路径 |
| `output_format` | `"markdown"` \| `"json"` | 否 | `"markdown"` | 输出格式 |
| `extract_images` | boolean | 否 | `false` | 是否提取文档中的图片 |
| `language` | string | 否 | 自动检测 | 语言代码（如 `en`、`zh`、`ja`） |

**支持的文件格式：** PDF (`.pdf`)、PNG (`.png`)、JPEG (`.jpg`、`.jpeg`)

**使用示例：**

```json
// 将 PDF 解析为 Markdown
{
  "file_path": "/path/to/document.pdf",
  "output_format": "markdown"
}

// 将图片解析为 JSON 并提取图片
{
  "file_path": "/path/to/image.png",
  "output_format": "json",
  "extract_images": true,
  "language": "zh"
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

详细文档请参阅 [test/README.md](test/README.md)。

## 常见问题

| 问题 | 解决方案 |
|------|----------|
| "API key not configured" | 在 MCP 客户端配置中添加 `SOMARK_API_KEY`，或使用 `set_api_key` 工具 |
| 连接问题 | 检查 API Key 是否有效，确认 [somark.tech](https://somark.tech) 可以访问 |
| 不支持的文件格式 | 仅支持 PDF、PNG、JPG 和 JPEG 格式 |

## 许可证

ISC
