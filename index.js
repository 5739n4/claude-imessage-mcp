#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { spawn, execSync } from 'child_process';
import { EventEmitter } from 'events';

/**
 * iMessage Watcher - listens for new messages
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
 * Main MCP Server
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
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'send_imessage',
          description: 'Send an iMessage to a contact. Supports phone numbers or email addresses.',
          inputSchema: {
            type: 'object',
            properties: {
              to: {
                type: 'string',
                description: 'Recipient phone number (e.g. +15551234567) or email address',
              },
              text: {
                type: 'string',
                description: 'Message text',
              },
              file: {
                type: 'string',
                description: 'Optional attachment file path',
              },
            },
            required: ['to', 'text'],
          },
        },
        {
          name: 'list_imessage_chats',
          description: 'List recent iMessage chats with chat IDs and participants.',
          inputSchema: {
            type: 'object',
            properties: {
              limit: {
                type: 'number',
                description: 'Max results to return (default 20)',
                default: 20,
              },
            },
          },
        },
        {
          name: 'get_imessage_history',
          description: 'Get message history for a chat.',
          inputSchema: {
            type: 'object',
            properties: {
              chat_id: {
                type: 'string',
                description: 'Chat ID (from list_imessage_chats)',
              },
              limit: {
                type: 'number',
                description: 'Number of messages to return (default 50)',
                default: 50,
              },
              attachments: {
                type: 'boolean',
                description: 'Include attachment metadata (default false)',
                default: false,
              },
            },
            required: ['chat_id'],
          },
        },
        {
          name: 'watch_imessage',
          description: 'Start watching for new iMessage messages and continue until stopped.',
          inputSchema: {
            type: 'object',
            properties: {
              chat_id: {
                type: 'string',
                description: 'Optional: watch a single chat by ID',
              },
            },
          },
        },
        {
          name: 'stop_watch_imessage',
          description: 'Stop watching iMessage messages.',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
      ],
    }));

    // Handle tool calls
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
              text: `Error: ${error.message}`,
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
            text: `✓ Message sent to ${to}\n${output}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to send message: ${error.message}`);
    }
  }

  async listChats(args) {
    const limit = args.limit || 20;

    try {
      const output = execSync(`imsg chats --limit ${limit} --json`, {
        encoding: 'utf-8',
        timeout: 10000,
      });

      const chats = this.parseJsonOutput(output);
      const formatted = chats.map((chat, index) => {
        const participants = chat.name || chat.display_name || chat.participants?.join(', ') || chat.identifier || 'Unknown';
        const lastMessageAt = chat.last_message_at || chat.last_message_date || 'N/A';
        const chatId = chat.chat_id ?? chat.id ?? 'N/A';
        const service = chat.service || 'N/A';
        return `${index + 1}. Chat ID: ${chatId}
   Participants: ${participants}
   Service: ${service}
   Last message: ${lastMessageAt}`;
      }).join('\n\n');

      return {
        content: [
          {
            type: 'text',
            text: `Found ${chats.length} chats:\n\n${formatted}\n\nRaw JSON:\n${output}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to fetch chat list: ${error.message}`);
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
      const messages = this.parseJsonOutput(output);

      const formatted = messages.map((msg, index) => {
        const from = msg.is_from_me ? 'Me' : (msg.sender || msg.handle || msg.identifier || 'Unknown');
        const text = msg.text || '[No text]';
        const date = msg.created_at || msg.date || 'N/A';
        return `${index + 1}. [${date}] ${from}: ${text}`;
      }).join('\n');

      return {
        content: [
          {
            type: 'text',
            text: `Chat history (${messages.length} messages):\n\n${formatted}\n\nRaw JSON:\n${output}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to fetch message history: ${error.message}`);
    }
  }

  parseJsonOutput(output) {
    const trimmed = output.trim();
    if (!trimmed) {
      return [];
    }

    try {
      const parsed = JSON.parse(trimmed);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch (error) {
      const lines = trimmed.split('\n').filter(Boolean);
      return lines.map((line) => JSON.parse(line));
    }
  }

  async startWatch(args) {
    if (this.watcher && this.watcher.isRunning) {
      return {
        content: [
          {
            type: 'text',
            text: '⚠️ Watcher is already running',
          },
        ],
      };
    }

    try {
      this.watcher = new ImsgWatcher(args.chat_id);

      this.watcher.on('message', (msg) => {
        const from = msg.is_from_me ? 'Me' : (msg.sender || msg.handle || 'Unknown');
        const text = msg.text || '[No text]';
        console.error(`\n📨 New message [${msg.chat_id}] ${from}: ${text}`);
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
            text: `✓ Started watching iMessage messages${args.chat_id ? ` (Chat ID: ${args.chat_id})` : ' (all chats)'}\n\nNew messages will stream to stderr. Use stop_watch_imessage to stop.`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to start watch: ${error.message}`);
    }
  }

  async stopWatch() {
    if (!this.watcher || !this.watcher.isRunning) {
      return {
        content: [
          {
            type: 'text',
            text: '⚠️ No watcher is running',
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
          text: '✓ Stopped watching iMessage messages',
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('🦞 Claude iMessage MCP Server started');
  }
}

// Start server
const server = new ImessageMCPServer();
server.run().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.error('\nShutting down server...');
  if (server.watcher) {
    server.watcher.stop();
  }
  process.exit(0);
});
