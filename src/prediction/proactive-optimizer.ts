/**
 * Prophet Proactive Optimizer - 主动优化器
 *
 * Phase 4.2: 提前优化系统
 *
 * 目标：在问题发生前就主动修复
 *
 * 策略：
 * - 接收预测结果
 * - 评估预测置信度
 * - 对高置信度预测采取预防措施
 * - 记录预防效果
 *
 * 工作流程：
 * 1. 获取预测 → 2. 评估风险 → 3. 生成方案 → 4. 执行预防 → 5. 验证效果
 */

import { Prediction } from './predictive-analyzer.js'
import { EventEmitter } from 'events'
import Anthropic from '@anthropic-ai/sdk'

export interface PreventionAction {
  id: string
  predictionId: string
  type: 'refactor' | 'add-test' | 'documentation' | 'code-review' | 'monitoring'
  description: string
  code?: string
  files: string[]
  estimatedImpact: 'low' | 'medium' | 'high'
  safe: boolean
  autoExecutable: boolean
}

export interface PreventionResult {
  actionId: string
  success: boolean
  executedAt: Date
  effect: {
    prevented: boolean
    actualIssue?: string
    savedTime?: number  // 分钟
  }
}

export class ProactiveOptimizer extends EventEmitter {
  private anthropic: Anthropic
  private preventionHistory: PreventionResult[] = []
  private activeActions: Map<string, PreventionAction> = new Map()

  constructor(options: {
    apiKey?: string
    minConfidence?: number  // 最小置信度阈值（默认0.7）
    autoExecute?: boolean   // 是否自动执行（默认false）
  } = {}) {
    super()

    this.anthropic = new Anthropic({
      apiKey: options.apiKey || process.env.ANTHROPIC_API_KEY || ''
    })
  }

  /**
   * 主动优化入口
   */
  async optimizeBeforeIssue(predictions: Prediction[]): Promise<PreventionAction[]> {
    console.log(`\n🛡️  [ProactiveOptimizer] 评估 ${predictions.length} 个预测`)

    const actions: PreventionAction[] = []

    for (const prediction of predictions) {
      console.log(`\n   🔮 预测: ${prediction.description}`)
      console.log(`      置信度: ${(prediction.confidence * 100).toFixed(0)}%`)
      console.log(`      严重度: ${prediction.severity}`)

      // 评估是否需要采取行动
      if (this.shouldTakeAction(prediction)) {
        console.log(`      ✅ 置信度足够，生成预防方案...`)

        const preventionActions = await this.generatePreventionActions(prediction)
        actions.push(...preventionActions)

        for (const action of preventionActions) {
          this.activeActions.set(action.id, action)
          console.log(`      ✓ 生成预防措施: ${action.description}`)
        }
      } else {
        console.log(`      ⏭️  置信度不足或严重度低，跳过`)
      }
    }

    console.log(`\n   ✓ 总计生成 ${actions.length} 个预防措施`)

    return actions
  }

  /**
   * 判断是否应该采取行动
   */
  private shouldTakeAction(prediction: Prediction): boolean {
    // 1. 置信度阈值（默认0.7）
    if (prediction.confidence < 0.7) {
      return false
    }

    // 2. 严重度考虑
    if (prediction.severity === 'low' && prediction.confidence < 0.8) {
      return false
    }

    // 3. 如果是critical，即使置信度0.6也采取行动
    if (prediction.severity === 'critical' && prediction.confidence >= 0.6) {
      return true
    }

    return true
  }

  /**
   * 生成预防措施
   */
  private async generatePreventionActions(prediction: Prediction): Promise<PreventionAction[]> {
    const actions: PreventionAction[] = []

    // 1. 基于预测类型生成规则预防措施
    const ruleBasedActions = this.generateRuleBasedActions(prediction)
    actions.push(...ruleBasedActions)

    // 2. 使用AI生成定制化预防措施
    const aiAction = await this.generateAIAction(prediction)
    if (aiAction) {
      actions.push(aiAction)
    }

    return actions
  }

  /**
   * 基于规则生成预防措施
   */
  private generateRuleBasedActions(prediction: Prediction): PreventionAction[] {
    const actions: PreventionAction[] = []

    switch (prediction.type) {
      case 'file-hotspot':
        // 热点文件 → 添加测试 + 考虑重构
        actions.push({
          id: `action-${prediction.id}-test`,
          predictionId: prediction.id,
          type: 'add-test',
          description: '为热点文件添加单元测试覆盖',
          files: this.extractFilesFromPrediction(prediction),
          estimatedImpact: 'medium',
          safe: true,
          autoExecutable: false  // 需要人工审核
        })

        actions.push({
          id: `action-${prediction.id}-refactor`,
          predictionId: prediction.id,
          type: 'refactor',
          description: '分析热点文件是否需要拆分重构',
          files: this.extractFilesFromPrediction(prediction),
          estimatedImpact: 'high',
          safe: false,  // 重构有风险
          autoExecutable: false
        })
        break

      case 'temporal-spike':
        // 时间峰值 → 加强监控 + 提前code review
        actions.push({
          id: `action-${prediction.id}-monitor`,
          predictionId: prediction.id,
          type: 'monitoring',
          description: '在预测时间段加强监控和code review',
          files: [],
          estimatedImpact: 'low',
          safe: true,
          autoExecutable: true
        })
        break

      case 'ai-综合分析':
        // AI预测 → 生成文档 + 团队通知
        actions.push({
          id: `action-${prediction.id}-doc`,
          predictionId: prediction.id,
          type: 'documentation',
          description: '记录AI预测结果，提醒团队注意',
          files: [],
          estimatedImpact: 'low',
          safe: true,
          autoExecutable: true
        })
        break
    }

    return actions
  }

  /**
   * 使用AI生成定制化预防措施
   */
  private async generateAIAction(prediction: Prediction): Promise<PreventionAction | null> {
    try {
      const prompt = this.buildActionPrompt(prediction)

      const message = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })

      const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

      // 解析AI响应
      const parsed = this.parseAIAction(responseText)

      if (parsed) {
        return {
          id: `action-${prediction.id}-ai`,
          predictionId: prediction.id,
          type: parsed.type,
          description: parsed.description,
          code: parsed.code,
          files: parsed.files,
          estimatedImpact: parsed.impact,
          safe: parsed.safe,
          autoExecutable: parsed.autoExecutable
        }
      }

    } catch (error: any) {
      console.warn(`      ⚠️  AI生成预防措施失败: ${error.message}`)
    }

    return null
  }

  /**
   * 构建AI生成预防措施的提示词
   */
  private buildActionPrompt(prediction: Prediction): string {
    return `作为代码优化专家，为这个预测生成预防措施。

预测信息:
- 类型: ${prediction.type}
- 描述: ${prediction.description}
- 置信度: ${(prediction.confidence * 100).toFixed(0)}%
- 严重度: ${prediction.severity}
- 预计时间: ${prediction.expectedTime.toLocaleDateString()}

已有建议:
${prediction.preventionSuggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}

请生成1个具体的预防措施，返回JSON格式:
{
  "type": "refactor" | "add-test" | "documentation" | "code-review" | "monitoring",
  "description": "具体措施描述（1句话）",
  "code": "如果是代码相关，提供代码示例（可选）",
  "files": ["涉及的文件列表"],
  "impact": "low" | "medium" | "high",
  "safe": true/false (是否安全，不会破坏现有功能),
  "autoExecutable": true/false (是否可以自动执行)
}

注意：
1. 措施要具体可执行
2. 考虑安全性（safe=true表示低风险）
3. 只有非常安全的操作才设autoExecutable=true`
  }

  /**
   * 解析AI响应
   */
  private parseAIAction(response: string): {
    type: PreventionAction['type']
    description: string
    code?: string
    files: string[]
    impact: PreventionAction['estimatedImpact']
    safe: boolean
    autoExecutable: boolean
  } | null {
    try {
      const cleaned = response
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()

      const parsed = JSON.parse(cleaned)

      return {
        type: parsed.type || 'documentation',
        description: parsed.description || '',
        code: parsed.code,
        files: parsed.files || [],
        impact: parsed.impact || 'medium',
        safe: parsed.safe !== undefined ? parsed.safe : false,
        autoExecutable: parsed.autoExecutable !== undefined ? parsed.autoExecutable : false
      }
    } catch (error) {
      return null
    }
  }

  /**
   * 从预测中提取文件列表
   */
  private extractFilesFromPrediction(prediction: Prediction): string[] {
    // 从description中提取文件名
    const filePattern = /([a-zA-Z0-9_-]+\.(ts|tsx|js|jsx|py|java))/g
    const matches = prediction.description.match(filePattern)
    return matches || []
  }

  /**
   * 执行预防措施
   */
  async executeAction(action: PreventionAction): Promise<PreventionResult> {
    console.log(`\n🔧 [ProactiveOptimizer] 执行预防措施: ${action.description}`)

    if (!action.autoExecutable) {
      console.log(`   ⏸️  需要人工审核，跳过自动执行`)
      return {
        actionId: action.id,
        success: false,
        executedAt: new Date(),
        effect: {
          prevented: false
        }
      }
    }

    if (!action.safe) {
      console.log(`   ⚠️  不安全操作，需要人工确认`)
      return {
        actionId: action.id,
        success: false,
        executedAt: new Date(),
        effect: {
          prevented: false
        }
      }
    }

    // 执行具体的预防措施
    let success = false
    try {
      switch (action.type) {
        case 'monitoring':
          success = await this.setupMonitoring(action)
          break

        case 'documentation':
          success = await this.createDocumentation(action)
          break

        case 'add-test':
          // 测试添加需要人工，这里只是标记
          console.log(`   📝 标记: 需要为 ${action.files.join(', ')} 添加测试`)
          success = true
          break

        default:
          console.log(`   ⏭️  类型 ${action.type} 需要人工处理`)
          success = false
      }

      const result: PreventionResult = {
        actionId: action.id,
        success,
        executedAt: new Date(),
        effect: {
          prevented: success
        }
      }

      this.preventionHistory.push(result)
      this.emit('action-executed', result)

      return result

    } catch (error: any) {
      console.error(`   ❌ 执行失败: ${error.message}`)
      return {
        actionId: action.id,
        success: false,
        executedAt: new Date(),
        effect: {
          prevented: false
        }
      }
    }
  }

  /**
   * 设置监控
   */
  private async setupMonitoring(action: PreventionAction): Promise<boolean> {
    console.log(`   ✓ 监控已激活（模拟）`)
    // TODO: 实际实现可以集成到GlobalOrchestrator的监控系统
    return true
  }

  /**
   * 创建文档
   */
  private async createDocumentation(action: PreventionAction): Promise<boolean> {
    console.log(`   ✓ 文档已创建（模拟）`)
    // TODO: 实际实现可以生成markdown文档
    return true
  }

  /**
   * 批量执行所有可自动执行的措施
   */
  async executeAllAutoActions(actions: PreventionAction[]): Promise<PreventionResult[]> {
    console.log(`\n🚀 [ProactiveOptimizer] 批量执行预防措施`)

    const autoActions = actions.filter(a => a.autoExecutable && a.safe)
    console.log(`   可自动执行: ${autoActions.length} / ${actions.length}`)

    const results: PreventionResult[] = []

    for (const action of autoActions) {
      const result = await this.executeAction(action)
      results.push(result)
    }

    return results
  }

  /**
   * 验证预防效果
   *
   * 在预测的时间点后，检查是否真的发生了预测的问题
   */
  async verifyPreventionEffect(
    predictionId: string,
    actualIssueOccurred: boolean
  ): Promise<void> {
    console.log(`\n📊 [ProactiveOptimizer] 验证预防效果: ${predictionId}`)

    // 找到相关的预防措施
    const relatedResults = this.preventionHistory.filter(r =>
      this.activeActions.get(r.actionId)?.predictionId === predictionId
    )

    if (relatedResults.length === 0) {
      console.log(`   ⚠️  未找到相关预防记录`)
      return
    }

    // 更新效果
    for (const result of relatedResults) {
      result.effect.prevented = result.success && !actualIssueOccurred

      if (result.effect.prevented) {
        console.log(`   ✅ 预防成功！问题未发生`)
        this.emit('prevention-success', result)
      } else if (actualIssueOccurred) {
        console.log(`   ❌ 预防失败，问题仍然发生`)
        this.emit('prevention-failed', result)
      } else {
        console.log(`   ℹ️  预测未实现（可能预测有误）`)
      }
    }
  }

  /**
   * 获取统计信息
   */
  getStatistics() {
    const total = this.preventionHistory.length
    const successful = this.preventionHistory.filter(r => r.effect.prevented).length
    const failed = this.preventionHistory.filter(r => !r.effect.prevented && r.success).length

    return {
      totalActions: total,
      successful,
      failed,
      successRate: total > 0 ? (successful / total * 100).toFixed(1) + '%' : '0%',
      activeActions: this.activeActions.size
    }
  }

  /**
   * 获取预防历史
   */
  getHistory(): PreventionResult[] {
    return [...this.preventionHistory]
  }
}

/**
 * 使用示例：
 *
 * const optimizer = new ProactiveOptimizer({ minConfidence: 0.7, autoExecute: false })
 *
 * // 1. 获取预测
 * const predictions = await predictiveAnalyzer.predictFutureIssues('videoplay', '/path')
 *
 * // 2. 生成预防措施
 * const actions = await optimizer.optimizeBeforeIssue(predictions)
 *
 * // 3. 执行安全措施
 * const results = await optimizer.executeAllAutoActions(actions)
 *
 * // 4. 事件监听
 * optimizer.on('action-executed', (result) => {
 *   console.log(`预防措施已执行: ${result.actionId}`)
 * })
 *
 * optimizer.on('prevention-success', (result) => {
 *   console.log(`🎉 成功预防了问题！`)
 * })
 */
