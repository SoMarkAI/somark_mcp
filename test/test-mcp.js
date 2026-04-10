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

server.stdout.on('data', (data) => {
    responseBuffer += data.toString()
    const lines = responseBuffer.split('\n')

    // Process complete JSON responses
    while (lines.length > 1) {
        const line = lines.shift()
        if (!line.trim()) continue

        try {
            const response = JSON.parse(line)
            console.log('📨 Response:', JSON.stringify(response, null, 2))

            if (response.id === 2) {
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
                // Got result
                console.log('\n✅ Test completed successfully!\n')
                server.kill()
                process.exit(0)
            }
        } catch (e) {
            // Not complete JSON yet
        }
    }

    responseBuffer = lines[0]
})

server.on('error', (error) => {
    console.error('❌ Server error:', error)
    process.exit(1)
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
    console.error('\n⏱️  Test timeout')
    server.kill()
    process.exit(1)
}, 30000)
