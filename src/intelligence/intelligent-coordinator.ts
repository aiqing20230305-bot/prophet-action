/**
 * Prophet Intelligent Coordinator - 智能协调器
 *
 * Phase 3.3: 整合AdaptiveScheduler + PriorityQueue
 *
 * 职责：
 * - 协调自适应调度和优先级队列
 * - 根据项目活跃度动态分配资源
 * - 智能选择下一个要处理的问题
 * - 平衡多项目之间的资源
 */

import { AdaptiveScheduler, ProjectActivity } from './adaptive-scheduler.js'
import { IntelligentPriorityQueue, Issue, ScoredIssue } from './priority-queue.js'
import { EventEmitter } from 'events'

export interface ProjectConfig {
  projectId: string
  projectName: string
  projectPath: string
  priority: 'high' | 'medium' | 'low'
}

export interface NextTask {
  project: ProjectActivity
  issue: ScoredIssue
  reason: string
}

export class IntelligentCoordinator extends EventEmitter {
  private scheduler: AdaptiveScheduler
  private priorityQueues: Map<string, IntelligentPriorityQueue>
  private projects: Map<string, ProjectConfig>
  private lastScanTime: Map<string, number>

  constructor(options: {
    useAI?: boolean
  } = {}) {
    super()

    this.scheduler = new AdaptiveScheduler()
    this.priorityQueues = new Map()
    this.projects = new Map()
    this.lastScanTime = new Map()

    console.log(`🧠 [IntelligentCoordinator] 初始化智能协调器`)
    console.log(`   AI评分: ${options.useAI ? '✅ 启用' : '❌ 禁用（使用规则）'}`)
  }

  /**
   * 注册项目
   */
  registerProject(config: ProjectConfig): void {
    this.projects.set(config.projectId, config)

    // 为项目创建优先级队列
    if (!this.priorityQueues.has(config.projectId)) {
      this.priorityQueues.set(config.projectId, new IntelligentPriorityQueue({ useAI: true }))
    }

    console.log(`   ✓ 注册项目: ${config.projectName}`)
  }

  /**
   * 为项目添加问题
   */
  async addIssues(projectId: string, issues: Issue[]): Promise<void> {
    const queue = this.priorityQueues.get(projectId)
    if (!queue) {
      console.warn(`⚠️  项目未注册: ${projectId}`)
      return
    }

    await queue.addIssues(issues)

    this.emit('issues-added', {
      projectId,
      issueCount: issues.length,
      queueSize: queue.size()
    })
  }

  /**
   * 智能选择下一个任务
   *
   * 策略：
   * 1. 分析所有项目的活跃度
   * 2. 优先选择高活跃度项目
   * 3. 在项目内选择最高优先级问题
   * 4. 考虑项目优先级权重
   */
  async selectNextTask(): Promise<NextTask | null> {
    // 1. 分析所有项目活跃度
    const projectConfigs = Array.from(this.projects.values())
    const activities = await this.scheduler.analyzeProjects(
      projectConfigs.map(p => ({
        projectId: p.projectId,
        projectName: p.projectName,
        projectPath: p.projectPath
      }))
    )

    // 2. 过滤出需要扫描的项目
    const now = Date.now()
    const candidateProjects = activities.filter(activity => {
      const lastScan = this.lastScanTime.get(activity.projectId) || 0
      const timeSinceLastScan = now - lastScan

      // 检查是否到了推荐扫描间隔
      return timeSinceLastScan >= activity.recommendedInterval
    })

    if (candidateProjects.length === 0) {
      return null
    }

    // 3. 为每个候选项目计算综合得分
    const scoredCandidates = candidateProjects.map(activity => {
      const config = this.projects.get(activity.projectId)!
      const queue = this.priorityQueues.get(activity.projectId)!

      // 获取项目内最高优先级问题
      const topIssue = queue.getTopN(1)[0]

      if (!topIssue) {
        return null
      }

      // 计算综合得分
      const score = this.calculateCombinedScore(activity, config, topIssue)

      return {
        activity,
        config,
        issue: topIssue,
        score
      }
    }).filter(c => c !== null) as Array<{
      activity: ProjectActivity
      config: ProjectConfig
      issue: ScoredIssue
      score: number
    }>

    if (scoredCandidates.length === 0) {
      return null
    }

    // 4. 选择得分最高的
    scoredCandidates.sort((a, b) => b.score - a.score)
    const selected = scoredCandidates[0]

    // 更新扫描时间
    this.lastScanTime.set(selected.activity.projectId, now)

    // 从队列中移除该问题
    const queue = this.priorityQueues.get(selected.activity.projectId)!
    queue.getNext()  // 移除

    // 构建原因说明
    const reason = this.explainSelection(selected)

    this.emit('task-selected', {
      projectId: selected.activity.projectId,
      projectName: selected.activity.projectName,
      issueType: selected.issue.type,
      score: selected.score
    })

    return {
      project: selected.activity,
      issue: selected.issue,
      reason
    }
  }

  /**
   * 计算综合得分
   *
   * 综合考虑：
   * - 项目活跃度（30%）
   * - 问题优先级（40%）
   * - 项目优先级（20%）
   * - 队列深度（10%）
   */
  private calculateCombinedScore(
    activity: ProjectActivity,
    config: ProjectConfig,
    issue: ScoredIssue
  ): number {
    // 1. 项目活跃度得分（0-100）
    const activityScore = activity.activityScore * 100

    // 2. 问题优先级得分（0-100）
    const issueScore = issue.score

    // 3. 项目优先级得分（0-100）
    const projectPriorityScore = {
      'high': 100,
      'medium': 70,
      'low': 40
    }[config.priority]

    // 4. 队列深度得分（0-100）
    // 队列越长，得分越高（避免队列积压）
    const queue = this.priorityQueues.get(config.projectId)!
    const queueDepth = queue.size()
    const queueScore = Math.min(100, queueDepth * 5)  // 20个问题=100分

    // 加权计算
    const combinedScore = (
      activityScore * 0.30 +
      issueScore * 0.40 +
      projectPriorityScore * 0.20 +
      queueScore * 0.10
    )

    return combinedScore
  }

  /**
   * 解释选择原因
   */
  private explainSelection(selected: {
    activity: ProjectActivity
    config: ProjectConfig
    issue: ScoredIssue
    score: number
  }): string {
    const reasons: string[] = []

    // 活跃度
    if (selected.activity.activityScore > 0.8) {
      reasons.push(`项目极度活跃（${(selected.activity.activityScore * 100).toFixed(0)}%）`)
    } else if (selected.activity.activityScore > 0.6) {
      reasons.push(`项目高度活跃（${(selected.activity.activityScore * 100).toFixed(0)}%）`)
    }

    // 问题优先级
    if (selected.issue.priority === 'critical') {
      reasons.push(`关键问题（${selected.issue.score}分）`)
    } else if (selected.issue.priority === 'high') {
      reasons.push(`高优先级问题（${selected.issue.score}分）`)
    }

    // 项目优先级
    if (selected.config.priority === 'high') {
      reasons.push('高优先级项目')
    }

    // 队列深度
    const queue = this.priorityQueues.get(selected.activity.projectId)!
    if (queue.size() > 20) {
      reasons.push(`队列积压（${queue.size()}个问题）`)
    }

    return reasons.join(' + ')
  }

  /**
   * 获取所有项目状态
   */
  async getProjectsStatus(): Promise<Array<{
    project: ProjectConfig
    activity: ProjectActivity
    queueSize: number
    topIssue: ScoredIssue | null
  }>> {
    const projectConfigs = Array.from(this.projects.values())
    const activities = await this.scheduler.analyzeProjects(
      projectConfigs.map(p => ({
        projectId: p.projectId,
        projectName: p.projectName,
        projectPath: p.projectPath
      }))
    )

    return activities.map(activity => {
      const config = this.projects.get(activity.projectId)!
      const queue = this.priorityQueues.get(activity.projectId)!
      const topIssue = queue.getTopN(1)[0] || null

      return {
        project: config,
        activity,
        queueSize: queue.size(),
        topIssue
      }
    })
  }

  /**
   * 打印状态报告
   */
  async printStatus(): Promise<void> {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    console.log(`🧠 [IntelligentCoordinator] 系统状态`)
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)

    const statuses = await this.getProjectsStatus()

    for (const status of statuses) {
      const activityEmoji = {
        'very-high': '🔥',
        'high': '⚡',
        'medium': '✓',
        'low': '😴',
        'sleeping': '💤'
      }[status.activity.activityLevel]

      console.log(`\n${activityEmoji} ${status.project.projectName}`)
      console.log(`   活跃度: ${(status.activity.activityScore * 100).toFixed(0)}% (${status.activity.activityLevel})`)
      console.log(`   扫描间隔: ${(status.activity.recommendedInterval / 1000).toFixed(0)}秒`)
      console.log(`   队列大小: ${status.queueSize} 个问题`)

      if (status.topIssue) {
        console.log(`   下一个问题: [${status.topIssue.priority}] ${status.topIssue.message.substring(0, 50)}...`)
        console.log(`   问题得分: ${status.topIssue.score}/100`)
      } else {
        console.log(`   下一个问题: 无`)
      }
    }

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)
  }

  /**
   * 获取统计信息
   */
  getStatistics() {
    const totalIssues = Array.from(this.priorityQueues.values())
      .reduce((sum, queue) => sum + queue.size(), 0)

    const activityStats = this.scheduler.getStatistics()

    return {
      projectCount: this.projects.size,
      totalIssues,
      averageActivity: activityStats.averageScore,
      activityBreakdown: activityStats.byLevel
    }
  }
}

/**
 * 使用示例：
 *
 * const coordinator = new IntelligentCoordinator({ useAI: true })
 *
 * // 注册项目
 * coordinator.registerProject({
 *   projectId: 'videoplay',
 *   projectName: 'videoplay',
 *   projectPath: '/path/to/videoplay',
 *   priority: 'high'
 * })
 *
 * // 添加问题
 * await coordinator.addIssues('videoplay', [
 *   {
 *     id: '1',
 *     type: 'FIXME',
 *     file: 'src/auth.ts',
 *     message: 'Fix security issue',
 *     projectId: 'videoplay',
 *     projectName: 'videoplay'
 *   }
 * ])
 *
 * // 选择下一个任务
 * const task = await coordinator.selectNextTask()
 * if (task) {
 *   console.log(`处理: ${task.issue.message}`)
 *   console.log(`原因: ${task.reason}`)
 * }
 *
 * // 查看状态
 * await coordinator.printStatus()
 */
