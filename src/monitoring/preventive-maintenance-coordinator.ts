/**
 * Preventive Maintenance Coordinator - 预防性维护协调器
 * Phase 6 Day 4: 完整预防流程集成
 *
 * 职责：
 * - 协调所有Phase 6组件
 * - 管理完整的预防流程
 * - 自动化预防性维护
 */

import { EventEmitter } from 'events'
import { HealthMonitor, SystemHealth } from './health-monitor.js'
import { HealthTrendAnalyzer, HealthTrend } from './health-trend-analyzer.js'
import { PreventiveActionPlanner, PreventiveAction, PreventivePlan } from './preventive-action-planner.js'
import { MaintenanceScheduler, MaintenanceTask } from './maintenance-scheduler.js'
import { SelfHealingEngine } from './self-healing-engine.js'

/**
 * 预防会话
 */
export interface PreventionSession {
  sessionId: string
  startTime: Date
  endTime?: Date
  trends: HealthTrend[]
  actions: PreventiveAction[]
  plan?: PreventivePlan
  tasks: MaintenanceTask[]
  success: boolean
  preventedIssues: number
}

/**
 * 协调器配置
 */
export interface PreventiveMaintenanceCoordinatorConfig {
  enableAutoPreventive: boolean       // 是否启用自动预防
  checkInterval: number               // 检查间隔（毫秒）
  minTrendHistorySize: number         // 最少历史样本数
  minCriticalityForAction: string     // 最低严重度才触发预防
}

/**
 * 预防性维护协调器
 */
export class PreventiveMaintenanceCoordinator extends EventEmitter {
  private healthMonitor: HealthMonitor
  private trendAnalyzer: HealthTrendAnalyzer
  private actionPlanner: PreventiveActionPlanner
  private scheduler: MaintenanceScheduler
  private config: PreventiveMaintenanceCoordinatorConfig
  private sessions: PreventionSession[] = []
  private checkInterval?: NodeJS.Timeout
  private isRunning = false

  constructor(
    healthMonitor: HealthMonitor,
    trendAnalyzer: HealthTrendAnalyzer,
    actionPlanner: PreventiveActionPlanner,
    scheduler: MaintenanceScheduler,
    config?: Partial<PreventiveMaintenanceCoordinatorConfig>
  ) {
    super()

    this.healthMonitor = healthMonitor
    this.trendAnalyzer = trendAnalyzer
    this.actionPlanner = actionPlanner
    this.scheduler = scheduler

    this.config = {
      enableAutoPreventive: true,
      checkInterval: 60 * 60 * 1000, // 每小时检查一次
      minTrendHistorySize: 20,
      minCriticalityForAction: 'medium',
      ...config
    }

    this.initialize()
  }

  /**
   * 初始化协调器
   */
  private initialize(): void {
    // 监听关键趋势
    this.trendAnalyzer.on('critical-trend', (trend: HealthTrend) => {
      console.log(`[PreventiveMaintenance] 🚨 检测到关键趋势: ${trend.metric} - ${trend.severity}`)
      this.emit('critical-trend-detected', trend)
    })

    // 监听任务完成
    this.scheduler.on('task-completed', ({ task, result }) => {
      console.log(`[PreventiveMaintenance] ✅ 预防任务完成: ${task.action.description}`)
      this.emit('prevention-executed', { task, result })
    })

    console.log('[PreventiveMaintenance] ✅ 预防性维护协调器已初始化')
  }

  /**
   * 启动协调器
   */
  start(): void {
    if (this.isRunning) {
      return
    }

    console.log('[PreventiveMaintenance] 🚀 启动预防性维护协调器')

    this.isRunning = true

    // 启动调度器
    this.scheduler.start()

    // 定期执行预防检查
    if (this.config.enableAutoPreventive) {
      this.checkInterval = setInterval(() => {
        this.performPreventiveCheck().catch(err => {
          console.error('[PreventiveMaintenance] 预防检查失败:', err)
        })
      }, this.config.checkInterval)

      // 立即执行一次
      setTimeout(() => {
        this.performPreventiveCheck().catch(err => {
          console.error('[PreventiveMaintenance] 初始预防检查失败:', err)
        })
      }, 5000)
    }

    console.log('[PreventiveMaintenance] ✅ 协调器已启动')
  }

  /**
   * 停止协调器
   */
  stop(): void {
    if (!this.isRunning) {
      return
    }

    console.log('[PreventiveMaintenance] ⏹️  停止预防性维护协调器')

    this.isRunning = false

    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = undefined
    }

    this.scheduler.stop()
  }

  /**
   * 执行预防检查（主流程）
   */
  private async performPreventiveCheck(): Promise<void> {
    console.log('\n🛡️  ========================================')
    console.log('🛡️  预防性维护检查')
    console.log('🛡️  ========================================')

    const session: PreventionSession = {
      sessionId: `prevention-${Date.now()}`,
      startTime: new Date(),
      trends: [],
      actions: [],
      tasks: [],
      success: false,
      preventedIssues: 0
    }

    try {
      this.emit('prevention-check-started', session)

      // 1. 获取历史数据
      console.log('\n📊 [步骤1/5] 获取健康历史...')
      const history = this.healthMonitor.getRecentHistory(50)

      if (history.length < this.config.minTrendHistorySize) {
        console.log(`   ℹ️  历史数据不足（${history.length}/${this.config.minTrendHistorySize}），跳过预防检查`)
        return
      }

      console.log(`   ✅ 已获取 ${history.length} 个历史样本`)

      // 2. 分析趋势
      console.log('\n🔍 [步骤2/5] 分析健康趋势...')
      const trends = this.trendAnalyzer.analyzeTrends(history)
      session.trends = trends

      if (trends.length === 0) {
        console.log('   ✅ 未发现显著趋势，系统健康')
        session.success = true
        this.sessions.push(session)
        return
      }

      console.log(`   ✅ 发现 ${trends.length} 个趋势:`)
      for (const trend of trends) {
        console.log(`      - ${trend.metric}: ${trend.direction} [${trend.severity}]`)
      }

      // 过滤需要预防的趋势
      const criticalTrends = trends.filter(t =>
        t.severity === 'critical' ||
        t.severity === 'high' ||
        (t.severity === 'medium' && this.config.minCriticalityForAction === 'medium')
      )

      if (criticalTrends.length === 0) {
        console.log('   ℹ️  无需预防的趋势')
        session.success = true
        this.sessions.push(session)
        return
      }

      // 3. 规划预防措施
      console.log('\n🛡️  [步骤3/5] 规划预防措施...')
      const currentHealth = this.healthMonitor.getCurrentHealth()
      const actions = this.actionPlanner.planActions(criticalTrends, currentHealth || undefined)
      session.actions = actions

      if (actions.length === 0) {
        console.log('   ℹ️  无需预防措施')
        session.success = true
        this.sessions.push(session)
        return
      }

      console.log(`   ✅ 生成 ${actions.length} 个预防措施:`)
      for (const action of actions.slice(0, 3)) {
        console.log(`      - ${action.description} [${action.urgency}]`)
      }

      // 4. 创建预防计划
      console.log('\n📋 [步骤4/5] 创建预防计划...')
      const plan = this.actionPlanner.createPlan(actions)
      session.plan = plan

      console.log(`   ✅ 计划已创建: ${plan.actions.length} 个措施`)
      console.log(`   执行窗口: ${plan.executionWindow.start.toLocaleString()}`)

      // 5. 调度任务
      console.log('\n🕐 [步骤5/5] 调度预防任务...')
      const tasks = this.scheduler.schedulePlan(plan)
      session.tasks = tasks
      session.preventedIssues = criticalTrends.length

      console.log(`   ✅ 已调度 ${tasks.length} 个任务`)

      session.success = true
      session.endTime = new Date()

      console.log('\n✨ ========================================')
      console.log('✨ 预防检查完成')
      console.log('✨ ========================================')
      console.log(`   预防趋势: ${session.preventedIssues} 个`)
      console.log(`   预防措施: ${session.actions.length} 个`)
      console.log(`   调度任务: ${session.tasks.length} 个`)
      console.log('')

      this.emit('prevention-check-completed', session)

    } catch (error: any) {
      console.error('[PreventiveMaintenance] 预防检查错误:', error.message)
      session.success = false
      session.endTime = new Date()
      this.emit('prevention-check-failed', { session, error: error.message })
    } finally {
      this.sessions.push(session)
    }
  }

  /**
   * 手动触发预防检查
   */
  async triggerPreventiveCheck(): Promise<PreventionSession> {
    await this.performPreventiveCheck()
    return this.sessions[this.sessions.length - 1]
  }

  /**
   * 获取预防历史
   */
  getHistory(count: number = 10): PreventionSession[] {
    return this.sessions.slice(-count)
  }

  /**
   * 获取统计信息
   */
  getStats() {
    const schedulerStats = this.scheduler.getStats()

    return {
      totalSessions: this.sessions.length,
      successfulSessions: this.sessions.filter(s => s.success).length,
      totalPreventedIssues: this.sessions.reduce((sum, s) => sum + s.preventedIssues, 0),
      totalActions: this.sessions.reduce((sum, s) => sum + s.actions.length, 0),
      totalTasks: this.sessions.reduce((sum, s) => sum + s.tasks.length, 0),
      schedulerStats,
      isRunning: this.isRunning,
      autoPreventiveEnabled: this.config.enableAutoPreventive
    }
  }

  /**
   * 启用/禁用自动预防
   */
  setAutoPreventive(enabled: boolean): void {
    this.config.enableAutoPreventive = enabled
    console.log(`[PreventiveMaintenance] 自动预防已${enabled ? '启用' : '禁用'}`)
  }

  /**
   * 清除历史
   */
  clearHistory(): void {
    this.sessions = []
  }
}
