/**
 * Preventive Action Planner - 预防措施规划器
 * Phase 6 Day 2: 预防性维护
 *
 * 职责：
 * - 根据趋势分析生成预防措施
 * - 评估预防效果
 * - 优先级排序
 * - 选择最佳执行时间
 */

import { EventEmitter } from 'events'
import { HealthTrend } from './health-trend-analyzer.js'
import { SystemHealth } from './health-monitor.js'

/**
 * 预防措施
 */
export interface PreventiveAction {
  id: string
  type: 'cleanup' | 'optimize' | 'scale' | 'balance' | 'archive'
  description: string
  reason: string                      // 为什么需要这个措施
  predictedIssue: HealthTrend        // 要预防的问题
  estimatedImpact: number            // 预期效果（%）
  priority: number                   // 优先级分数 (0-100)
  urgency: 'low' | 'medium' | 'high' | 'critical'
  bestExecutionTime?: Date           // 最佳执行时间
  estimatedDuration: number          // 预计执行时长（分钟）
  automated: boolean                 // 是否可自动执行
  safetyRating: number              // 安全等级 (0-1)
  createdAt: Date
}

/**
 * 措施评估
 */
export interface ActionEvaluation {
  action: PreventiveAction
  feasibility: number                // 可行性 (0-1)
  effectiveness: number              // 有效性 (0-1)
  risk: number                       // 风险 (0-1)
  costBenefit: number               // 成本收益比
  recommendation: 'execute' | 'defer' | 'manual' | 'reject'
  reasoning: string
}

/**
 * 预防计划
 */
export interface PreventivePlan {
  id: string
  actions: PreventiveAction[]
  totalEstimatedImpact: number
  executionWindow: {
    start: Date
    end: Date
  }
  priority: 'low' | 'medium' | 'high' | 'critical'
  createdAt: Date
}

/**
 * 规划器配置
 */
export interface PreventiveActionPlannerConfig {
  minPriorityThreshold: number      // 最低优先级阈值
  maxActionsPerPlan: number         // 每个计划最多措施数
  safetyThreshold: number           // 安全阈值
}

/**
 * 预防措施规划器
 */
export class PreventiveActionPlanner extends EventEmitter {
  private config: PreventiveActionPlannerConfig
  private actionCounter = 0

  constructor(config?: Partial<PreventiveActionPlannerConfig>) {
    super()

    this.config = {
      minPriorityThreshold: 30,
      maxActionsPerPlan: 5,
      safetyThreshold: 0.7,
      ...config
    }
  }

  /**
   * 根据趋势生成预防措施
   */
  planActions(trends: HealthTrend[], currentHealth?: SystemHealth): PreventiveAction[] {
    const actions: PreventiveAction[] = []

    for (const trend of trends) {
      // 只为上升趋势或高严重度趋势生成措施
      if (trend.direction === 'increasing' || trend.severity === 'high' || trend.severity === 'critical') {
        const trendActions = this.generateActionsForTrend(trend, currentHealth)
        actions.push(...trendActions)
      }
    }

    // 去重和排序
    const uniqueActions = this.deduplicateActions(actions)
    const sortedActions = this.prioritizeActions(uniqueActions)

    // 发出事件
    if (sortedActions.length > 0) {
      this.emit('actions-planned', { actions: sortedActions, count: sortedActions.length })
    }

    return sortedActions
  }

  /**
   * 为单个趋势生成措施
   */
  private generateActionsForTrend(trend: HealthTrend, currentHealth?: SystemHealth): PreventiveAction[] {
    const actions: PreventiveAction[] = []

    switch (trend.metric) {
      case 'cpu':
        actions.push(...this.generateCPUActions(trend, currentHealth))
        break
      case 'memory':
        actions.push(...this.generateMemoryActions(trend, currentHealth))
        break
      case 'disk':
        actions.push(...this.generateDiskActions(trend, currentHealth))
        break
    }

    return actions
  }

  /**
   * 生成CPU预防措施
   */
  private generateCPUActions(trend: HealthTrend, currentHealth?: SystemHealth): PreventiveAction[] {
    const actions: PreventiveAction[] = []

    // 措施1: 优化CPU密集型任务
    actions.push({
      id: this.generateActionId(),
      type: 'optimize',
      description: '优化CPU密集型任务和后台进程',
      reason: `CPU趋势${trend.direction}，当前${trend.currentValue.toFixed(1)}%，24小时后预计${trend.predictedValue24h.toFixed(1)}%`,
      predictedIssue: trend,
      estimatedImpact: 15, // 预计降低15%
      priority: this.calculatePriority(trend, 15),
      urgency: this.mapSeverityToUrgency(trend.severity),
      bestExecutionTime: this.calculateBestExecutionTime(trend, 12), // 提前12小时
      estimatedDuration: 10,
      automated: true,
      safetyRating: 0.9,
      createdAt: new Date()
    })

    // 措施2: 如果严重，考虑降级非核心功能
    if (trend.severity === 'high' || trend.severity === 'critical') {
      actions.push({
        id: this.generateActionId(),
        type: 'scale',
        description: '降级非核心功能以降低CPU负载',
        reason: `CPU ${trend.severity}趋势，需要立即降低负载`,
        predictedIssue: trend,
        estimatedImpact: 25, // 预计降低25%
        priority: this.calculatePriority(trend, 25),
        urgency: 'critical',
        bestExecutionTime: this.calculateBestExecutionTime(trend, 6), // 提前6小时
        estimatedDuration: 5,
        automated: true,
        safetyRating: 0.8,
        createdAt: new Date()
      })
    }

    return actions
  }

  /**
   * 生成内存预防措施
   */
  private generateMemoryActions(trend: HealthTrend, currentHealth?: SystemHealth): PreventiveAction[] {
    const actions: PreventiveAction[] = []

    // 措施1: 清理缓存和临时数据
    actions.push({
      id: this.generateActionId(),
      type: 'cleanup',
      description: '清理内存缓存和临时数据',
      reason: `内存趋势${trend.direction}，当前${trend.currentValue.toFixed(1)}%，24小时后预计${trend.predictedValue24h.toFixed(1)}%`,
      predictedIssue: trend,
      estimatedImpact: 10, // 预计释放10%
      priority: this.calculatePriority(trend, 10),
      urgency: this.mapSeverityToUrgency(trend.severity),
      bestExecutionTime: this.calculateBestExecutionTime(trend, 24), // 提前24小时
      estimatedDuration: 5,
      automated: true,
      safetyRating: 0.95,
      createdAt: new Date()
    })

    // 措施2: 如果增长快，强制垃圾回收
    if (trend.rate > 1) { // 每小时增长>1%
      actions.push({
        id: this.generateActionId(),
        type: 'optimize',
        description: '强制垃圾回收和内存优化',
        reason: `内存快速增长（${trend.rate.toFixed(2)}%/小时），可能存在内存泄漏`,
        predictedIssue: trend,
        estimatedImpact: 15,
        priority: this.calculatePriority(trend, 15),
        urgency: 'high',
        bestExecutionTime: this.calculateBestExecutionTime(trend, 12),
        estimatedDuration: 3,
        automated: true,
        safetyRating: 0.9,
        createdAt: new Date()
      })
    }

    // 措施3: 如果严重，考虑重启
    if (trend.severity === 'critical' && trend.predictedThresholdTime) {
      const hoursUntil = (trend.predictedThresholdTime.getTime() - Date.now()) / (1000 * 60 * 60)
      if (hoursUntil < 12) {
        actions.push({
          id: this.generateActionId(),
          type: 'scale',
          description: '计划重启以释放内存（需人工确认）',
          reason: `内存即将耗尽（${hoursUntil.toFixed(1)}小时内），重启是最有效的方式`,
          predictedIssue: trend,
          estimatedImpact: 50,
          priority: 90,
          urgency: 'critical',
          bestExecutionTime: new Date(trend.predictedThresholdTime.getTime() - 2 * 60 * 60 * 1000), // 提前2小时
          estimatedDuration: 5,
          automated: false, // 需要人工确认
          safetyRating: 0.6,
          createdAt: new Date()
        })
      }
    }

    return actions
  }

  /**
   * 生成磁盘预防措施
   */
  private generateDiskActions(trend: HealthTrend, currentHealth?: SystemHealth): PreventiveAction[] {
    const actions: PreventiveAction[] = []

    // 措施1: 清理旧日志
    actions.push({
      id: this.generateActionId(),
      type: 'cleanup',
      description: '清理旧日志文件和临时文件',
      reason: `磁盘趋势${trend.direction}，当前${trend.currentValue.toFixed(1)}%，24小时后预计${trend.predictedValue24h.toFixed(1)}%`,
      predictedIssue: trend,
      estimatedImpact: 5, // 预计释放5%
      priority: this.calculatePriority(trend, 5),
      urgency: this.mapSeverityToUrgency(trend.severity),
      bestExecutionTime: this.calculateBestExecutionTime(trend, 48), // 提前48小时
      estimatedDuration: 10,
      automated: true,
      safetyRating: 0.95,
      createdAt: new Date()
    })

    // 措施2: 归档旧数据
    if (trend.currentValue > 70) {
      actions.push({
        id: this.generateActionId(),
        type: 'archive',
        description: '归档旧数据到备份存储',
        reason: `磁盘使用率高（${trend.currentValue.toFixed(1)}%），需要归档旧数据`,
        predictedIssue: trend,
        estimatedImpact: 15,
        priority: this.calculatePriority(trend, 15),
        urgency: 'medium',
        bestExecutionTime: this.calculateBestExecutionTime(trend, 72), // 提前3天
        estimatedDuration: 30,
        automated: false, // 归档需要人工确认
        safetyRating: 0.8,
        createdAt: new Date()
      })
    }

    return actions
  }

  /**
   * 评估单个措施
   */
  evaluateAction(action: PreventiveAction, currentHealth?: SystemHealth): ActionEvaluation {
    // 可行性评估
    const feasibility = this.assessFeasibility(action, currentHealth)

    // 有效性评估
    const effectiveness = this.assessEffectiveness(action)

    // 风险评估
    const risk = this.assessRisk(action)

    // 成本收益比
    const costBenefit = (effectiveness * action.estimatedImpact) / (risk * action.estimatedDuration)

    // 生成建议
    let recommendation: 'execute' | 'defer' | 'manual' | 'reject'
    let reasoning: string

    if (!action.automated) {
      recommendation = 'manual'
      reasoning = '该措施需要人工审核和确认'
    } else if (action.safetyRating < this.config.safetyThreshold) {
      recommendation = 'manual'
      reasoning = `安全等级过低（${action.safetyRating}），建议人工执行`
    } else if (action.priority < this.config.minPriorityThreshold) {
      recommendation = 'defer'
      reasoning = `优先级过低（${action.priority}），建议延后执行`
    } else if (feasibility < 0.6) {
      recommendation = 'reject'
      reasoning = `可行性过低（${(feasibility * 100).toFixed(0)}%），不建议执行`
    } else if (risk > 0.7) {
      recommendation = 'manual'
      reasoning = `风险较高（${(risk * 100).toFixed(0)}%），建议人工评估`
    } else {
      recommendation = 'execute'
      reasoning = `可行性高，风险低，建议自动执行`
    }

    return {
      action,
      feasibility,
      effectiveness,
      risk,
      costBenefit,
      recommendation,
      reasoning
    }
  }

  /**
   * 评估可行性
   */
  private assessFeasibility(action: PreventiveAction, currentHealth?: SystemHealth): number {
    let feasibility = 0.8 // 基础可行性

    // 如果是自动化措施，可行性更高
    if (action.automated) {
      feasibility += 0.1
    }

    // 如果安全等级高，可行性更高
    feasibility += action.safetyRating * 0.1

    return Math.min(1, feasibility)
  }

  /**
   * 评估有效性
   */
  private assessEffectiveness(action: PreventiveAction): number {
    // 根据预期影响和问题严重度评估
    const impactScore = action.estimatedImpact / 100
    const severityScore = this.severityToScore(action.predictedIssue.severity)

    return (impactScore + severityScore) / 2
  }

  /**
   * 评估风险
   */
  private assessRisk(action: PreventiveAction): number {
    // 风险 = 1 - 安全等级
    let risk = 1 - action.safetyRating

    // 非自动化措施风险较低（因为有人工审核）
    if (!action.automated) {
      risk *= 0.5
    }

    // 执行时间长的措施风险更高
    if (action.estimatedDuration > 20) {
      risk += 0.1
    }

    return Math.min(1, risk)
  }

  /**
   * 优先级排序
   */
  prioritizeActions(actions: PreventiveAction[]): PreventiveAction[] {
    return actions.sort((a, b) => {
      // 首先按紧急度排序
      const urgencyOrder = { critical: 4, high: 3, medium: 2, low: 1 }
      const urgencyDiff = urgencyOrder[b.urgency] - urgencyOrder[a.urgency]
      if (urgencyDiff !== 0) return urgencyDiff

      // 然后按优先级分数排序
      return b.priority - a.priority
    })
  }

  /**
   * 创建预防计划
   */
  createPlan(actions: PreventiveAction[]): PreventivePlan {
    // 选择优先级最高的措施
    const selectedActions = actions
      .filter(a => a.priority >= this.config.minPriorityThreshold)
      .slice(0, this.config.maxActionsPerPlan)

    // 计算总预期影响
    const totalImpact = selectedActions.reduce((sum, a) => sum + a.estimatedImpact, 0)

    // 确定执行窗口
    const executionTimes = selectedActions
      .filter(a => a.bestExecutionTime)
      .map(a => a.bestExecutionTime!.getTime())

    const start = executionTimes.length > 0
      ? new Date(Math.min(...executionTimes))
      : new Date(Date.now() + 24 * 60 * 60 * 1000) // 默认24小时后

    const end = new Date(start.getTime() + 4 * 60 * 60 * 1000) // 4小时执行窗口

    // 确定计划优先级
    const maxUrgency = selectedActions.reduce((max, a) => {
      const urgencyOrder = { critical: 4, high: 3, medium: 2, low: 1 }
      return Math.max(max, urgencyOrder[a.urgency])
    }, 0)

    const planPriority = maxUrgency >= 4 ? 'critical'
      : maxUrgency >= 3 ? 'high'
        : maxUrgency >= 2 ? 'medium' : 'low'

    return {
      id: `plan-${Date.now()}`,
      actions: selectedActions,
      totalEstimatedImpact: totalImpact,
      executionWindow: { start, end },
      priority: planPriority,
      createdAt: new Date()
    }
  }

  /**
   * 去重
   */
  private deduplicateActions(actions: PreventiveAction[]): PreventiveAction[] {
    const seen = new Set<string>()
    return actions.filter(action => {
      const key = `${action.type}-${action.predictedIssue.metric}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  /**
   * 计算优先级
   */
  private calculatePriority(trend: HealthTrend, impact: number): number {
    const severityScore = this.severityToScore(trend.severity) * 50
    const impactScore = (impact / 100) * 30
    const urgencyScore = trend.predictedThresholdTime
      ? this.calculateUrgencyScore(trend.predictedThresholdTime) * 20
      : 10

    return Math.round(severityScore + impactScore + urgencyScore)
  }

  /**
   * 计算紧急度分数
   */
  private calculateUrgencyScore(thresholdTime: Date): number {
    const hoursUntil = (thresholdTime.getTime() - Date.now()) / (1000 * 60 * 60)

    if (hoursUntil < 6) return 1.0
    if (hoursUntil < 12) return 0.8
    if (hoursUntil < 24) return 0.6
    if (hoursUntil < 48) return 0.4
    return 0.2
  }

  /**
   * 计算最佳执行时间
   */
  private calculateBestExecutionTime(trend: HealthTrend, hoursBeforeThreshold: number): Date | undefined {
    if (!trend.predictedThresholdTime) {
      return undefined
    }

    return new Date(trend.predictedThresholdTime.getTime() - hoursBeforeThreshold * 60 * 60 * 1000)
  }

  /**
   * 严重度转分数
   */
  private severityToScore(severity: string): number {
    switch (severity) {
      case 'critical': return 1.0
      case 'high': return 0.7
      case 'medium': return 0.4
      case 'low': return 0.2
      default: return 0.1
    }
  }

  /**
   * 严重度映射到紧急度
   */
  private mapSeverityToUrgency(severity: string): 'low' | 'medium' | 'high' | 'critical' {
    return severity as 'low' | 'medium' | 'high' | 'critical'
  }

  /**
   * 生成措施ID
   */
  private generateActionId(): string {
    return `action-${Date.now()}-${++this.actionCounter}`
  }

  /**
   * 获取统计信息
   */
  getStats(actions: PreventiveAction[]) {
    return {
      totalActions: actions.length,
      automatedActions: actions.filter(a => a.automated).length,
      manualActions: actions.filter(a => !a.automated).length,
      criticalActions: actions.filter(a => a.urgency === 'critical').length,
      highPriorityActions: actions.filter(a => a.priority >= 70).length,
      averagePriority: actions.length > 0
        ? actions.reduce((sum, a) => sum + a.priority, 0) / actions.length
        : 0
    }
  }
}
