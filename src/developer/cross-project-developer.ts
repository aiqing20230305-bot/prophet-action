/**
 * Prophet Cross-Project Developer
 * 跨项目开发协调器 - 识别通用需求，生成共享解决方案
 *
 * @module developer/cross-project-developer
 * @prophet-component development
 */

import { EventEmitter } from 'events'
import {
  ProjectConfig,
  Issue,
  SharedModule,
  PriorityScore,
} from '../types/orchestrator'
import { SharedSolution } from '../monitor/pattern-detector'

/**
 * 开发任务
 */
export interface DevTask {
  issueId: string
  projectId: string
  type: 'shared' | 'specific'
  status: 'pending' | 'in-progress' | 'completed' | 'failed'
  startedAt?: Date
  completedAt?: Date
}

/**
 * 跨项目开发协调器
 */
export class CrossProjectDeveloper extends EventEmitter {
  private devSlots = 2 // 最多同时开发2个项目
  private activeDevs: Map<string, DevTask> = new Map()
  private projects: Map<string, ProjectConfig> = new Map()

  constructor(private config: CrossProjectDeveloperConfig = {}) {
    super()
    this.devSlots = config.maxConcurrentDev ?? 2
  }

  /**
   * 注册项目
   */
  registerProject(project: ProjectConfig): void {
    this.projects.set(project.id, project)
  }

  /**
   * 协调开发
   */
  async coordinatedDevelopment(allIssues: Issue[]): Promise<void> {
    // 1. 全局优先级排序
    const prioritized = this.globalPrioritize(allIssues)

    this.emit('prioritization-completed', prioritized)

    // 2. 识别通用需求
    const commonIssues = prioritized.filter((i) => i.affectedProjects.length >= 2)

    this.emit('common-issues-identified', commonIssues)

    // 3. 分配开发任务
    for (const issue of prioritized) {
      if (this.activeDevs.size >= this.devSlots) {
        break // 已达并发限制
      }

      if (issue.affectedProjects.length >= 2) {
        await this.developSharedSolution(issue)
      } else {
        await this.developProjectSpecific(issue)
      }
    }
  }

  /**
   * 全局优先级排序
   */
  private globalPrioritize(issues: Issue[]): Issue[] {
    const scored = issues.map((issue) => ({
      issue,
      score: this.calculatePriorityScore(issue),
    }))

    return scored.sort((a, b) => b.score.score - a.score.score).map((s) => s.issue)
  }

  /**
   * 计算优先级分数
   */
  private calculatePriorityScore(issue: Issue): PriorityScore {
    let score = 0
    const breakdown = {
      scope: 0,
      priority: 0,
      safety: 0,
      projectPriority: 0,
    }

    // 影响范围：跨项目的问题得分更高
    breakdown.scope = issue.affectedProjects.length * 50
    score += breakdown.scope

    // 优先级
    const priorityScores: Record<string, number> = {
      critical: 100,
      high: 50,
      medium: 20,
      low: 5,
    }
    breakdown.priority = priorityScores[issue.priority] || 0
    score += breakdown.priority

    // 安全性和自动化
    if (issue.autoExecutable && issue.safe) {
      breakdown.safety = 30
      score += breakdown.safety
    }

    // 项目优先级
    const criticalProjects = issue.affectedProjects.filter((pid) => {
      const project = this.projects.get(pid)
      return project?.priority === 'critical'
    }).length

    breakdown.projectPriority = criticalProjects * 20
    score += breakdown.projectPriority

    return {
      issueId: issue.id,
      score,
      breakdown,
    }
  }

  /**
   * 开发共享解决方案
   */
  private async developSharedSolution(issue: Issue): Promise<void> {
    const taskId = `shared-${issue.id}`
    const task: DevTask = {
      issueId: issue.id,
      projectId: issue.affectedProjects[0], // 主项目
      type: 'shared',
      status: 'in-progress',
      startedAt: new Date(),
    }

    this.activeDevs.set(taskId, task)

    this.emit('shared-solution-started', issue)

    console.log(`🔮 Prophet: 开发共享解决方案`)
    console.log(`   标题: ${issue.title}`)
    console.log(`   影响项目: ${issue.affectedProjects.join(', ')}`)
    console.log(`   优先级: ${issue.priority}`)

    try {
      // 这里应该集成实际的代码生成逻辑
      // 目前只是占位符

      // 1. 分析需求
      const requirements = await this.analyzeRequirements(issue)

      // 2. 生成共享模块（由 SharedModuleGenerator 处理）
      this.emit('generate-shared-module', issue, requirements)

      // 3. 推荐给所有相关项目
      for (const projectId of issue.affectedProjects) {
        this.emit('recommend-to-project', projectId, issue)
      }

      task.status = 'completed'
      task.completedAt = new Date()

      this.emit('shared-solution-completed', issue)
    } catch (error) {
      task.status = 'failed'
      this.emit('shared-solution-failed', issue, error)
    } finally {
      this.activeDevs.delete(taskId)
    }
  }

  /**
   * 开发项目特定解决方案
   */
  private async developProjectSpecific(issue: Issue): Promise<void> {
    const projectId = issue.affectedProjects[0]
    const taskId = `specific-${issue.id}`
    const task: DevTask = {
      issueId: issue.id,
      projectId,
      type: 'specific',
      status: 'in-progress',
      startedAt: new Date(),
    }

    this.activeDevs.set(taskId, task)

    this.emit('specific-solution-started', issue)

    console.log(`🔧 Prophet: 开发项目特定解决方案`)
    console.log(`   项目: ${projectId}`)
    console.log(`   标题: ${issue.title}`)

    try {
      // 这里应该集成实际的代码生成逻辑
      this.emit('generate-solution', projectId, issue)

      task.status = 'completed'
      task.completedAt = new Date()

      this.emit('specific-solution-completed', issue)
    } catch (error) {
      task.status = 'failed'
      this.emit('specific-solution-failed', issue, error)
    } finally {
      this.activeDevs.delete(taskId)
    }
  }

  /**
   * 分析需求
   */
  private async analyzeRequirements(issue: Issue): Promise<any> {
    // TODO: 实现需求分析逻辑
    return {
      category: this.extractCategory(issue.description),
      features: this.extractFeatures(issue.description),
      dependencies: [],
      complexity: 'medium',
    }
  }

  /**
   * 从描述中提取类别
   */
  private extractCategory(description: string): string {
    const lower = description.toLowerCase()

    if (lower.includes('auth') || lower.includes('login')) {
      return 'auth'
    }
    if (lower.includes('payment') || lower.includes('checkout')) {
      return 'payment'
    }
    if (lower.includes('monitor') || lower.includes('log')) {
      return 'monitoring'
    }

    return 'general'
  }

  /**
   * 从描述中提取功能
   */
  private extractFeatures(description: string): string[] {
    const features: string[] = []

    // 简单的关键词提取
    const keywords = [
      'authentication',
      'authorization',
      'validation',
      'caching',
      'logging',
      'testing',
    ]

    const lower = description.toLowerCase()
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        features.push(keyword)
      }
    }

    return features
  }

  /**
   * 处理共享解决方案
   */
  async processSharedSolution(solution: SharedSolution): Promise<void> {
    this.emit('processing-shared-solution', solution)

    console.log(`📦 Prophet: 处理共享解决方案`)
    console.log(`   类别: ${solution.category}`)
    console.log(`   模块: ${solution.moduleName}`)
    console.log(`   优先级: ${solution.priority}`)
    console.log(`   工作量: ${solution.estimatedEffort}`)
    console.log(`   影响项目: ${solution.affectedProjects.join(', ')}`)

    // 发出生成共享模块的事件
    this.emit('generate-shared-module-request', solution)
  }

  /**
   * 获取活跃任务
   */
  getActiveTasks(): DevTask[] {
    return Array.from(this.activeDevs.values())
  }

  /**
   * 获取可用槽位
   */
  getAvailableSlots(): number {
    return Math.max(0, this.devSlots - this.activeDevs.size)
  }

  /**
   * 获取状态
   */
  getStatus() {
    return {
      activeTasks: this.activeDevs.size,
      availableSlots: this.getAvailableSlots(),
      maxSlots: this.devSlots,
      tasks: this.getActiveTasks(),
    }
  }
}

/**
 * 配置接口
 */
export interface CrossProjectDeveloperConfig {
  maxConcurrentDev?: number
}
