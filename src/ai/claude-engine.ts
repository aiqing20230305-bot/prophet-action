/**
 * Claude AI Engine
 *
 * Prophet 的 AI 核心引擎，负责调用 Claude API 进行代码生成、审查等任务
 */

import Anthropic from '@anthropic-ai/sdk'
import { getGlobalTokenTracker } from '../monitoring/token-tracker.js'
import { EventEmitter } from 'events'

export interface AIRequest {
  projectId: string
  operation: 'generate' | 'review' | 'fix' | 'document'
  context: AIContext
  requireApproval?: boolean
}

export interface AIContext {
  // 文件信息
  filePath?: string
  fileContent?: string

  // TODO/Issue 信息
  todoItem?: {
    line: number
    content: string
    type: 'TODO' | 'FIXME'
  }

  // Bug 信息
  bugInfo?: {
    description: string
    stackTrace?: string
    errorMessage?: string
  }

  // 代码片段
  codeSnippet?: string

  // 额外上下文
  relatedFiles?: Array<{
    path: string
    content: string
  }>

  // 项目信息
  projectType?: 'web-app' | 'api' | 'cli' | 'library'
  language?: string
  framework?: string
}

export interface AIResponse {
  success: boolean
  operation: string
  projectId: string

  // 生成的内容
  generatedCode?: string
  suggestions?: string[]
  explanation?: string

  // 文件操作
  fileChanges?: Array<{
    path: string
    type: 'create' | 'modify' | 'delete'
    content?: string
    oldContent?: string
  }>

  // Token 使用
  tokensUsed: {
    input: number
    output: number
    total: number
  }

  // 成本
  estimatedCost: number

  // 原始响应
  rawResponse?: string
}

export class ClaudeEngine extends EventEmitter {
  private client: Anthropic
  private tokenTracker = getGlobalTokenTracker()
  private model = 'claude-sonnet-4-5-20250929'
  private maxTokens = 8000

  constructor(apiKey?: string) {
    super()
    this.client = new Anthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY
    })
  }

  /**
   * 自动生成代码（基于 TODO）
   */
  async generateCode(request: AIRequest): Promise<AIResponse> {
    const { projectId, context } = request

    if (!context.todoItem) {
      throw new Error('TODO item is required for code generation')
    }

    const prompt = this.buildGeneratePrompt(context)

    const response = await this.callClaude(projectId, 'generate', prompt)

    // 解析生成的代码
    const generatedCode = this.extractCode(response.rawResponse!)

    return {
      ...response,
      generatedCode,
      fileChanges: generatedCode ? [{
        path: context.filePath || 'generated.ts',
        type: 'create',
        content: generatedCode
      }] : undefined
    }
  }

  /**
   * 自动审查代码
   */
  async reviewCode(request: AIRequest): Promise<AIResponse> {
    const { projectId, context } = request

    if (!context.fileContent && !context.codeSnippet) {
      throw new Error('File content or code snippet is required for review')
    }

    const prompt = this.buildReviewPrompt(context)

    const response = await this.callClaude(projectId, 'review', prompt)

    // 解析审查建议
    const suggestions = this.extractSuggestions(response.rawResponse!)

    return {
      ...response,
      suggestions,
      explanation: response.rawResponse
    }
  }

  /**
   * 自动修复 Bug
   */
  async fixBug(request: AIRequest): Promise<AIResponse> {
    const { projectId, context } = request

    if (!context.bugInfo) {
      throw new Error('Bug info is required for bug fixing')
    }

    const prompt = this.buildFixPrompt(context)

    const response = await this.callClaude(projectId, 'fix', prompt)

    // 解析修复代码
    const generatedCode = this.extractCode(response.rawResponse!)

    return {
      ...response,
      generatedCode,
      fileChanges: generatedCode && context.filePath ? [{
        path: context.filePath,
        type: 'modify',
        content: generatedCode,
        oldContent: context.fileContent
      }] : undefined
    }
  }

  /**
   * 自动生成文档
   */
  async generateDocumentation(request: AIRequest): Promise<AIResponse> {
    const { projectId, context } = request

    if (!context.fileContent && !context.codeSnippet) {
      throw new Error('File content or code snippet is required for documentation')
    }

    const prompt = this.buildDocumentPrompt(context)

    const response = await this.callClaude(projectId, 'document', prompt)

    return {
      ...response,
      generatedCode: response.rawResponse,
      explanation: 'Generated documentation'
    }
  }

  /**
   * 调用 Claude API
   */
  private async callClaude(
    projectId: string,
    operation: string,
    prompt: string
  ): Promise<AIResponse> {
    try {
      const startTime = Date.now()

      const message = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })

      const duration = Date.now() - startTime

      // 提取 token 使用信息
      const inputTokens = message.usage.input_tokens
      const outputTokens = message.usage.output_tokens
      const totalTokens = inputTokens + outputTokens

      // 记录到 Token Tracker
      await this.tokenTracker.recordUsage({
        projectId,
        operation,
        inputTokens,
        outputTokens,
        model: this.model
      })

      // 提取文本内容
      const rawResponse = message.content
        .filter(block => block.type === 'text')
        .map(block => (block as any).text)
        .join('\n')

      // 触发事件
      this.emit('api-call', {
        projectId,
        operation,
        tokensUsed: totalTokens,
        duration
      })

      return {
        success: true,
        operation,
        projectId,
        tokensUsed: {
          input: inputTokens,
          output: outputTokens,
          total: totalTokens
        },
        estimatedCost: this.calculateCost(inputTokens, outputTokens),
        rawResponse
      }
    } catch (error) {
      this.emit('api-error', {
        projectId,
        operation,
        error
      })

      throw error
    }
  }

  /**
   * 构建代码生成提示词
   */
  private buildGeneratePrompt(context: AIContext): string {
    const { todoItem, filePath, fileContent, relatedFiles } = context

    let prompt = `你是一个专业的代码生成助手。请根据以下 TODO 生成实现代码。

TODO: ${todoItem!.content}
位置: ${filePath}:${todoItem!.line}

`

    if (fileContent) {
      prompt += `\n当前文件内容：\n\`\`\`\n${fileContent}\n\`\`\`\n`
    }

    if (relatedFiles && relatedFiles.length > 0) {
      prompt += `\n相关文件：\n`
      for (const file of relatedFiles) {
        prompt += `\n${file.path}:\n\`\`\`\n${file.content}\n\`\`\`\n`
      }
    }

    prompt += `\n请生成：
1. 完整的实现代码
2. 必要的类型定义
3. 简短的注释说明

要求：
- 代码风格一致
- 类型安全
- 遵循最佳实践
- 只输出代码，不要解释`

    return prompt
  }

  /**
   * 构建代码审查提示词
   */
  private buildReviewPrompt(context: AIContext): string {
    const code = context.fileContent || context.codeSnippet!

    return `你是一个专业的代码审查专家。请审查以下代码，提供改进建议。

代码：
\`\`\`${context.language || 'typescript'}
${code}
\`\`\`

请从以下方面审查：
1. 代码质量（可读性、可维护性）
2. 性能问题
3. 安全漏洞
4. 类型安全
5. 最佳实践

输出格式：
- 每个建议一行，以 "- " 开头
- 严重问题用 "🔴" 标记
- 警告用 "⚠️" 标记
- 建议用 "💡" 标记`
  }

  /**
   * 构建 Bug 修复提示词
   */
  private buildFixPrompt(context: AIContext): string {
    const { bugInfo, fileContent, filePath } = context

    let prompt = `你是一个专业的 Bug 修复专家。请修复以下 Bug。

Bug 描述: ${bugInfo!.description}
`

    if (bugInfo!.errorMessage) {
      prompt += `错误信息: ${bugInfo!.errorMessage}\n`
    }

    if (bugInfo!.stackTrace) {
      prompt += `堆栈跟踪:\n${bugInfo!.stackTrace}\n`
    }

    if (fileContent) {
      prompt += `\n问题代码:\n\`\`\`\n${fileContent}\n\`\`\`\n`
    }

    prompt += `\n请提供：
1. 修复后的完整代码
2. 修复原因说明（简短）

只输出修复后的代码，不要额外解释。`

    return prompt
  }

  /**
   * 构建文档生成提示词
   */
  private buildDocumentPrompt(context: AIContext): string {
    const code = context.fileContent || context.codeSnippet!

    return `你是一个专业的技术文档撰写专家。请为以下代码生成文档。

代码：
\`\`\`${context.language || 'typescript'}
${code}
\`\`\`

请生成：
1. JSDoc 格式的函数/类注释
2. 简短的使用示例
3. 参数和返回值说明

要求：
- 文档清晰易懂
- 包含类型信息
- 提供实际用例`
  }

  /**
   * 从响应中提取代码
   */
  private extractCode(response: string): string | undefined {
    // 提取 ``` 代码块
    const codeBlockRegex = /```(?:\w+)?\n([\s\S]*?)```/g
    const matches = [...response.matchAll(codeBlockRegex)]

    if (matches.length > 0) {
      return matches[0][1].trim()
    }

    return undefined
  }

  /**
   * 从响应中提取建议
   */
  private extractSuggestions(response: string): string[] {
    const lines = response.split('\n')
    const suggestions: string[] = []

    for (const line of lines) {
      if (line.trim().startsWith('-') ||
          line.includes('🔴') ||
          line.includes('⚠️') ||
          line.includes('💡')) {
        suggestions.push(line.trim())
      }
    }

    return suggestions
  }

  /**
   * 计算成本
   */
  private calculateCost(inputTokens: number, outputTokens: number): number {
    // Claude Sonnet 4.5 定价：input $3/M, output $15/M
    const inputCost = (inputTokens / 1_000_000) * 3
    const outputCost = (outputTokens / 1_000_000) * 15
    return inputCost + outputCost
  }
}

// 全局单例
let globalEngine: ClaudeEngine | null = null

export function getGlobalClaudeEngine(): ClaudeEngine {
  if (!globalEngine) {
    globalEngine = new ClaudeEngine()
  }
  return globalEngine
}
