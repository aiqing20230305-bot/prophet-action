/**
 * Prophet Predictive Analyzer - 预测性分析器
 *
 * Phase 4.1: 代码趋势分析
 *
 * 目标：分析历史数据，预测未来可能出现的问题
 *
 * 策略：
 * - 分析过去30天的进化历史
 * - 识别重复出现的问题模式
 * - 预测未来7天可能出现的问题
 * - 计算预测置信度（0-1）
 *
 * 预测模式：
 * - 时间模式：每周五下午代码质量下降
 * - 事件模式：新功能发布后24小时bug增多
 * - 文件模式：某个文件反复被修改（设计问题）
 * - 开发者模式：特定开发者的代码更易出问题
 */

import { execSync } from 'child_process'
import { statSync, readFileSync } from 'fs'
import Anthropic from '@anthropic-ai/sdk'

export interface EvolutionRecord {
  timestamp: Date
  type: 'commit' | 'issue-added' | 'issue-fixed' | 'rollback'
  projectId: string
  projectName: string
  details: {
    commitHash?: string
    message?: string
    filesChanged?: string[]
    issueType?: string
    severity?: string
  }
}

export interface Pattern {
  id: string
  name: string
  description: string
  type: 'temporal' | 'event-based' | 'file-based' | 'developer-based'
  frequency: number  // 出现次数
  lastOccurrence: Date
  confidence: number  // 0-1
  examples: EvolutionRecord[]
}

export interface Prediction {
  id: string
  type: string
  description: string
  confidence: number  // 0-1
  expectedTime: Date
  preventionSuggestions: string[]
  relatedPatterns: string[]  // Pattern IDs
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export class PredictiveAnalyzer {
  private anthropic: Anthropic
  private historyCache: Map<string, EvolutionRecord[]> = new Map()
  private patternCache: Map<string, Pattern[]> = new Map()

  constructor(options: { apiKey?: string } = {}) {
    this.anthropic = new Anthropic({
      apiKey: options.apiKey || process.env.ANTHROPIC_API_KEY || ''
    })
  }

  /**
   * 预测未来问题
   */
  async predictFutureIssues(projectId: string, projectPath: string): Promise<Prediction[]> {
    console.log(`🔮 [PredictiveAnalyzer] 分析 ${projectId} 的未来趋势`)

    // 1. 获取历史数据（过去30天）
    const history = await this.getEvolutionHistory(projectId, projectPath, 30)
    console.log(`   ✓ 获取到 ${history.length} 条历史记录`)

    // 2. 识别模式
    const patterns = await this.findPatterns(history)
    console.log(`   ✓ 识别到 ${patterns.length} 个模式`)

    // 3. 基于模式预测未来7天
    const predictions = await this.predictNextWeek(projectId, patterns, history)
    console.log(`   ✓ 生成 ${predictions.length} 个预测`)

    return predictions
  }

  /**
   * 获取进化历史（过去N天）
   */
  private async getEvolutionHistory(
    projectId: string,
    projectPath: string,
    days: number
  ): Promise<EvolutionRecord[]> {
    // 检查缓存
    const cacheKey = `${projectId}:${days}`
    const cached = this.historyCache.get(cacheKey)
    if (cached) {
      return cached
    }

    const records: EvolutionRecord[] = []

    try {
      // 获取git commits历史
      const since = `${days} days ago`
      const gitLog = execSync(
        `git log --since="${since}" --pretty=format:"%H|%ai|%s|%an" --name-only`,
        { cwd: projectPath, encoding: 'utf-8', stdio: 'pipe' }
      )

      const commits = this.parseGitLog(gitLog, projectId)
      records.push(...commits)

      console.log(`   📊 Git commits: ${commits.length} 条`)

      // TODO: 未来可以添加更多数据源
      // - Issue tracker历史
      // - 性能指标历史
      // - 错误日志历史

    } catch (error: any) {
      console.warn(`   ⚠️  获取历史失败: ${error.message}`)
    }

    // 缓存10分钟
    this.historyCache.set(cacheKey, records)
    setTimeout(() => this.historyCache.delete(cacheKey), 10 * 60 * 1000)

    return records
  }

  /**
   * 解析git log
   */
  private parseGitLog(gitLog: string, projectId: string): EvolutionRecord[] {
    const records: EvolutionRecord[] = []
    const lines = gitLog.trim().split('\n')

    let i = 0
    while (i < lines.length) {
      const line = lines[i]
      if (!line.includes('|')) {
        i++
        continue
      }

      const [hash, dateStr, message] = line.split('|')
      const timestamp = new Date(dateStr)

      // 收集文件列表
      const filesChanged: string[] = []
      i++
      while (i < lines.length && !lines[i].includes('|')) {
        if (lines[i].trim()) {
          filesChanged.push(lines[i].trim())
        }
        i++
      }

      records.push({
        timestamp,
        type: 'commit',
        projectId,
        projectName: projectId,
        details: {
          commitHash: hash,
          message,
          filesChanged
        }
      })
    }

    return records
  }

  /**
   * 识别模式
   */
  private async findPatterns(history: EvolutionRecord[]): Promise<Pattern[]> {
    const patterns: Pattern[] = []

    // 1. 时间模式（例如：每周五下午问题多）
    const temporalPatterns = this.findTemporalPatterns(history)
    patterns.push(...temporalPatterns)

    // 2. 文件模式（例如：某文件反复被修改）
    const filePatterns = this.findFilePatterns(history)
    patterns.push(...filePatterns)

    // 3. 关键词模式（例如：包含"fix"的commit后容易出问题）
    const keywordPatterns = this.findKeywordPatterns(history)
    patterns.push(...keywordPatterns)

    return patterns
  }

  /**
   * 识别时间模式
   */
  private findTemporalPatterns(history: EvolutionRecord[]): Pattern[] {
    const patterns: Pattern[] = []

    // 按星期几分组
    const byDayOfWeek: Map<number, EvolutionRecord[]> = new Map()
    for (const record of history) {
      const day = record.timestamp.getDay()  // 0=周日, 1=周一, ...
      if (!byDayOfWeek.has(day)) {
        byDayOfWeek.set(day, [])
      }
      byDayOfWeek.get(day)!.push(record)
    }

    // 查找活跃度异常高的日子
    const avgPerDay = history.length / 7
    for (const [day, records] of byDayOfWeek) {
      if (records.length > avgPerDay * 1.5) {  // 超过平均50%
        const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
        patterns.push({
          id: `temporal-day-${day}`,
          name: `${dayNames[day]}活跃度高`,
          description: `${dayNames[day]}的commit数量异常高（${records.length}次 vs 平均${avgPerDay.toFixed(1)}次）`,
          type: 'temporal',
          frequency: records.length,
          lastOccurrence: records[records.length - 1].timestamp,
          confidence: Math.min(0.9, records.length / (avgPerDay * 2)),
          examples: records.slice(0, 3)
        })
      }
    }

    // 按小时分组（工作时间分析）
    const byHour: Map<number, EvolutionRecord[]> = new Map()
    for (const record of history) {
      const hour = record.timestamp.getHours()
      if (!byHour.has(hour)) {
        byHour.set(hour, [])
      }
      byHour.get(hour)!.push(record)
    }

    // 查找深夜/凌晨提交（可能质量较低）
    const lateNightCommits = [...byHour.entries()]
      .filter(([hour]) => hour >= 22 || hour <= 6)
      .reduce((sum, [, records]) => sum + records.length, 0)

    if (lateNightCommits > history.length * 0.1) {  // 超过10%
      patterns.push({
        id: 'temporal-late-night',
        name: '深夜提交频繁',
        description: `${lateNightCommits}次深夜提交（22:00-06:00），可能质量较低`,
        type: 'temporal',
        frequency: lateNightCommits,
        lastOccurrence: new Date(),
        confidence: 0.7,
        examples: []
      })
    }

    return patterns
  }

  /**
   * 识别文件模式
   */
  private findFilePatterns(history: EvolutionRecord[]): Pattern[] {
    const patterns: Pattern[] = []

    // 统计文件修改频率
    const fileChanges: Map<string, number> = new Map()
    for (const record of history) {
      if (record.details.filesChanged) {
        for (const file of record.details.filesChanged) {
          fileChanges.set(file, (fileChanges.get(file) || 0) + 1)
        }
      }
    }

    // 找出频繁修改的文件（可能设计有问题）
    const avgChanges = Array.from(fileChanges.values()).reduce((a, b) => a + b, 0) / fileChanges.size
    for (const [file, count] of fileChanges) {
      if (count > avgChanges * 2) {  // 超过平均2倍
        patterns.push({
          id: `file-hotspot-${file}`,
          name: `热点文件: ${file}`,
          description: `${file} 被修改${count}次（平均${avgChanges.toFixed(1)}次），可能存在设计问题`,
          type: 'file-based',
          frequency: count,
          lastOccurrence: new Date(),
          confidence: Math.min(0.9, count / (avgChanges * 3)),
          examples: []
        })
      }
    }

    return patterns
  }

  /**
   * 识别关键词模式
   */
  private findKeywordPatterns(history: EvolutionRecord[]): Pattern[] {
    const patterns: Pattern[] = []

    // 统计关键词出现频率
    const keywords = ['fix', 'bug', 'hotfix', 'urgent', 'rollback', 'revert']
    const keywordCounts: Map<string, number> = new Map()

    for (const record of history) {
      const message = record.details.message?.toLowerCase() || ''
      for (const keyword of keywords) {
        if (message.includes(keyword)) {
          keywordCounts.set(keyword, (keywordCounts.get(keyword) || 0) + 1)
        }
      }
    }

    // 如果"fix"相关commit占比高，说明问题多
    const fixCount = keywordCounts.get('fix') || 0
    if (fixCount > history.length * 0.3) {  // 超过30%
      patterns.push({
        id: 'keyword-fix-heavy',
        name: 'Bug修复频繁',
        description: `${fixCount}次fix相关commit（占${(fixCount / history.length * 100).toFixed(0)}%），问题较多`,
        type: 'event-based',
        frequency: fixCount,
        lastOccurrence: new Date(),
        confidence: 0.8,
        examples: []
      })
    }

    return patterns
  }

  /**
   * 预测未来7天可能出现的问题
   */
  private async predictNextWeek(
    projectId: string,
    patterns: Pattern[],
    history: EvolutionRecord[]
  ): Promise<Prediction[]> {
    const predictions: Prediction[] = []

    // 1. 基于时间模式预测
    for (const pattern of patterns) {
      if (pattern.type === 'temporal') {
        const prediction = this.predictFromTemporalPattern(pattern)
        if (prediction) {
          predictions.push(prediction)
        }
      }
    }

    // 2. 基于文件热点预测
    for (const pattern of patterns) {
      if (pattern.type === 'file-based' && pattern.confidence > 0.7) {
        predictions.push({
          id: `pred-${pattern.id}`,
          type: 'file-hotspot',
          description: `${pattern.name}可能继续频繁修改，建议重构`,
          confidence: pattern.confidence,
          expectedTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),  // 7天内
          preventionSuggestions: [
            '分析文件职责，是否承担了太多功能',
            '考虑拆分成多个小文件',
            '添加单元测试覆盖',
            '重构改进代码结构'
          ],
          relatedPatterns: [pattern.id],
          severity: 'medium'
        })
      }
    }

    // 3. 基于整体趋势预测（使用AI）
    if (patterns.length > 0) {
      const aiPrediction = await this.predictWithAI(projectId, patterns, history)
      if (aiPrediction) {
        predictions.push(aiPrediction)
      }
    }

    return predictions
  }

  /**
   * 从时间模式生成预测
   */
  private predictFromTemporalPattern(pattern: Pattern): Prediction | null {
    const now = new Date()
    const currentDay = now.getDay()

    // 如果模式是"周五活跃度高"，预测下个周五
    if (pattern.id.startsWith('temporal-day-')) {
      const patternDay = parseInt(pattern.id.split('-')[2])
      let daysUntil = (patternDay - currentDay + 7) % 7
      if (daysUntil === 0) daysUntil = 7  // 下周

      const expectedTime = new Date(now.getTime() + daysUntil * 24 * 60 * 60 * 1000)

      return {
        id: `pred-${pattern.id}`,
        type: 'temporal-spike',
        description: pattern.description,
        confidence: pattern.confidence,
        expectedTime,
        preventionSuggestions: [
          '提前code review，确保质量',
          '增加测试覆盖',
          '避免在活跃期进行重大重构'
        ],
        relatedPatterns: [pattern.id],
        severity: 'low'
      }
    }

    return null
  }

  /**
   * 使用AI预测（综合分析）
   */
  private async predictWithAI(
    projectId: string,
    patterns: Pattern[],
    history: EvolutionRecord[]
  ): Promise<Prediction | null> {
    try {
      const prompt = this.buildPredictionPrompt(projectId, patterns, history)

      const message = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 800,
        messages: [{ role: 'user', content: prompt }]
      })

      const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

      // 解析AI响应
      const parsed = this.parseAIPrediction(responseText)

      if (parsed) {
        return {
          id: 'pred-ai-综合',
          type: 'ai-综合分析',
          description: parsed.description,
          confidence: parsed.confidence,
          expectedTime: parsed.expectedTime,
          preventionSuggestions: parsed.suggestions,
          relatedPatterns: patterns.map(p => p.id),
          severity: parsed.severity
        }
      }

    } catch (error: any) {
      console.warn(`   ⚠️  AI预测失败: ${error.message}`)
    }

    return null
  }

  /**
   * 构建AI预测提示词
   */
  private buildPredictionPrompt(
    projectId: string,
    patterns: Pattern[],
    history: EvolutionRecord[]
  ): string {
    const recentCommits = history.slice(-10).map(r =>
      `${r.timestamp.toISOString().split('T')[0]} - ${r.details.message}`
    ).join('\n')

    const patternSummary = patterns.map(p =>
      `- ${p.name}: ${p.description} (置信度: ${(p.confidence * 100).toFixed(0)}%)`
    ).join('\n')

    return `作为代码预测专家，分析这个项目未来7天可能出现的问题。

项目: ${projectId}
分析时间段: 过去30天
总commit数: ${history.length}

识别到的模式:
${patternSummary}

最近10次提交:
${recentCommits}

请预测未来7天可能出现的主要问题，返回JSON格式:
{
  "description": "预测描述（1-2句话）",
  "confidence": 0.0-1.0的置信度,
  "daysUntil": 预计几天后发生,
  "severity": "low" | "medium" | "high" | "critical",
  "suggestions": ["建议1", "建议2", "建议3"]
}

注意：
1. 基于历史模式进行合理推断
2. 置信度要保守（通常0.5-0.8）
3. 建议要具体可执行`
  }

  /**
   * 解析AI预测响应
   */
  private parseAIPrediction(response: string): {
    description: string
    confidence: number
    expectedTime: Date
    severity: Prediction['severity']
    suggestions: string[]
  } | null {
    try {
      const cleaned = response
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()

      const parsed = JSON.parse(cleaned)

      const daysUntil = parsed.daysUntil || 7
      const expectedTime = new Date(Date.now() + daysUntil * 24 * 60 * 60 * 1000)

      return {
        description: parsed.description || 'AI综合预测',
        confidence: Math.max(0, Math.min(1, parsed.confidence || 0.5)),
        expectedTime,
        severity: parsed.severity || 'medium',
        suggestions: parsed.suggestions || []
      }
    } catch (error) {
      return null
    }
  }

  /**
   * 获取统计信息
   */
  getStatistics() {
    return {
      cachedHistories: this.historyCache.size,
      cachedPatterns: this.patternCache.size
    }
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.historyCache.clear()
    this.patternCache.clear()
  }
}

/**
 * 使用示例：
 *
 * const analyzer = new PredictiveAnalyzer()
 *
 * const predictions = await analyzer.predictFutureIssues(
 *   'videoplay',
 *   '/path/to/videoplay'
 * )
 *
 * for (const pred of predictions) {
 *   console.log(`🔮 预测: ${pred.description}`)
 *   console.log(`   置信度: ${(pred.confidence * 100).toFixed(0)}%`)
 *   console.log(`   预计时间: ${pred.expectedTime.toLocaleDateString()}`)
 *   console.log(`   建议:`)
 *   pred.preventionSuggestions.forEach(s => console.log(`     - ${s}`))
 * }
 */
