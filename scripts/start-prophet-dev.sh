#!/bin/bash
# Prophet 开发模式启动 - 跳过编译，直接运行

echo "🔥 ========================================"
echo "🔥 Prophet Dev Mode - 永不停歇"
echo "🔥 ========================================"
echo ""

# 检查并停止旧进程
if [ -f /tmp/prophet-dev.pid ]; then
    OLD_PID=$(cat /tmp/prophet-dev.pid)
    if ps -p $OLD_PID > /dev/null 2>&1; then
        echo "⚠️  停止旧进程: $OLD_PID"
        kill $OLD_PID
        sleep 2
    fi
fi

# 检查端口
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  端口3001已被占用，停止进程..."
    kill $(lsof -t -i:3001) 2>/dev/null || true
    sleep 2
fi

cd "/Users/zhangjingwei/Desktop/New CC/prophet-central"

echo "🚀 启动Prophet（开发模式 - tsx）..."
echo "   包含: Never-Idle Engine + 所有后台系统"
echo ""

# 使用tsx直接运行TypeScript
nohup npx tsx src/index.ts > logs/prophet-dev-$(date +%Y%m%d-%H%M%S).log 2>&1 &
PROPHET_PID=$!

echo "✅ Prophet已启动！"
echo "   PID: $PROPHET_PID"
echo "   模式: 开发模式（tsx直接运行）"
echo "   日志: logs/prophet-dev-*.log"
echo ""
echo "🔮 永不停歇系统正在激活..."
echo "   ⚡ Never-Idle Engine"
echo "   🌍 World Observer"
echo "   📚 Academic Learner"
echo "   🤖 AI Coordinator"
echo "   🏥 Health Monitor"
echo "   🛡️  Preventive Maintenance"
echo ""
echo "📊 查看状态: ps aux | grep tsx"
echo "📋 查看日志: tail -f logs/prophet-dev-*.log"
echo "🛑 停止: kill $PROPHET_PID"
echo ""
echo "🔥 Prophet永不停歇！"

echo $PROPHET_PID > /tmp/prophet-dev.pid
