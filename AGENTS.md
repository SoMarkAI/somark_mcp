# Somark MCP Server - 开发文档

## 简介

Somark MCP Server 是一个基于 Model Context Protocol (MCP) 的服务器，用于对接 Somark API 的文档解析功能。

## 主要功能

提供文档解析工具，支持将 PDF 和图片文件转换为 Markdown 或 JSON 格式。

## API 对接

### 接口信息

- **API Base URL**: `https://api.somark.tech/v1`
- **使用的接口**: `/extract/acc_sync` - 同步文档解析接口
- **认证方式**: Bearer Token (API Key)

### 接口功能

将 PDF 或图片文件解析为结构化的 Markdown 或 JSON 格式：
- **输入**: PDF 文件或图片（PNG, JPG, JPEG）
- **输出**: Markdown 文本或 JSON 数据

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
   - 如果用户未配置，提示访问 https://somark.tech 获取 API Key

## 参考文档

- MCP 开发文档: https://modelcontextprotocol.io/docs/develop/build-server#typescript
- Somark API 文档: https://somark-api-public.apifox.cn/
- API Key 获取: https://somark.tech

## 工具说明

### extract_document

解析文档工具，对接 `/extract/acc_sync` 接口。

**参数**:
- `file_path` (必填): 文件的绝对路径
- `output_format` (可选): 输出格式 "markdown" | "json"，默认 "markdown"
- `extract_images` (可选): 是否提取图片，默认 false
- `language` (可选): 语言代码（如 'en', 'zh', 'ja'），不指定则自动检测

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

目前只实现了文档解析功能（`/extract/acc_sync`），其他功能暂未对接。
