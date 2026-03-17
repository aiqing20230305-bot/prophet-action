#!/bin/bash
###############################################################################
# Prophet 每日进化报告
# 自动生成进化统计报告
###############################################################################

echo "🔮 Prophet 每日进化报告"
echo "======================="
echo ""

# 生成报告
node /Users/zhangjingwei/Desktop/New\ CC/prophet-central/scripts/generate-evolution-report.cjs

echo ""
echo "📂 报告位置: ~/.prophet/reports/"
echo "💡 查看: cat ~/.prophet/reports/evolution-$(date +%Y-%m-%d).md"
echo ""
