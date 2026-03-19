/**
 * Prophet Intelligent Priority Queue - AI优先级队列系统
 *
 * Phase 3.2: AI优先级队列
 *
 * 目标：使用AI评估问题优先级，智能排序
 *
 * 评分因素：
 * - 影响范围（1-10分）
 * - 修复难度（1-10分，越容易越高分）
 * - 紧急程度（1-10分）
 * - 安全性风险（1-10分）
 * - 业务价值（1-10分）
 *
 * AI策略：
 * - 使用Claude API评估问题
 * - 基于历史数据学习
 * - 考虑项目特定上下文
 */

import Anthropic from '@anthropic-ai/sdk'

export interface Issue {
  id: string
  type: string
  file: string
  line?: number
  message: string
  projectId: string
  projectName: string
  context?: {
    codeSnippet?: string
    relatedFiles?: string[]
    affectedUsers?: number
  }
}

export interface ScoredIssue extends Issue {
  score: number  // 0-100
  priority: 'critical' | 'high' | 'medium' | 'low'
  reasoning: string
  breakdown: {
    impact: number       // 影响范围 (0-10)
    difficulty: number   // 修复难度 (0-10, 越容易越高)
    urgency: number      // 紧急程度 (0-10)
    security: number     // 安全风险 (0-10)
    business: number     // 业务价值 (0-10)
  }
}

export class IntelligentPriorityQueue {
  private anthropic: Anthropic
  private queue: ScoredIssue[] = []
  private scoringCache: Map<string, ScoredIssue> = new Map()
  private useAI: boolean

  constructor(options: {
    useAI?: boolean
    apiKey?: string
  } = {}) {
    this.useAI = options.useAI !== undefined ? options.useAI : true

    this.anthropic = new Anthropic({
      apiKey: options.apiKey || process.env.ANTHROPIC_API_KEY || ''
    })
  }

  /**
   * 添加问题到队列并评分
   */
  async addIssue(issue: Issue): Promise<ScoredIssue> {
    // 检查缓存
    const cacheKey = this.getCacheKey(issue)
    const cached = this.scoringCache.get(cacheKey)

    if (cached) {
      this.queue.push(cached)
      this.sortQueue()
      return cached
    }

    // 评分
    const scoredIssue = this.useAI
      ? await this.scoreWithAI(issue)
      : this.scoreWithRules(issue)

    // 缓存
    this.scoringCache.set(cacheKey, scoredIssue)

    // 加入队列
    this.queue.push(scoredIssue)
    this.sortQueue()

    return scoredIssue
  }

  /**
   * 批量添加问题
   */
  async addIssues(issues: Issue[]): Promise<ScoredIssue[]> {
    console.log(`\n🎯 [PriorityQueue] 评估 ${issues.length} 个问题优先级`)

    const scoredIssues = await Promise.all(
      issues.map(issue => this.addIssue(issue))
    )

    console.log(`   ✓ 评估完成，队列大小: ${this.queue.length}`)

    return scoredIssues
  }

  /**
   * 使用AI评分（Claude）
   */
  private async scoreWithAI(issue: Issue): Promise<ScoredIssue> {
    try {
      const prompt = this.buildScoringPrompt(issue)

      const message = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })

      const responseText = message.content[0].type === 'text'
        ? message.content[0].text
        : ''

      // 解析AI响应
      const parsed = this.parseAIResponse(responseText)

      return {
        ...issue,
        score: parsed.score,
        priority: this.getPriorityLevel(parsed.score),
        reasoning: parsed.reasoning,
        breakdown: parsed.breakdown
      }

    } catch (error: any) {
      console.warn(`⚠️  AI评分失败，使用规则评分: ${error.message}`)
      return this.scoreWithRules(issue)
    }
  }

  /**
   * 构建评分提示词
   */
  private buildScoringPrompt(issue: Issue): string {
    return `评估这个代码问题的优先级（0-100分）:

项目: ${issue.projectName}
类型: ${issue.type}
位置: ${issue.file}${issue.line ? `:${issue.line}` : ''}
描述: ${issue.message}

${issue.context?.codeSnippet ? `代码片段:\n\`\`\`\n${issue.context.codeSnippet}\n\`\`\`` : ''}

请从以下5个维度评分（每项0-10分）:
1. **影响范围**: 这个问题会影响多少用户/功能？
2. **修复难度**: 修复这个问题有多容易？（越容易分数越高）
3. **紧急程度**: 需要多快修复？
4. **安全风险**: 是否有安全隐患？
5. **业务价值**: 修复后的业务价值有多大？

返回JSON格式（直接返回，不要markdown代码块）:
{
  "score": 0-100的综合分数,
  "reasoning": "简短理由（1-2句话）",
  "breakdown": {
    "impact": 0-10,
    "difficulty": 0-10,
    "urgency": 0-10,
    "security": 0-10,
    "business": 0-10
  }
}`
  }

  /**
   * 解析AI响应
   */
  private parseAIResponse(response: string): {
    score: number
    reasoning: string
    breakdown: ScoredIssue['breakdown']
  } {
    try {
      // 移除可能的markdown代码块标记
      const cleaned = response
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()

      const parsed = JSON.parse(cleaned)

      return {
        score: Math.max(0, Math.min(100, parsed.score || 50)),
        reasoning: parsed.reasoning || 'AI评估',
        breakdown: {
          impact: Math.max(0, Math.min(10, parsed.breakdown?.impact || 5)),
          difficulty: Math.max(0, Math.min(10, parsed.breakdown?.difficulty || 5)),
          urgency: Math.max(0, Math.min(10, parsed.breakdown?.urgency || 5)),
          security: Math.max(0, Math.min(10, parsed.breakdown?.security || 5)),
          business: Math.max(0, Math.min(10, parsed.breakdown?.business || 5))
        }
      }
    } catch (error) {
      // 解析失败，返回默认值
      return {
        score: 50,
        reasoning: '使用默认评分',
        breakdown: {
          impact: 5,
          difficulty: 5,
          urgency: 5,
          security: 5,
          business: 5
        }
      }
    }
  }

  /**
   * 使用规则评分（快速，无需AI）
   */
  private scoreWithRules(issue: Issue): ScoredIssue {
    const breakdown = {
      impact: this.scoreImpact(issue),
      difficulty: this.scoreDifficulty(issue),
      urgency: this.scoreUrgency(issue),
      security: this.scoreSecurity(issue),
      business: this.scoreBusiness(issue)
    }

    // 加权计算总分
    const score = (
      breakdown.impact * 0.25 +
      breakdown.difficulty * 0.15 +
      breakdown.urgency * 0.25 +
      breakdown.security * 0.20 +
      breakdown.business * 0.15
    ) * 10  // 转换到0-100

    return {
      ...issue,
      score: Math.round(score),
      priority: this.getPriorityLevel(score),
      reasoning: '基于规则评分',
      breakdown
    }
  }

  /**
   * 评估影响范围
   */
  private scoreImpact(issue: Issue): number {
    let score = 5  // 默认中等

    // 关键文件加分
    if (issue.file.match(/(auth|security|payment|user)/i)) {
      score += 3
    }

    // 核心目录加分
    if (issue.file.match(/^(src|app)\//)) {
      score += 2
    }

    // 测试文件减分
    if (issue.file.match(/\.(test|spec)\./)) {
      score -= 3
    }

    return Math.max(0, Math.min(10, score))
  }

  /**
   * 评估修复难度
   */
  private scoreDifficulty(issue: Issue): number {
    let score = 5  // 默认中等

    // TODO类型较容易
    if (issue.type.includes('TODO')) {
      score += 3
    }

    // FIXME类型较难
    if (issue.type.includes('FIXME')) {
      score -= 2
    }

    // console.log移除很容易
    if (issue.type === 'CONSOLE_LOG') {
      score += 4
    }

    // 大文件拆分较难
    if (issue.type === 'LARGE_FILE') {
      score -= 3
    }

    return Math.max(0, Math.min(10, score))
  }

  /**
   * 评估紧急程度
   */
  private scoreUrgency(issue: Issue): number {
    let score = 5  // 默认中等

    // 关键词判断
    const message = issue.message.toLowerCase()

    if (message.match(/urgent|紧急|critical|立即|asap/)) {
      score += 5
    }

    if (message.match(/bug|error|错误|问题|failure/)) {
      score += 3
    }

    if (message.match(/enhancement|优化|improve/)) {
      score -= 1
    }

    return Math.max(0, Math.min(10, score))
  }

  /**
   * 评估安全风险
   */
  private scoreSecurity(issue: Issue): number {
    let score = 0  // 默认无风险

    const message = issue.message.toLowerCase()
    const file = issue.file.toLowerCase()

    // 安全相关关键词
    if (message.match(/security|auth|password|token|sql|xss|csrf/)) {
      score += 8
    }

    if (file.match(/auth|security|login|password/)) {
      score += 5
    }

    // console.log可能泄露信息
    if (issue.type === 'CONSOLE_LOG' && file.match(/auth|user|token/)) {
      score += 3
    }

    return Math.max(0, Math.min(10, score))
  }

  /**
   * 评估业务价值
   */
  private scoreBusiness(issue: Issue): number {
    let score = 5  // 默认中等

    const message = issue.message.toLowerCase()

    // 用户体验相关
    if (message.match(/ux|ui|user experience|用户体验/)) {
      score += 3
    }

    // 性能优化
    if (message.match(/performance|性能|slow|慢/)) {
      score += 2
    }

    // 技术债务
    if (message.match(/refactor|重构|technical debt/)) {
      score += 1
    }

    return Math.max(0, Math.min(10, score))
  }

  /**
   * 确定优先级等级
   */
  private getPriorityLevel(score: number): ScoredIssue['priority'] {
    if (score >= 80) return 'critical'
    if (score >= 60) return 'high'
    if (score >= 40) return 'medium'
    return 'low'
  }

  /**
   * 排序队列
   */
  private sortQueue(): void {
    this.queue.sort((a, b) => b.score - a.score)
  }

  /**
   * 获取下一个最高优先级问题
   */
  getNext(): ScoredIssue | null {
    return this.queue.shift() || null
  }

  /**
   * 获取前N个最高优先级问题
   */
  getTopN(n: number): ScoredIssue[] {
    return this.queue.slice(0, n)
  }

  /**
   * 获取所有问题（按优先级排序）
   */
  getAll(): ScoredIssue[] {
    return [...this.queue]
  }

  /**
   * 获取队列大小
   */
  size(): number {
    return this.queue.length
  }

  /**
   * 清空队列
   */
  clear(): void {
    this.queue = []
    this.scoringCache.clear()
  }

  /**
   * 获取缓存键
   */
  private getCacheKey(issue: Issue): string {
    return `${issue.projectId}:${issue.file}:${issue.line}:${issue.type}`
  }

  /**
   * 打印队列统计
   */
  printStatistics(): void {
    const stats = {
      total: this.queue.length,
      critical: this.queue.filter(i => i.priority === 'critical').length,
      high: this.queue.filter(i => i.priority === 'high').length,
      medium: this.queue.filter(i => i.priority === 'medium').length,
      low: this.queue.filter(i => i.priority === 'low').length,
      avgScore: this.queue.length > 0
        ? this.queue.reduce((sum, i) => sum + i.score, 0) / this.queue.length
        : 0
    }

    console.log(`\n📊 [PriorityQueue] 队列统计`)
    console.log(`   总问题数: ${stats.total}`)
    console.log(`   Critical: ${stats.critical} 个`)
    console.log(`   High: ${stats.high} 个`)
    console.log(`   Medium: ${stats.medium} 个`)
    console.log(`   Low: ${stats.low} 个`)
    console.log(`   平均分数: ${stats.avgScore.toFixed(1)}`)
  }
}

/**
 * 使用示例：
 *
 * const queue = new IntelligentPriorityQueue({ useAI: true })
 *
 * // 添加问题
 * await queue.addIssues([
 *   {
 *     id: 'issue-1',
 *     type: 'FIXME',
 *     file: 'src/auth/login.ts',
 *     line: 42,
 *     message: 'URGENT: Fix authentication bypass vulnerability',
 *     projectId: 'p1',
 *     projectName: 'videoplay'
 *   },
 *   {
 *     id: 'issue-2',
 *     type: 'TODO',
 *     file: 'src/components/Button.tsx',
 *     line: 10,
 *     message: 'Add loading state',
 *     projectId: 'p1',
 *     projectName: 'videoplay'
 *   }
 * ])
 *
 * // 获取最高优先级问题
 * const nextIssue = queue.getNext()
 * console.log(`处理: ${nextIssue.message} (分数: ${nextIssue.score})`)
 *
 * // 查看统计
 * queue.printStatistics()
 */
