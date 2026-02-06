# Claude iMessage MCP Server

🦞 一个用于 Claude Code 的 MCP (Model Context Protocol) 服务器，让 Claude 可以通过 iMessage 发送和接收消息。

## 特性

- 📤 **发送消息**: 通过 Claude Code 发送 iMessage/SMS 消息
- 📥 **接收消息**: 实时监听新消息
- 📋 **聊天列表**: 查看最近的聊天记录
- 🔍 **历史记录**: 获取聊天历史消息
- 📎 **附件支持**: 发送图片、文件等附件
- 🔄 **实时监听**: 持续监听新消息（watch 模式）

## 系统要求

- **操作系统**: macOS (iMessage 仅支持 macOS)
- **Node.js**: >= 18.0.0
- **imsg CLI**: 需要安装 [imsg](https://github.com/steipete/imsg)
- **系统权限**:
  - 完全磁盘访问权限（读取 Messages 数据库）
  - 自动化权限（控制 Messages.app）

## 快速开始

### 1. 安装 imsg

```bash
brew install steipete/tap/imsg
```

### 2. 克隆并安装项目

```bash
git clone https://github.com/yourusername/claude-imessage-mcp.git
cd claude-imessage-mcp
npm install
```

### 3. 配置系统权限

前往 **系统设置 → 隐私与安全**:

1. **完全磁盘访问**: 添加你的终端应用（Terminal.app 或 iTerm.app）
2. **自动化**: 允许终端控制 Messages.app

### 4. 测试安装

```bash
npm test
```

### 5. 配置 Claude Code

编辑 Claude Code 配置文件（`~/.claude/config.json`）:

```json
{
  "mcpServers": {
    "imessage": {
      "command": "node",
      "args": ["/绝对路径/claude-imessage-mcp/index.js"]
    }
  }
}
```

或者使用 `npx`:

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

### 6. 重启 Claude Code

```bash
claude restart
```

## 使用方法

在 Claude Code 中，你可以使用以下命令与 iMessage 交互:

### 发送消息

```
给 +86xxxxxxxxxx 发送一条消息："你好！"
```

Claude 会调用 `send_imessage` 工具发送消息。

### 查看聊天列表

```
显示我最近的 iMessage 聊天
```

### 获取聊天历史

```
获取 chat_id 123 的历史消息
```

### 实时监听消息

```
开始监听新的 iMessage 消息
```

这会启动实时监听模式，新消息会在 Claude Code 的输出中显示。

### 停止监听

```
停止监听 iMessage
```

## 可用工具

### `send_imessage`

发送 iMessage 消息。

**参数**:
- `to` (必需): 收件人电话号码或邮箱
- `text` (必需): 消息内容
- `file` (可选): 附件文件路径

**示例**:
```json
{
  "to": "+86xxxxxxxxxx",
  "text": "Hello from Claude!",
  "file": "/path/to/image.jpg"
}
```

### `list_imessage_chats`

列出最近的聊天。

**参数**:
- `limit` (可选): 返回数量，默认 20

### `get_imessage_history`

获取聊天历史。

**参数**:
- `chat_id` (必需): 聊天 ID
- `limit` (可选): 消息数量，默认 50
- `attachments` (可选): 是否包含附件信息，默认 false

### `watch_imessage`

开始监听新消息。

**参数**:
- `chat_id` (可选): 仅监听特定聊天

### `stop_watch_imessage`

停止监听消息。

## 架构说明

本项目基于 [OpenClaw](https://github.com/openclaw/openclaw) 的 iMessage 集成方案，使用以下技术架构:

```
iMessage (Messages.app)
  ↓
chat.db (SQLite 数据库)
  ↓
imsg CLI (Swift 工具)
  ↓
MCP Server (本项目)
  ↓
Claude Code
```

### 核心组件

1. **imsg**: Swift 编写的 CLI 工具，通过 AppleScript 发送消息，通过读取 `chat.db` 接收消息
2. **MCP Server**: 提供标准化的工具接口给 Claude Code
3. **ImsgWatcher**: 实时监听消息的 EventEmitter

## 开发

### 运行开发模式

```bash
npm run dev
```

使用 nodemon 自动重启服务器。

### 调试

MCP Server 的日志输出到 stderr，可以在 Claude Code 的日志中查看:

```bash
tail -f ~/.claude/logs/mcp-imessage.log
```

### 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启 Pull Request

## 常见问题

### Q: 提示 "imsg not found"

**A**: 安装 imsg: `brew install steipete/tap/imsg`

### Q: 发送消息失败

**A**: 检查以下几点:
1. 终端是否有自动化权限
2. Messages.app 是否已登录
3. 电话号码格式是否正确（建议使用 E.164 格式，如 +86xxxxxxxxxx）

### Q: 无法读取消息

**A**: 终端需要完全磁盘访问权限才能读取 `~/Library/Messages/chat.db`

### Q: 实时监听不工作

**A**:
1. 确认 `imsg watch` 命令可以正常运行
2. 检查 Messages.app 是否在运行
3. 尝试手动发送一条测试消息

### Q: 如何发送 SMS（非 iMessage）？

**A**:
1. 确保 iPhone 上启用了"短信转发"
2. Mac 和 iPhone 在同一 Apple ID 下登录
3. 使用电话号码发送即可自动通过 SMS

## 相关项目

- [imsg](https://github.com/steipete/imsg) - iMessage CLI 工具
- [OpenClaw](https://github.com/openclaw/openclaw) - 个人 AI 助手框架
- [MCP SDK](https://github.com/modelcontextprotocol/sdk) - Model Context Protocol SDK

## 安全性说明

- 本项目**不会**上传任何消息内容到远程服务器
- 所有数据处理均在本地完成
- Messages 数据库以只读模式访问
- 建议仅在可信设备上使用

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 致谢

- [Peter Steinberger](https://github.com/steipete) - imsg 工具的作者
- [OpenClaw](https://github.com/openclaw/openclaw) - 提供了 iMessage 集成的灵感
- [Anthropic](https://anthropic.com) - Claude 和 MCP 协议

---

Made with 🦞 for Claude Code
