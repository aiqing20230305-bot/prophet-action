/**
 * Recovery Coordinator - 恢复流程协调器
 * Phase 5: 完整的自愈流程编排
 *
 * 职责：
 * - 协调监控、诊断、修复三个组件
 * - 管理完整的恢复流程
 * - 验证修复效果
 * - 处理恢复失败情况
 */

import { EventEmitter } from 'events'
import { HealthMonitor, SystemHealth } from './health-monitor.js'
import { IntelligentDiagnostic, DiagnosticResult } from './intelligent-diagnostic.js'
import { SelfHealingEngine, HealingResult } from './self-healing-engine.js'

/**
 * 恢复会话
 */
export interface RecoverySession {
  sessionId: string
  startTime: Date
  endTime?: Date
  health: SystemHealth
  diagnostics: DiagnosticResult[]
  healings: HealingResult[]
  finalHealth?: SystemHealth
  success: boolean
  recoveryTime?: number
}

/**
 * 恢复协调器配置
 */
export interface RecoveryCoordinatorConfig {
  enableAutoRecovery: boolean
  recoveryTimeout: number          // 恢复超时（毫秒）
  verificationDelay: number        // 验证延迟（毫秒）
  maxRecoveryAttempts: number      // 最大恢复尝试次数
}

/**
 * 恢复协调器
 */
export class RecoveryCoordinator extends EventEmitter {
  private healthMonitor: HealthMonitor
  private diagnostic: IntelligentDiagnostic
  private healingEngine: SelfHealingEngine
  private config: RecoveryCoordinatorConfig
  private sessions: RecoverySession[] = []
  private isRecovering = false

  constructor(
    healthMonitor: HealthMonitor,
    diagnostic: IntelligentDiagnostic,
    healingEngine: SelfHealingEngine,
    config?: Partial<RecoveryCoordinatorConfig>
  ) {
    super()

    this.healthMonitor = healthMonitor
    this.diagnostic = diagnostic
    this.healingEngine = healingEngine

    this.config = {
      enableAutoRecovery: true,
      recoveryTimeout: 5 * 60 * 1000,   // 5分钟
      verificationDelay: 10 * 1000,     // 10秒
      maxRecoveryAttempts: 3,
      ...config
    }

    this.initialize()
  }

  /**
   * 初始化协调器
   */
  private initialize(): void {
    // 监听健康问题事件
    this.healthMonitor.on('health-issue', (health: SystemHealth) => {
      if (this.config.enableAutoRecovery) {
        this.handleHealthIssue(health).catch(err => {
          console.error('[RecoveryCoordinator] 恢复流程错误:', err)
        })
      }
    })

    // 转发诊断事件
    this.diagnostic.on('diagnostic-completed', (result: DiagnosticResult) => {
      this.emit('diagnostic-completed', result)
    })

    // 转发修复事件
    this.healingEngine.on('healing-action-executed', (result: HealingResult) => {
      this.emit('healing-action-executed', result)
    })

    console.log('[RecoveryCoordinator] ✅ 恢复协调器已初始化')
  }

  /**
   * 处理健康问题（主流程）
   */
  private async handleHealthIssue(health: SystemHealth): Promise<void> {
    if (this.isRecovering) {
      console.log('[RecoveryCoordinator] 已有恢复流程在进行中，跳过')
      return
    }

    // 创建恢复会话
    const session: RecoverySession = {
      sessionId: `recovery-${Date.now()}`,
      startTime: new Date(),
      health,
      diagnostics: [],
      healings: [],
      success: false
    }

    this.isRecovering = true

    try {
      console.log('')
      console.log('🚨 ====================================')
      console.log('🚨 Prophet 自愈流程启动')
      console.log('🚨 ====================================')
      console.log(`   会话ID: ${session.sessionId}`)
      console.log(`   系统状态: ${health.overallStatus}`)
      console.log('')

      this.emit('recovery-started', session)

      // === 步骤1: 智能诊断 ===
      console.log('🔍 [步骤1/3] 智能诊断中...')

      const history = this.healthMonitor.getRecentHistory(20)
      const diagnostics = await this.diagnostic.diagnose(health, history)

      session.diagnostics = diagnostics

      if (diagnostics.length === 0) {
        console.log('   ℹ️  未发现需要处理的问题')
        session.success = true
        session.endTime = new Date()
        session.recoveryTime = session.endTime.getTime() - session.startTime.getTime()
        this.sessions.push(session)
        this.emit('recovery-completed', session)
        return
      }

      console.log(`   ✅ 诊断完成，发现 ${diagnostics.length} 个问题:`)
      for (const diag of diagnostics) {
        console.log(`      - [${diag.severity}] ${diag.issue}`)
        console.log(`        根因: ${diag.rootCause}`)
      }
      console.log('')

      // === 步骤2: 自动修复 ===
      console.log('🔧 [步骤2/3] 自动修复中...')

      for (const diag of diagnostics) {
        console.log(`   处理: ${diag.issue}`)

        const healings = await this.healingEngine.heal(diag)
        session.healings.push(...healings)

        const successCount = healings.filter(h => h.success).length
        console.log(`   ✅ 执行了 ${healings.length} 个修复动作，成功 ${successCount} 个`)
      }
      console.log('')

      // === 步骤3: 验证恢复 ===
      console.log('✓ [步骤3/3] 验证恢复效果...')
      console.log(`   等待 ${this.config.verificationDelay / 1000} 秒让系统稳定...`)

      await this.sleep(this.config.verificationDelay)

      // 重新检查健康状态
      const finalHealth = this.healthMonitor.getCurrentHealth()

      session.finalHealth = finalHealth || undefined
      session.endTime = new Date()
      session.recoveryTime = session.endTime.getTime() - session.startTime.getTime()

      // 判断恢复是否成功
      if (finalHealth) {
        const isRecovered =
          finalHealth.overallStatus === 'healthy' ||
          (finalHealth.overallStatus === 'warning' && health.overallStatus === 'critical')

        session.success = isRecovered

        if (isRecovered) {
          console.log('   ✅ 系统已恢复健康')
          console.log(`   最终状态: ${finalHealth.overallStatus}`)
          console.log(`   恢复时间: ${(session.recoveryTime / 1000).toFixed(1)}秒`)
          console.log('')
          console.log('🎉 ====================================')
          console.log('🎉 自愈流程成功完成！')
          console.log('🎉 ====================================')
          console.log('')

          this.emit('recovery-success', session)
        } else {
          console.log('   ⚠️  系统仍有问题')
          console.log(`   最终状态: ${finalHealth.overallStatus}`)
          console.log('')
          console.log('❌ ====================================')
          console.log('❌ 自愈流程未完全成功')
          console.log('❌ ====================================')
          console.log('')

          this.emit('recovery-partial', session)
        }
      } else {
        session.success = false
        console.log('   ❌ 无法获取最终健康状态')
        console.log('')

        this.emit('recovery-failed', session)
      }

      // 保存会话
      this.sessions.push(session)
      this.emit('recovery-completed', session)

    } catch (error: any) {
      console.error('[RecoveryCoordinator] 恢复流程异常:', error.message)
      session.success = false
      session.endTime = new Date()
      this.sessions.push(session)
      this.emit('recovery-failed', session)
    } finally {
      this.isRecovering = false
    }
  }

  /**
   * 手动触发恢复流程
   */
  async triggerRecovery(): Promise<RecoverySession | null> {
    const currentHealth = this.healthMonitor.getCurrentHealth()

    if (!currentHealth) {
      console.log('[RecoveryCoordinator] 无法获取当前健康状态')
      return null
    }

    if (currentHealth.overallStatus === 'healthy') {
      console.log('[RecoveryCoordinator] 系统当前健康，无需恢复')
      return null
    }

    await this.handleHealthIssue(currentHealth)

    // 返回最新的会话
    return this.sessions[this.sessions.length - 1] || null
  }

  /**
   * 获取恢复历史
   */
  getHistory(count: number = 10): RecoverySession[] {
    return this.sessions.slice(-count)
  }

  /**
   * 获取统计信息
   */
  getStats() {
    const successCount = this.sessions.filter(s => s.success).length
    const totalRecoveryTime = this.sessions
      .filter(s => s.recoveryTime)
      .reduce((sum, s) => sum + (s.recoveryTime || 0), 0)

    const avgRecoveryTime = this.sessions.length > 0
      ? totalRecoveryTime / this.sessions.length
      : 0

    return {
      totalSessions: this.sessions.length,
      successCount,
      failureCount: this.sessions.length - successCount,
      successRate: this.sessions.length > 0
        ? (successCount / this.sessions.length) * 100
        : 0,
      avgRecoveryTime: Math.round(avgRecoveryTime / 1000), // 秒
      isRecovering: this.isRecovering,
      autoRecoveryEnabled: this.config.enableAutoRecovery
    }
  }

  /**
   * 启用/禁用自动恢复
   */
  setAutoRecovery(enabled: boolean): void {
    this.config.enableAutoRecovery = enabled
    console.log(`[RecoveryCoordinator] 自动恢复已${enabled ? '启用' : '禁用'}`)
  }

  /**
   * 清除历史
   */
  clearHistory(): void {
    this.sessions = []
  }

  /**
   * 睡眠
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 停止协调器
   */
  stop(): void {
    this.removeAllListeners()
    console.log('[RecoveryCoordinator] 恢复协调器已停止')
  }
}
