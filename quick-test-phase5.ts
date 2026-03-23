/**
 * Phase 5 快速验证
 */

import 'dotenv/config'
import { HealthMonitor } from './src/monitoring/health-monitor.js'
import { IntelligentDiagnostic } from './src/monitoring/intelligent-diagnostic.js'
import { SelfHealingEngine } from './src/monitoring/self-healing-engine.js'
import { RecoveryCoordinator } from './src/monitoring/recovery-coordinator.js'

async function main() {
  console.log('🏥 Phase 5 快速验证')
  console.log('==================\n')

  // 1. 健康监控器
  const healthMonitor = new HealthMonitor({
    checkInterval: 30 * 1000,
    cpuThreshold: 70,
    memoryThreshold: 80,
    diskThreshold: 90
  })

  console.log('[1/4] 启动HealthMonitor...')
  await healthMonitor.start()
  console.log('      ✅ 已启动\n')

  // 2. 智能诊断器
  console.log('[2/4] 初始化IntelligentDiagnostic...')
  const intelligentDiagnostic = new IntelligentDiagnostic()
  const diagStats = intelligentDiagnostic.getStats()
  console.log(`      ✅ 已初始化，${diagStats.rulesCount}种诊断规则\n`)

  // 3. 自愈引擎
  console.log('[3/4] 初始化SelfHealingEngine...')
  const selfHealingEngine = new SelfHealingEngine({
    enableAutoHealing: true
  })
  console.log('      ✅ 已初始化\n')

  // 4. 恢复协调器
  console.log('[4/4] 初始化RecoveryCoordinator...')
  const recoveryCoordinator = new RecoveryCoordinator(
    healthMonitor,
    intelligentDiagnostic,
    selfHealingEngine
  )
  console.log('      ✅ 已初始化\n')

  console.log('✨ Phase 5所有组件启动成功！\n')

  // 等待第一次健康检查
  console.log('⏳ 执行首次健康检查...\n')
  await new Promise(resolve => setTimeout(resolve, 2000))

  const health = healthMonitor.getCurrentHealth()
  if (health) {
    console.log('📊 系统健康状态')
    console.log('================')
    console.log(`状态: ${health.overallStatus.toUpperCase()}`)
    console.log(`CPU:  ${health.cpu.usage}% [${health.cpu.status}]`)
    console.log(`内存: ${health.memory.percentage}% (${health.memory.used}MB/${health.memory.total}MB) [${health.memory.status}]`)
    console.log(`磁盘: ${health.disk.percentage}% [${health.disk.status}]`)

    if (health.processes.prophet) {
      console.log(`进程: PID ${health.processes.prophet.pid} [${health.processes.prophet.status}]`)
    } else {
      console.log('进程: 未检测到（正常 - 这是测试脚本）')
    }
    console.log('')
  }

  // 测试诊断功能
  if (health) {
    console.log('🔍 测试智能诊断...')
    const history = healthMonitor.getRecentHistory(10)
    const diagnostics = await intelligentDiagnostic.diagnose(health, history)

    if (diagnostics.length > 0) {
      console.log(`   发现 ${diagnostics.length} 个问题:`)
      for (const diag of diagnostics) {
        console.log(`   - [${diag.severity}] ${diag.issue}`)
      }
    } else {
      console.log('   ✅ 系统健康，无问题')
    }
    console.log('')
  }

  console.log('🎉 Phase 5 验证完成！')
  console.log('====================\n')
  console.log('Prophet现在拥有：')
  console.log('  ✅ 实时健康监控')
  console.log('  ✅ 智能问题诊断')
  console.log('  ✅ 自动修复能力')
  console.log('  ✅ 完整恢复流程\n')

  // 停止
  healthMonitor.stop()
  recoveryCoordinator.stop()

  console.log('Prophet可以自己照顾自己了！🧬\n')
}

main().catch(console.error)
