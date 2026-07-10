# SoMark MCP Server - 开发文档

## 简介

SoMark MCP Server 是一个基于 Model Context Protocol (MCP) 的服务器，用于对接 SoMark API 的文档解析功能。

## 主要功能

提供文档解析工具，支持将 PDF 和图片文件高精度解析为 Markdown、JSON 格式。

## API 对接

### 接口信息

- **API Base URL**: Configured via `SOMARK_API_HOST` env var (similar to MiniMax's `MINIMAX_API_HOST`)
  - Mainland China (default): `https://somark.cn/api/v1`
  - Outside mainland China (including Taiwan, China; Hong Kong, China; Macau, China): `https://somark.ai/api/v1`
- **使用的接口**: `/parse/sync` - 同步文档解析接口
- **认证方式**: `multipart/form-data` 请求体中的 `api_key` 字段

### 接口功能

将 PDF 或图片文件解析为结构化的 `Markdown`、`JSON` 结果。

- **输入**: PDF 文件或图片文件（如 PNG、JPG、JPEG、BMP、TIFF 等）
- **输出**: Markdown 文本、JSON 数据

## 技术实现

1. **开发框架**:
    - 基于 TypeScript 开发
    - 使用 MCP SDK: `@modelcontextprotocol/sdk`
    - 参考文档：https://modelcontextprotocol.io/docs/develop/build-server#typescript

2. **安装方式**:
    - 通过 npx 安装和使用
    - 支持全局安装

3. **API Key 配置**:
    - 环境变量: `SOMARK_API_KEY`
    - 如果用户未配置，提示访问 https://somark.cn（中国大陆）或 https://somark.ai（中国大陆以外，含中国台湾、中国香港、中国澳门）获取 API Key

## 参考文档

- MCP 开发文档: https://modelcontextprotocol.io/docs/develop/build-server#typescript
- SoMark API 文档:
  - 中国大陆: https://docs.somark.cn/api-reference/
  - 中国大陆以外（含中国台湾、中国香港、中国澳门）: https://docs.somark.ai/api-reference/
- API Key 获取:
  - 中国大陆: https://somark.cn/workbench/apikey
  - 中国大陆以外（含中国台湾、中国香港、中国澳门）: https://somark.ai/workbench/apikey
- 购买 API 套餐:
  - 中国大陆: https://somark.cn/workbench/purchase
  - 全球: https://somark.ai/studio/purchase

## 工具说明

### extract_document

解析文档工具，对接 `/parse/sync` 接口。

**参数**:

- `file_path` (必填): 文件的绝对路径
- `output_formats` (可选): 输出格式列表，可选值为 `"markdown"`、`"json"`。不允许重复值。
- `element_formats` (可选): 元素渲染格式配置
    - `image`: `"url"` | `"base64"` | `"none"`，默认 `"url"`
    - `formula`: `"latex"` | `"mathml"` | `"ascii"`，默认 `"latex"`
    - `table`: `"html"` | `"markdown"` | `"image"`，默认 `"html"`
    - `cs`: `"image"`，默认 `"image"`
- `feature_config` (可选): 提取选项配置
    - `enable_text_cross_page`: boolean，默认 `false`
    - `enable_table_cross_page`: boolean，默认 `false`
    - `enable_title_level_recognition`: boolean，默认 `false`
    - `enable_inline_image`: boolean，默认 `true`
    - `enable_table_image`: boolean，默认 `true`
    - `enable_image_understanding`: boolean，默认 `true`
    - `keep_header_footer`: boolean，默认 `false`

**支持的文件格式**:

- PDF (.pdf)
- PNG (.png)
- JPEG (.jpg, .jpeg)
- BMP (.bmp, .dib)
- TIFF (.tiff, .tif)
- JPEG 2000 (.jp2)
- Portable Pixmap (.ppm)
- Portable Graymap (.pgm)
- Portable Bitmap (.pbm)
- GIF (.gif)
- HEIC (.heic)
- HEIF (.heif)
- WebP (.webp)
- X PixMap (.xpm)
- Targa (.tga)
- DirectDraw Surface (.dds)
- X BitMap (.xbm)

## 开发注意事项

1. 文件上传使用 FormData 格式
2. 需要妥善处理文件读取和二进制数据传输
3. 错误处理要清晰，包括：
    - 文件不存在
    - 文件格式不支持
    - API 密钥未配置
    - API 请求失败

## 未来扩展

目前只实现了文档解析功能（`/parse/sync`），其他功能暂未对接。
