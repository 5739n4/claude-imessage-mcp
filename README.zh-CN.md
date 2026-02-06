# Claude iMessage MCP 服务器

[English](README.md) | 简体中文

🦞 让 Claude Code 通过 iMessage 发送和接收消息的 MCP 服务器。

## 功能特性

- 📤 发送 iMessage/SMS 消息
- 📥 实时接收新消息
- 📋 查看聊天列表
- 🔍 获取历史记录
- 📎 支持发送附件
- 🔄 持续监听模式

## 快速安装

```bash
# 1. 安装 imsg
brew install steipete/tap/imsg

# 2. 克隆项目
git clone https://github.com/yourusername/claude-imessage-mcp.git
cd claude-imessage-mcp

# 3. 安装依赖
npm install

# 4. 测试
npm test
```

## 配置 Claude Code

编辑 `~/.claude/config.json`:

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

## 系统权限

前往 **系统设置 → 隐私与安全**:

1. **完全磁盘访问** → 添加终端应用
2. **自动化** → 允许终端控制 Messages

## 使用示例

在 Claude Code 中：

```
给 +86xxxxxxxxxx 发送消息："你好"
```

```
显示我最近的 iMessage 聊天
```

```
开始监听新的 iMessage 消息
```

## 技术架构

基于 [OpenClaw](https://github.com/openclaw/openclaw) 的实现方案：

```
iMessage → chat.db → imsg CLI → MCP Server → Claude Code
```

## 可用工具

- `send_imessage` - 发送消息
- `list_imessage_chats` - 列出聊天
- `get_imessage_history` - 获取历史
- `watch_imessage` - 开始监听
- `stop_watch_imessage` - 停止监听

## 常见问题

**Q: 提示找不到 imsg？**
A: 运行 `brew install steipete/tap/imsg` 安装

**Q: 发送消息失败？**
A: 检查自动化权限和 Messages.app 登录状态

**Q: 无法读取消息？**
A: 检查终端的完全磁盘访问权限

## 相关链接

- [imsg CLI 工具](https://github.com/steipete/imsg)
- [OpenClaw 项目](https://github.com/openclaw/openclaw)
- [MCP 协议](https://github.com/modelcontextprotocol/sdk)

## 开源协议

MIT License

---

用 🦞 为 Claude Code 制作
