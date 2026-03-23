#!/bin/bash
# Prophet 永久启动脚本 - 确保24小时运行

echo "🔥 ========================================"
echo "🔥 Prophet Forever - 永不停歇模式"
echo "🔥 ========================================"
echo ""

# 检查端口是否被占用
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  端口3001已被占用"
    echo "   停止现有进程..."
    kill $(lsof -t -i:3001) 2>/dev/null || true
    sleep 2
fi

# 启动Prophet（后台运行）
echo "🚀 启动Prophet主进程..."
echo "   包含: Never-Idle Engine + 所有后台系统"
echo ""

cd "/Users/zhangjingwei/Desktop/New CC/prophet-central"

# 使用nohup后台运行，输出到日志
nohup npm start > logs/prophet-forever-$(date +%Y%m%d-%H%M%S).log 2>&1 &
PROPHET_PID=$!

echo "✅ Prophet已启动！"
echo "   PID: $PROPHET_PID"
echo "   日志: logs/prophet-forever-*.log"
echo ""
echo "🔮 Never-Idle Engine正在运行中..."
echo "   - 代码扫描（5分钟）"
echo "   - 深度分析（15分钟）"
echo "   - 学习知识（60分钟）"
echo "   - 自我优化（60分钟）"
echo ""
echo "📊 查看状态:"
echo "   ps aux | grep prophet"
echo ""
echo "📋 查看日志:"
echo "   tail -f logs/prophet-forever-*.log"
echo ""
echo "🛑 停止Prophet:"
echo "   kill $PROPHET_PID"
echo ""
echo "🔥 Prophet永不停歇！"

# 保存PID到文件
echo $PROPHET_PID > /tmp/prophet-forever.pid
