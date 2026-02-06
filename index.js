#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { spawn, execSync } from 'child_process';
import { EventEmitter } from 'events';

/**
 * iMessage Watcher - 监听新消息
 */
class ImsgWatcher extends EventEmitter {
  constructor(chatId = null) {
    super();
    this.process = null;
    this.chatId = chatId;
    this.isRunning = false;
  }

  start() {
    if (this.isRunning) {
      console.error('Watcher already running');
      return;
    }

    const args = ['watch', '--json', '--debounce', '250'];
    if (this.chatId) {
      args.push('--chat-id', this.chatId);
    }

    try {
      this.process = spawn('imsg', args);
      this.isRunning = true;

      let buffer = '';

      this.process.stdout.on('data', (data) => {
        buffer += data.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        lines.forEach(line => {
          if (line.trim()) {
            try {
              const msg = JSON.parse(line);
              this.emit('message', msg);
            } catch (err) {
              console.error('Failed to parse message:', err.message);
            }
          }
        });
      });

      this.process.stderr.on('data', (data) => {
        console.error('imsg stderr:', data.toString());
      });

      this.process.on('error', (err) => {
        this.emit('error', err);
        this.isRunning = false;
      });

      this.process.on('exit', (code) => {
        console.error(`imsg watch exited with code ${code}`);
        this.isRunning = false;
        this.emit('exit', code);
      });

      console.error('✓ iMessage watcher started');
    } catch (err) {
      console.error('Failed to start imsg watch:', err.message);
      this.isRunning = false;
      throw err;
    }
  }

  stop() {
    if (this.process && this.isRunning) {
      this.process.kill();
      this.isRunning = false;
      console.error('✓ iMessage watcher stopped');
    }
  }
}

/**
 * 主 MCP Server
 */
class ImessageMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'claude-imessage-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.watcher = null;
    this.setupToolHandlers();
    this.checkImsgInstalled();
  }

  checkImsgInstalled() {
    try {
      execSync('which imsg', { encoding: 'utf-8' });
      console.error('✓ imsg is installed');
    } catch (err) {
      console.error('✗ imsg is not installed. Install it with: brew install steipete/tap/imsg');
      process.exit(1);
    }
  }

  setupToolHandlers() {
    // 列出可用工具
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'send_imessage',
          description: '发送 iMessage 消息到指定联系人。支持电话号码或邮箱地址。',
          inputSchema: {
            type: 'object',
            properties: {
              to: {
                type: 'string',
                description: '收件人电话号码（如 +86xxxxxxxxxx）或邮箱地址',
              },
              text: {
                type: 'string',
                description: '消息内容',
              },
              file: {
                type: 'string',
                description: '可选：附件文件路径',
              },
            },
            required: ['to', 'text'],
          },
        },
        {
          name: 'list_imessage_chats',
          description: '列出最近的 iMessage 聊天列表，包含聊天ID、参与者等信息。',
          inputSchema: {
            type: 'object',
            properties: {
              limit: {
                type: 'number',
                description: '返回数量限制（默认20）',
                default: 20,
              },
            },
          },
        },
        {
          name: 'get_imessage_history',
          description: '获取指定聊天的历史消息记录。',
          inputSchema: {
            type: 'object',
            properties: {
              chat_id: {
                type: 'string',
                description: '聊天ID（从 list_imessage_chats 获取）',
              },
              limit: {
                type: 'number',
                description: '返回消息数量（默认50）',
                default: 50,
              },
              attachments: {
                type: 'boolean',
                description: '是否包含附件信息（默认false）',
                default: false,
              },
            },
            required: ['chat_id'],
          },
        },
        {
          name: 'watch_imessage',
          description: '开始监听新的 iMessage 消息。一旦启动，将持续监听并报告新消息。',
          inputSchema: {
            type: 'object',
            properties: {
              chat_id: {
                type: 'string',
                description: '可选：仅监听特定聊天的消息',
              },
            },
          },
        },
        {
          name: 'stop_watch_imessage',
          description: '停止监听 iMessage 消息。',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
      ],
    }));

    // 处理工具调用
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'send_imessage':
            return await this.sendMessage(args);

          case 'list_imessage_chats':
            return await this.listChats(args);

          case 'get_imessage_history':
            return await this.getHistory(args);

          case 'watch_imessage':
            return await this.startWatch(args);

          case 'stop_watch_imessage':
            return await this.stopWatch();

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `错误: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async sendMessage(args) {
    const { to, text, file } = args;
    const escapedText = text.replace(/"/g, '\\"').replace(/`/g, '\\`').replace(/\$/g, '\\$');

    let cmd = `imsg send --to "${to}" --text "${escapedText}"`;
    if (file) {
      cmd += ` --file "${file}"`;
    }

    try {
      const output = execSync(cmd, { encoding: 'utf-8', timeout: 10000 });
      return {
        content: [
          {
            type: 'text',
            text: `✓ 消息已发送到 ${to}\n${output}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`发送消息失败: ${error.message}`);
    }
  }

  async listChats(args) {
    const limit = args.limit || 20;

    try {
      const output = execSync(`imsg chats --limit ${limit} --json`, {
        encoding: 'utf-8',
        timeout: 10000,
      });

      const chats = JSON.parse(output);
      const formatted = chats.map((chat, index) => {
        return `${index + 1}. Chat ID: ${chat.chat_id || 'N/A'}
   参与者: ${chat.display_name || chat.participants?.join(', ') || 'Unknown'}
   最后消息: ${chat.last_message_date || 'N/A'}`;
      }).join('\n\n');

      return {
        content: [
          {
            type: 'text',
            text: `找到 ${chats.length} 个聊天:\n\n${formatted}\n\n原始JSON数据:\n${output}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`获取聊天列表失败: ${error.message}`);
    }
  }

  async getHistory(args) {
    const { chat_id, limit = 50, attachments = false } = args;

    try {
      let cmd = `imsg history --chat-id "${chat_id}" --limit ${limit} --json`;
      if (attachments) {
        cmd += ' --attachments';
      }

      const output = execSync(cmd, { encoding: 'utf-8', timeout: 10000 });
      const messages = JSON.parse(output);

      const formatted = messages.map((msg, index) => {
        const from = msg.is_from_me ? '我' : (msg.sender || msg.handle || 'Unknown');
        const text = msg.text || '[无文本]';
        const date = msg.date || 'N/A';
        return `${index + 1}. [${date}] ${from}: ${text}`;
      }).join('\n');

      return {
        content: [
          {
            type: 'text',
            text: `聊天历史 (${messages.length} 条消息):\n\n${formatted}\n\n原始JSON数据:\n${output}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`获取历史消息失败: ${error.message}`);
    }
  }

  async startWatch(args) {
    if (this.watcher && this.watcher.isRunning) {
      return {
        content: [
          {
            type: 'text',
            text: '⚠️ Watcher已在运行中',
          },
        ],
      };
    }

    try {
      this.watcher = new ImsgWatcher(args.chat_id);

      this.watcher.on('message', (msg) => {
        const from = msg.is_from_me ? '我' : (msg.sender || msg.handle || 'Unknown');
        const text = msg.text || '[无文本]';
        console.error(`\n📨 新消息 [${msg.chat_id}] ${from}: ${text}`);
      });

      this.watcher.on('error', (err) => {
        console.error('❌ Watcher error:', err.message);
      });

      this.watcher.on('exit', (code) => {
        console.error(`⚠️ Watcher exited with code ${code}`);
      });

      this.watcher.start();

      return {
        content: [
          {
            type: 'text',
            text: `✓ 开始监听 iMessage 消息${args.chat_id ? ` (Chat ID: ${args.chat_id})` : '（所有聊天）'}\n\n新消息将实时显示在控制台输出中。使用 stop_watch_imessage 停止监听。`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`启动监听失败: ${error.message}`);
    }
  }

  async stopWatch() {
    if (!this.watcher || !this.watcher.isRunning) {
      return {
        content: [
          {
            type: 'text',
            text: '⚠️ 没有正在运行的 watcher',
          },
        ],
      };
    }

    this.watcher.stop();
    this.watcher = null;

    return {
      content: [
        {
          type: 'text',
          text: '✓ 已停止监听 iMessage 消息',
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('🦞 Claude iMessage MCP Server 已启动');
  }
}

// 启动服务器
const server = new ImessageMCPServer();
server.run().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});

// 优雅退出
process.on('SIGINT', () => {
  console.error('\n正在关闭服务器...');
  if (server.watcher) {
    server.watcher.stop();
  }
  process.exit(0);
});
