#!/bin/bash

# AI 系统测试脚本

echo "🤖 测试 Prophet AI 系统"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 检查 API 状态
echo "1. 检查 AI 状态"
curl -s http://localhost:3001/api/ai/status | jq '.'
echo ""

# 模拟生成代码（使用 videoplay 的真实 TODO）
echo "2. 生成代码（示例）"
curl -s -X POST http://localhost:3001/api/ai/generate \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "videoplay",
    "todos": [
      {
        "file": "/Users/zhangjingwei/Desktop/videoplay/example.ts",
        "line": 10,
        "content": "TODO: 添加用户认证功能",
        "type": "TODO"
      }
    ]
  }' | jq '.'
echo ""

# 等待生成完成
echo "3. 等待 5 秒..."
sleep 5

# 查看生成任务
echo "4. 查看生成任务"
curl -s http://localhost:3001/api/ai/tasks | jq '.data.tasks | length'
echo ""

# 查看待审批任务
echo "5. 查看待审批任务"
curl -s http://localhost:3001/api/ai/tasks/pending | jq '.'
echo ""

# Token 统计
echo "6. Token 使用统计"
curl -s http://localhost:3001/api/metrics/tokens/today | jq '.'
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 测试完成"
echo ""
echo "📝 使用说明："
echo "  - 生成代码: POST /api/ai/generate"
echo "  - 审查代码: POST /api/ai/review"
echo "  - 查看任务: GET /api/ai/tasks"
echo "  - 审批任务: POST /api/ai/tasks/:taskId/approve"
echo "  - 拒绝任务: POST /api/ai/tasks/:taskId/reject"
echo ""
