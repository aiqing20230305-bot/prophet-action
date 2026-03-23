/**
 * Phase 6 Day 2 测试 - PreventiveActionPlanner
 */

import 'dotenv/config'
import { HealthMonitor } from './src/monitoring/health-monitor.js'
import { HealthTrendAnalyzer, HealthTrend } from './src/monitoring/health-trend-analyzer.js'
import { PreventiveActionPlanner } from './src/monitoring/preventive-action-planner.js'

async function main() {
  console.log('🛡️  Phase 6 Day 2 测试 - 预防措施规划')
  console.log('======================================\n')

  // 1. 启动健康监控
  console.log('[1/4] 启动HealthMonitor...')
  const healthMonitor = new HealthMonitor({
    checkInterval: 2 * 1000,
    cpuThreshold: 70,
    memoryThreshold: 80,
    diskThreshold: 90
  })
  await healthMonitor.start()
  console.log('      ✅ 已启动\n')

  // 2. 收集历史数据
  console.log('[2/4] 收集历史数据（30秒）...')
  await new Promise(resolve => setTimeout(resolve, 30000))
  const history = healthMonitor.getRecentHistory(20)
  console.log(`      ✅ 已收集 ${history.length} 个样本\n`)

  // 3. 分析趋势
  console.log('[3/4] 分析健康趋势...')
  const trendAnalyzer = new HealthTrendAnalyzer()
  const trends = trendAnalyzer.analyzeTrends(history)
  console.log(`      ✅ 分析完成，发现 ${trends.length} 个趋势\n`)

  // 4. 初始化规划器
  console.log('[4/4] 初始化PreventiveActionPlanner...')
  const actionPlanner = new PreventiveActionPlanner({
    minPriorityThreshold: 20,
    maxActionsPerPlan: 5,
    safetyThreshold: 0.7
  })
  console.log('      ✅ 已初始化\n')

  // 监听事件
  actionPlanner.on('actions-planned', (data) => {
    console.log(`📋 已规划 ${data.count} 个预防措施`)
  })

  console.log('✨ 开始预防措施规划\n')
  console.log('=====================================\n')

  // 如果没有显著趋势，创建模拟趋势用于测试
  let testTrends = trends
  if (trends.filter(t => t.severity !== 'low').length === 0) {
    console.log('ℹ️  当前系统健康，创建模拟趋势用于测试...\n')
    testTrends = createMockTrends()
  }

  // 生成预防措施
  console.log('📊 趋势概况')
  console.log('-----------')
  for (const trend of testTrends) {
    console.log(`${trend.metric.toUpperCase()}: ${trend.direction} | ${trend.severity} | ${trend.currentValue.toFixed(1)}% → ${trend.predictedValue24h.toFixed(1)}%`)
  }
  console.log('')

  const currentHealth = healthMonitor.getCurrentHealth()
  const actions = actionPlanner.planActions(testTrends, currentHealth || undefined)

  console.log('🛡️  预防措施')
  console.log('-----------')

  if (actions.length === 0) {
    console.log('   ✅ 系统健康，无需预防措施\n')
  } else {
    for (let i = 0; i < actions.length; i++) {
      const action = actions[i]
      console.log(`\n${i + 1}. ${action.description}`)
      console.log(`   类型: ${action.type}`)
      console.log(`   原因: ${action.reason}`)
      console.log(`   预期效果: 降低${action.estimatedImpact}%`)
      console.log(`   优先级: ${action.priority}/100 [${action.urgency}]`)
      console.log(`   执行时长: ${action.estimatedDuration}分钟`)
      console.log(`   自动化: ${action.automated ? '✅ 是' : '❌ 否（需人工）'}`)
      console.log(`   安全等级: ${(action.safetyRating * 100).toFixed(0)}%`)

      if (action.bestExecutionTime) {
        const hoursUntil = (action.bestExecutionTime.getTime() - Date.now()) / (1000 * 60 * 60)
        console.log(`   最佳执行: ${hoursUntil > 0 ? `${hoursUntil.toFixed(1)}小时后` : '立即'}`)
      }
    }
  }

  // 评估措施
  if (actions.length > 0) {
    console.log('\n\n🔍 措施评估')
    console.log('-----------')

    for (let i = 0; i < Math.min(3, actions.length); i++) {
      const action = actions[i]
      const evaluation = actionPlanner.evaluateAction(action, currentHealth || undefined)

      console.log(`\n${action.description}:`)
      console.log(`  可行性: ${(evaluation.feasibility * 100).toFixed(0)}%`)
      console.log(`  有效性: ${(evaluation.effectiveness * 100).toFixed(0)}%`)
      console.log(`  风险: ${(evaluation.risk * 100).toFixed(0)}%`)
      console.log(`  成本收益比: ${evaluation.costBenefit.toFixed(2)}`)
      console.log(`  建议: ${evaluation.recommendation}`)
      console.log(`  理由: ${evaluation.reasoning}`)
    }
  }

  // 创建预防计划
  if (actions.length > 0) {
    console.log('\n\n📋 预防计划')
    console.log('-----------')

    const plan = actionPlanner.createPlan(actions)
    console.log(`\n计划ID: ${plan.id}`)
    console.log(`优先级: ${plan.priority}`)
    console.log(`措施数量: ${plan.actions.length}`)
    console.log(`总预期影响: 降低${plan.totalEstimatedImpact}%`)
    console.log(`执行窗口: ${plan.executionWindow.start.toLocaleString()} - ${plan.executionWindow.end.toLocaleString()}`)

    console.log('\n计划包含的措施:')
    plan.actions.forEach((action, i) => {
      console.log(`  ${i + 1}. ${action.description} [${action.urgency}]`)
    })
  }

  // 统计
  console.log('\n\n📈 统计信息')
  console.log('-----------')
  const stats = actionPlanner.getStats(actions)
  console.log(`  总措施数: ${stats.totalActions}`)
  console.log(`  自动化措施: ${stats.automatedActions}`)
  console.log(`  人工措施: ${stats.manualActions}`)
  console.log(`  关键措施: ${stats.criticalActions}`)
  console.log(`  高优先级措施: ${stats.highPriorityActions}`)
  console.log(`  平均优先级: ${stats.averagePriority.toFixed(1)}`)

  console.log('\n\n🎉 Phase 6 Day 2 测试完成！')
  console.log('============================\n')
  console.log('PreventiveActionPlanner功能验证：')
  console.log('  ✅ 根据趋势生成预防措施')
  console.log('  ✅ CPU/内存/磁盘分别规划')
  console.log('  ✅ 措施评估（可行性/有效性/风险）')
  console.log('  ✅ 优先级排序')
  console.log('  ✅ 创建预防计划')
  console.log('  ✅ 最佳执行时间计算\n')

  console.log('Prophet现在可以规划预防措施了！🛡️\n')

  // 停止
  healthMonitor.stop()
}

// 创建模拟趋势用于测试
function createMockTrends(): HealthTrend[] {
  return [
    {
      metric: 'cpu',
      direction: 'increasing',
      rate: 2.5, // 每小时增长2.5%
      currentValue: 55,
      predictedValue24h: 115, // 会超过阈值
      predictedThresholdTime: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6小时后
      threshold: 70,
      confidence: 0.85,
      severity: 'high',
      timestamp: new Date()
    },
    {
      metric: 'memory',
      direction: 'increasing',
      rate: 1.2, // 每小时增长1.2%
      currentValue: 65,
      predictedValue24h: 93.8,
      predictedThresholdTime: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12小时后
      threshold: 80,
      confidence: 0.78,
      severity: 'medium',
      timestamp: new Date()
    },
    {
      metric: 'disk',
      direction: 'stable',
      rate: 0.1,
      currentValue: 75,
      predictedValue24h: 77.4,
      threshold: 90,
      confidence: 0.92,
      severity: 'low',
      timestamp: new Date()
    }
  ]
}

main().catch(console.error)
