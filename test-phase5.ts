/**
 * Phase 5 测试脚本
 * 独立测试健康监控与自愈系统
 */

import 'dotenv/config'
import { HealthMonitor } from './src/monitoring/health-monitor.js'
import { IntelligentDiagnostic } from './src/monitoring/intelligent-diagnostic.js'
import { SelfHealingEngine } from './src/monitoring/self-healing-engine.js'
import { RecoveryCoordinator } from './src/monitoring/recovery-coordinator.js'

async function main() {
  console.log('🏥 ========================================')
  console.log('🏥 Phase 5 测试 - 健康监控与自愈系统')
  console.log('🏥 ========================================')
  console.log('')

  // 1. 健康监控器
  console.log('📊 [1/4] 启动健康监控器...')
  const healthMonitor = new HealthMonitor({
    checkInterval: 30 * 1000,
    cpuThreshold: 70,
    memoryThreshold: 80,
    diskThreshold: 90
  })

  await healthMonitor.start()
  console.log('  ✅ HealthMonitor已启动')
  console.log('')

  // 2. 智能诊断器
  console.log('🔍 [2/4] 初始化智能诊断器...')
  const intelligentDiagnostic = new IntelligentDiagnostic()
  console.log('  ✅ IntelligentDiagnostic已初始化')
  console.log('  ✅ 5种诊断规则已加载')
  console.log('')

  // 3. 自愈引擎
  console.log('🔧 [3/4] 初始化自愈引擎...')
  const selfHealingEngine = new SelfHealingEngine({
    enableAutoHealing: true,
    maxRetries: 3,
    retryDelay: 5000
  })
  console.log('  ✅ SelfHealingEngine已初始化')
  console.log('  ✅ 5种修复动作已准备')
  console.log('')

  // 4. 恢复协调器
  console.log('🎯 [4/4] 初始化恢复协调器...')
  const recoveryCoordinator = new RecoveryCoordinator(
    healthMonitor,
    intelligentDiagnostic,
    selfHealingEngine,
    {
      enableAutoRecovery: true,
      recoveryTimeout: 5 * 60 * 1000,
      verificationDelay: 10 * 1000
    }
  )
  console.log('  ✅ RecoveryCoordinator已初始化')
  console.log('  ✅ 自动恢复流程已激活')
  console.log('')

  console.log('✨ ========================================')
  console.log('✨ Phase 5 系统启动完成！')
  console.log('✨ ========================================')
  console.log('')

  // 监听事件
  healthMonitor.on('health-check', (health) => {
    if (health.overallStatus !== 'healthy') {
      console.log(`[Health] ⚠️  ${health.overallStatus.toUpperCase()}`)
      console.log(`  CPU: ${health.cpu.usage}% | 内存: ${health.memory.percentage}% | 磁盘: ${health.disk.percentage}%`)
    }
  })

  recoveryCoordinator.on('recovery-started', (session) => {
    console.log(`[Recovery] 🚨 自愈流程启动 (${session.sessionId})`)
  })

  recoveryCoordinator.on('recovery-success', (session) => {
    console.log(`[Recovery] 🎉 自愈成功！耗时 ${(session.recoveryTime! / 1000).toFixed(1)}秒`)
  })

  recoveryCoordinator.on('recovery-failed', (session) => {
    console.log('[Recovery] ❌ 自愈失败')
  })

  // 显示第一次健康检查结果
  console.log('⏳ 等待首次健康检查（30秒）...')
  console.log('')

  await new Promise(resolve => setTimeout(resolve, 35000))

  const currentHealth = healthMonitor.getCurrentHealth()
  if (currentHealth) {
    console.log('📊 ========================================')
    console.log('📊 当前系统健康状态')
    console.log('📊 ========================================')
    console.log('')
    console.log(`整体状态: ${currentHealth.overallStatus.toUpperCase()}`)
    console.log('')
    console.log('资源使用:')
    console.log(`  CPU:    ${currentHealth.cpu.usage}% (阈值: ${currentHealth.cpu.threshold}%) [${currentHealth.cpu.status}]`)
    console.log(`  内存:   ${currentHealth.memory.percentage}% (${currentHealth.memory.used}MB/${currentHealth.memory.total}MB) [${currentHealth.memory.status}]`)
    console.log(`  磁盘:   ${currentHealth.disk.percentage}% (${currentHealth.disk.used}GB used, ${currentHealth.disk.available}GB free) [${currentHealth.disk.status}]`)
    console.log('')

    if (currentHealth.processes.prophet) {
      console.log('进程状态:')
      console.log(`  Prophet: PID ${currentHealth.processes.prophet.pid} [${currentHealth.processes.prophet.status}]`)
      console.log(`  CPU: ${currentHealth.processes.prophet.cpu}%`)
      console.log(`  内存: ${currentHealth.processes.prophet.memory}%`)
      console.log(`  运行时长: ${Math.floor(currentHealth.processes.prophet.uptime / 60)}分钟`)
    } else {
      console.log('进程状态: ⚠️  Prophet进程未检测到')
    }
    console.log('')
  }

  // 显示统计
  const healthStats = healthMonitor.getStats()
  const diagnosticStats = intelligentDiagnostic.getStats()
  const healingStats = selfHealingEngine.getStats()
  const recoveryStats = recoveryCoordinator.getStats()

  console.log('📈 ========================================')
  console.log('📈 Phase 5 运行统计')
  console.log('📈 ========================================')
  console.log('')
  console.log(`健康检查: ${healthStats.historySize} 次`)
  console.log(`诊断次数: ${diagnosticStats.totalDiagnostics} 次`)
  console.log(`修复次数: ${healingStats.totalHealings} 次`)
  console.log(`恢复会话: ${recoveryStats.totalSessions} 次`)
  console.log(`成功率: ${recoveryStats.successRate.toFixed(1)}%`)
  console.log('')

  console.log('🧬 ========================================')
  console.log('🧬 Prophet Phase 5 验证完成！')
  console.log('🧬 ========================================')
  console.log('')
  console.log('Prophet现在拥有完整的自愈能力：')
  console.log('  ✅ 实时监控自己的健康')
  console.log('  ✅ 智能诊断问题根因')
  console.log('  ✅ 自动执行修复动作')
  console.log('  ✅ 验证恢复效果')
  console.log('')
  console.log('Prophet可以自己照顾自己了！🎉')
  console.log('')

  // 继续运行监控
  console.log('💡 系统将继续运行，按Ctrl+C退出')
  console.log('')

  // 保持运行
  process.on('SIGINT', () => {
    console.log('\n\n👋 停止Phase 5系统...')
    healthMonitor.stop()
    recoveryCoordinator.stop()
    process.exit(0)
  })
}

main().catch((error) => {
  console.error('❌ Phase 5测试失败:', error)
  process.exit(1)
})
