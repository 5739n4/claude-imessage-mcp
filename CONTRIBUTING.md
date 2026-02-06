# Contributing to Claude iMessage MCP

感谢你对本项目的关注！我们欢迎任何形式的贡献。

## 如何贡献

### 报告 Bug

如果你发现了 Bug，请创建一个 Issue 并包含以下信息:

- 详细的问题描述
- 复现步骤
- 预期行为和实际行为
- 系统环境（macOS 版本、Node.js 版本、imsg 版本）
- 相关的错误日志

### 提交功能建议

欢迎提交新功能建议！请创建 Issue 并说明:

- 功能描述
- 使用场景
- 可能的实现方案

### 提交代码

1. **Fork 本仓库**

2. **创建特性分支**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **进行修改**
   - 遵循现有的代码风格
   - 添加必要的注释
   - 更新相关文档

4. **测试你的更改**
   ```bash
   npm test
   ```

5. **提交更改**
   ```bash
   git commit -m "描述你的更改"
   ```

6. **推送到你的 Fork**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **创建 Pull Request**
   - 清楚地描述你的更改
   - 引用相关的 Issue（如果有）

## 代码规范

- 使用 ES6+ 语法
- 使用有意义的变量名
- 保持函数简洁（单一职责）
- 添加必要的错误处理
- 为新功能添加注释

## 提交信息规范

推荐使用以下格式:

```
<type>: <subject>

<body>
```

**Type 类型**:
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建/工具链更新

**示例**:
```
feat: 添加发送图片功能

实现了通过 imsg --file 参数发送图片附件的功能
```

## 开发环境设置

```bash
# 克隆仓库
git clone https://github.com/yourusername/claude-imessage-mcp.git
cd claude-imessage-mcp

# 安装依赖
npm install

# 运行测试
npm test

# 开发模式（自动重启）
npm run dev
```

## 测试

在提交 PR 前，请确保:

- [x] 所有现有测试通过
- [x] 为新功能添加了测试
- [x] 在 macOS 上测试过
- [x] 更新了相关文档

## 需要帮助？

如果你在贡献过程中遇到问题:

- 查看现有的 Issues
- 创建新的 Issue 提问
- 在 Pull Request 中询问

## 行为准则

- 尊重所有贡献者
- 保持专业和友好的态度
- 欢迎建设性的反馈
- 关注技术本身

## 许可证

提交代码即表示你同意以 MIT 许可证授权你的贡献。
