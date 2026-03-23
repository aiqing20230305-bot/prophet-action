/**
 * Prophet Pattern Learner - 模式学习系统
 *
 * Phase 4.3: 模式学习
 *
 * 目标：从历史数据中学习，持续改进预测准确度
 *
 * 学习内容：
 * - 成功的优化模式（记录什么有效）
 * - 失败的尝试（记录什么无效）
 * - 预测准确度（提升预测质量）
 * - 问题重复模式（识别根本原因）
 *
 * 学习策略：
 * - 强化学习：成功模式权重+1，失败模式权重-1
 * - 相似度匹配：新问题匹配历史模式
 * - 趋势分析：识别长期趋势
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { Pattern, Prediction } from './predictive-analyzer.js'
import { PreventionAction, PreventionResult } from './proactive-optimizer.js'

export interface LearnedPattern {
  id: string
  name: string
  description: string
  successCount: number
  failureCount: number
  weight: number  // 权重（-10 到 10）
  lastSeen: Date
  examples: {
    success: string[]
    failure: string[]
  }
  tags: string[]
}

export interface OptimizationLearning {
  actionType: PreventionAction['type']
  description: string
  workedWell: boolean
  context: {
    projectId: string
    issueType: string
    severity: string
  }
  timestamp: Date
  notes: string
}

export interface PredictionAccuracy {
  predictionId: string
  predicted: string
  actuallyOccurred: boolean
  confidence: number
  wasAccurate: boolean
  timestamp: Date
}

export class PatternLearner {
  private learnedPatterns: Map<string, LearnedPattern> = new Map()
  private optimizationLearnings: OptimizationLearning[] = []
  private predictionAccuracies: PredictionAccuracy[] = []
  private storageDir: string

  constructor(options: {
    storageDir?: string
  } = {}) {
    this.storageDir = options.storageDir || join(process.cwd(), '.prophet-learning')

    // 确保存储目录存在
    if (!existsSync(this.storageDir)) {
      mkdirSync(this.storageDir, { recursive: true })
    }

    // 加载历史学习数据
    this.loadLearnings()
  }

  /**
   * 从成功案例学习
   */
  learnFromSuccess(
    pattern: Pattern,
    action: PreventionAction,
    result: PreventionResult
  ): void {
    console.log(`\n📚 [PatternLearner] 学习成功案例`)
    console.log(`   模式: ${pattern.name}`)
    console.log(`   措施: ${action.description}`)

    // 1. 更新模式权重
    this.updatePatternWeight(pattern, +1)

    // 2. 记录优化学习
    this.optimizationLearnings.push({
      actionType: action.type,
      description: action.description,
      workedWell: true,
      context: {
        projectId: pattern.id.split('-')[0] || 'unknown',
        issueType: pattern.type,
        severity: 'medium'  // TODO: 从action获取
      },
      timestamp: new Date(),
      notes: `成功预防了 ${pattern.name}`
    })

    console.log(`   ✓ 模式权重更新为: ${this.learnedPatterns.get(pattern.id)?.weight || 0}`)

    // 3. 持久化
    this.saveLearnings()

    // 4. 发出学习事件
    this.emitLearningEvent('success', pattern, action)
  }

  /**
   * 从失败案例学习
   */
  learnFromFailure(
    pattern: Pattern,
    action: PreventionAction,
    result: PreventionResult,
    reason: string
  ): void {
    console.log(`\n📚 [PatternLearner] 学习失败案例`)
    console.log(`   模式: ${pattern.name}`)
    console.log(`   措施: ${action.description}`)
    console.log(`   原因: ${reason}`)

    // 1. 更新模式权重
    this.updatePatternWeight(pattern, -1)

    // 2. 记录优化学习
    this.optimizationLearnings.push({
      actionType: action.type,
      description: action.description,
      workedWell: false,
      context: {
        projectId: pattern.id.split('-')[0] || 'unknown',
        issueType: pattern.type,
        severity: 'medium'
      },
      timestamp: new Date(),
      notes: `失败: ${reason}`
    })

    console.log(`   ✓ 模式权重更新为: ${this.learnedPatterns.get(pattern.id)?.weight || 0}`)

    // 3. 持久化
    this.saveLearnings()

    // 4. 发出学习事件
    this.emitLearningEvent('failure', pattern, action)
  }

  /**
   * 记录预测准确度
   */
  recordPredictionAccuracy(
    prediction: Prediction,
    actuallyOccurred: boolean
  ): void {
    console.log(`\n📊 [PatternLearner] 记录预测准确度`)
    console.log(`   预测: ${prediction.description}`)
    console.log(`   置信度: ${(prediction.confidence * 100).toFixed(0)}%`)
    console.log(`   实际发生: ${actuallyOccurred ? '是' : '否'}`)

    // 判断预测是否准确
    // 高置信度预测应该发生，低置信度预测可以不发生
    const wasAccurate = prediction.confidence > 0.7
      ? actuallyOccurred  // 高置信度：发生了才算准确
      : !actuallyOccurred  // 低置信度：没发生才算准确

    this.predictionAccuracies.push({
      predictionId: prediction.id,
      predicted: prediction.description,
      actuallyOccurred,
      confidence: prediction.confidence,
      wasAccurate,
      timestamp: new Date()
    })

    console.log(`   准确性: ${wasAccurate ? '✅ 准确' : '❌ 不准确'}`)

    // 持久化
    this.saveLearnings()
  }

  /**
   * 更新模式权重
   */
  private updatePatternWeight(pattern: Pattern, delta: number): void {
    let learned = this.learnedPatterns.get(pattern.id)

    if (!learned) {
      // 创建新学习模式
      learned = {
        id: pattern.id,
        name: pattern.name,
        description: pattern.description,
        successCount: delta > 0 ? 1 : 0,
        failureCount: delta < 0 ? 1 : 0,
        weight: delta,
        lastSeen: new Date(),
        examples: {
          success: delta > 0 ? [pattern.description] : [],
          failure: delta < 0 ? [pattern.description] : []
        },
        tags: [pattern.type]
      }
    } else {
      // 更新现有模式
      if (delta > 0) {
        learned.successCount++
        learned.examples.success.push(pattern.description)
      } else {
        learned.failureCount++
        learned.examples.failure.push(pattern.description)
      }

      // 权重限制在 -10 到 10
      learned.weight = Math.max(-10, Math.min(10, learned.weight + delta))
      learned.lastSeen = new Date()
    }

    this.learnedPatterns.set(pattern.id, learned)
  }

  /**
   * 获取最佳模式（权重最高）
   */
  getBestPatterns(limit: number = 10): LearnedPattern[] {
    const patterns = Array.from(this.learnedPatterns.values())
    return patterns
      .sort((a, b) => b.weight - a.weight)
      .slice(0, limit)
  }

  /**
   * 获取最差模式（权重最低，应该避免）
   */
  getWorstPatterns(limit: number = 10): LearnedPattern[] {
    const patterns = Array.from(this.learnedPatterns.values())
    return patterns
      .sort((a, b) => a.weight - b.weight)
      .slice(0, limit)
  }

  /**
   * 查找相似模式
   *
   * 用于新问题匹配历史经验
   */
  findSimilarPatterns(
    description: string,
    type?: string
  ): LearnedPattern[] {
    const similar: Array<{ pattern: LearnedPattern, similarity: number }> = []

    for (const pattern of this.learnedPatterns.values()) {
      // 类型匹配
      if (type && !pattern.tags.includes(type)) {
        continue
      }

      // 计算相似度
      const similarity = this.calculateSimilarity(description, pattern.description)

      if (similarity > 0.5) {  // 相似度阈值
        similar.push({ pattern, similarity })
      }
    }

    // 按相似度排序
    similar.sort((a, b) => b.similarity - a.similarity)

    return similar.slice(0, 5).map(s => s.pattern)
  }

  /**
   * 计算文本相似度（简单版）
   */
  private calculateSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/))
    const words2 = new Set(text2.toLowerCase().split(/\s+/))

    // Jaccard相似度
    const intersection = new Set([...words1].filter(w => words2.has(w)))
    const union = new Set([...words1, ...words2])

    return intersection.size / union.size
  }

  /**
   * 获取预测准确率
   */
  getPredictionAccuracyRate(): {
    total: number
    accurate: number
    rate: number
    byConfidence: {
      high: { total: number, accurate: number, rate: number }
      medium: { total: number, accurate: number, rate: number }
      low: { total: number, accurate: number, rate: number }
    }
  } {
    const total = this.predictionAccuracies.length
    const accurate = this.predictionAccuracies.filter(p => p.wasAccurate).length

    // 按置信度分组
    const high = this.predictionAccuracies.filter(p => p.confidence >= 0.8)
    const medium = this.predictionAccuracies.filter(p => p.confidence >= 0.6 && p.confidence < 0.8)
    const low = this.predictionAccuracies.filter(p => p.confidence < 0.6)

    return {
      total,
      accurate,
      rate: total > 0 ? accurate / total : 0,
      byConfidence: {
        high: {
          total: high.length,
          accurate: high.filter(p => p.wasAccurate).length,
          rate: high.length > 0 ? high.filter(p => p.wasAccurate).length / high.length : 0
        },
        medium: {
          total: medium.length,
          accurate: medium.filter(p => p.wasAccurate).length,
          rate: medium.length > 0 ? medium.filter(p => p.wasAccurate).length / medium.length : 0
        },
        low: {
          total: low.length,
          accurate: low.filter(p => p.wasAccurate).length,
          rate: low.length > 0 ? low.filter(p => p.wasAccurate).length / low.length : 0
        }
      }
    }
  }

  /**
   * 获取优化建议
   *
   * 基于学习历史给出建议
   */
  getOptimizationRecommendations(context: {
    projectId: string
    issueType: string
  }): string[] {
    const recommendations: string[] = []

    // 查找相关的成功案例
    const relevant = this.optimizationLearnings.filter(l =>
      l.workedWell &&
      l.context.projectId === context.projectId &&
      l.context.issueType === context.issueType
    )

    if (relevant.length > 0) {
      // 统计最有效的措施类型
      const typeCount: Map<string, number> = new Map()
      for (const learning of relevant) {
        typeCount.set(learning.actionType, (typeCount.get(learning.actionType) || 0) + 1)
      }

      const sorted = Array.from(typeCount.entries()).sort((a, b) => b[1] - a[1])

      recommendations.push(
        `对于 ${context.issueType} 类型问题，以下措施最有效:`
      )

      for (const [type, count] of sorted.slice(0, 3)) {
        recommendations.push(`- ${type} (成功${count}次)`)
      }
    }

    // 查找失败案例，给出避免建议
    const failures = this.optimizationLearnings.filter(l =>
      !l.workedWell &&
      l.context.projectId === context.projectId &&
      l.context.issueType === context.issueType
    )

    if (failures.length > 0) {
      recommendations.push(`\n避免以下措施（曾经失败）:`)
      for (const failure of failures.slice(0, 3)) {
        recommendations.push(`- ${failure.actionType}: ${failure.notes}`)
      }
    }

    return recommendations
  }

  /**
   * 打印学习报告
   */
  printLearningReport(): void {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    console.log(`📚 [PatternLearner] 学习报告`)
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)

    // 模式统计
    console.log(`\n📊 学习的模式数量: ${this.learnedPatterns.size}`)

    const best = this.getBestPatterns(3)
    if (best.length > 0) {
      console.log(`\n✅ 最佳模式（权重最高）:`)
      for (const pattern of best) {
        console.log(`   ${pattern.name} (权重: ${pattern.weight})`)
        console.log(`      成功: ${pattern.successCount}次, 失败: ${pattern.failureCount}次`)
      }
    }

    const worst = this.getWorstPatterns(3)
    if (worst.length > 0) {
      console.log(`\n❌ 最差模式（应避免）:`)
      for (const pattern of worst) {
        console.log(`   ${pattern.name} (权重: ${pattern.weight})`)
        console.log(`      成功: ${pattern.successCount}次, 失败: ${pattern.failureCount}次`)
      }
    }

    // 预测准确率
    const accuracy = this.getPredictionAccuracyRate()
    console.log(`\n🎯 预测准确率:`)
    console.log(`   总计: ${accuracy.accurate}/${accuracy.total} (${(accuracy.rate * 100).toFixed(1)}%)`)
    console.log(`   高置信度(≥0.8): ${accuracy.byConfidence.high.accurate}/${accuracy.byConfidence.high.total} (${(accuracy.byConfidence.high.rate * 100).toFixed(1)}%)`)
    console.log(`   中置信度(0.6-0.8): ${accuracy.byConfidence.medium.accurate}/${accuracy.byConfidence.medium.total} (${(accuracy.byConfidence.medium.rate * 100).toFixed(1)}%)`)
    console.log(`   低置信度(<0.6): ${accuracy.byConfidence.low.accurate}/${accuracy.byConfidence.low.total} (${(accuracy.byConfidence.low.rate * 100).toFixed(1)}%)`)

    // 优化学习
    const successfulOptimizations = this.optimizationLearnings.filter(l => l.workedWell).length
    console.log(`\n🔧 优化学习:`)
    console.log(`   成功: ${successfulOptimizations}/${this.optimizationLearnings.length}`)

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)
  }

  /**
   * 持久化学习数据
   */
  private saveLearnings(): void {
    try {
      // 保存模式
      const patternsPath = join(this.storageDir, 'learned-patterns.json')
      writeFileSync(patternsPath, JSON.stringify(
        Array.from(this.learnedPatterns.values()),
        null,
        2
      ))

      // 保存优化学习
      const learningsPath = join(this.storageDir, 'optimization-learnings.json')
      writeFileSync(learningsPath, JSON.stringify(this.optimizationLearnings, null, 2))

      // 保存预测准确度
      const accuracyPath = join(this.storageDir, 'prediction-accuracy.json')
      writeFileSync(accuracyPath, JSON.stringify(this.predictionAccuracies, null, 2))

    } catch (error: any) {
      console.warn(`⚠️  保存学习数据失败: ${error.message}`)
    }
  }

  /**
   * 加载学习数据
   */
  private loadLearnings(): void {
    try {
      // 加载模式
      const patternsPath = join(this.storageDir, 'learned-patterns.json')
      if (existsSync(patternsPath)) {
        const patterns: LearnedPattern[] = JSON.parse(readFileSync(patternsPath, 'utf-8'))
        for (const pattern of patterns) {
          this.learnedPatterns.set(pattern.id, pattern)
        }
        console.log(`📚 加载了 ${patterns.length} 个学习模式`)
      }

      // 加载优化学习
      const learningsPath = join(this.storageDir, 'optimization-learnings.json')
      if (existsSync(learningsPath)) {
        this.optimizationLearnings = JSON.parse(readFileSync(learningsPath, 'utf-8'))
        console.log(`📚 加载了 ${this.optimizationLearnings.length} 条优化学习`)
      }

      // 加载预测准确度
      const accuracyPath = join(this.storageDir, 'prediction-accuracy.json')
      if (existsSync(accuracyPath)) {
        this.predictionAccuracies = JSON.parse(readFileSync(accuracyPath, 'utf-8'))
        console.log(`📚 加载了 ${this.predictionAccuracies.length} 条预测准确度记录`)
      }

    } catch (error: any) {
      console.warn(`⚠️  加载学习数据失败: ${error.message}`)
    }
  }

  /**
   * 发出学习事件（用于日志/通知）
   */
  private emitLearningEvent(
    type: 'success' | 'failure',
    pattern: Pattern,
    action: PreventionAction
  ): void {
    // TODO: 可以集成到EventEmitter系统
    // this.emit('learning', { type, pattern, action })
  }

  /**
   * 清除所有学习数据
   */
  clearAllLearnings(): void {
    this.learnedPatterns.clear()
    this.optimizationLearnings = []
    this.predictionAccuracies = []
    this.saveLearnings()
    console.log(`🗑️  所有学习数据已清除`)
  }
}

/**
 * 使用示例：
 *
 * const learner = new PatternLearner({ storageDir: '.prophet-learning' })
 *
 * // 1. 学习成功案例
 * learner.learnFromSuccess(pattern, action, result)
 *
 * // 2. 学习失败案例
 * learner.learnFromFailure(pattern, action, result, '原因描述')
 *
 * // 3. 记录预测准确度
 * learner.recordPredictionAccuracy(prediction, true)
 *
 * // 4. 获取建议
 * const recommendations = learner.getOptimizationRecommendations({
 *   projectId: 'videoplay',
 *   issueType: 'file-hotspot'
 * })
 *
 * // 5. 打印报告
 * learner.printLearningReport()
 */
