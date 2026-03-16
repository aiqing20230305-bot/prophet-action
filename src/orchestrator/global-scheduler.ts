/**
 * Prophet Global Scheduler
 * 全局任务调度器 - 智能调度多项目任务，避免资源竞争
 *
 * @module orchestrator/global-scheduler
 * @prophet-component scheduling
 */

import { ScheduledTask } from '../types/orchestrator'
import { EventEmitter } from 'events'

/**
 * 优先级队列（惰性排序优化版本）
 */
class PriorityQueue<T> {
  private items: Array<{ item: T; priority: number }> = []
  private needsSort = false

  enqueue(item: T, priority: number): void {
    this.items.push({ item, priority })
    this.needsSort = true  // 标记需要排序，但延迟到真正需要时
  }

  dequeue(): T | undefined {
    if (this.needsSort) {
      this.items.sort((a, b) => b.priority - a.priority)
      this.needsSort = false
    }
    return this.items.shift()?.item
  }

  getReadyTasks(now: number): T[] {
    if (this.needsSort) {
      this.items.sort((a, b) => b.priority - a.priority)
      this.needsSort = false
    }
    return this.items
      .filter(({ item }) => (item as any).nextRun <= now && (item as any).status === 'pending')
      .map(({ item }) => item)
      .slice(0, 10)  // 限制每次最多返回 10 个任务
  }

  getAll(): T[] {
    return this.items.map(({ item }) => item)
  }

  remove(predicate: (item: T) => boolean): void {
    this.items = this.items.filter(({ item }) => !predicate(item))
  }

  size(): number {
    return this.items.length
  }

  clear(): void {
    this.items = []
    this.needsSort = false
  }
}

/**
 * 全局调度器配置
 */
export interface GlobalSchedulerConfig {
  /** 最大并发任务数 */
  concurrencyLimit?: number
  /** 检查间隔（毫秒） */
  checkInterval?: number
  /** 启用时间错开 */
  enableStaggering?: boolean
  /** 最大队列大小 */
  maxQueueSize?: number
}

/**
 * 全局调度器
 * 负责智能调度所有项目的任务，避免资源竞争
 */
export class GlobalScheduler extends EventEmitter {
  private queue: PriorityQueue<ScheduledTask>
  private concurrencyLimit: number
  private checkInterval: number
  private enableStaggering: boolean
  private maxQueueSize: number
  private activeTaskCount = 0
  private isRunning = false
  private checkTimer?: NodeJS.Timeout
  private taskRegistry: Map<string, ScheduledTask> = new Map()

  constructor(config: GlobalSchedulerConfig = {}) {
    super()
    this.queue = new PriorityQueue()
    this.concurrencyLimit = config.concurrencyLimit ?? 3
    this.checkInterval = config.checkInterval ?? 1000
    this.enableStaggering = config.enableStaggering ?? true
    this.maxQueueSize = config.maxQueueSize ?? 1000  // 默认最多 1000 个任务
  }

  /**
   * 调度一个任务
   */
  async schedule(task: ScheduledTask): Promise<void> {
    // 检查是否已存在相同任务（去重）
    const existingTask = this.taskRegistry.get(task.id)
    if (existingTask && existingTask.status === 'pending') {
      // console.log(`任务 ${task.id} 已存在，跳过重复调度`)
      return
    }

    // 检查队列大小限制
    if (this.queue.size() >= this.maxQueueSize) {
      console.warn(`⚠️  队列已满 (${this.maxQueueSize})，跳过任务: ${task.type} (${task.projectId})`)
      this.emit('queue-full', task)
      return
    }

    // 计算执行时间（错开策略）
    if (this.enableStaggering && !task.nextRun) {
      const offset = this.calculateTimeOffset(task.projectId, task.type)
      task.nextRun = Date.now() + offset
    }

    // 如果没有设置 nextRun，使用当前时间
    if (!task.nextRun) {
      task.nextRun = Date.now()
    }

    // 设置初始状态
    task.status = task.status || 'pending'

    // 计算优先级分数
    const priorityScore = this.calculatePriorityScore(task)

    // 加入队列
    this.queue.enqueue(task, priorityScore)
    this.taskRegistry.set(task.id, task)

    this.emit('task-scheduled', task)
  }

  /**
   * 取消任务
   */
  cancelTask(taskId: string): boolean {
    const task = this.taskRegistry.get(taskId)
    if (!task) {
      return false
    }

    this.queue.remove((t) => t.id === taskId)
    this.taskRegistry.delete(taskId)
    this.emit('task-cancelled', task)

    return true
  }

  /**
   * 启动调度器
   */
  start(): void {
    if (this.isRunning) {
      return
    }

    this.isRunning = true
    this.execute()
    this.emit('started')
  }

  /**
   * 停止调度器
   */
  stop(): void {
    this.isRunning = false
    if (this.checkTimer) {
      clearTimeout(this.checkTimer)
      this.checkTimer = undefined
    }
    this.emit('stopped')
  }

  /**
   * 执行调度循环
   */
  private async execute(): Promise<void> {
    while (this.isRunning) {
      const now = Date.now()
      const readyTasks = this.queue.getReadyTasks(now)

      for (const task of readyTasks) {
        if (this.activeTaskCount < this.concurrencyLimit) {
          await this.executeTask(task)
        } else {
          break // 达到并发限制，等待下一轮
        }
      }

      // 等待下一次检查
      await this.sleep(this.checkInterval)
    }
  }

  /**
   * 执行单个任务
   */
  private async executeTask(task: ScheduledTask): Promise<void> {
    this.activeTaskCount++
    task.status = 'running'
    task.lastRun = Date.now()

    this.emit('task-started', task)

    try {
      // 发送任务执行事件，由外部监听器处理实际执行
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Task execution timeout'))
        }, 5 * 60 * 1000) // 5分钟超时

        this.emit('task-execute', task, (error?: Error) => {
          clearTimeout(timeout)
          if (error) {
            reject(error)
          } else {
            resolve()
          }
        })
      })

      task.status = 'completed'
      this.emit('task-completed', task)

      // 重新调度（如果是周期性任务）
      if (task.interval > 0) {
        task.nextRun = Date.now() + task.interval
        task.status = 'pending'
        await this.schedule(task)
      } else {
        // 一次性任务，从队列移除
        this.queue.remove((t) => t.id === task.id)
        this.taskRegistry.delete(task.id)
      }
    } catch (error) {
      task.status = 'failed'
      this.emit('task-failed', task, error)

      // 失败的任务也重新调度（带延迟）
      if (task.interval > 0) {
        task.nextRun = Date.now() + task.interval * 2 // 失败后加倍间隔
        task.status = 'pending'
        await this.schedule(task)
      }
    } finally {
      this.activeTaskCount--
    }
  }

  /**
   * 计算时间偏移（时间错开策略）
   * 基于项目 ID 和任务类型的哈希，确保时间分散
   */
  private calculateTimeOffset(projectId: string, taskType: string): number {
    const hash = this.simpleHash(`${projectId}:${taskType}`)
    const baseInterval = this.getBaseInterval(taskType)

    // 错开时间：hash % baseInterval
    // 这样可以保证同类型的任务在不同项目间分散执行
    return (hash % baseInterval) * 1000
  }

  /**
   * 简单哈希函数
   */
  private simpleHash(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash)
  }

  /**
   * 获取任务类型的基础间隔
   */
  private getBaseInterval(taskType: string): number {
    const intervals: Record<string, number> = {
      heart: 300, // 5分钟
      developer: 1800, // 30分钟
      analyzer: 7200, // 2小时
      consolidator: 3600, // 1小时
    }

    return intervals[taskType] || 600 // 默认10分钟
  }

  /**
   * 计算任务优先级分数
   */
  private calculatePriorityScore(task: ScheduledTask): number {
    let score = task.priority || 0

    // 任务类型权重
    const typeWeights: Record<string, number> = {
      heart: 10, // 心跳最高优先级
      developer: 5,
      analyzer: 3,
      consolidator: 2,
    }

    score += typeWeights[task.type] || 1

    // 延迟任务提高优先级
    if (task.nextRun < Date.now()) {
      const delayMinutes = (Date.now() - task.nextRun) / 60000
      score += Math.min(delayMinutes, 10) // 最多加10分
    }

    return score
  }

  /**
   * 获取调度器状态
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      activeTaskCount: this.activeTaskCount,
      queuedTaskCount: this.queue.size(),
      concurrencyLimit: this.concurrencyLimit,
      maxQueueSize: this.maxQueueSize,
    }
  }

  /**
   * 清空任务队列（用于性能优化或重置）
   */
  clearQueue(): void {
    const queueSize = this.queue.size()
    this.queue.clear()
    this.taskRegistry.clear()
    console.log(`✅ 队列已清空，移除了 ${queueSize} 个任务`)
    this.emit('queue-cleared', queueSize)
  }

  /**
   * 获取所有调度的任务
   */
  getScheduledTasks(): ScheduledTask[] {
    return this.queue.getAll()
  }

  /**
   * 获取特定项目的任务
   */
  getProjectTasks(projectId: string): ScheduledTask[] {
    return this.queue.getAll().filter((task) => task.projectId === projectId)
  }

  /**
   * Sleep 工具函数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
      this.checkTimer = setTimeout(resolve, ms)
    })
  }
}
