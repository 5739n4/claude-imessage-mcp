#!/usr/bin/env node

/**
 * 简单的测试脚本，用于验证 imsg 命令是否可用
 */

import { execSync } from 'child_process';

console.log('🧪 Testing iMessage MCP Server Setup\n');

// 检查 imsg 是否安装
console.log('1. Checking if imsg is installed...');
try {
  const imsgPath = execSync('which imsg', { encoding: 'utf-8' }).trim();
  console.log(`   ✓ imsg found at: ${imsgPath}\n`);
} catch (err) {
  console.error('   ✗ imsg not found. Install it with:');
  console.error('     brew install steipete/tap/imsg\n');
  process.exit(1);
}

// 检查 imsg 版本
console.log('2. Checking imsg version...');
try {
  const version = execSync('imsg --version', { encoding: 'utf-8' }).trim();
  console.log(`   ✓ Version: ${version}\n`);
} catch (err) {
  console.error('   ✗ Failed to get version\n');
}

// 测试列出聊天
console.log('3. Testing list chats...');
try {
  const chats = execSync('imsg chats --limit 3 --json', { encoding: 'utf-8' });
  const chatList = JSON.parse(chats);
  console.log(`   ✓ Found ${chatList.length} recent chats\n`);
} catch (err) {
  console.error('   ✗ Failed to list chats');
  console.error('   Make sure you have granted Full Disk Access to your terminal\n');
}

// 检查权限提示
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
