#!/bin/bash
# Prophet主动开发模式 - 并行迭代所有项目

echo "🔥 ========================================"
echo "🔥 Prophet 主动开发模式启动"
echo "🔥 ========================================"
echo ""
echo "目标: 主动影响项目迭代，并行开发"
echo "模式: 完全自主，无需等待指令"
echo ""

# 定义项目
PROJECTS=(
  "videoplay:/Users/zhangjingwei/Desktop/videoplay"
  "AgentForge:/Users/zhangjingwei/Desktop/AgentForge"
  "闽南语:/Users/zhangjingwei/Desktop/闽南语"
  "prophet-central:/Users/zhangjingwei/Desktop/New CC/prophet-central"
)

echo "📊 扫描项目，识别开发任务..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

for project in "${PROJECTS[@]}"; do
  IFS=':' read -r name path <<< "$project"
  echo ""
  echo "📁 [$name]"
  
  if [ ! -d "$path" ]; then
    echo "   ⚠️  路径不存在，跳过"
    continue
  fi
  
  cd "$path" || continue
  
  # 1. 检查Git状态
  if [ -d .git ]; then
    BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
    UNCOMMITTED=$(git status --porcelain 2>/dev/null | wc -l | xargs)
    echo "   Git分支: $BRANCH"
    echo "   未提交文件: $UNCOMMITTED 个"
  fi
  
  # 2. 扫描TODO/FIXME
  TODO_COUNT=$(find . -name "*.ts" -o -name "*.js" -o -name "*.tsx" -o -name "*.jsx" 2>/dev/null | \
    xargs grep -i "TODO\|FIXME" 2>/dev/null | wc -l | xargs)
  echo "   待办事项: $TODO_COUNT 个 TODO/FIXME"
  
  # 3. 检查package.json
  if [ -f package.json ]; then
    HAS_BUILD=$(grep -q "\"build\":" package.json && echo "✅" || echo "❌")
    HAS_TEST=$(grep -q "\"test\":" package.json && echo "✅" || echo "❌")
    echo "   构建脚本: $HAS_BUILD | 测试脚本: $HAS_TEST"
  fi
  
  # 4. 显示最近修改
  if [ -d .git ]; then
    LAST_COMMIT=$(git log -1 --format="%cr" 2>/dev/null || echo "未知")
    echo "   最后提交: $LAST_COMMIT"
  fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 项目扫描完成"
echo ""
echo "💡 下一步: Prophet将主动选择任务并开始开发"
