#!/usr/bin/env node

/**
 * Simple test script to verify the imsg CLI is available
 */

import { execSync } from 'child_process';

console.log('🧪 Testing iMessage MCP Server Setup\n');

// Check if imsg is installed
console.log('1. Checking if imsg is installed...');
try {
  const imsgPath = execSync('which imsg', { encoding: 'utf-8' }).trim();
  console.log(`   ✓ imsg found at: ${imsgPath}\n`);
} catch (err) {
  console.error('   ✗ imsg not found. Install it with:');
  console.error('     brew install steipete/tap/imsg\n');
  process.exit(1);
}

// Check imsg version
console.log('2. Checking imsg version...');
try {
  const version = execSync('imsg --version', { encoding: 'utf-8' }).trim();
  console.log(`   ✓ Version: ${version}\n`);
} catch (err) {
  console.error('   ✗ Failed to get version\n');
}

// Test listing chats
console.log('3. Testing list chats...');
try {
  const chats = execSync('imsg chats --limit 3 --json', { encoding: 'utf-8' }).trim();
  const lines = chats ? chats.split('\n') : [];
  const chatList = lines.map(line => JSON.parse(line));
  console.log(`   ✓ Found ${chatList.length} recent chats\n`);
} catch (err) {
  console.error('   ✗ Failed to list chats');
  console.error('   Make sure you have granted Full Disk Access to your terminal');
  console.error('   and that imsg returns valid JSON lines (one per chat)\n');
}

// Required permissions reminder
console.log('4. Required Permissions:');
console.log('   - Full Disk Access: Required to read ~/Library/Messages/chat.db');
console.log('   - Automation: Required to send messages via Messages.app');
console.log('   Configure in: System Settings → Privacy & Security\n');

console.log('✅ Basic tests completed!\n');
console.log('Next steps:');
console.log('1. Install dependencies: npm install');
console.log('2. Add to Claude Code config:');
console.log('   {');
console.log('     "mcpServers": {');
console.log('       "imessage": {');
console.log('         "command": "node",');
console.log('         "args": ["/path/to/claude-imessage-mcp/index.js"]');
console.log('       }');
console.log('     }');
console.log('   }');
