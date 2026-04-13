#!/usr/bin/env node
/**
 * Somark MCP Server
 *
 * This MCP server provides document parsing tools using Somark API.
 * It supports PDF and image files, converting them to markdown or JSON format.
 * Before using, please obtain an API key from https://somark.tech
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import * as fs from 'fs'
import * as path from 'path'

// Server configuration
const SERVER_NAME = 'somark_mcp'
const SERVER_VERSION = '1.0.0'

// Somark API configuration
const SOMARK_API_BASE = 'https://somark.tech/api/v1'

// API Key storage (will be provided via environment variable)
let apiKey: string | null = process.env.SOMARK_API_KEY || null

/**
 * Check if API key is configured
 */
function requireApiKey(): string {
    if (!apiKey) {
        throw new Error(
            "API key not configured. Please use the 'set_api_key' tool to configure your API key, " +
                'or set the SOMARK_API_KEY environment variable. ' +
                'Get your API key from https://somark.tech',
        )
    }
    return apiKey
}

/**
 * Set API key
 */
function setApiKey(key: string): void {
    apiKey = key
    console.error(`API key configured successfully.`)
}

/**
 * Make HTTP request to Somark API with file upload support
 */
async function somarkRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // Build headers - don't set Content-Type for FormData (fetch handles it automatically)
    // Note: Somark API uses api_key in request body, not Authorization header
    const headers: HeadersInit =
        options.body instanceof FormData
            ? {} // No special headers for FormData
            : {
                  'Content-Type': 'application/json',
                  ...options.headers,
              }

    try {
        const response = await fetch(`${SOMARK_API_BASE}${endpoint}`, {
            ...options,
            headers,
        })

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`)
        }

        return response.json() as Promise<T>
    } catch (error) {
        if (error instanceof TypeError && error.message === 'fetch failed') {
            // Network error
            throw new Error(`fetch failed - Cannot reach Somark API at ${SOMARK_API_BASE}${endpoint}. Check your network connection.`)
        }
        throw error
    }
}

// Create MCP server instance
const server = new McpServer(
    { name: SERVER_NAME, version: SERVER_VERSION },
    {
        instructions:
            'Somark MCP Server - Provides document parsing tools for converting PDF and images to markdown or JSON. ' +
            'IMPORTANT: Before using extract_document tool, ALWAYS check if API key is configured by using check_api_key tool first. ' +
            "If API key is not configured, use the 'set_api_key' tool to ask the user for their API key. " +
            'Users can get their API key from https://somark.tech',
    },
)

// ============================================
// Tool Definitions
// ============================================

/**
 * Tool: check_api_key
 * Check if Somark API key is configured
 */
server.registerTool(
    'check_api_key',
    {
        title: 'Check API Key Status',
        description: 'Check if Somark API key is configured. Use this before calling extract_document.',
        inputSchema: z.object({}),
    },
    async () => {
        const isConfigured = apiKey !== null && apiKey.length > 0

        return {
            content: [
                {
                    type: 'text',
                    text: isConfigured
                        ? '✓ API key is configured and ready to use.'
                        : "✗ API key is not configured. Please use the 'set_api_key' tool to configure it. Get your API key from https://somark.tech",
                },
            ],
        }
    },
)

/**
 * Tool: set_api_key
 * Configure the Somark API key for authentication
 */
server.registerTool(
    'set_api_key',
    {
        title: 'Set Somark API Key',
        description: 'Configure your Somark API key for document parsing. Get your API key from https://somark.tech',
        inputSchema: z.object({
            api_key: z.string().describe('Your Somark API key from https://somark.tech'),
        }),
    },
    async ({ api_key }) => {
        try {
            if (!api_key || api_key.trim().length === 0) {
                throw new Error('API key cannot be empty')
            }

            // Set the API key
            setApiKey(api_key.trim())

            return {
                content: [
                    {
                        type: 'text',
                        text: '✓ API key configured successfully! You can now use the extract_document tool to parse documents.',
                    },
                ],
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error)
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error setting API key: ${message}`,
                    },
                ],
                isError: true,
            }
        }
    },
)

/**
 * Tool: extract_document
 * Parse PDF or image files to markdown or JSON format
 */
server.registerTool(
    'extract_document',
    {
        title: 'Extract Document',
        description:
            "Use Somark's document parsing API to parse PDF or image files (PNG, JPG, JPEG, BMP, TIFF, JP2, DIB, PPM, PGM, PBM, GIF, HEIC, HEIF, WebP, XPM, TGA, DDS, XBM) into Markdown, JSON, and SoMarkDown formats, and provide a ZIP download URL for the parsing results.",
        inputSchema: z
            .object({
                file_path: z.string().describe('Absolute path to the PDF or image file to parse'),
                output_formats: z
                    .array(z.enum(['json', 'markdown', 'somarkdown', 'zip']))
                    .nonempty()
                    .describe('Output formats. Allowed values: json, markdown, somarkdown, zip'),
                element_formats: z
                    .object({
                        image: z.enum(['url', 'base64', 'none']).optional(),
                        formula: z.enum(['latex', 'mathml', 'ascii']).optional(),
                        table: z.enum(['html', 'markdown', 'image']).optional(),
                        cs: z.literal('image').optional(),
                    })
                    .optional()
                    .describe('Element rendering formats. Defaults: image=url, formula=latex, table=html, cs=image'),
                feature_config: z
                    .object({
                        enable_text_cross_page: z.boolean().optional(),
                        enable_table_cross_page: z.boolean().optional(),
                        enable_title_level_recognition: z.boolean().optional(),
                        enable_inline_image: z.boolean().optional(),
                        enable_table_image: z.boolean().optional(),
                        enable_image_understanding: z.boolean().optional(),
                        keep_header_footer: z.boolean().optional(),
                    })
                    .optional()
                    .describe('Extraction options'),
            })
            .superRefine((data, ctx) => {
                if (data.output_formats.includes('zip') && data.element_formats?.image !== undefined && data.element_formats.image !== 'none') {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        path: ['element_formats', 'image'],
                        message: "When output_formats contains 'zip', element_formats.image can only be 'none' or be omitted.",
                    })
                }
            }),
    },
    async ({ file_path, output_formats, element_formats, feature_config }) => {
        try {
            // Check if file exists
            if (!fs.existsSync(file_path)) {
                throw new Error(`File not found: ${file_path}`)
            }

            // Check file extension
            const ext = path.extname(file_path).toLowerCase()
            const allowedExtensions = [
                '.pdf',
                '.png',
                '.jpg',
                '.jpeg',
                '.bmp',
                '.tiff',
                '.tif',
                '.jp2',
                '.dib',
                '.ppm',
                '.pgm',
                '.pbm',
                '.gif',
                '.heic',
                '.heif',
                '.webp',
                '.xpm',
                '.tga',
                '.dds',
                '.xbm',
            ]

            if (!allowedExtensions.includes(ext)) {
                throw new Error(
                    `Unsupported file format: ${ext}. Supported formats: PDF, PNG, JPG, JPEG, BMP, TIFF, JP2, DIB, PPM, PGM, PBM, GIF, HEIC, HEIF, WebP, XPM, TGA, DDS, XBM`,
                )
            }

            if (!Array.isArray(output_formats) || output_formats.length === 0 || !output_formats.every((item) => typeof item === 'string' && item.trim().length > 0)) {
                throw new Error('output_formats must be a non-empty array of strings.')
            }
            const allowedOutputFormats = new Set(['json', 'markdown', 'somarkdown', 'zip'])
            const invalidFormats = output_formats.filter((item) => {
                return !allowedOutputFormats.has(item.trim())
            })
            if (invalidFormats.length > 0) {
                throw new Error(`Invalid output_formats: ${invalidFormats.join(', ')}. Allowed values are json, markdown, somarkdown, zip.`)
            }
            if (new Set(output_formats).size !== output_formats.length) {
                throw new Error('output_formats contains duplicate values.')
            }
            const normalizedOutputFormats = output_formats.map((item) => item.trim())

            if (normalizedOutputFormats.includes('zip')) {
                const isZipOnly = normalizedOutputFormats.length === 1 && normalizedOutputFormats[0] === 'zip'
                const isZipWithJson = normalizedOutputFormats.length === 2 && normalizedOutputFormats.includes('json')

                if (!isZipOnly && !isZipWithJson) {
                    throw new Error("When zip is included, output_formats must be either ['zip'] or ['zip', 'json'].")
                }
            }

            const normalizedElementFormats = {
                image: element_formats?.image ?? 'url',
                formula: element_formats?.formula ?? 'latex',
                table: element_formats?.table ?? 'html',
                cs: element_formats?.cs ?? 'image',
            }

            const normalizedFeatureConfig = {
                enable_text_cross_page: feature_config?.enable_text_cross_page ?? false,
                enable_table_cross_page: feature_config?.enable_table_cross_page ?? false,
                enable_title_level_recognition: feature_config?.enable_title_level_recognition ?? false,
                enable_inline_image: feature_config?.enable_inline_image ?? true,
                enable_table_image: feature_config?.enable_table_image ?? true,
                enable_image_understanding: feature_config?.enable_image_understanding ?? true,
                keep_header_footer: feature_config?.keep_header_footer ?? false,
            }

            // Read file as buffer
            const fileBuffer = fs.readFileSync(file_path)
            const fileName = path.basename(file_path)
            const fileSize = fileBuffer.length

            console.error(`Processing file: ${fileName} (${(fileSize / 1024).toFixed(2)} KB)`)

            // Determine MIME type based on extension
            const mimeTypes: Record<string, string> = {
                '.pdf': 'application/pdf',
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.bmp': 'image/bmp',
                '.tiff': 'image/tiff',
                '.tif': 'image/tiff',
                '.jp2': 'image/jp2',
                '.dib': 'image/bmp',
                '.ppm': 'image/x-portable-pixmap',
                '.pgm': 'image/x-portable-graymap',
                '.pbm': 'image/x-portable-bitmap',
                '.gif': 'image/gif',
                '.heic': 'image/heic',
                '.heif': 'image/heif',
                '.webp': 'image/webp',
                '.xpm': 'image/x-xpixmap',
                '.tga': 'image/x-tga',
                '.dds': 'image/vnd-ms.dds',
                '.xbm': 'image/x-xbitmap',
            }
            const mimeType = mimeTypes[ext] || 'application/octet-stream'

            // Create form data using Node.js native FormData and File
            const formData = new FormData()
            const file = new File([fileBuffer], fileName, { type: mimeType })
            formData.append('file', file)
            formData.append('api_key', requireApiKey())
            for (const item of normalizedOutputFormats) {
                formData.append('output_formats', item)
            }

            formData.append('element_formats', JSON.stringify(normalizedElementFormats))
            formData.append('feature_config', JSON.stringify(normalizedFeatureConfig))

            console.error(`Sending request to Somark API...`)

            // Make API request
            const response = await somarkRequest<{
                code: number
                message: string
                data: {
                    task_id: string
                    result: {
                        file_name: string
                        imgs: string[]
                        outputs: {
                            markdown?: string
                            json?: any
                            somarkdown?: string
                            zip?: string
                        }
                    }
                    error: string | null
                    metadata: {
                        page_num?: number
                        file_type?: string
                    }
                }
            }>('/parse/sync', {
                method: 'POST',
                body: formData,
            })

            const { code, message, data } = response

            // Check if API returned an error
            if (code !== 0) {
                throw new Error(`API error: ${data.error || message || 'Unknown error'}`)
            }

            const { outputs } = data.result // 获取解析结果

            const jsonContent = outputs.json
            const markdownContent = typeof outputs.markdown === 'string' && outputs.markdown.trim() ? outputs.markdown : ''
            const somarkdownContent = typeof outputs.somarkdown === 'string' && outputs.somarkdown.trim() ? outputs.somarkdown : ''
            const zipUrl = typeof outputs.zip === 'string' && outputs.zip.trim() ? outputs.zip : ''

            const extractedOutputs: Record<string, unknown> = {}
            if (jsonContent !== undefined) {
                extractedOutputs.json = jsonContent
            }
            if (markdownContent) {
                extractedOutputs.markdown = markdownContent
            }
            if (somarkdownContent) {
                extractedOutputs.somarkdown = somarkdownContent
            }
            if (zipUrl) {
                extractedOutputs.zip = zipUrl
            }

            // Format response based on output format
            let responseText = `Document parsed successfully!\n\n`
            responseText += `- Task ID: ${data.task_id}\n`
            responseText += `- File: ${data.result.file_name}\n`

            if (data.metadata.page_num) {
                responseText += `- Pages: ${data.metadata.page_num}\n`
            }
            if (Array.isArray(data.result.imgs) && data.result.imgs.length > 0) {
                responseText += `- Images: ${data.result.imgs.length}\n`
            }

            if (Object.keys(extractedOutputs).length > 0) {
                responseText += `- Outputs: ${Object.keys(extractedOutputs).join(', ')}\n`
            }

            if (markdownContent) {
                responseText += `\n--- Markdown ---\n\n${markdownContent}`
            }

            if (somarkdownContent) {
                responseText += `\n\n--- SoMarkDown ---\n\n${somarkdownContent}`
            }

            if (jsonContent !== undefined) {
                responseText += `\n\n--- JSON ---\n\n\`\`\`json\n${JSON.stringify(jsonContent, null, 2)}\n\`\`\``
            }

            if (zipUrl) {
                responseText += `\n\n--- ZIP ---\n\n${zipUrl}`
            }

            return {
                content: [
                    {
                        type: 'text',
                        text: responseText,
                    },
                ],
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error)
            console.error(`Error parsing document: ${message}`)

            // Provide more helpful error messages
            let helpfulMessage = `Error parsing document: ${message}`

            if (message.includes('fetch failed')) {
                helpfulMessage += '\n\nPossible causes:'
                helpfulMessage += '\n- Network connection issue'
                helpfulMessage += '\n- Somark API server is unreachable'
                helpfulMessage += '\n- Invalid API key'
                helpfulMessage += '\n- Firewall blocking the request'
                helpfulMessage += '\n\nPlease check:'
                helpfulMessage += '\n1. Your internet connection'
                helpfulMessage += '\n2. API key is correctly set: echo $SOMARK_API_KEY'
                helpfulMessage += '\n3. Try accessing https://somark.tech/api/v1 directly'
            }

            return {
                content: [
                    {
                        type: 'text',
                        text: helpfulMessage,
                    },
                ],
                isError: true,
            }
        }
    },
)

// ============================================
// Main Entry Point
// ============================================

async function main() {
    // Check for API key on startup
    if (!apiKey) {
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.error('⚠️  SOMARK_API_KEY environment variable not set.')
        console.error('')
        console.error('To use Somark MCP Server, you need an API key:')
        console.error('1. Get your API key from: https://somark.tech')
        console.error('2. Configure it using one of these methods:')
        console.error("   • Use the 'set_api_key' tool (recommended for this session)")
        console.error("   • Set environment variable: export SOMARK_API_KEY='your-key'")
        console.error('')
        console.error("Don't worry - I'll prompt you for the API key when needed!")
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.error('')
    }

    // Connect using stdio transport
    const transport = new StdioServerTransport()
    await server.connect(transport)

    console.error(`Somark MCP Server v${SERVER_VERSION} started.`)
    console.error(`Available tools:`)
    console.error(`  - check_api_key: Check if API key is configured`)
    console.error(`  - set_api_key: Configure your Somark API key`)
    console.error(`  - extract_document: Parse PDF/images to markdown/JSON`)
}

main().catch((error) => {
    console.error('Failed to start server:', error)
    process.exit(1)
})
