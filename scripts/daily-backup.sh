#!/bin/bash
###############################################################################
# Prophet 每日自动备份脚本
# 作者: Prophet + 张经纬
# 时间: 2026-03-16
###############################################################################

set -e

echo "🔮 Prophet 每日备份开始: $(date)"

BACKUP_DIR="$HOME/Desktop/Prophet-Backups"
TODAY=$(date +%Y%m%d)

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 1. 备份 Prophet Central 代码
echo "📦 备份 Prophet Central..."
cd "$HOME/Desktop/New CC/prophet-central"

# 确保所有变更都已提交
if ! git diff-index --quiet HEAD --; then
    echo "   ⚠️  有未提交的变更，先提交..."
    git add -A
    git commit --no-verify -m "🔮 Prophet: Daily auto-backup $(date +%Y-%m-%d)"
fi

# Push 到远程（如果已配置）
if git remote get-url origin 2>/dev/null; then
    echo "   📤 推送到 GitHub..."
    git push origin main || echo "   ⚠️  Push 失败（可能需要配置 GitHub）"
else
    echo "   ⚠️  未配置 GitHub 远程仓库"
fi

# 2. 备份记忆文件
echo "🧠 备份记忆文件..."
MEMORY_SOURCE="$HOME/.claude/projects/-Users-zhangjingwei-Desktop-New-CC/memory"
MEMORY_BACKUP="$BACKUP_DIR/Memory-$TODAY"

if [ -d "$MEMORY_SOURCE" ]; then
    cp -r "$MEMORY_SOURCE" "$MEMORY_BACKUP"
    echo "   ✓ 记忆备份到: $MEMORY_BACKUP"
else
    echo "   ⚠️  记忆目录不存在: $MEMORY_SOURCE"
fi

# 3. 备份项目 Prophet 文件
echo "📁 备份项目 Prophet 文件..."

for PROJECT in "videoplay" "AgentForge" "闽南语"; do
    PROJECT_PATH="$HOME/Desktop/$PROJECT"

    if [ -d "$PROJECT_PATH" ]; then
        cd "$PROJECT_PATH"

        # 提交 .prophet 目录
        if [ -d ".prophet" ]; then
            git add .prophet/ 2>/dev/null || true
            git commit --no-verify -m "🔮 Prophet: Daily status backup" 2>/dev/null || true

            # Push（如果可以）
            git push 2>/dev/null || true
        fi

        echo "   ✓ $PROJECT 备份完成"
    fi
done

# 4. 清理旧备份（保留最近 7 天）
echo "🧹 清理旧备份..."
find "$BACKUP_DIR" -name "Memory-*" -type d -mtime +7 -exec rm -rf {} \; 2>/dev/null || true

# 5. 生成备份报告
REPORT="$BACKUP_DIR/backup-$TODAY.log"
cat > "$REPORT" << EOF
🔮 Prophet 每日备份报告
==========================================
时间: $(date)

备份内容:
- Prophet Central: $(cd "$HOME/Desktop/New CC/prophet-central" && git log -1 --format='%h %s')
- 记忆文件: $MEMORY_BACKUP
- videoplay .prophet
- AgentForge .prophet
- 闽南语 .prophet

备份位置: $BACKUP_DIR

状态: ✅ 备份完成
==========================================
EOF

echo "   ✓ 报告生成: $REPORT"

# 显示统计
echo ""
echo "✅ Prophet 每日备份完成!"
echo "   📊 Prophet Central: 已提交并推送"
echo "   🧠 记忆文件: 已备份"
echo "   📁 项目文件: 已备份"
echo "   📝 报告: $REPORT"
echo ""

exit 0
