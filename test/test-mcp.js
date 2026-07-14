#!/usr/bin/env node

/**
 * Test MCP Server directly
 * Usage: node test/test-mcp.js
 * Or from test dir: node test-mcp.js
 */

import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const API_KEY = process.env.SOMARK_API_KEY
if (!API_KEY) {
    console.error('❌ SOMARK_API_KEY not set')
    process.exit(1)
}

const testFile = join(__dirname, 'test.pdf')

console.log('🚀 Starting MCP Server test...\n')

const server = spawn('node', [join(__dirname, '..', 'build', 'index.js')], {
    env: { ...process.env, SOMARK_API_KEY: API_KEY },
    stdio: ['pipe', 'pipe', 'inherit'],
})

let responseBuffer = ''
let requestId = 0
let completed = false

function stopServer() {
    if (!server.killed) {
        server.kill()
    }
}

function exitWithError(message, details) {
    if (completed) return
    completed = true
    console.error(`\n❌ ${message}`)
    if (details !== undefined) {
        console.error(JSON.stringify(details, null, 2))
    }
    stopServer()
    process.exit(1)
}

function exitSuccessfully() {
    if (completed) return
    completed = true
    console.log('\n✅ Test completed successfully!\n')
    stopServer()
    process.exit(0)
}

server.stdout.on('data', (data) => {
    responseBuffer += data.toString()
    const lines = responseBuffer.split('\n')

    // Process complete JSON responses
    while (lines.length > 1) {
        const line = lines.shift()
        if (!line.trim()) continue

        // Stdout pollution check: any non-empty non-JSON line means the server
        // leaked a plain-text log to stdout, which will corrupt the MCP transport.
        try {
            const response = JSON.parse(line)
            console.log('📨 Response:', JSON.stringify(response, null, 2))

            if (response.error) {
                exitWithError(`JSON-RPC request ${response.id ?? 'unknown'} failed`, response.error)
            }

            if (response.id === 2) {
                const tools = response.result?.tools
                if (!Array.isArray(tools)) {
                    exitWithError('tools/list did not return a tools array', response)
                }

                const hasExtractDocument = tools.some((tool) => tool?.name === 'extract_document')
                if (!hasExtractDocument) {
                    exitWithError('tools/list response does not include extract_document', response)
                }

                // Got tools list, now call extract_document
                console.log('\n✅ Server initialized, calling extract_document...\n')

                const callRequest = {
                    jsonrpc: '2.0',
                    id: 3,
                    method: 'tools/call',
                    params: {
                        name: 'extract_document',
                        arguments: {
                            file_path: testFile,
                            output_formats: ['markdown'],
                        },
                    },
                }

                server.stdin.write(JSON.stringify(callRequest) + '\n')
            } else if (response.id === 3) {
                const result = response.result
                if (!result || typeof result !== 'object') {
                    exitWithError('tools/call did not return a result object', response)
                }

                if (result.isError) {
                    exitWithError('extract_document returned isError=true', result)
                }

                const textContent = Array.isArray(result.content)
                    ? result.content.find((item) => item?.type === 'text' && typeof item.text === 'string')
                    : null

                if (!textContent || !textContent.text.trim()) {
                    exitWithError('extract_document returned no non-empty text content', result)
                }

                exitSuccessfully()
            }
        } catch (e) {
            // If the line is non-empty and not valid JSON, it's stdout pollution
            if (line.trim()) {
                exitWithError('Stdout pollution detected (non-JSON line from server)', line)
            }
            // Empty line — ignore (incomplete JSON buffer)
        }
    }

    responseBuffer = lines[0]
})

server.on('error', (error) => {
    exitWithError('Server error', error)
})

// 1. Initialize
console.log('1️⃣  Sending initialize request...')
const initRequest = {
    jsonrpc: '2.0',
    id: ++requestId,
    method: 'initialize',
    params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'test-client', version: '1.0.0' },
    },
}
server.stdin.write(JSON.stringify(initRequest) + '\n')

// 2. List tools
setTimeout(() => {
    console.log('2️⃣  Requesting tools list...')
    const toolsRequest = {
        jsonrpc: '2.0',
        id: ++requestId,
        method: 'tools/list',
        params: {},
    }
    server.stdin.write(JSON.stringify(toolsRequest) + '\n')
}, 1000)

// Timeout
setTimeout(() => {
    exitWithError('Test timeout')
}, 30000)
