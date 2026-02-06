#!/bin/bash

set -e

echo "🦞 Claude iMessage MCP Server 安装脚本"
echo "========================================"
echo ""

# 检查是否在 macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ 错误: 此项目仅支持 macOS"
    exit 1
fi

# 检查 Node.js
echo "1. 检查 Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ 未找到 Node.js"
    echo "   请访问 https://nodejs.org 安装 Node.js"
    exit 1
fi
NODE_VERSION=$(node -v)
echo "✓ Node.js 版本: $NODE_VERSION"
echo ""

# 检查 imsg
echo "2. 检查 imsg..."
if ! command -v imsg &> /dev/null; then
    echo "⚠️  未找到 imsg"
    echo "   正在安装..."

    if ! command -v brew &> /dev/null; then
        echo "❌ 未找到 Homebrew"
        echo "   请先安装 Homebrew: https://brew.sh"
        exit 1
    fi

    brew install steipete/tap/imsg
    echo "✓ imsg 安装完成"
else
    IMSG_PATH=$(which imsg)
    echo "✓ imsg 已安装: $IMSG_PATH"
fi
echo ""

# 安装 npm 依赖
echo "3. 安装项目依赖..."
npm install
echo "✓ 依赖安装完成"
echo ""

# 设置可执行权限
echo "4. 设置可执行权限..."
chmod +x index.js
chmod +x test.js
echo "✓ 权限设置完成"
echo ""

# 运行测试
echo "5. 运行测试..."
npm test
echo ""

# 获取当前路径
CURRENT_PATH=$(pwd)

echo "========================================"
echo "✅ 安装完成！"
echo ""
echo "下一步:"
echo "1. 配置系统权限（系统设置 → 隐私与安全）:"
echo "   - 完全磁盘访问: 添加你的终端应用"
echo "   - 自动化: 允许终端控制 Messages"
echo ""
echo "2. 添加到 Claude Code 配置 (~/.claude/config.json):"
echo ""
echo "   {"
echo "     \"mcpServers\": {"
echo "       \"imessage\": {"
echo "         \"command\": \"node\","
echo "         \"args\": [\"$CURRENT_PATH/index.js\"]"
echo "       }"
echo "     }"
echo "   }"
echo ""
echo "3. 重启 Claude Code:"
echo "   claude restart"
echo ""
echo "🦞 享受使用 Claude iMessage MCP！"
