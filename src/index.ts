#!/usr/bin/env node
/**
 * Somark MCP Server
 *
 * This MCP server provides document parsing tools using Somark API.
 * It supports PDF and image files, converting them to markdown or JSON format.
 * Before using, please obtain an API key from https://somark.tech
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";

// Server configuration
const SERVER_NAME = "somark_mcp";
const SERVER_VERSION = "1.0.0";

// Somark API configuration
const SOMARK_API_BASE = "https://somark.tech/api/v1";

// API Key storage (will be provided via environment variable)
let apiKey: string | null = process.env.SOMARK_API_KEY || null;

/**
 * Check if API key is configured
 */
function requireApiKey(): string {
    if (!apiKey) {
        throw new Error(
            "API key not configured. Please use the 'set_api_key' tool to configure your API key, " +
            "or set the SOMARK_API_KEY environment variable. " +
            "Get your API key from https://somark.tech"
        );
    }
    return apiKey;
}

/**
 * Set API key
 */
function setApiKey(key: string): void {
    apiKey = key;
    console.error(`API key configured successfully.`);
}

/**
 * Make HTTP request to Somark API with file upload support
 */
async function somarkRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    // Build headers - don't set Content-Type for FormData (fetch handles it automatically)
    // Note: Somark API uses api_key in request body, not Authorization header
    const headers: HeadersInit = options.body instanceof FormData
        ? {} // No special headers for FormData
        : {
            "Content-Type": "application/json",
            ...options.headers,
        };

    try {
        const response = await fetch(`${SOMARK_API_BASE}${endpoint}`, {
            ...options,
            headers,
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
        }

        return response.json() as Promise<T>;
    } catch (error) {
        if (error instanceof TypeError && error.message === 'fetch failed') {
            // Network error
            throw new Error(`fetch failed - Cannot reach Somark API at ${SOMARK_API_BASE}${endpoint}. Check your network connection.`);
        }
        throw error;
    }
}

// Create MCP server instance
const server = new McpServer(
    { name: SERVER_NAME, version: SERVER_VERSION },
    {
        instructions: "Somark MCP Server - Provides document parsing tools for converting PDF and images to markdown or JSON. " +
            "If the API key is not configured, use the 'set_api_key' tool to ask the user for their API key. " +
            "Users can get their API key from https://somark.tech",
    }
);

// ============================================
// Tool Definitions
// ============================================

/**
 * Tool: set_api_key
 * Configure the Somark API key for authentication
 */
server.registerTool(
    "set_api_key",
    {
        title: "Set Somark API Key",
        description: "Configure your Somark API key for document parsing. Get your API key from https://somark.tech",
        inputSchema: z.object({
            api_key: z.string().describe("Your Somark API key from https://somark.tech"),
        }),
    },
    async ({ api_key }) => {
        try {
            if (!api_key || api_key.trim().length === 0) {
                throw new Error("API key cannot be empty");
            }

            // Set the API key
            setApiKey(api_key.trim());

            return {
                content: [
                    {
                        type: "text",
                        text: "✓ API key configured successfully! You can now use the extract_document tool to parse documents.",
                    },
                ],
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return {
                content: [
                    {
                        type: "text",
                        text: `Error setting API key: ${message}`,
                    },
                ],
                isError: true,
            };
        }
    }
);

/**
 * Tool: extract_document
 * Parse PDF or image files to markdown or JSON format
 */
server.registerTool(
    "extract_document",
    {
        title: "Extract Document",
        description: "Parse PDF or image files (PNG, JPG, JPEG) to markdown or JSON format using Somark's document parsing API",
        inputSchema: z.object({
            file_path: z.string().describe("Absolute path to the PDF or image file to parse"),
            output_format: z.enum(["markdown", "json"]).default("markdown").describe("Output format: markdown or json"),
            extract_images: z.boolean().optional().default(false).describe("Whether to extract images from the document"),
            language: z.string().optional().describe("Document language code (e.g., 'en', 'zh', 'ja'). Auto-detect if not specified"),
        }),
    },
    async ({ file_path, output_format, extract_images, language }) => {
        try {
            // Check if file exists
            if (!fs.existsSync(file_path)) {
                throw new Error(`File not found: ${file_path}`);
            }

            // Check file extension
            const ext = path.extname(file_path).toLowerCase();
            const allowedExtensions = ['.pdf', '.png', '.jpg', '.jpeg'];
            if (!allowedExtensions.includes(ext)) {
                throw new Error(`Unsupported file format: ${ext}. Supported formats: PDF, PNG, JPG, JPEG`);
            }

            // Read file as buffer
            const fileBuffer = fs.readFileSync(file_path);
            const fileName = path.basename(file_path);
            const fileSize = fileBuffer.length;

            console.error(`Processing file: ${fileName} (${(fileSize / 1024).toFixed(2)} KB)`);

            // Determine MIME type based on extension
            const mimeTypes: Record<string, string> = {
                '.pdf': 'application/pdf',
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
            };
            const mimeType = mimeTypes[ext] || 'application/octet-stream';

            // Create form data using Node.js native FormData and File
            const formData = new FormData();
            const file = new File([fileBuffer], fileName, { type: mimeType });
            formData.append('file', file);
            formData.append('api_key', requireApiKey());
            formData.append('output_formats', output_format); // Note: plural 'formats'
            if (extract_images) {
                formData.append('extract_images', 'true');
            }
            if (language) {
                formData.append('language', language);
            }

            console.error(`Sending request to Somark API...`);

            // Make API request
            const response = await somarkRequest<{
                code: number;
                message: string;
                data: {
                    task_id: string;
                    result: {
                        file_name: string;
                        imgs: string[];
                        outputs: {
                            markdown?: string;
                            json?: any;
                        };
                    };
                    error: string | null;
                    metadata: {
                        page_num?: number;
                        file_type?: string;
                    };
                };
            }>("/extract/acc_sync", {
                method: "POST",
                body: formData,
            });

            // Check if API returned an error
            if (response.code !== 0 || response.data.error) {
                throw new Error(`API error: ${response.message || response.data.error}`);
            }

            const { task_id, result, metadata } = response.data;

            // Format response based on output format
            let responseText = `Document parsed successfully!\n\n`;
            responseText += `- Task ID: ${task_id}\n`;
            responseText += `- File: ${result.file_name}\n`;
            
            if (metadata.page_num) {
                responseText += `- Pages: ${metadata.page_num}\n`;
            }
            if (result.imgs && result.imgs.length > 0) {
                responseText += `- Images: ${result.imgs.length}\n`;
            }

            responseText += `\n--- Parsed Content ---\n\n`;

            if (output_format === "markdown" && result.outputs.markdown) {
                responseText += result.outputs.markdown;
            } else if (output_format === "json" && result.outputs.json) {
                responseText += JSON.stringify(result.outputs.json, null, 2);
            } else {
                // Fallback: show available output
                responseText += JSON.stringify(result.outputs, null, 2);
            }

            return {
                content: [
                    {
                        type: "text",
                        text: responseText,
                    },
                ],
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.error(`Error parsing document: ${message}`);
            
            // Provide more helpful error messages
            let helpfulMessage = `Error parsing document: ${message}`;
            
            if (message.includes('fetch failed')) {
                helpfulMessage += '\n\nPossible causes:';
                helpfulMessage += '\n- Network connection issue';
                helpfulMessage += '\n- Somark API server is unreachable';
                helpfulMessage += '\n- Invalid API key';
                helpfulMessage += '\n- Firewall blocking the request';
                helpfulMessage += '\n\nPlease check:';
                helpfulMessage += '\n1. Your internet connection';
                helpfulMessage += '\n2. API key is correctly set: echo $SOMARK_API_KEY';
                helpfulMessage += '\n3. Try accessing https://somark.tech/api/v1 directly';
            }
            
            return {
                content: [
                    {
                        type: "text",
                        text: helpfulMessage,
                    },
                ],
                isError: true,
            };
        }
    }
);

// ============================================
// Main Entry Point
// ============================================

async function main() {
    // Check for API key on startup
    if (!apiKey) {
        console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.error("⚠️  SOMARK_API_KEY environment variable not set.");
        console.error("");
        console.error("To use Somark MCP Server, you need an API key:");
        console.error("1. Get your API key from: https://somark.tech");
        console.error("2. Configure it using one of these methods:");
        console.error("   • Use the 'set_api_key' tool (recommended for this session)");
        console.error("   • Set environment variable: export SOMARK_API_KEY='your-key'");
        console.error("");
        console.error("Don't worry - I'll prompt you for the API key when needed!");
        console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.error("");
    }

    // Connect using stdio transport
    const transport = new StdioServerTransport();
    await server.connect(transport);

    console.error(`Somark MCP Server v${SERVER_VERSION} started.`);
    console.error(`Available tools:`);
    console.error(`  - set_api_key: Configure your Somark API key`);
    console.error(`  - extract_document: Parse PDF/images to markdown/JSON`);
}

main().catch((error) => {
    console.error("Failed to start server:", error);
    process.exit(1);
});
