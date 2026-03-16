/**
 * Auto Reviewer
 *
 * 自动代码审查系统
 */

import { ClaudeEngine, AIContext } from './claude-engine.js'
import { readFile } from 'fs/promises'
import { EventEmitter } from 'events'

export interface ReviewResult {
  id: string
  projectId: string
  filePath: string
  suggestions: string[]
  tokensUsed: number
  cost: number
  timestamp: Date
}

export class AutoReviewer extends EventEmitter {
  private engine: ClaudeEngine
  private reviews: Map<string, ReviewResult> = new Map()

  constructor(engine: ClaudeEngine) {
    super()
    this.engine = engine
  }

  /**
   * 审查文件
   */
  async reviewFile(projectId: string, filePath: string): Promise<ReviewResult> {
    const reviewId = `rev-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    console.log(`🔍 Auto Reviewer: 审查 ${filePath}...`)

    // 读取文件
    const fileContent = await readFile(filePath, 'utf-8')

    // 构建上下文
    const context: AIContext = {
      filePath,
      fileContent,
      language: this.detectLanguage(filePath)
    }

    // 调用 Claude 审查
    const response = await this.engine.reviewCode({
      projectId,
      operation: 'review',
      context
    })

    const result: ReviewResult = {
      id: reviewId,
      projectId,
      filePath,
      suggestions: response.suggestions || [],
      tokensUsed: response.tokensUsed.total,
      cost: response.estimatedCost,
      timestamp: new Date()
    }

    this.reviews.set(reviewId, result)

    console.log(`   ✓ 审查完成: ${result.suggestions.length} 个建议 (${result.tokensUsed} tokens)`)

    this.emit('review-completed', result)

    return result
  }

  /**
   * 批量审查文件
   */
  async reviewFiles(projectId: string, filePaths: string[]): Promise<ReviewResult[]> {
    const results: ReviewResult[] = []

    console.log(`🔍 Auto Reviewer: 审查 ${filePaths.length} 个文件...`)

    for (const filePath of filePaths) {
      try {
        const result = await this.reviewFile(projectId, filePath)
        results.push(result)
      } catch (error) {
        console.error(`审查文件失败: ${filePath}`, error)
      }
    }

    return results
  }

  /**
   * 获取审查结果
   */
  getReview(reviewId: string): ReviewResult | undefined {
    return this.reviews.get(reviewId)
  }

  /**
   * 检测语言
   */
  private detectLanguage(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase()
    const langMap: Record<string, string> = {
      ts: 'typescript',
      tsx: 'typescript',
      js: 'javascript',
      jsx: 'javascript',
      py: 'python',
      rs: 'rust',
      go: 'go',
      java: 'java'
    }
    return langMap[ext || ''] || 'typescript'
  }
}
