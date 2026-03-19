/**
 * Prophet Automation Orchestrator
 *
 * 协调自动化系统 - 完全自主运行
 *
 * 职责：
 * - 协调Auto-Merge和Auto-Rollback
 * - 监控项目的Git活动
 * - 自动触发合并和回滚
 * - 维护系统稳定性
 */

import { AutoMergeController } from './auto-merge.js'
import { AutoRollbackController } from './auto-rollback.js'
import { execSync } from 'child_process'

export interface AutomationConfig {
  projectPath: string
  projectName: string
  enableAutoMerge: boolean
  enableAutoRollback: boolean
  checkInterval: number  // 检查间隔（毫秒）
  rollbackObservationPeriod: number  // 回滚观察期（毫秒）
}

export class AutomationOrchestrator {
  private config: AutomationConfig
  private autoMerge: AutoMergeController
  private autoRollback: AutoRollbackController
  private isRunning: boolean = false
  private lastCheckedCommit: string | null = null

  constructor(config: AutomationConfig) {
    this.config = config
    this.autoMerge = new AutoMergeController(config.projectPath)
    this.autoRollback = new AutoRollbackController(config.projectPath)
  }

  /**
   * 启动自动化系统
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log(`⚠️  [Automation] ${this.config.projectName} 自动化系统已在运行`)
      return
    }

    console.log(`\n🤖 [Automation] 启动 ${this.config.projectName} 自动化系统`)
    console.log(`   Auto-Merge: ${this.config.enableAutoMerge ? '✅' : '❌'}`)
    console.log(`   Auto-Rollback: ${this.config.enableAutoRollback ? '✅' : '❌'}`)
    console.log(`   检查间隔: ${this.config.checkInterval / 1000}秒`)

    this.isRunning = true

    // 设置回滚基准
    if (this.config.enableAutoRollback) {
      await this.autoRollback.setBaseline()
    }

    // 获取当前最新commit作为起点
    this.lastCheckedCommit = await this.getLatestCommit()
    console.log(`   起始commit: ${this.lastCheckedCommit?.substring(0, 7) || 'N/A'}`)

    // 启动监控循环
    this.runMonitoringLoop().catch(err => {
      console.error(`❌ [Automation] 监控循环异常:`, err)
    })

    console.log(`   ✓ 自动化系统已启动`)
  }

  /**
   * 停止自动化系统
   */
  stop(): void {
    console.log(`\n🛑 [Automation] 停止 ${this.config.projectName} 自动化系统`)
    this.isRunning = false
  }

  /**
   * 监控循环
   */
  private async runMonitoringLoop(): Promise<void> {
    while (this.isRunning) {
      try {
        // 1. 检查新的commits
        const newCommits = await this.getNewCommits()

        if (newCommits.length > 0) {
          console.log(`\n🔍 [Automation] ${this.config.projectName} 发现 ${newCommits.length} 个新commit`)

          // 2. Auto-Rollback: 监控每个新commit
          if (this.config.enableAutoRollback) {
            // 只监控最新的commit（其他的已经过观察期了）
            const latestCommit = newCommits[0]
            console.log(`   → 启动回滚监控: ${latestCommit.substring(0, 7)}`)

            // 异步监控，不阻塞主循环
            this.autoRollback.monitorCommit(latestCommit).catch(err => {
              console.error(`   ⚠️  回滚监控失败:`, err.message)
            })
          }

          // 更新最后检查的commit
          this.lastCheckedCommit = newCommits[0]
        }

        // 3. Auto-Merge: 检查可合并的分支
        if (this.config.enableAutoMerge) {
          const mergeableBranches = await this.autoMerge.getMergeableBranches()

          if (mergeableBranches.length > 0) {
            console.log(`\n🔀 [Automation] ${this.config.projectName} 发现 ${mergeableBranches.length} 个可合并分支`)

            // 批量合并
            const results = await this.autoMerge.batchAutoMerge(mergeableBranches)

            const successCount = results.filter(r => r.success).length
            console.log(`   ✓ 成功合并 ${successCount}/${results.length} 个分支`)
          }
        }

      } catch (error: any) {
        console.error(`⚠️  [Automation] 监控异常:`, error.message)
      }

      // 等待下一次检查
      await this.sleep(this.config.checkInterval)
    }
  }

  /**
   * 获取新的commits
   */
  private async getNewCommits(): Promise<string[]> {
    try {
      const latestCommit = await this.getLatestCommit()

      // 如果没有上次检查的commit，返回空
      if (!this.lastCheckedCommit || latestCommit === this.lastCheckedCommit) {
        return []
      }

      // 获取两个commit之间的所有commits
      const output = this.git(`log ${this.lastCheckedCommit}..${latestCommit} --format=%H`)
      const commits = output.trim().split('\n').filter(h => h.length > 0)

      return commits

    } catch (error: any) {
      console.error(`获取新commits失败: ${error.message}`)
      return []
    }
  }

  /**
   * 获取最新commit
   */
  private async getLatestCommit(): Promise<string | null> {
    try {
      const output = this.git(`log -1 --format=%H`)
      return output.trim()
    } catch (error: any) {
      console.error(`获取最新commit失败: ${error.message}`)
      return null
    }
  }

  /**
   * 执行Git命令
   */
  private git(command: string): string {
    return execSync(`git ${command}`, {
      cwd: this.config.projectPath,
      encoding: 'utf-8',
      stdio: 'pipe'
    })
  }

  /**
   * 获取运行状态
   */
  getStatus() {
    return {
      projectName: this.config.projectName,
      isRunning: this.isRunning,
      lastCheckedCommit: this.lastCheckedCommit,
      autoMergeEnabled: this.config.enableAutoMerge,
      autoRollbackEnabled: this.config.enableAutoRollback
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

/**
 * 使用示例：
 *
 * const orchestrator = new AutomationOrchestrator({
 *   projectPath: '/path/to/project',
 *   projectName: 'videoplay',
 *   enableAutoMerge: true,
 *   enableAutoRollback: true,
 *   checkInterval: 60 * 1000,  // 每分钟检查
 *   rollbackObservationPeriod: 5 * 60 * 1000  // 5分钟观察期
 * })
 *
 * await orchestrator.start()
 */
