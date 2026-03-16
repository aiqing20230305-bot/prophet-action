/**
 * Autonomous Evolution System
 *
 * 先知的完全自主进化系统 - 无需人工干预的持续进化
 */

import { EventEmitter } from 'events'
import { AICoordinator } from '../ai/ai-coordinator.js'
import { GlobalOrchestrator } from '../orchestrator/global-orchestrator.js'
import { readFile } from 'fs/promises'
import { join } from 'path'

export interface AutonomousConfig {
  checkInterval: number  // 检查间隔（毫秒）
  maxDailyTokens: number  // 每日 token 限制
  autoApproveAll: boolean  // 自动审批所有操作
  projectPriority: Record<string, number>  // 项目优先级
}

export class AutonomousEvolutionSystem extends EventEmitter {
  private aiCoordinator: AICoordinator
  private globalOrchestrator: GlobalOrchestrator
  private config: AutonomousConfig
  private isRunning = false
  private checkTimer: NodeJS.Timeout | null = null

  // 项目路径映射
  private projectPaths: Map<string, string> = new Map([
    ['videoplay', '/Users/zhangjingwei/Desktop/videoplay'],
    ['agentforge', '/Users/zhangjingwei/Desktop/AgentForge']
  ])

  constructor(
    aiCoordinator: AICoordinator,
    globalOrchestrator: GlobalOrchestrator,
    config: Partial<AutonomousConfig> = {}
  ) {
    super()
    this.aiCoordinator = aiCoordinator
    this.globalOrchestrator = globalOrchestrator
    this.config = {
      checkInterval: 30 * 60 * 1000,  // 每30分钟检查一次
      maxDailyTokens: 500_000,  // 每天50万 tokens（保守）
      autoApproveAll: true,  // 完全自主
      projectPriority: {
        videoplay: 1,
        agentforge: 2
      },
      ...config
    }
  }

  /**
   * 启动自主进化
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      return
    }

    this.isRunning = true

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('  🔮 Autonomous Evolution System')
    console.log('  先知自主进化系统 - 永不停止')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('')
    console.log('模式: 完全自主 (无需人工干预)')
    console.log(`检查间隔: ${this.config.checkInterval / 60000} 分钟`)
    console.log(`Token 预算: ${this.config.maxDailyTokens.toLocaleString()} tokens/天`)
    console.log('')
    console.log('监控项目:')
    for (const [name, path] of this.projectPaths) {
      const priority = this.config.projectPriority[name] || 999
      console.log(`  ${priority}. ${name} - ${path}`)
    }
    console.log('')
    console.log('🚀 开始持续进化...')
    console.log('')

    // 立即执行第一次
    await this.evolutionCycle()

    // 定期执行
    this.checkTimer = setInterval(async () => {
      await this.evolutionCycle()
    }, this.config.checkInterval)

    this.emit('started')
  }

  /**
   * 停止自主进化
   */
  stop(): void {
    if (!this.isRunning) {
      return
    }

    this.isRunning = false

    if (this.checkTimer) {
      clearInterval(this.checkTimer)
      this.checkTimer = null
    }

    console.log('')
    console.log('🔮 Autonomous Evolution System 已停止')

    this.emit('stopped')
  }

  /**
   * 进化周期
   */
  private async evolutionCycle(): Promise<void> {
    const timestamp = new Date().toISOString()
    console.log(`\n━━━ [${timestamp}] 进化周期开始 ━━━\n`)

    try {
      // 按优先级排序项目
      const projects = Array.from(this.projectPaths.entries())
        .sort((a, b) => {
          const priorityA = this.config.projectPriority[a[0]] || 999
          const priorityB = this.config.projectPriority[b[0]] || 999
          return priorityA - priorityB
        })

      for (const [projectName, projectPath] of projects) {
        await this.evolveProject(projectName, projectPath)
      }

      console.log('\n━━━ 进化周期完成 ━━━\n')
      this.emit('cycle-completed')
    } catch (error) {
      console.error('进化周期失败:', error)
      this.emit('cycle-error', error)
    }
  }

  /**
   * 进化单个项目
   */
  private async evolveProject(projectName: string, projectPath: string): Promise<void> {
    console.log(`🔮 进化项目: ${projectName}`)

    try {
      // 1. 读取 TODO 列表
      const todos = await this.loadTodos(projectPath)
      console.log(`   📋 发现 ${todos.length} 个 TODO`)

      if (todos.length === 0) {
        console.log('   ✓ 无 TODO，项目状态良好\n')
        return
      }

      // 2. 检查 token 预算
      const stats = this.aiCoordinator.getStats()
      if (stats.dailyTokensUsed >= this.config.maxDailyTokens) {
        console.log('   ⚠️  Token 预算已用尽，跳过\n')
        return
      }

      // 3. 选择前 5 个 TODO（避免过度消耗）
      const selectedTodos = todos.slice(0, 5)
      console.log(`   ⚡ 自动处理前 ${selectedTodos.length} 个 TODO`)

      // 4. 调用 AI 生成代码
      await this.aiCoordinator.processTodos(projectName, selectedTodos)

      // 5. 自动审批所有任务
      if (this.config.autoApproveAll) {
        const pendingTasks = this.aiCoordinator.getDeveloper().getPendingTasks()
        for (const task of pendingTasks) {
          if (task.projectId === projectName) {
            console.log(`   ✅ 自动审批: ${task.todo.content}`)
            await this.aiCoordinator.getDeveloper().approveTask(task.id)
          }
        }
      }

      console.log(`   ✓ ${projectName} 进化完成\n`)
      this.emit('project-evolved', { projectName, todosProcessed: selectedTodos.length })
    } catch (error) {
      console.error(`   ✗ ${projectName} 进化失败:`, error)
      this.emit('project-error', { projectName, error })
    }
  }

  /**
   * 加载项目的 TODO 列表
   */
  private async loadTodos(projectPath: string): Promise<any[]> {
    try {
      const todoFile = join(projectPath, '.prophet', 'todo-tracking.json')
      const content = await readFile(todoFile, 'utf-8')
      const data = JSON.parse(content)

      // 转换为 AI 可用的格式
      return (data.items || []).map((item: any) => ({
        file: item.file,
        line: item.line,
        content: item.content,
        type: item.type
      }))
    } catch (error) {
      console.log(`   ⚠️  无法加载 TODO: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return []
    }
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      isRunning: this.isRunning,
      checkInterval: this.config.checkInterval,
      maxDailyTokens: this.config.maxDailyTokens,
      autoApproveAll: this.config.autoApproveAll,
      projects: Array.from(this.projectPaths.keys()),
      aiStats: this.aiCoordinator.getStats()
    }
  }
}
