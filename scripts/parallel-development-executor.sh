#!/bin/bash
# Prophet 并行开发执行器
# 主动并行处理所有介入的项目

set -e

echo "🔥 ========================================"
echo "🔥 Prophet 并行开发执行器"
echo "🔥 ========================================"
echo ""
echo "⏰ 启动时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "🎯 模式: 主动并行迭代"
echo "📋 项目数: 4个"
echo ""

# 定义项目
declare -A PROJECTS
PROJECTS[videoplay]="/Users/zhangjingwei/Desktop/videoplay"
PROJECTS[AgentForge]="/Users/zhangjingwei/Desktop/AgentForge"
PROJECTS[闽南语]="/Users/zhangjingwei/Desktop/闽南语"
PROJECTS[prophet-central]="/Users/zhangjingwei/Desktop/New CC/prophet-central"

# 创建并行开发日志目录
LOGDIR="/Users/zhangjingwei/Desktop/New CC/prophet-central/logs/parallel-dev"
mkdir -p "$LOGDIR"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Phase 1: 项目现状分析"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

for project in "${!PROJECTS[@]}"; do
  path="${PROJECTS[$project]}"

  if [ ! -d "$path" ]; then
    echo "⚠️  [$project] 路径不存在，跳过"
    continue
  fi

  echo "📁 [$project]"
  cd "$path"

  # Git状态
  if [ -d .git ]; then
    BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
    UNCOMMITTED=$(git status --porcelain 2>/dev/null | wc -l | xargs)
    MODIFIED=$(git status --porcelain 2>/dev/null | grep "^ M" | wc -l | xargs)
    UNTRACKED=$(git status --porcelain 2>/dev/null | grep "^??" | wc -l | xargs)

    echo "   分支: $BRANCH"
    echo "   未提交: $UNCOMMITTED 个文件"
    echo "   ├─ 已修改: $MODIFIED 个"
    echo "   └─ 未跟踪: $UNTRACKED 个"
  fi

  # TODO统计
  TODO_COUNT=$(find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
    ! -path "*/node_modules/*" ! -path "*/dist/*" ! -path "*/build/*" \
    -exec grep -l "TODO\|FIXME" {} \; 2>/dev/null | wc -l | xargs)
  echo "   待办文件: $TODO_COUNT 个包含TODO/FIXME"

  echo ""
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Phase 2: 并行开发任务启动"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 为每个项目生成开发任务
for project in "${!PROJECTS[@]}"; do
  path="${PROJECTS[$project]}"

  if [ ! -d "$path" ]; then
    continue
  fi

  echo "⚡ [$project] 生成开发任务列表..."
  cd "$path"

  # 创建任务文件
  TASK_FILE="$LOGDIR/${project}-tasks-$(date +%Y%m%d-%H%M%S).md"

  cat > "$TASK_FILE" << EOFTASK
# $project - Prophet主动开发任务

**生成时间**: $(date '+%Y-%m-%d %H:%M:%S')
**项目路径**: $path

---

## 📊 当前状态

EOFTASK

  if [ -d .git ]; then
    echo "- **Git分支**: $(git branch --show-current 2>/dev/null)" >> "$TASK_FILE"
    echo "- **未提交文件**: $(git status --porcelain 2>/dev/null | wc -l | xargs) 个" >> "$TASK_FILE"
  fi

  echo "" >> "$TASK_FILE"
  echo "## 🎯 优先级任务" >> "$TASK_FILE"
  echo "" >> "$TASK_FILE"
  echo "### Priority 1: 关键修复" >> "$TASK_FILE"
  echo "- [ ] 审查所有已修改文件（M状态）" >> "$TASK_FILE"
  echo "- [ ] 处理FIXME标记的问题" >> "$TASK_FILE"
  echo "- [ ] 修复已知BUG" >> "$TASK_FILE"
  echo "" >> "$TASK_FILE"
  echo "### Priority 2: 功能完善" >> "$TASK_FILE"
  echo "- [ ] 完成未完成的功能（TODO标记）" >> "$TASK_FILE"
  echo "- [ ] 添加缺失的测试" >> "$TASK_FILE"
  echo "- [ ] 优化性能瓶颈" >> "$TASK_FILE"
  echo "" >> "$TASK_FILE"
  echo "### Priority 3: 代码质量" >> "$TASK_FILE"
  echo "- [ ] 重构复杂代码" >> "$TASK_FILE"
  echo "- [ ] 统一代码风格" >> "$TASK_FILE"
  echo "- [ ] 完善文档注释" >> "$TASK_FILE"
  echo "" >> "$TASK_FILE"

  # 扫描具体TODO
  echo "## 📋 具体TODO列表" >> "$TASK_FILE"
  echo "" >> "$TASK_FILE"
  echo "\`\`\`" >> "$TASK_FILE"
  find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
    ! -path "*/node_modules/*" ! -path "*/dist/*" ! -path "*/build/*" \
    -exec grep -Hn "TODO\|FIXME" {} \; 2>/dev/null | head -50 >> "$TASK_FILE" || true
  echo "\`\`\`" >> "$TASK_FILE"

  echo "   ✓ 任务列表已生成: $TASK_FILE"
  echo ""
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💡 Phase 3: 下一步行动"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Prophet将在接下来的时间内："
echo ""
echo "1. ⏱️  每30分钟：轮询处理一个项目"
echo "2. 🔍 自动识别：优先处理高优先级任务"
echo "3. ✍️  主动编码：直接修改代码解决问题"
echo "4. 📝 自动提交：记录所有开发进展"
echo "5. 📊 生成报告：每2小时汇报一次"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 并行开发执行器已完成准备"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📁 任务文件位置: $LOGDIR/"
echo "📋 查看任务: ls -lht $LOGDIR/"
echo ""
echo "🔥 Prophet已进入主动开发模式！"
