#!/usr/bin/env node

/**
 * Debug script to test Somark API connection and file upload
 * Usage: node test/debug-test.js <file-path>
 * Or from test dir: node debug-test.js <file-path>
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SOMARK_API_BASE = "https://somark.tech/api/v1";
const API_KEY = process.env.SOMARK_API_KEY;

async function testConnection() {
    console.log('🔍 Somark API Debug Test\n');
    console.log('='.repeat(50));
    
    // 1. Check API Key
    console.log('\n1️⃣  Checking API Key...');
    if (!API_KEY) {
        console.error('❌ SOMARK_API_KEY environment variable not set');
        console.log('   Set it with: export SOMARK_API_KEY="your-key"');
        process.exit(1);
    }
    console.log(`✅ API Key found: ${API_KEY.substring(0, 10)}...`);
    
    // 2. Test network connectivity
    console.log('\n2️⃣  Testing network connectivity...');
    try {
        const response = await fetch('https://somark.tech/');
        console.log(`✅ Can reach somark.tech (Status: ${response.status})`);
    } catch (error) {
        console.error('❌ Cannot reach somark.tech');
        console.error('   Error:', error.message);
        console.log('   Please check your internet connection');
        process.exit(1);
    }
    
    // 3. Test file upload if file provided
    let filePath = process.argv[2];
    
    // If no file provided, try using test.pdf in the same directory
    if (!filePath) {
        const defaultTestFile = path.join(__dirname, 'test.pdf');
        if (fs.existsSync(defaultTestFile)) {
            filePath = defaultTestFile;
            console.log('\n3️⃣  Using default test file: test.pdf');
        }
    }
    if (!filePath) {
        console.log('\n3️⃣  Skipping file upload test (no file provided)');
        console.log('   Usage: node test/debug-test.js <file-path>');
        return;
    }
    
    console.log('\n3️⃣  Testing file upload...');
    
    if (!fs.existsSync(filePath)) {
        console.error(`❌ File not found: ${filePath}`);
        process.exit(1);
    }
    
    const stats = fs.statSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const fileName = path.basename(filePath);
    
    console.log(`   File: ${fileName}`);
    console.log(`   Size: ${(stats.size / 1024).toFixed(2)} KB`);
    console.log(`   Type: ${ext}`);
    
    const allowedExtensions = ['.pdf', '.png', '.jpg', '.jpeg'];
    if (!allowedExtensions.includes(ext)) {
        console.error(`❌ Unsupported file type: ${ext}`);
        console.log(`   Supported: ${allowedExtensions.join(', ')}`);
        process.exit(1);
    }
    console.log('✅ File type supported');
    
    // 4. Test FormData creation
    console.log('\n4️⃣  Creating FormData...');
    try {
        const fileBuffer = fs.readFileSync(filePath);
        
        const mimeTypes = {
            '.pdf': 'application/pdf',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
        };
        const mimeType = mimeTypes[ext] || 'application/octet-stream';
        
        const formData = new FormData();
        const file = new File([fileBuffer], fileName, { type: mimeType });
        formData.append('file', file);
        formData.append('api_key', API_KEY);
        formData.append('output_formats', 'markdown'); // Note: plural 'formats'
        
        console.log('✅ FormData created successfully');
        console.log(`   MIME type: ${mimeType}`);
        
        // 5. Test API request
        console.log('\n5️⃣  Sending request to Somark API...');
        console.log(`   Endpoint: ${SOMARK_API_BASE}/parse/sync`);
        
        const response = await fetch(`${SOMARK_API_BASE}/parse/sync`, {
            method: 'POST',
            body: formData,
        });
        
        console.log(`   Response status: ${response.status} ${response.statusText}`);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ API request failed');
            console.error('   Error:', errorText);
            process.exit(1);
        }
        
        const result = await response.json();
        console.log('✅ API request successful!');
        console.log('\n📄 Response:');
        console.log(JSON.stringify(result, null, 2));
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.cause) {
            console.error('   Cause:', error.cause);
        }
        process.exit(1);
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ All tests passed!\n');
}

testConnection().catch(error => {
    console.error('\n💥 Unexpected error:', error);
    process.exit(1);
});
