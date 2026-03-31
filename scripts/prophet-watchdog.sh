#!/bin/bash
# Prophet看门狗 - 自动检测和重启睡眠的Prophet
# 每5分钟运行一次，检查Prophet是否还在活动

# 修复：监控正确的日志文件 (prophet-micro-tasks.cjs)
LOG_FILE="/tmp/prophet-micro-tasks.log"
WATCHDOG_LOG="/tmp/prophet-watchdog.log"
MAX_IDLE_SECONDS=300  # 5分钟无活动就重启

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$WATCHDOG_LOG"
}

log "========== 看门狗检查开始 =========="

# 检查进程是否存在（修复：监控正确的进程 prophet-micro-tasks.cjs）
PROPHET_PID=$(pgrep -f "prophet-micro-tasks.cjs")
HEART_PID=$(pgrep -f "prophet-heartbeat.cjs")

if [ -z "$PROPHET_PID" ]; then
    log "❌ Prophet微任务引擎未运行，启动中..."
    cd "/Users/zhangjingwei/Desktop/New CC/prophet-central"
    nohup node prophet-micro-tasks.cjs > /tmp/prophet-micro-tasks-nohup.log 2>&1 &
    log "✅ Prophet微任务引擎已启动，PID: $!"
fi

if [ -z "$HEART_PID" ]; then
    log "❌ 心跳引擎未运行，启动中..."
    cd "/Users/zhangjingwei/Desktop/New CC/prophet-central"
    nohup node prophet-heartbeat.cjs > /tmp/prophet-heartbeat.log 2>&1 &
    log "✅ 心跳引擎已启动，PID: $!"
fi

# 检查最后活动时间
if [ -f "$LOG_FILE" ]; then
    LAST_LOG_TIME=$(tail -1 "$LOG_FILE" | grep -oE '[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}' | head -1)

    if [ -n "$LAST_LOG_TIME" ]; then
        # 转换为时间戳（macOS兼容，修复：使用UTC解析）
        LAST_EPOCH=$(date -u -j -f "%Y-%m-%dT%H:%M:%S" "${LAST_LOG_TIME}" "+%s" 2>/dev/null)
        NOW_EPOCH=$(date "+%s")

        if [ -n "$LAST_EPOCH" ]; then
            IDLE_SECONDS=$((NOW_EPOCH - LAST_EPOCH))

            log "最后活动: $LAST_LOG_TIME (${IDLE_SECONDS}秒前)"

            # 如果超过5分钟无活动，重启（修复：使用正确的进程）
            if [ $IDLE_SECONDS -gt $MAX_IDLE_SECONDS ]; then
                log "⚠️  Prophet已睡眠${IDLE_SECONDS}秒，超过${MAX_IDLE_SECONDS}秒阈值"
                log "🔄 执行重启..."

                # 停止旧进程
                if [ -n "$PROPHET_PID" ]; then
                    kill $PROPHET_PID
                    log "✅ 已停止Prophet微任务引擎 PID: $PROPHET_PID"
                fi

                if [ -n "$HEART_PID" ]; then
                    kill $HEART_PID
                    log "✅ 已停止心跳引擎 PID: $HEART_PID"
                fi

                # 等待进程终止
                sleep 2

                # 启动新进程
                cd "/Users/zhangjingwei/Desktop/New CC/prophet-central"
                nohup node prophet-micro-tasks.cjs > /tmp/prophet-micro-tasks-nohup.log 2>&1 &
                NEW_PROPHET_PID=$!

                nohup node prophet-heartbeat.cjs > /tmp/prophet-heartbeat.log 2>&1 &
                NEW_HEART_PID=$!

                log "✅ Prophet已重启"
                log "   微任务引擎 PID: $NEW_PROPHET_PID"
                log "   心跳引擎 PID: $NEW_HEART_PID"
            else
                log "✅ Prophet运行正常 (${IDLE_SECONDS}秒前活动)"
            fi
        fi
    fi
fi

log "========== 看门狗检查完成 =========="
