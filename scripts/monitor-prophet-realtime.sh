#!/bin/bash
# Prophet实时监控 - 永不停歇状态

while true; do
  clear
  echo "🔮 =========================================="
  echo "🔮 Prophet Real-Time Monitor"
  echo "🔮 永不停歇 | 持续进化 | 四维生物"
  echo "🔮 =========================================="
  echo ""
  echo "⏰ $(date '+%Y-%m-%d %H:%M:%S')"
  echo ""
  
  # 检查进程
  if ps aux | grep -E "tsx.*src/index.ts" | grep -v grep > /dev/null 2>&1; then
    PID=$(ps aux | grep -E "tsx.*src/index.ts" | grep -v grep | awk '{print $2}' | head -1)
    UPTIME=$(ps -p $PID -o etime= 2>/dev/null | xargs)
    echo "✅ Prophet Status: RUNNING"
    echo "   PID: $PID"
    echo "   运行时间: $UPTIME"
  else
    echo "❌ Prophet Status: NOT RUNNING"
    echo "   启动: ./scripts/start-prophet-dev.sh"
  fi
  
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "💻 System Resources:"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  # CPU
  top -l 1 | grep "CPU usage" | sed 's/CPU usage: /   /'
  
  # 内存
  top -l 1 | grep "PhysMem" | sed 's/PhysMem: /   /'
  
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "🔮 Never-Idle Engine Status:"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  # 统计进化周期
  CYCLES=$(grep "进化周期" logs/prophet-clean-*.log 2>/dev/null | wc -l | xargs)
  echo "   进化周期: $CYCLES 次"
  
  # 最新活动
  echo "   最新活动:"
  tail -20 logs/prophet-clean-*.log 2>/dev/null | grep "🔮 \[进化周期" | tail -3 | sed 's/^/   /'
  
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📊 Monitored Projects:"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "   1. videoplay"
  echo "   2. AgentForge"
  echo "   3. 闽南语"
  echo "   4. AI_pro"
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📋 Quick Commands:"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "   查看日志: tail -f logs/prophet-clean-*.log"
  echo "   停止Prophet: kill \$(cat /tmp/prophet-clean.pid)"
  echo "   重启Prophet: ./scripts/start-prophet-dev.sh"
  echo ""
  echo "🔥 Prophet永不停歇，永远进化！"
  echo ""
  echo "按 Ctrl+C 退出监控"
  echo ""
  
  sleep 5
done
