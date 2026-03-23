/**
 * Maintenance Scheduler - 维护任务调度器
 * Phase 6 Day 3: 预防性维护
 *
 * 职责：
 * - 智能调度预防措施
 * - 选择最佳执行时间
 * - 自动执行预防措施
 * - 验证执行效果
 */

import { EventEmitter } from 'events'
import { PreventiveAction, PreventivePlan } from './preventive-action-planner.js'
import { SelfHealingEngine, HealingResult } from './self-healing-engine.js'
import { SystemHealth } from './health-monitor.js'

/**
 * 维护任务
 */
export interface MaintenanceTask {
  id: string
  action: PreventiveAction
  scheduledTime: Date
  status: 'scheduled' | 'running' | 'completed' | 'failed' | 'cancelled'
  result?: MaintenanceResult
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
}

/**
 * 维护结果
 */
export interface MaintenanceResult {
  taskId: string
  success: boolean
  executionTime: number              // 实际执行时间（毫秒）
  actualImpact?: number              // 实际效果
  beforeHealth?: SystemHealth        // 执行前健康状态
  afterHealth?: SystemHealth         // 执行后健康状态
  healingResults: HealingResult[]    // 修复结果
  message: string
  timestamp: Date
}

/**
 * 执行窗口
 */
export interface ExecutionWindow {
  start: Date
  end: Date
  reason: string
  loadScore: number                  // 负载分数（越低越好）
}

/**
 * 调度器配置
 */
export interface MaintenanceSchedulerConfig {
  enableAutoExecution: boolean       // 是否自动执行
  maxConcurrentTasks: number         // 最大并发任务数
  minTimeBetweenTasks: number        // 任务间最小间隔（毫秒）
  executionRetryLimit: number        // 执行失败重试次数
  loadThreshold: number              // 负载阈值（执行时系统负载应低于此值）
}

/**
 * 维护任务调度器
 */
export class MaintenanceScheduler extends EventEmitter {
  private config: MaintenanceSchedulerConfig
  private tasks: Map<string, MaintenanceTask> = new Map()
  private runningTasks: Set<string> = new Set()
  private healingEngine: SelfHealingEngine
  private schedulerInterval?: NodeJS.Timeout

  constructor(
    healingEngine: SelfHealingEngine,
    config?: Partial<MaintenanceSchedulerConfig>
  ) {
    super()

    this.healingEngine = healingEngine

    this.config = {
      enableAutoExecution: true,
      maxConcurrentTasks: 1,
      minTimeBetweenTasks: 5 * 60 * 1000, // 5分钟
      executionRetryLimit: 3,
      loadThreshold: 60, // CPU < 60%
      ...config
    }
  }

  /**
   * 启动调度器
   */
  start(): void {
    if (this.schedulerInterval) {
      return
    }

    console.log('[MaintenanceScheduler] 🕐 启动维护任务调度器')

    // 每分钟检查一次待执行任务
    this.schedulerInterval = setInterval(() => {
      this.checkAndExecuteTasks().catch(err => {
        console.error('[MaintenanceScheduler] 任务检查失败:', err)
      })
    }, 60 * 1000)

    console.log('[MaintenanceScheduler] ✅ 调度器已启动')
  }

  /**
   * 停止调度器
   */
  stop(): void {
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval)
      this.schedulerInterval = undefined
      console.log('[MaintenanceScheduler] ⏹️  调度器已停止')
    }
  }

  /**
   * 调度单个任务
   */
  scheduleTask(action: PreventiveAction, scheduledTime?: Date): MaintenanceTask {
    const task: MaintenanceTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      action,
      scheduledTime: scheduledTime || action.bestExecutionTime || new Date(Date.now() + 60 * 60 * 1000),
      status: 'scheduled',
      createdAt: new Date()
    }

    this.tasks.set(task.id, task)

    this.emit('task-scheduled', task)
    console.log(`[MaintenanceScheduler] 📅 任务已调度: ${task.action.description} (${task.scheduledTime.toLocaleString()})`)

    return task
  }

  /**
   * 调度计划中的所有任务
   */
  schedulePlan(plan: PreventivePlan): MaintenanceTask[] {
    const tasks: MaintenanceTask[] = []

    for (const action of plan.actions) {
      const task = this.scheduleTask(action, plan.executionWindow.start)
      tasks.push(task)
    }

    console.log(`[MaintenanceScheduler] 📋 计划已调度: ${tasks.length} 个任务`)

    return tasks
  }

  /**
   * 查找最佳执行时间
   */
  findBestExecutionTime(
    action: PreventiveAction,
    historyPattern?: { peakHours: number[], lowHours: number[] }
  ): ExecutionWindow {
    const now = new Date()
    const currentHour = now.getHours()

    // 如果有历史模式，使用低谷时段
    if (historyPattern && historyPattern.lowHours.length > 0) {
      const nextLowHour = this.findNextLowHour(currentHour, historyPattern.lowHours)
      const start = new Date(now)
      start.setHours(nextLowHour, 0, 0, 0)

      if (start <= now) {
        start.setDate(start.getDate() + 1)
      }

      return {
        start,
        end: new Date(start.getTime() + 2 * 60 * 60 * 1000), // 2小时窗口
        reason: '历史低负载时段',
        loadScore: 0.2
      }
    }

    // 默认策略：凌晨2-4点（通常是低负载时段）
    const start = new Date(now)
    start.setHours(2, 0, 0, 0)

    if (start <= now) {
      start.setDate(start.getDate() + 1)
    }

    // 如果是紧急任务，立即执行
    if (action.urgency === 'critical') {
      return {
        start: new Date(now.getTime() + 5 * 60 * 1000), // 5分钟后
        end: new Date(now.getTime() + 30 * 60 * 1000),
        reason: '紧急任务，立即执行',
        loadScore: 1.0
      }
    }

    return {
      start,
      end: new Date(start.getTime() + 2 * 60 * 60 * 1000),
      reason: '默认低负载时段（凌晨2-4点）',
      loadScore: 0.3
    }
  }

  /**
   * 找到下一个低负载时段
   */
  private findNextLowHour(currentHour: number, lowHours: number[]): number {
    // 找到当前小时之后最近的低负载时段
    for (const hour of lowHours.sort((a, b) => a - b)) {
      if (hour > currentHour) {
        return hour
      }
    }

    // 如果没有，返回第一个低负载时段（明天）
    return lowHours[0]
  }

  /**
   * 检查并执行待执行任务
   */
  private async checkAndExecuteTasks(): Promise<void> {
    if (!this.config.enableAutoExecution) {
      return
    }

    const now = new Date()

    // 找到所有应该执行的任务
    const tasksToExecute: MaintenanceTask[] = []

    for (const task of this.tasks.values()) {
      if (
        task.status === 'scheduled' &&
        task.scheduledTime <= now &&
        !this.runningTasks.has(task.id)
      ) {
        tasksToExecute.push(task)
      }
    }

    if (tasksToExecute.length === 0) {
      return
    }

    console.log(`[MaintenanceScheduler] 🔄 发现 ${tasksToExecute.length} 个待执行任务`)

    // 按优先级排序
    tasksToExecute.sort((a, b) => b.action.priority - a.action.priority)

    // 执行任务（受并发限制）
    for (const task of tasksToExecute) {
      if (this.runningTasks.size >= this.config.maxConcurrentTasks) {
        console.log('[MaintenanceScheduler] ⏸️  达到并发限制，暂停执行')
        break
      }

      await this.executeTask(task)

      // 任务间间隔
      await this.sleep(this.config.minTimeBetweenTasks)
    }
  }

  /**
   * 执行单个任务
   */
  async executeTask(task: MaintenanceTask): Promise<MaintenanceResult> {
    console.log(`[MaintenanceScheduler] 🚀 开始执行任务: ${task.action.description}`)

    task.status = 'running'
    task.startedAt = new Date()
    this.runningTasks.add(task.id)

    this.emit('task-started', task)

    const startTime = Date.now()

    try {
      // 将PreventiveAction转换为DiagnosticResult格式（用于SelfHealingEngine）
      const mockDiagnostic = {
        issue: task.action.reason,
        severity: task.action.urgency,
        rootCause: task.action.reason,
        relatedMetrics: [],
        recommendations: [{
          action: task.action.type as any,
          description: task.action.description,
          priority: 1,
          automated: task.action.automated
        }],
        expectedOutcome: `预期降低${task.action.estimatedImpact}%`,
        timestamp: new Date(),
        diagnosticId: `diag-${task.id}`
      }

      // 执行修复动作
      const healingResults = await this.healingEngine.heal(mockDiagnostic)

      const executionTime = Date.now() - startTime
      const success = healingResults.some(r => r.success)

      const result: MaintenanceResult = {
        taskId: task.id,
        success,
        executionTime,
        healingResults,
        message: success
          ? `任务执行成功，耗时${(executionTime / 1000).toFixed(1)}秒`
          : '任务执行失败',
        timestamp: new Date()
      }

      task.result = result
      task.status = success ? 'completed' : 'failed'
      task.completedAt = new Date()

      this.emit('task-completed', { task, result })
      console.log(`[MaintenanceScheduler] ✅ 任务完成: ${task.action.description}`)

      return result

    } catch (error: any) {
      const executionTime = Date.now() - startTime

      const result: MaintenanceResult = {
        taskId: task.id,
        success: false,
        executionTime,
        healingResults: [],
        message: `执行失败: ${error.message}`,
        timestamp: new Date()
      }

      task.result = result
      task.status = 'failed'
      task.completedAt = new Date()

      this.emit('task-failed', { task, error: error.message })
      console.error(`[MaintenanceScheduler] ❌ 任务失败: ${task.action.description}`, error.message)

      return result

    } finally {
      this.runningTasks.delete(task.id)
    }
  }

  /**
   * 取消任务
   */
  cancelTask(taskId: string): boolean {
    const task = this.tasks.get(taskId)

    if (!task) {
      return false
    }

    if (task.status === 'running') {
      console.log(`[MaintenanceScheduler] ⚠️  任务正在执行，无法取消: ${taskId}`)
      return false
    }

    if (task.status !== 'scheduled') {
      console.log(`[MaintenanceScheduler] ⚠️  任务状态不允许取消: ${task.status}`)
      return false
    }

    task.status = 'cancelled'
    this.emit('task-cancelled', task)
    console.log(`[MaintenanceScheduler] 🚫 任务已取消: ${task.action.description}`)

    return true
  }

  /**
   * 获取任务状态
   */
  getTask(taskId: string): MaintenanceTask | undefined {
    return this.tasks.get(taskId)
  }

  /**
   * 获取所有任务
   */
  getAllTasks(): MaintenanceTask[] {
    return Array.from(this.tasks.values())
  }

  /**
   * 获取待执行任务
   */
  getPendingTasks(): MaintenanceTask[] {
    return Array.from(this.tasks.values())
      .filter(t => t.status === 'scheduled')
      .sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime())
  }

  /**
   * 获取运行中任务
   */
  getRunningTasks(): MaintenanceTask[] {
    return Array.from(this.tasks.values()).filter(t => t.status === 'running')
  }

  /**
   * 获取已完成任务
   */
  getCompletedTasks(): MaintenanceTask[] {
    return Array.from(this.tasks.values())
      .filter(t => t.status === 'completed' || t.status === 'failed')
      .sort((a, b) => (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0))
  }

  /**
   * 清理已完成任务
   */
  cleanupCompletedTasks(olderThanHours: number = 24): number {
    const cutoffTime = Date.now() - olderThanHours * 60 * 60 * 1000
    let cleaned = 0

    for (const [id, task] of this.tasks.entries()) {
      if (
        (task.status === 'completed' || task.status === 'failed' || task.status === 'cancelled') &&
        task.completedAt &&
        task.completedAt.getTime() < cutoffTime
      ) {
        this.tasks.delete(id)
        cleaned++
      }
    }

    if (cleaned > 0) {
      console.log(`[MaintenanceScheduler] 🧹 清理了 ${cleaned} 个旧任务`)
    }

    return cleaned
  }

  /**
   * 获取统计信息
   */
  getStats() {
    const allTasks = Array.from(this.tasks.values())

    return {
      totalTasks: allTasks.length,
      scheduledTasks: allTasks.filter(t => t.status === 'scheduled').length,
      runningTasks: this.runningTasks.size,
      completedTasks: allTasks.filter(t => t.status === 'completed').length,
      failedTasks: allTasks.filter(t => t.status === 'failed').length,
      cancelledTasks: allTasks.filter(t => t.status === 'cancelled').length,
      successRate: this.calculateSuccessRate(allTasks),
      averageExecutionTime: this.calculateAverageExecutionTime(allTasks),
      autoExecutionEnabled: this.config.enableAutoExecution
    }
  }

  /**
   * 计算成功率
   */
  private calculateSuccessRate(tasks: MaintenanceTask[]): number {
    const completed = tasks.filter(t => t.status === 'completed' || t.status === 'failed')
    if (completed.length === 0) return 0

    const successful = completed.filter(t => t.status === 'completed')
    return (successful.length / completed.length) * 100
  }

  /**
   * 计算平均执行时间
   */
  private calculateAverageExecutionTime(tasks: MaintenanceTask[]): number {
    const completed = tasks.filter(t => t.result)
    if (completed.length === 0) return 0

    const totalTime = completed.reduce((sum, t) => sum + (t.result?.executionTime || 0), 0)
    return Math.round(totalTime / completed.length)
  }

  /**
   * 启用/禁用自动执行
   */
  setAutoExecution(enabled: boolean): void {
    this.config.enableAutoExecution = enabled
    console.log(`[MaintenanceScheduler] 自动执行已${enabled ? '启用' : '禁用'}`)
  }

  /**
   * 睡眠
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
