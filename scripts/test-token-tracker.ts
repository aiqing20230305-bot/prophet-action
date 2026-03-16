/**
 * Token Tracker 测试脚本
 */

import { getGlobalTokenTracker } from '../src/monitoring/token-tracker.js'

async function testTokenTracker() {
  console.log('🧪 测试 Token Tracker...\n')

  const tracker = getGlobalTokenTracker()

  // 加载今天的数据
  await tracker.loadFromDisk()

  // 模拟记录一些 token 使用
  console.log('📝 记录模拟 token 使用...')

  await tracker.recordUsage({
    projectId: 'videoplay',
    operation: 'heartbeat',
    inputTokens: 1000,
    outputTokens: 500,
    model: 'claude-sonnet-4.5'
  })

  await tracker.recordUsage({
    projectId: 'agentforge',
    operation: 'developer',
    inputTokens: 5000,
    outputTokens: 3000,
    model: 'claude-sonnet-4.5'
  })

  await tracker.recordUsage({
    projectId: 'videoplay',
    operation: 'analyzer',
    inputTokens: 2000,
    outputTokens: 1500,
    model: 'claude-sonnet-4.5'
  })

  // 获取今天的统计
  console.log('\n📊 今天的统计：')
  const todayStats = tracker.getTodayStats()

  console.log(`总 Tokens: ${todayStats.totalTokens.toLocaleString()}`)
  console.log(`输入 Tokens: ${todayStats.inputTokens.toLocaleString()}`)
  console.log(`输出 Tokens: ${todayStats.outputTokens.toLocaleString()}`)
  console.log(`估算成本: $${todayStats.estimatedCost.toFixed(4)}`)

  console.log('\n📦 按项目：')
  for (const [projectId, stats] of Object.entries(todayStats.byProject)) {
    console.log(`  ${projectId}:`)
    console.log(`    Tokens: ${stats.totalTokens.toLocaleString()}`)
    console.log(`    操作次数: ${stats.operations}`)
    console.log(`    成本: $${stats.cost.toFixed(4)}`)
  }

  console.log('\n⚙️  按操作：')
  for (const [operation, stats] of Object.entries(todayStats.byOperation)) {
    console.log(`  ${operation}:`)
    console.log(`    Tokens: ${stats.totalTokens.toLocaleString()}`)
    console.log(`    次数: ${stats.count}`)
    console.log(`    成本: $${stats.cost.toFixed(4)}`)
  }

  // 保存到磁盘
  await tracker.saveToDisk()
  console.log('\n✅ 数据已保存')

  // 清理
  await tracker.destroy()
}

testTokenTracker().catch(console.error)
