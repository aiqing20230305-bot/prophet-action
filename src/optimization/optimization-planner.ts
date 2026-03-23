/**
 * Optimization Planner - 优化策略规划器
 * Phase 7 Day 3: 自我优化
 *
 * 职责：
 * - 基于性能和质量分析生成优化策略
 * - 评估优化收益和成本
 * - 优先级排序和计划制定
 */

import { EventEmitter } from 'events'
import { PerformanceProfile, HotSpot, Bottleneck } from './performance-profiler.js'
import { CodeQualityReport, CodeSmell, OptimizationOpportunity as QualityOpportunity } from './code-quality-analyzer.js'

/**
 * 优化步骤
 */
export interface OptimizationStep {
  order: number
  action: string
  description: string
  estimatedTime: number  // 分钟
  verification: string
}

/**
 * 优化策略
 */
export interface OptimizationStrategy {
  id: string
  title: string
  description: string
  category: 'performance' | 'quality' | 'architecture' | 'maintenance'

  // 收益
  benefits: {
    performanceGain: number     // 性能提升百分比
    qualityImprovement: number  // 质量分数提升
    maintenanceSaving: number   // 维护成本降低百分比
    totalValue: number          // 总价值分数
  }

  // 成本
  effort: {
    hours: number
    complexity: 'low' | 'medium' | 'high'
    risk: 'low' | 'medium' | 'high'
    totalCost: number  // 总成本分数
  }

  // 优先级
  priority: number  // 0-100
  roi: number       // 收益/成本比
  urgency: 'low' | 'medium' | 'high' | 'critical'

  // 实施
  steps: OptimizationStep[]
  dependencies: string[]  // 依赖的其他策略ID
  automated: boolean      // 是否可自动执行
  confidence: number      // 可信度 0-100

  // 元数据
  source: 'performance' | 'quality' | 'hybrid'
  createdAt: Date
}

/**
 * 策略评估
 */
export interface StrategyEvaluation {
  strategy: OptimizationStrategy
  feasibility: number      // 可行性 0-100
  effectiveness: number    // 有效性 0-100
  risk: number            // 风险 0-100
  recommendation: 'execute' | 'defer' | 'reject'
  reasoning: string
}

/**
 * 优化阶段
 */
export interface OptimizationPhase {
  name: string
  description: string
  strategies: OptimizationStrategy[]
  sequenceOrder: number
  estimatedDuration: number  // 小时
  expectedGain: number       // 预期总收益
}

/**
 * 优化计划
 */
export interface OptimizationPlan {
  id: string
  name: string
  createdAt: Date

  strategies: OptimizationStrategy[]
  phases: OptimizationPhase[]

  totalExpectedGain: {
    performance: number
    quality: number
  }

  estimatedDuration: number  // 总时长（小时）
  totalROI: number

  quickWins: OptimizationStrategy[]  // 快速见效的优化
  longTerm: OptimizationStrategy[]   // 长期优化
}

/**
 * Planner配置
 */
export interface OptimizationPlannerConfig {
  minROI: number                    // 最小ROI才考虑
  maxRiskLevel: 'low' | 'medium' | 'high'
  prioritizeQuickWins: boolean
  autoApprovalThreshold: number     // 自动批准的ROI阈值
}

/**
 * 优化策略规划器
 */
export class OptimizationPlanner extends EventEmitter {
  private config: OptimizationPlannerConfig
  private strategyIdCounter = 0

  constructor(config?: Partial<OptimizationPlannerConfig>) {
    super()

    this.config = {
      minROI: 2.0,
      maxRiskLevel: 'medium',
      prioritizeQuickWins: true,
      autoApprovalThreshold: 10.0,
      ...config
    }
  }

  /**
   * 生成优化策略
   */
  generateStrategies(
    perfProfile?: PerformanceProfile,
    qualityReport?: CodeQualityReport
  ): OptimizationStrategy[] {
    console.log('[OptimizationPlanner] 🎯 生成优化策略...')

    const strategies: OptimizationStrategy[] = []

    // 1. 基于性能分析的策略
    if (perfProfile) {
      strategies.push(...this.generatePerformanceStrategies(perfProfile))
    }

    // 2. 基于质量分析的策略
    if (qualityReport) {
      strategies.push(...this.generateQualityStrategies(qualityReport))
    }

    // 3. 混合策略（同时提升性能和质量）
    if (perfProfile && qualityReport) {
      strategies.push(...this.generateHybridStrategies(perfProfile, qualityReport))
    }

    console.log(`[OptimizationPlanner] ✅ 生成了 ${strategies.length} 个策略`)

    this.emit('strategies-generated', { count: strategies.length })

    return strategies
  }

  /**
   * 生成性能优化策略
   */
  private generatePerformanceStrategies(profile: PerformanceProfile): OptimizationStrategy[] {
    const strategies: OptimizationStrategy[] = []

    // CPU热点优化
    for (const hotspot of profile.cpu.hotspots.slice(0, 5)) {
      if (hotspot.percentage > 15) {
        strategies.push(this.createStrategy({
          title: `优化CPU热点: ${hotspot.function}`,
          description: `该函数占用${hotspot.percentage.toFixed(1)}% CPU时间，调用${hotspot.calls}次`,
          category: 'performance',
          benefits: {
            performanceGain: Math.min(50, hotspot.percentage * 0.8),
            qualityImprovement: 5,
            maintenanceSaving: 10
          },
          effort: {
            hours: hotspot.percentage > 30 ? 8 : 4,
            complexity: hotspot.percentage > 30 ? 'high' : 'medium',
            risk: 'medium'
          },
          steps: [
            {
              order: 1,
              action: '分析热点原因',
              description: `使用profiler深入分析${hotspot.function}的性能瓶颈`,
              estimatedTime: 30,
              verification: '确认瓶颈位置'
            },
            {
              order: 2,
              action: '实施优化',
              description: '应用算法优化、缓存或其他优化技术',
              estimatedTime: hotspot.percentage > 30 ? 180 : 90,
              verification: '验证性能提升'
            },
            {
              order: 3,
              action: '性能测试',
              description: 'A/B测试验证优化效果',
              estimatedTime: 30,
              verification: '确认达到预期提升'
            }
          ],
          automated: false,
          confidence: 80,
          source: 'performance'
        }))
      }
    }

    // 内存优化
    if (profile.memory.leaks.length > 0) {
      strategies.push(this.createStrategy({
        title: '修复内存泄漏',
        description: `检测到${profile.memory.leaks.length}个内存泄漏`,
        category: 'performance',
        benefits: {
          performanceGain: 25,
          qualityImprovement: 15,
          maintenanceSaving: 30
        },
        effort: {
          hours: profile.memory.leaks.length * 2,
          complexity: 'high',
          risk: 'medium'
        },
        steps: [
          {
            order: 1,
            action: '定位泄漏源',
            description: '使用heap profiler找到泄漏位置',
            estimatedTime: 60,
            verification: '确认泄漏源'
          },
          {
            order: 2,
            action: '修复泄漏',
            description: '释放未使用的对象引用',
            estimatedTime: 90,
            verification: '验证内存增长停止'
          }
        ],
        automated: false,
        confidence: 85,
        source: 'performance'
      }))
    }

    // 瓶颈优化
    for (const bottleneck of profile.bottlenecks) {
      if (bottleneck.impact > 30) {
        strategies.push(this.createStrategy({
          title: `消除${bottleneck.type}瓶颈`,
          description: bottleneck.description,
          category: 'performance',
          benefits: {
            performanceGain: Math.min(40, bottleneck.impact * 0.8),
            qualityImprovement: 5,
            maintenanceSaving: 10
          },
          effort: {
            hours: 3,
            complexity: 'medium',
            risk: 'low'
          },
          steps: [
            {
              order: 1,
              action: bottleneck.suggestion,
              description: `解决${bottleneck.location}的瓶颈`,
              estimatedTime: 120,
              verification: '验证瓶颈消除'
            }
          ],
          automated: false,
          confidence: 75,
          source: 'performance'
        }))
      }
    }

    return strategies
  }

  /**
   * 生成质量优化策略
   */
  private generateQualityStrategies(report: CodeQualityReport): OptimizationStrategy[] {
    const strategies: OptimizationStrategy[] = []

    // 高复杂度函数重构
    const criticalComplexity = report.complexity.high.filter(m => m.cyclomaticComplexity > 30)

    if (criticalComplexity.length > 0) {
      strategies.push(this.createStrategy({
        title: '重构高复杂度函数',
        description: `${criticalComplexity.length}个函数圈复杂度>30，需要重构`,
        category: 'quality',
        benefits: {
          performanceGain: 10,
          qualityImprovement: 25,
          maintenanceSaving: 40
        },
        effort: {
          hours: criticalComplexity.length * 3,
          complexity: 'high',
          risk: 'medium'
        },
        steps: [
          {
            order: 1,
            action: '分析函数职责',
            description: '理解函数的多个职责',
            estimatedTime: 30,
            verification: '职责清单'
          },
          {
            order: 2,
            action: '拆分函数',
            description: '按职责拆分为小函数',
            estimatedTime: 120,
            verification: '复杂度<10'
          },
          {
            order: 3,
            action: '单元测试',
            description: '为新函数编写测试',
            estimatedTime: 60,
            verification: '测试覆盖率>80%'
          }
        ],
        automated: false,
        confidence: 85,
        source: 'quality'
      }))
    }

    // 代码重复消除
    const duplicationSmells = report.smells.filter(s => s.type === 'duplication')

    if (duplicationSmells.length > 20) {
      strategies.push(this.createStrategy({
        title: '消除代码重复',
        description: `发现${duplicationSmells.length}处重复代码`,
        category: 'quality',
        benefits: {
          performanceGain: 5,
          qualityImprovement: 20,
          maintenanceSaving: 50
        },
        effort: {
          hours: 6,
          complexity: 'medium',
          risk: 'low'
        },
        steps: [
          {
            order: 1,
            action: '识别重复模式',
            description: '找出重复代码的共同点',
            estimatedTime: 60,
            verification: '重复模式列表'
          },
          {
            order: 2,
            action: '提取公共函数',
            description: '创建可复用的函数',
            estimatedTime: 120,
            verification: '重复率<10%'
          }
        ],
        automated: true,
        confidence: 90,
        source: 'quality'
      }))
    }

    // 代码异味修复
    const criticalSmells = report.smells.filter(s => s.severity === 'high' || s.severity === 'critical')

    if (criticalSmells.length > 0) {
      strategies.push(this.createStrategy({
        title: '修复严重代码异味',
        description: `${criticalSmells.length}个高/严重级别的代码异味`,
        category: 'quality',
        benefits: {
          performanceGain: 8,
          qualityImprovement: 15,
          maintenanceSaving: 25
        },
        effort: {
          hours: Math.min(16, criticalSmells.length * 0.5),
          complexity: 'medium',
          risk: 'low'
        },
        steps: [
          {
            order: 1,
            action: '修复代码异味',
            description: '逐个处理高优先级异味',
            estimatedTime: criticalSmells.length * 20,
            verification: '严重异味清零'
          }
        ],
        automated: false,
        confidence: 80,
        source: 'quality'
      }))
    }

    return strategies
  }

  /**
   * 生成混合策略
   */
  private generateHybridStrategies(
    profile: PerformanceProfile,
    report: CodeQualityReport
  ): OptimizationStrategy[] {
    const strategies: OptimizationStrategy[] = []

    // 找出既是热点又是高复杂度的函数
    for (const hotspot of profile.cpu.hotspots) {
      const complexity = report.complexity.high.find(
        c => c.location.function === hotspot.function
      )

      if (complexity) {
        strategies.push(this.createStrategy({
          title: `优化热点+简化复杂度: ${hotspot.function}`,
          description: `该函数是CPU热点(${hotspot.percentage.toFixed(1)}%)且复杂度高(${complexity.cyclomaticComplexity})`,
          category: 'performance',
          benefits: {
            performanceGain: Math.min(60, hotspot.percentage * 1.2),
            qualityImprovement: 30,
            maintenanceSaving: 40
          },
          effort: {
            hours: 10,
            complexity: 'high',
            risk: 'medium'
          },
          steps: [
            {
              order: 1,
              action: '性能分析',
              description: 'Profile函数找出瓶颈',
              estimatedTime: 30,
              verification: '瓶颈定位'
            },
            {
              order: 2,
              action: '重构简化',
              description: '降低复杂度同时优化性能',
              estimatedTime: 240,
              verification: '复杂度<10，性能提升>30%'
            },
            {
              order: 3,
              action: '测试验证',
              description: '性能和功能双重验证',
              estimatedTime: 60,
              verification: '通过所有测试'
            }
          ],
          automated: false,
          confidence: 75,
          source: 'hybrid'
        }))
      }
    }

    return strategies
  }

  /**
   * 创建策略
   */
  private createStrategy(params: {
    title: string
    description: string
    category: OptimizationStrategy['category']
    benefits: { performanceGain: number, qualityImprovement: number, maintenanceSaving: number }
    effort: { hours: number, complexity: 'low' | 'medium' | 'high', risk: 'low' | 'medium' | 'high' }
    steps: OptimizationStep[]
    automated: boolean
    confidence: number
    source: 'performance' | 'quality' | 'hybrid'
  }): OptimizationStrategy {
    const { benefits, effort } = params

    // 计算总价值
    const totalValue = benefits.performanceGain * 2 + benefits.qualityImprovement + benefits.maintenanceSaving

    // 计算总成本
    const complexityScore = effort.complexity === 'low' ? 1 : effort.complexity === 'medium' ? 2 : 3
    const riskScore = effort.risk === 'low' ? 1 : effort.risk === 'medium' ? 2 : 3
    const totalCost = effort.hours * complexityScore * riskScore

    // 计算ROI
    const roi = totalCost > 0 ? totalValue / totalCost : 0

    // 计算优先级 (0-100)
    let priority = roi * 10
    if (params.automated) priority += 10
    if (effort.risk === 'low') priority += 5
    priority = Math.min(100, priority)

    // 确定紧急度
    let urgency: OptimizationStrategy['urgency'] = 'low'
    if (benefits.performanceGain > 40 || benefits.qualityImprovement > 30) urgency = 'critical'
    else if (benefits.performanceGain > 25 || benefits.qualityImprovement > 20) urgency = 'high'
    else if (benefits.performanceGain > 15 || benefits.qualityImprovement > 10) urgency = 'medium'

    return {
      id: `strategy-${++this.strategyIdCounter}`,
      title: params.title,
      description: params.description,
      category: params.category,
      benefits: {
        ...benefits,
        totalValue
      },
      effort: {
        ...effort,
        totalCost
      },
      priority,
      roi,
      urgency,
      steps: params.steps,
      dependencies: [],
      automated: params.automated,
      confidence: params.confidence,
      source: params.source,
      createdAt: new Date()
    }
  }

  /**
   * 评估策略
   */
  evaluateStrategy(strategy: OptimizationStrategy): StrategyEvaluation {
    // 可行性评估
    let feasibility = 100
    if (strategy.effort.complexity === 'high') feasibility -= 20
    if (strategy.effort.risk === 'high') feasibility -= 30
    if (strategy.effort.hours > 40) feasibility -= 20

    // 有效性评估
    const effectiveness = strategy.confidence * (strategy.benefits.totalValue / 100)

    // 风险评估
    const riskScore = strategy.effort.risk === 'low' ? 20 : strategy.effort.risk === 'medium' ? 50 : 80

    // 推荐
    let recommendation: 'execute' | 'defer' | 'reject' = 'execute'
    let reasoning = ''

    if (strategy.roi < this.config.minROI) {
      recommendation = 'reject'
      reasoning = `ROI过低(${strategy.roi.toFixed(1)}，需要>${this.config.minROI})`
    } else if (strategy.effort.risk === 'high' && strategy.effort.risk > this.config.maxRiskLevel) {
      recommendation = 'defer'
      reasoning = '风险过高，建议延后或寻求专家帮助'
    } else if (strategy.roi > this.config.autoApprovalThreshold && strategy.automated) {
      recommendation = 'execute'
      reasoning = `高ROI(${strategy.roi.toFixed(1)})且可自动执行，强烈推荐`
    } else if (strategy.effort.hours < 4 && strategy.benefits.performanceGain > 20) {
      recommendation = 'execute'
      reasoning = '快速见效优化，立即执行'
    } else {
      recommendation = 'execute'
      reasoning = `ROI合理(${strategy.roi.toFixed(1)})，建议执行`
    }

    return {
      strategy,
      feasibility,
      effectiveness,
      risk: riskScore,
      recommendation,
      reasoning
    }
  }

  /**
   * 优先级排序
   */
  prioritizeStrategies(strategies: OptimizationStrategy[]): OptimizationStrategy[] {
    return strategies.sort((a, b) => {
      // 优先快速见效
      if (this.config.prioritizeQuickWins) {
        const aQuickWin = a.effort.hours < 4 && a.benefits.performanceGain > 15
        const bQuickWin = b.effort.hours < 4 && b.benefits.performanceGain > 15
        if (aQuickWin && !bQuickWin) return -1
        if (!aQuickWin && bQuickWin) return 1
      }

      // 然后按优先级
      if (a.priority !== b.priority) {
        return b.priority - a.priority
      }

      // 最后按ROI
      return b.roi - a.roi
    })
  }

  /**
   * 创建优化计划
   */
  createPlan(strategies: OptimizationStrategy[]): OptimizationPlan {
    console.log('[OptimizationPlanner] 📋 创建优化计划...')

    // 优先级排序
    const sortedStrategies = this.prioritizeStrategies([...strategies])

    // 分类：快速见效 vs 长期
    const quickWins = sortedStrategies.filter(s => s.effort.hours < 4 && s.roi > 5)
    const longTerm = sortedStrategies.filter(s => s.effort.hours >= 4 || s.roi <= 5)

    // 分阶段
    const phases = this.createPhases(sortedStrategies)

    // 计算总体指标
    const totalExpectedGain = {
      performance: sortedStrategies.reduce((sum, s) => sum + s.benefits.performanceGain, 0),
      quality: sortedStrategies.reduce((sum, s) => sum + s.benefits.qualityImprovement, 0)
    }

    const estimatedDuration = sortedStrategies.reduce((sum, s) => sum + s.effort.hours, 0)
    const totalROI = sortedStrategies.reduce((sum, s) => sum + s.roi, 0) / sortedStrategies.length

    const plan: OptimizationPlan = {
      id: `plan-${Date.now()}`,
      name: 'Prophet自我优化计划',
      createdAt: new Date(),
      strategies: sortedStrategies,
      phases,
      totalExpectedGain,
      estimatedDuration,
      totalROI,
      quickWins,
      longTerm
    }

    console.log(`[OptimizationPlanner] ✅ 计划创建完成`)
    console.log(`   策略总数: ${sortedStrategies.length}`)
    console.log(`   快速见效: ${quickWins.length}`)
    console.log(`   总工作量: ${estimatedDuration.toFixed(1)}小时`)

    this.emit('plan-created', plan)

    return plan
  }

  /**
   * 创建阶段
   */
  private createPhases(strategies: OptimizationStrategy[]): OptimizationPhase[] {
    const phases: OptimizationPhase[] = []

    // 阶段1: 快速见效（<4小时，高ROI）
    const phase1 = strategies.filter(s => s.effort.hours < 4 && s.roi > 5)
    if (phase1.length > 0) {
      phases.push({
        name: '阶段1: 快速见效',
        description: '低工作量、高收益的优化，立即执行',
        strategies: phase1,
        sequenceOrder: 1,
        estimatedDuration: phase1.reduce((sum, s) => sum + s.effort.hours, 0),
        expectedGain: phase1.reduce((sum, s) => sum + s.benefits.performanceGain, 0)
      })
    }

    // 阶段2: 性能优化（性能收益>20%）
    const phase2 = strategies.filter(
      s => s.benefits.performanceGain > 20 && !phase1.includes(s)
    )
    if (phase2.length > 0) {
      phases.push({
        name: '阶段2: 性能优化',
        description: '重点提升系统性能',
        strategies: phase2,
        sequenceOrder: 2,
        estimatedDuration: phase2.reduce((sum, s) => sum + s.effort.hours, 0),
        expectedGain: phase2.reduce((sum, s) => sum + s.benefits.performanceGain, 0)
      })
    }

    // 阶段3: 质量提升（质量收益>15）
    const phase3 = strategies.filter(
      s => s.benefits.qualityImprovement > 15 && !phase1.includes(s) && !phase2.includes(s)
    )
    if (phase3.length > 0) {
      phases.push({
        name: '阶段3: 质量提升',
        description: '改进代码质量和可维护性',
        strategies: phase3,
        sequenceOrder: 3,
        estimatedDuration: phase3.reduce((sum, s) => sum + s.effort.hours, 0),
        expectedGain: phase3.reduce((sum, s) => sum + s.benefits.qualityImprovement, 0)
      })
    }

    // 阶段4: 长期优化（剩余的）
    const phase4 = strategies.filter(
      s => !phase1.includes(s) && !phase2.includes(s) && !phase3.includes(s)
    )
    if (phase4.length > 0) {
      phases.push({
        name: '阶段4: 长期优化',
        description: '架构改进和技术债务清理',
        strategies: phase4,
        sequenceOrder: 4,
        estimatedDuration: phase4.reduce((sum, s) => sum + s.effort.hours, 0),
        expectedGain: phase4.reduce((sum, s) => sum + s.benefits.performanceGain + s.benefits.qualityImprovement, 0)
      })
    }

    return phases
  }

  /**
   * 获取统计
   */
  getStats(strategies: OptimizationStrategy[]) {
    return {
      total: strategies.length,
      byCategory: {
        performance: strategies.filter(s => s.category === 'performance').length,
        quality: strategies.filter(s => s.category === 'quality').length,
        architecture: strategies.filter(s => s.category === 'architecture').length,
        maintenance: strategies.filter(s => s.category === 'maintenance').length
      },
      byUrgency: {
        critical: strategies.filter(s => s.urgency === 'critical').length,
        high: strategies.filter(s => s.urgency === 'high').length,
        medium: strategies.filter(s => s.urgency === 'medium').length,
        low: strategies.filter(s => s.urgency === 'low').length
      },
      automated: strategies.filter(s => s.automated).length,
      averageROI: strategies.reduce((sum, s) => sum + s.roi, 0) / strategies.length,
      totalHours: strategies.reduce((sum, s) => sum + s.effort.hours, 0),
      totalExpectedGain: {
        performance: strategies.reduce((sum, s) => sum + s.benefits.performanceGain, 0),
        quality: strategies.reduce((sum, s) => sum + s.benefits.qualityImprovement, 0)
      }
    }
  }
}
