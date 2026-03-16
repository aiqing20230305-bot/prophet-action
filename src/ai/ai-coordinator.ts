/**
 * AI Coordinator
 *
 * 统一协调所有 AI 功能
 */

import { ClaudeEngine, getGlobalClaudeEngine } from './claude-engine.js'
import { AutoDeveloper, TodoItem } from './auto-developer.js'
import { AutoReviewer } from './auto-reviewer.js'
import { EventEmitter } from 'events'

export interface AICoordinatorConfig {
  autoApprove?: boolean
  maxConcurrentTasks?: number
  tokenBudget?: number  // 每日 token 预算
}

export class AICoordinator extends EventEmitter {
  private engine: ClaudeEngine
  private developer: AutoDeveloper
  private reviewer: AutoReviewer
  private config: AICoordinatorConfig

  private dailyTokensUsed = 0
  private isRunning = false

  constructor(config: AICoordinatorConfig = {}) {
    super()
    this.config = {
      autoApprove: false,
      maxConcurrentTasks: 3,
      tokenBudget: 1_000_000,  // 默认 100万 tokens/天
      ...config
    }

    this.engine = getGlobalClaudeEngine()
    this.developer = new AutoDeveloper(this.engine)
    this.reviewer = new AutoReviewer(this.engine)

    // 设置自动审批
    this.developer.setAutoApprove(this.config.autoApprove!)

    // 监听事件
    this.setupEventListeners()
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 监听 API 调用
    this.engine.on('api-call', (data) => {
      this.dailyTokensUsed += data.tokensUsed
      this.emit('tokens-used', {
        tokensUsed: data.tokensUsed,
        dailyTotal: this.dailyTokensUsed,
        budget: this.config.tokenBudget,
        percentage: (this.dailyTokensUsed / this.config.tokenBudget!) * 100
      })

      // 检查预算
      if (this.dailyTokensUsed >= this.config.tokenBudget!) {
        this.emit('budget-exceeded', {
          used: this.dailyTokensUsed,
          budget: this.config.tokenBudget
        })
        console.warn(`⚠️  Token 预算已用尽: ${this.dailyTokensUsed}/${this.config.tokenBudget}`)
      }
    })

    // 监听代码生成
    this.developer.on('code-generated', (task) => {
      this.emit('code-generated', task)
      console.log(`✨ 代码已生成: ${task.todo.content}`)
    })

    // 监听代码应用
    this.developer.on('code-applied', (task) => {
      this.emit('code-applied', task)
      console.log(`✅ 代码已应用: ${task.todo.file}`)
    })

    // 监听审查完成
    this.reviewer.on('review-completed', (result) => {
      this.emit('review-completed', result)
      console.log(`🔍 审查完成: ${result.filePath} (${result.suggestions.length} 个建议)`)
    })
  }

  /**
   * 启动 AI 协调器
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('AI Coordinator 已在运行')
      return
    }

    this.isRunning = true
    this.dailyTokensUsed = 0

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('  🤖 AI Coordinator 启动')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`自动审批: ${this.config.autoApprove ? '✅ 开启' : '❌ 关闭'}`)
    console.log(`最大并发: ${this.config.maxConcurrentTasks}`)
    console.log(`Token 预算: ${this.config.tokenBudget?.toLocaleString()} tokens/天`)
    console.log('')

    this.emit('started')
  }

  /**
   * 停止 AI 协调器
   */
  async stop(): Promise<void> {
    this.isRunning = false
    console.log('🤖 AI Coordinator 已停止')
    this.emit('stopped')
  }

  /**
   * 处理项目的 TODO
   */
  async processTodos(projectId: string, todos: TodoItem[]): Promise<void> {
    if (!this.isRunning) {
      throw new Error('AI Coordinator is not running')
    }

    // 检查预算
    if (this.dailyTokensUsed >= this.config.tokenBudget!) {
      throw new Error('Daily token budget exceeded')
    }

    console.log(`\n🤖 处理 ${projectId} 的 ${todos.length} 个 TODO...`)

    // 批量处理（限制并发）
    const batches = this.createBatches(todos, this.config.maxConcurrentTasks!)

    for (const batch of batches) {
      await Promise.all(
        batch.map(todo => this.developer.generateCodeForTodo(projectId, todo))
      )
    }
  }

  /**
   * 审查项目文件
   */
  async reviewProject(projectId: string, filePaths: string[]): Promise<void> {
    if (!this.isRunning) {
      throw new Error('AI Coordinator is not running')
    }

    console.log(`\n🔍 审查 ${projectId} 的 ${filePaths.length} 个文件...`)

    await this.reviewer.reviewFiles(projectId, filePaths)
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      isRunning: this.isRunning,
      dailyTokensUsed: this.dailyTokensUsed,
      tokenBudget: this.config.tokenBudget,
      budgetUsagePercentage: (this.dailyTokensUsed / this.config.tokenBudget!) * 100,
      pendingTasks: this.developer.getPendingTasks().length,
      totalTasks: this.developer.getAllTasks().length
    }
  }

  /**
   * 获取 Auto Developer
   */
  getDeveloper(): AutoDeveloper {
    return this.developer
  }

  /**
   * 获取 Auto Reviewer
   */
  getReviewer(): AutoReviewer {
    return this.reviewer
  }

  /**
   * 创建批次
   */
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = []
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize))
    }
    return batches
  }
}
