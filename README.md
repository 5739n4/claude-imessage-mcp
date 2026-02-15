# Claude iMessage MCP Server

🦞 An MCP (Model Context Protocol) server for Claude Code that lets Claude send and receive iMessage messages.

## Features

- 📤 **Send messages**: Send iMessage/SMS via Claude Code
- 📥 **Receive messages**: Watch for new messages in real time
- 📋 **Chat list**: View recent chats
- 🔍 **History**: Fetch chat history
- 📎 **Attachments**: Send images and files
- 🔄 **Live watch**: Continuous watch mode

## System Requirements

- **OS**: macOS (iMessage is macOS-only)
- **Node.js**: >= 18.0.0
- **imsg CLI**: Install [imsg](https://github.com/steipete/imsg)
- **Permissions**:
  - Full Disk Access (read Messages database)
  - Automation (control Messages.app)

## Quick Start

### 1. Install imsg

```bash
brew install steipete/tap/imsg
```

### 2. Clone and install

```bash
git clone https://github.com/yourusername/claude-imessage-mcp.git
cd claude-imessage-mcp
npm install
```

### 3. Configure system permissions

Go to **System Settings → Privacy & Security**:

1. **Full Disk Access**: add your terminal app (Terminal.app or iTerm.app)
2. **Automation**: allow your terminal to control Messages.app

### 4. Test the install

```bash
npm test
```

### 5. Configure Claude Code

Edit the Claude Code config file (`~/.claude/config.json`):

```json
{
  "mcpServers": {
    "imessage": {
      "command": "node",
      "args": ["/absolute/path/claude-imessage-mcp/index.js"]
    }
  }
}
```

Or use `npx`:

```json
{
  "mcpServers": {
    "imessage": {
      "command": "npx",
      "args": ["-y", "claude-imessage-mcp"]
    }
  }
}
```

### 6. Restart Claude Code

```bash
claude restart
```

## Usage

In Claude Code, you can use prompts like:

### Send a message

```
Send a message to +15551234567: "Hello!"
```

Claude will call the `send_imessage` tool.

### List chats

```
Show my recent iMessage chats
```

### Get chat history

```
Get history for chat_id 123
```

### Watch for new messages

```
Start watching for new iMessage messages
```

New messages will stream in Claude Code output.

### Stop watching

```
Stop watching iMessage
```

## Available Tools

### `send_imessage`

Send an iMessage.

**Parameters**:
- `to` (required): Recipient phone number or email address
- `text` (required): Message text
- `file` (optional): Attachment file path

**Example**:
```json
{
  "to": "+15551234567",
  "text": "Hello from Claude!",
  "file": "/path/to/image.jpg"
}
```

### `list_imessage_chats`

List recent chats.

**Parameters**:
- `limit` (optional): Max results, default 20

### `get_imessage_history`

Get chat history.

**Parameters**:
- `chat_id` (required): Chat ID
- `limit` (optional): Number of messages, default 50
- `attachments` (optional): Include attachment metadata, default false

### `watch_imessage`

Start watching for new messages.

**Parameters**:
- `chat_id` (optional): Watch a single chat

### `stop_watch_imessage`

Stop watching for messages.

## Architecture

Based on [OpenClaw](https://github.com/openclaw/openclaw)'s iMessage integration approach:

```
iMessage (Messages.app)
  ↓
chat.db (SQLite database)
  ↓
imsg CLI (Swift tool)
  ↓
MCP Server (this project)
  ↓
Claude Code
```

### Core Components

1. **imsg**: Swift CLI for sending via AppleScript and reading `chat.db`
2. **MCP Server**: Standardized tool interface for Claude Code
3. **ImsgWatcher**: EventEmitter that watches for new messages

## Development

### Run in dev mode

```bash
npm run dev
```

Uses nodemon for automatic restarts.

### Debugging

MCP Server logs go to stderr and show up in Claude Code logs:

```bash
tail -f ~/.claude/logs/mcp-imessage.log
```

### Contributing

Issues and PRs are welcome!

1. Fork this repo
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to your branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## FAQ

### Q: "imsg not found"

**A**: Install imsg: `brew install steipete/tap/imsg`

### Q: Sending fails

**A**: Check the following:
1. Your terminal has Automation permission
2. Messages.app is signed in
3. Your phone number is in E.164 format (e.g. +15551234567)

### Q: Cannot read messages

**A**: Full Disk Access is required to read `~/Library/Messages/chat.db`

### Q: Watch mode not working

**A**:
1. Confirm `imsg watch` works in your terminal
2. Ensure Messages.app is running
3. Try sending a test message

### Q: How do I send SMS (non-iMessage)?

**A**:
1. Enable Text Message Forwarding on your iPhone
2. Sign in to the same Apple ID on your Mac and iPhone
3. Send to a phone number and it will route via SMS when needed

## Related Projects

- [imsg](https://github.com/steipete/imsg) - iMessage CLI tool
- [OpenClaw](https://github.com/openclaw/openclaw) - Personal AI assistant framework
- [MCP SDK](https://github.com/modelcontextprotocol/sdk) - Model Context Protocol SDK

## Security Notes

- This project **does not** upload any message content to remote servers
- All processing happens locally
- Messages database is accessed in read-only mode
- Use only on trusted devices

## License

MIT License - see [LICENSE](LICENSE)

## Acknowledgments

- [Peter Steinberger](https://github.com/steipete) - Author of imsg
- [OpenClaw](https://github.com/openclaw/openclaw) - iMessage integration inspiration
- [Anthropic](https://anthropic.com) - Claude and the MCP protocol

---

Made with 🦞 for Claude Code
