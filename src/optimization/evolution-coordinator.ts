/**
 * Evolution Coordinator - 进化协调器
 * Phase 7 Day 5: 自我优化 - 终极集成
 *
 * 职责：
 * - 管理完整的持续优化流程
 * - 追踪进化历史
 * - 自动化持续改进循环
 */

import { EventEmitter } from 'events'
import { PerformanceProfiler, PerformanceProfile } from './performance-profiler.js'
import { CodeQualityAnalyzer, CodeQualityReport } from './code-quality-analyzer.js'
import { OptimizationPlanner, OptimizationStrategy, OptimizationPlan } from './optimization-planner.js'
import { SelfImprovementEngine, ImprovementExecution } from './self-improvement-engine.js'

/**
 * 进化会话
 */
export interface EvolutionSession {
  sessionId: string
  startTime: Date
  endTime?: Date

  // 分析结果
  performanceProfile?: PerformanceProfile
  qualityReport?: CodeQualityReport

  // 优化计划
  strategies: OptimizationStrategy[]
  plan?: OptimizationPlan

  // 执行结果
  executions: ImprovementExecution[]

  // 成果
  success: boolean
  totalImprovement: number
  appliedOptimizations: number
  failedOptimizations: number

  // 元数据
  phase: 'analysis' | 'planning' | 'execution' | 'completed'
  error?: string
}

/**
 * 进化趋势
 */
export type EvolutionTrend = 'improving' | 'stable' | 'declining'

/**
 * 进化统计
 */
export interface EvolutionStats {
  // 会话统计
  totalSessions: number
  successfulSessions: number
  failedSessions: number

  // 优化统计
  totalOptimizations: number
  successfulOptimizations: number
  failedOptimizations: number

  // 累积改进
  cumulativePerformanceGain: number
  cumulativeQualityGain: number

  // 趋势
  evolutionTrend: EvolutionTrend
  avgImprovementPerSession: number

  // 时间
  totalEvolutionTime: number  // 总进化时间（毫秒）
  lastEvolutionTime?: Date
  nextScheduledEvolution?: Date
}

/**
 * 自动优化配置
 */
export interface AutoOptimizationConfig {
  enabled: boolean
  interval: number  // 检查间隔（毫秒）

  // 自动执行条件
  autoApplyThreshold: {
    minROI: number           // 最小ROI才自动执行
    maxRisk: 'low' | 'medium'  // 最大风险等级
    maxEffort: number        // 最大工作量（小时）
  }

  // 人工批准
  requireApproval: boolean
  approvalTimeout: number    // 批准超时（毫秒）
}

/**
 * Coordinator配置
 */
export interface EvolutionCoordinatorConfig {
  // 分析配置
  performanceAnalysis: {
    enabled: boolean
    duration: number  // 采样时长（毫秒）
  }

  qualityAnalysis: {
    enabled: boolean
    basePath: string
  }

  // 优化配置
  optimization: {
    minROI: number
    maxRiskLevel: 'low' | 'medium' | 'high'
    prioritizeQuickWins: boolean
  }

  // 执行配置
  execution: {
    enableAutoExecution: boolean
    enableABTesting: boolean
    autoRollbackOnFailure: boolean
  }

  // 自动化
  autoOptimization: AutoOptimizationConfig
}

/**
 * 进化协调器
 */
export class EvolutionCoordinator extends EventEmitter {
  private config: EvolutionCoordinatorConfig
  private sessions: EvolutionSession[] = []
  private isRunning = false
  private evolutionInterval?: NodeJS.Timeout

  // 组件
  private profiler: PerformanceProfiler
  private analyzer: CodeQualityAnalyzer
  private planner: OptimizationPlanner
  private engine: SelfImprovementEngine

  constructor(
    profiler?: PerformanceProfiler,
    analyzer?: CodeQualityAnalyzer,
    planner?: OptimizationPlanner,
    engine?: SelfImprovementEngine,
    config?: Partial<EvolutionCoordinatorConfig>
  ) {
    super()

    // 初始化或使用提供的组件
    this.profiler = profiler || new PerformanceProfiler()
    this.analyzer = analyzer || new CodeQualityAnalyzer()
    this.planner = planner || new OptimizationPlanner()
    this.engine = engine || new SelfImprovementEngine()

    this.config = {
      performanceAnalysis: {
        enabled: true,
        duration: 10 * 1000
      },
      qualityAnalysis: {
        enabled: true,
        basePath: process.cwd() + '/src'
      },
      optimization: {
        minROI: 2.0,
        maxRiskLevel: 'medium',
        prioritizeQuickWins: true
      },
      execution: {
        enableAutoExecution: true,
        enableABTesting: true,
        autoRollbackOnFailure: true
      },
      autoOptimization: {
        enabled: false,
        interval: 60 * 60 * 1000,  // 1小时
        autoApplyThreshold: {
          minROI: 10.0,
          maxRisk: 'low',
          maxEffort: 2
        },
        requireApproval: true,
        approvalTimeout: 30 * 60 * 1000  // 30分钟
      },
      ...config
    }

    console.log('[EvolutionCoordinator] ✅ 进化协调器已初始化')
  }

  /**
   * 启动协调器
   */
  start(): void {
    if (this.isRunning) {
      console.log('[EvolutionCoordinator] ⚠️  已在运行中')
      return
    }

    console.log('[EvolutionCoordinator] 🚀 启动进化协调器')

    this.isRunning = true

    // 启动自动优化（如果启用）
    if (this.config.autoOptimization.enabled) {
      this.evolutionInterval = setInterval(() => {
        this.performEvolution().catch(err => {
          console.error('[EvolutionCoordinator] 自动进化失败:', err)
        })
      }, this.config.autoOptimization.interval)

      console.log(`[EvolutionCoordinator] ✅ 自动优化已启用（间隔: ${this.config.autoOptimization.interval / 1000}秒）`)

      // 立即执行一次
      setTimeout(() => {
        this.performEvolution().catch(err => {
          console.error('[EvolutionCoordinator] 初始进化失败:', err)
        })
      }, 5000)
    }

    this.emit('coordinator-started')
  }

  /**
   * 停止协调器
   */
  stop(): void {
    if (!this.isRunning) {
      return
    }

    console.log('[EvolutionCoordinator] ⏹️  停止进化协调器')

    this.isRunning = false

    if (this.evolutionInterval) {
      clearInterval(this.evolutionInterval)
      this.evolutionInterval = undefined
    }

    this.emit('coordinator-stopped')
  }

  /**
   * 手动触发进化
   */
  async triggerEvolution(): Promise<EvolutionSession> {
    console.log('[EvolutionCoordinator] 🔮 手动触发进化会话')
    return await this.performEvolution()
  }

  /**
   * 执行完整进化流程
   */
  private async performEvolution(): Promise<EvolutionSession> {
    console.log('\n🌟 ========================================')
    console.log('🌟 Prophet 进化会话')
    console.log('🌟 ========================================')

    const session: EvolutionSession = {
      sessionId: `evolution-${Date.now()}`,
      startTime: new Date(),
      strategies: [],
      executions: [],
      success: false,
      totalImprovement: 0,
      appliedOptimizations: 0,
      failedOptimizations: 0,
      phase: 'analysis'
    }

    try {
      this.emit('evolution-started', session)

      // 阶段1: 性能分析
      if (this.config.performanceAnalysis.enabled) {
        console.log('\n📊 [阶段1/4] 性能分析')
        console.log('─────────────────')
        session.phase = 'analysis'

        this.profiler.startProfiling()
        console.log('   启动性能采样...')

        // 模拟工作负载
        await this.simulateWorkload()

        session.performanceProfile = this.profiler.stopProfiling()
        const perfAnalysis = this.profiler.analyzeProfile(session.performanceProfile)

        console.log(`   ✅ 性能分析完成`)
        console.log(`      分数: ${perfAnalysis.score}/100`)
        console.log(`      CPU: 平均${session.performanceProfile.cpu.average.toFixed(1)}%`)
        console.log(`      热点: ${session.performanceProfile.cpu.hotspots.length}个`)
        console.log(`      瓶颈: ${session.performanceProfile.bottlenecks.length}个`)
      }

      // 阶段2: 质量分析
      if (this.config.qualityAnalysis.enabled) {
        console.log('\n📊 [阶段2/4] 质量分析')
        console.log('─────────────────')

        console.log(`   扫描代码库: ${this.config.qualityAnalysis.basePath}`)
        session.qualityReport = await this.analyzer.analyzeCodebase(this.config.qualityAnalysis.basePath)

        console.log(`   ✅ 质量分析完成`)
        console.log(`      分数: ${session.qualityReport.score}/100 [${session.qualityReport.grade}]`)
        console.log(`      文件: ${session.qualityReport.totalFiles}`)
        console.log(`      代码行: ${session.qualityReport.totalLines}`)
        console.log(`      异味: ${session.qualityReport.smells.length}个`)
        console.log(`      机会: ${session.qualityReport.opportunities.length}个`)
      }

      // 阶段3: 策略规划
      console.log('\n🎯 [阶段3/4] 策略规划')
      console.log('─────────────────')
      session.phase = 'planning'

      session.strategies = this.planner.generateStrategies(
        session.performanceProfile,
        session.qualityReport
      )

      console.log(`   ✅ 生成了 ${session.strategies.length} 个策略`)

      if (session.strategies.length === 0) {
        console.log('   ℹ️  未发现优化机会，系统已优化良好')
        session.success = true
        session.phase = 'completed'
        this.sessions.push(session)
        return session
      }

      // 创建计划
      session.plan = this.planner.createPlan(session.strategies)

      console.log(`   快速见效: ${session.plan.quickWins.length}个`)
      console.log(`   阶段数: ${session.plan.phases.length}`)
      console.log(`   预期收益: 性能+${session.plan.totalExpectedGain.performance.toFixed(0)}%, 质量+${session.plan.totalExpectedGain.quality.toFixed(0)}`)

      // 阶段4: 执行优化
      console.log('\n🤖 [阶段4/4] 执行优化')
      console.log('─────────────────')
      session.phase = 'execution'

      // 筛选可自动执行的策略
      const autoStrategies = this.filterAutoExecutableStrategies(session.strategies)

      console.log(`   可自动执行: ${autoStrategies.length}/${session.strategies.length}`)

      if (autoStrategies.length === 0) {
        console.log('   ℹ️  无可自动执行的策略（需人工批准）')
        session.success = true
        session.phase = 'completed'
        this.sessions.push(session)
        return session
      }

      // 执行自动策略
      for (let i = 0; i < autoStrategies.length; i++) {
        const strategy = autoStrategies[i]

        console.log(`\n   [${i + 1}/${autoStrategies.length}] ${strategy.title}`)
        console.log(`      ROI: ${strategy.roi.toFixed(2)}, 风险: ${strategy.effort.risk}`)

        try {
          const execution = await this.engine.executeStrategy(strategy)
          session.executions.push(execution)

          if (execution.status === 'completed' && execution.result?.success) {
            session.appliedOptimizations++
            session.totalImprovement += execution.result.actualGain
            console.log(`      ✅ 成功 (+${execution.result.actualGain.toFixed(1)}%)`)
          } else {
            session.failedOptimizations++
            console.log(`      ❌ 失败/回滚`)
          }

        } catch (err: any) {
          console.error(`      ❌ 执行错误: ${err.message}`)
          session.failedOptimizations++
        }
      }

      // 标记会话成功
      session.success = session.appliedOptimizations > 0
      session.phase = 'completed'
      session.endTime = new Date()

      // 结果汇总
      console.log('\n✨ ========================================')
      console.log('✨ 进化会话完成')
      console.log('✨ ========================================')
      console.log(`   会话ID: ${session.sessionId}`)
      console.log(`   成功: ${session.success ? '✅' : '❌'}`)
      console.log(`   策略数: ${session.strategies.length}`)
      console.log(`   执行数: ${session.executions.length}`)
      console.log(`   成功: ${session.appliedOptimizations}`)
      console.log(`   失败: ${session.failedOptimizations}`)
      console.log(`   总改进: +${session.totalImprovement.toFixed(1)}%`)
      console.log(`   用时: ${((session.endTime.getTime() - session.startTime.getTime()) / 1000).toFixed(1)}秒`)
      console.log('')

      this.emit('evolution-completed', session)

    } catch (error: any) {
      console.error('[EvolutionCoordinator] 进化失败:', error.message)
      session.success = false
      session.error = error.message
      session.endTime = new Date()
      this.emit('evolution-failed', { session, error: error.message })
    } finally {
      this.sessions.push(session)
    }

    return session
  }

  /**
   * 筛选可自动执行的策略
   */
  private filterAutoExecutableStrategies(strategies: OptimizationStrategy[]): OptimizationStrategy[] {
    if (!this.config.execution.enableAutoExecution) {
      return []
    }

    const threshold = this.config.autoOptimization.autoApplyThreshold

    return strategies.filter(s => {
      // 必须是自动化策略
      if (!s.automated) return false

      // ROI要高
      if (s.roi < threshold.minROI) return false

      // 风险要低
      const riskLevels = ['low', 'medium', 'high']
      if (riskLevels.indexOf(s.effort.risk) > riskLevels.indexOf(threshold.maxRisk)) {
        return false
      }

      // 工作量要小
      if (s.effort.hours > threshold.maxEffort) return false

      return true
    })
  }

  /**
   * 模拟工作负载
   */
  private async simulateWorkload(): Promise<void> {
    for (let i = 0; i < 3; i++) {
      let result = 0
      for (let j = 0; j < 100000; j++) {
        result += Math.sqrt(j) * Math.random()
      }
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  /**
   * 获取进化历史
   */
  getEvolutionHistory(count: number = 10): EvolutionSession[] {
    return this.sessions.slice(-count)
  }

  /**
   * 获取最新会话
   */
  getLatestSession(): EvolutionSession | undefined {
    return this.sessions[this.sessions.length - 1]
  }

  /**
   * 获取统计信息
   */
  getStats(): EvolutionStats {
    const successful = this.sessions.filter(s => s.success)
    const failed = this.sessions.filter(s => !s.success)

    const totalOptimizations = this.sessions.reduce((sum, s) => sum + s.executions.length, 0)
    const successfulOptimizations = this.sessions.reduce((sum, s) => sum + s.appliedOptimizations, 0)
    const failedOptimizations = this.sessions.reduce((sum, s) => sum + s.failedOptimizations, 0)

    const cumulativePerformanceGain = this.sessions.reduce((sum, s) => sum + s.totalImprovement, 0)
    const cumulativeQualityGain = this.sessions.reduce((sum, s) => {
      const qualityGain = s.executions
        .filter(e => e.result?.success)
        .reduce((qSum, e) => qSum + (e.result?.qualityChange || 0), 0)
      return sum + qualityGain
    }, 0)

    // 计算趋势
    let evolutionTrend: EvolutionTrend = 'stable'
    if (this.sessions.length >= 3) {
      const recentSessions = this.sessions.slice(-3)
      const improvements = recentSessions.map(s => s.totalImprovement)

      if (improvements[2] > improvements[1] && improvements[1] > improvements[0]) {
        evolutionTrend = 'improving'
      } else if (improvements[2] < improvements[1] && improvements[1] < improvements[0]) {
        evolutionTrend = 'declining'
      }
    }

    const avgImprovementPerSession = this.sessions.length > 0
      ? cumulativePerformanceGain / this.sessions.length
      : 0

    const totalEvolutionTime = this.sessions.reduce((sum, s) => {
      return sum + (s.endTime && s.startTime ? s.endTime.getTime() - s.startTime.getTime() : 0)
    }, 0)

    const lastSession = this.sessions[this.sessions.length - 1]
    const lastEvolutionTime = lastSession?.endTime

    let nextScheduledEvolution: Date | undefined
    if (this.config.autoOptimization.enabled && lastEvolutionTime) {
      nextScheduledEvolution = new Date(lastEvolutionTime.getTime() + this.config.autoOptimization.interval)
    }

    return {
      totalSessions: this.sessions.length,
      successfulSessions: successful.length,
      failedSessions: failed.length,
      totalOptimizations,
      successfulOptimizations,
      failedOptimizations,
      cumulativePerformanceGain,
      cumulativeQualityGain,
      evolutionTrend,
      avgImprovementPerSession,
      totalEvolutionTime,
      lastEvolutionTime,
      nextScheduledEvolution
    }
  }

  /**
   * 启用/禁用自动优化
   */
  setAutoOptimization(enabled: boolean): void {
    this.config.autoOptimization.enabled = enabled
    console.log(`[EvolutionCoordinator] 自动优化已${enabled ? '启用' : '禁用'}`)

    if (enabled && this.isRunning && !this.evolutionInterval) {
      // 启动自动优化
      this.evolutionInterval = setInterval(() => {
        this.performEvolution().catch(err => {
          console.error('[EvolutionCoordinator] 自动进化失败:', err)
        })
      }, this.config.autoOptimization.interval)
    } else if (!enabled && this.evolutionInterval) {
      // 停止自动优化
      clearInterval(this.evolutionInterval)
      this.evolutionInterval = undefined
    }
  }

  /**
   * 清除历史
   */
  clearHistory(): void {
    this.sessions = []
    console.log('[EvolutionCoordinator] 历史已清除')
  }

  /**
   * 获取配置
   */
  getConfig(): EvolutionCoordinatorConfig {
    return { ...this.config }
  }
}
