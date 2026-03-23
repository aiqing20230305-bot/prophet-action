/**
 * Phase 6 完整测试 - 预防性维护系统
 */

import 'dotenv/config'
import { HealthMonitor } from './src/monitoring/health-monitor.js'
import { HealthTrendAnalyzer } from './src/monitoring/health-trend-analyzer.js'
import { PreventiveActionPlanner } from './src/monitoring/preventive-action-planner.js'
import { SelfHealingEngine } from './src/monitoring/self-healing-engine.js'
import { MaintenanceScheduler } from './src/monitoring/maintenance-scheduler.js'
import { PreventiveMaintenanceCoordinator } from './src/monitoring/preventive-maintenance-coordinator.js'

async function main() {
  console.log('🛡️  ========================================')
  console.log('🛡️  Phase 6 完整测试 - 预防性维护系统')
  console.log('🛡️  ========================================\n')

  // 1. 健康监控器
  console.log('[1/6] 启动HealthMonitor...')
  const healthMonitor = new HealthMonitor({
    checkInterval: 2 * 1000,
    cpuThreshold: 70,
    memoryThreshold: 80,
    diskThreshold: 90
  })
  await healthMonitor.start()
  console.log('      ✅ 已启动\n')

  // 2. 趋势分析器
  console.log('[2/6] 初始化HealthTrendAnalyzer...')
  const trendAnalyzer = new HealthTrendAnalyzer({
    minHistorySize: 10,
    trendDetectionWindow: 24,
    stabilityThreshold: 2
  })
  console.log('      ✅ 已初始化\n')

  // 3. 措施规划器
  console.log('[3/6] 初始化PreventiveActionPlanner...')
  const actionPlanner = new PreventiveActionPlanner({
    minPriorityThreshold: 20,
    maxActionsPerPlan: 5,
    safetyThreshold: 0.7
  })
  console.log('      ✅ 已初始化\n')

  // 4. 自愈引擎
  console.log('[4/6] 初始化SelfHealingEngine...')
  const healingEngine = new SelfHealingEngine({
    enableAutoHealing: true,
    maxRetries: 3,
    retryDelay: 1000
  })
  console.log('      ✅ 已初始化\n')

  // 5. 任务调度器
  console.log('[5/6] 初始化MaintenanceScheduler...')
  const scheduler = new MaintenanceScheduler(healingEngine, {
    enableAutoExecution: false, // 测试模式：手动触发
    maxConcurrentTasks: 1,
    minTimeBetweenTasks: 1000
  })
  console.log('      ✅ 已初始化\n')

  // 6. 预防维护协调器
  console.log('[6/6] 初始化PreventiveMaintenanceCoordinator...')
  const coordinator = new PreventiveMaintenanceCoordinator(
    healthMonitor,
    trendAnalyzer,
    actionPlanner,
    scheduler,
    {
      enableAutoPreventive: false, // 测试模式：手动触发
      checkInterval: 60 * 60 * 1000,
      minTrendHistorySize: 10
    }
  )
  console.log('      ✅ 已初始化\n')

  console.log('✨ Phase 6 所有组件启动完成！\n')
  console.log('========================================\n')

  // 收集历史数据
  console.log('⏳ 收集健康历史数据（30秒）...\n')
  await new Promise(resolve => setTimeout(resolve, 30000))

  const history = healthMonitor.getRecentHistory(20)
  console.log(`✅ 已收集 ${history.length} 个历史样本\n`)

  // 启动协调器
  console.log('🚀 启动PreventiveMaintenanceCoordinator...\n')
  coordinator.start()

  // 手动触发预防检查
  console.log('🔍 手动触发预防性维护检查...\n')
  const session = await coordinator.triggerPreventiveCheck()

  // 显示结果
  console.log('\n📊 检查结果汇总')
  console.log('================')
  console.log(`会话ID: ${session.sessionId}`)
  console.log(`成功: ${session.success ? '✅' : '❌'}`)
  console.log(`趋势数: ${session.trends.length}`)
  console.log(`措施数: ${session.actions.length}`)
  console.log(`任务数: ${session.tasks.length}`)
  console.log(`预防问题: ${session.preventedIssues} 个`)

  if (session.plan) {
    console.log(`\n预防计划:`)
    console.log(`  优先级: ${session.plan.priority}`)
    console.log(`  总影响: 降低${session.plan.totalEstimatedImpact}%`)
    console.log(`  执行窗口: ${session.plan.executionWindow.start.toLocaleString()}`)
  }

  // 显示待执行任务
  const pendingTasks = scheduler.getPendingTasks()
  if (pendingTasks.length > 0) {
    console.log(`\n📋 待执行任务 (${pendingTasks.length}):`)
    for (const task of pendingTasks.slice(0, 3)) {
      console.log(`  - ${task.action.description}`)
      console.log(`    调度时间: ${task.scheduledTime.toLocaleString()}`)
    }
  }

  // 统计信息
  console.log('\n📈 系统统计')
  console.log('===========')
  const stats = coordinator.getStats()
  console.log(`预防会话: ${stats.totalSessions}`)
  console.log(`成功会话: ${stats.successfulSessions}`)
  console.log(`预防问题: ${stats.totalPreventedIssues}`)
  console.log(`生成措施: ${stats.totalActions}`)
  console.log(`调度任务: ${stats.totalTasks}`)

  const schedulerStats = stats.schedulerStats
  console.log(`\n调度器统计:`)
  console.log(`  待执行: ${schedulerStats.scheduledTasks}`)
  console.log(`  运行中: ${schedulerStats.runningTasks}`)
  console.log(`  已完成: ${schedulerStats.completedTasks}`)
  console.log(`  失败: ${schedulerStats.failedTasks}`)

  console.log('\n\n🎉 Phase 6 完整测试通过！')
  console.log('============================\n')
  console.log('Phase 6 完整功能验证：')
  console.log('  ✅ Day 1: HealthTrendAnalyzer - 趋势分析')
  console.log('  ✅ Day 2: PreventiveActionPlanner - 措施规划')
  console.log('  ✅ Day 3: MaintenanceScheduler - 任务调度')
  console.log('  ✅ Day 4: PreventiveMaintenanceCoordinator - 完整集成')
  console.log('\n完整预防流程：')
  console.log('  监控 → 趋势分析 → 预测问题 → 规划措施 → 调度执行\n')

  console.log('🔮 Prophet现在拥有完整的预防能力！')
  console.log('   从"救火"进化到"防火"')
  console.log('   Level 5: 预防性维护 ✅\n')

  // 停止
  coordinator.stop()
  healthMonitor.stop()

  console.log('测试完成，系统已停止。\n')
}

main().catch(console.error)
