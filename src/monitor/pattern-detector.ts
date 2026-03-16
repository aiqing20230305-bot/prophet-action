/**
 * Prophet Cross-Project Pattern Detector
 * 跨项目模式检测器 - 识别多个项目间的通用需求和模式
 *
 * @module monitor/pattern-detector
 * @prophet-component intelligence
 */

import { ScanResult, DetectedPattern, Issue, PatternExample } from '../types/orchestrator'

/**
 * 跨项目模式检测器
 */
export class CrossProjectPatternDetector {
  /**
   * 分析扫描结果，识别跨项目模式
   */
  async analyze(scanResults: ScanResult[]): Promise<DetectedPattern[]> {
    const patterns: DetectedPattern[] = []

    // 1. TODO 模式聚类
    const todoPatterns = await this.analyzeTodoPatterns(scanResults)
    patterns.push(...todoPatterns)

    // 2. 代码重复检测
    const duplicatePatterns = await this.findDuplicateCode(scanResults)
    patterns.push(...duplicatePatterns)

    // 3. 配置模式
    const configPatterns = await this.analyzeConfigs(scanResults)
    patterns.push(...configPatterns)

    // 4. 架构模式
    const archPatterns = await this.analyzeArchitecture(scanResults)
    patterns.push(...archPatterns)

    return patterns
  }

  /**
   * 分析 TODO 模式
   */
  private async analyzeTodoPatterns(scanResults: ScanResult[]): Promise<DetectedPattern[]> {
    const patterns: DetectedPattern[] = []

    // 收集所有 TODO
    const allTodos = scanResults.flatMap((r) =>
      r.opportunities
        .filter((o) => o.type === 'todo')
        .map((o) => ({ ...o, projectId: r.projectId }))
    )

    // 按类别分组
    const grouped = this.groupSimilarTodos(allTodos)

    // 生成模式
    for (const [category, todos] of grouped.entries()) {
      if (todos.length >= 2) {
        // 出现在2+个项目
        const affectedProjects = [...new Set(todos.map((t) => t.projectId))]

        patterns.push({
          type: 'common-need',
          category,
          description: `Multiple projects need ${category} functionality`,
          frequency: todos.length,
          affectedProjects,
          confidence: this.calculateConfidence(todos.length, scanResults.length),
          suggestion: this.generateSharedModuleSuggestion(category),
          examples: todos.slice(0, 3).map((t) => ({
            projectId: t.projectId,
            filePath: t.filePath || '',
            lineNumber: t.lineNumber,
            code: t.description,
          })),
        })
      }
    }

    return patterns
  }

  /**
   * 将相似的 TODO 分组
   */
  private groupSimilarTodos(todos: Issue[]): Map<string, Issue[]> {
    const grouped = new Map<string, Issue[]>()

    for (const todo of todos) {
      const category = this.categorizeTodo(todo.description)
      if (!grouped.has(category)) {
        grouped.set(category, [])
      }
      grouped.get(category)!.push(todo)
    }

    return grouped
  }

  /**
   * 将 TODO 归类
   */
  private categorizeTodo(content: string): string {
    const lower = content.toLowerCase()

    const keywords: Record<string, string[]> = {
      auth: ['登录', '认证', 'authentication', 'login', 'auth', 'jwt', 'token'],
      payment: ['支付', 'payment', 'stripe', '付款', 'checkout', 'billing'],
      monitoring: ['监控', 'monitoring', 'metrics', '告警', 'alert', 'logging'],
      testing: ['测试', 'test', 'unit test', 'integration', 'e2e'],
      security: ['安全', 'security', 'vulnerability', 'encrypt', 'xss', 'csrf'],
      performance: ['性能', 'performance', 'optimize', 'cache', 'slow'],
      ui: ['界面', 'ui', 'ux', 'design', 'layout', 'style'],
      api: ['api', 'endpoint', 'rest', 'graphql', 'http'],
      database: ['数据库', 'database', 'sql', 'query', 'migration'],
      deployment: ['部署', 'deploy', 'ci/cd', 'docker', 'kubernetes'],
      documentation: ['文档', 'documentation', 'readme', 'docs', 'comment'],
      refactor: ['重构', 'refactor', 'cleanup', 'reorganize'],
    }

    for (const [category, terms] of Object.entries(keywords)) {
      if (terms.some((term) => lower.includes(term))) {
        return category
      }
    }

    return 'other'
  }

  /**
   * 查找重复代码
   */
  private async findDuplicateCode(scanResults: ScanResult[]): Promise<DetectedPattern[]> {
    const patterns: DetectedPattern[] = []

    // TODO: 实现代码重复检测
    // - 可以使用代码哈希
    // - AST 相似度比较
    // - 字符串编辑距离

    return patterns
  }

  /**
   * 分析配置模式
   */
  private async analyzeConfigs(scanResults: ScanResult[]): Promise<DetectedPattern[]> {
    const patterns: DetectedPattern[] = []

    // 检查常见配置文件
    const configFiles = [
      'package.json',
      'tsconfig.json',
      '.eslintrc',
      '.prettierrc',
      'docker-compose.yml',
    ]

    for (const configFile of configFiles) {
      const projectsWithConfig = scanResults.filter((r) =>
        r.changes.modified.some((f) => f.includes(configFile)) ||
        r.changes.added.some((f) => f.includes(configFile))
      )

      if (projectsWithConfig.length >= 2) {
        patterns.push({
          type: 'config-pattern',
          category: configFile,
          description: `Multiple projects modifying ${configFile}`,
          frequency: projectsWithConfig.length,
          affectedProjects: projectsWithConfig.map((r) => r.projectId),
          confidence: 0.8,
          suggestion: `Consider creating shared ${configFile} template or config package`,
          examples: projectsWithConfig.slice(0, 3).map((r) => ({
            projectId: r.projectId,
            filePath: configFile,
          })),
        })
      }
    }

    return patterns
  }

  /**
   * 分析架构模式
   */
  private async analyzeArchitecture(scanResults: ScanResult[]): Promise<DetectedPattern[]> {
    const patterns: DetectedPattern[] = []

    // 检测常见架构模式
    const architectureIndicators = {
      'react-app': ['src/App.tsx', 'src/components', 'package.json'],
      'express-api': ['src/routes', 'src/controllers', 'express'],
      'nextjs-app': ['pages/', 'next.config.js'],
      'nestjs-api': ['src/modules', 'nest-cli.json'],
      'vue-app': ['src/App.vue', 'vue.config.js'],
    }

    // TODO: 实现架构模式识别

    return patterns
  }

  /**
   * 计算模式置信度
   */
  private calculateConfidence(occurrences: number, totalProjects: number): number {
    // 基于出现频率计算置信度
    const frequency = occurrences / totalProjects

    // 2个项目 = 0.6，3个 = 0.75，4个+ = 0.9
    if (occurrences >= 4) {
      return 0.9
    } else if (occurrences === 3) {
      return 0.75
    } else if (occurrences === 2) {
      return 0.6
    }

    return frequency
  }

  /**
   * 生成共享模块建议
   */
  private generateSharedModuleSuggestion(category: string): string {
    const suggestions: Record<string, string> = {
      auth: 'Create @prophet/auth-service - Shared authentication and authorization module',
      payment: 'Create @prophet/payment-service - Unified payment integration module',
      monitoring: 'Create @prophet/monitoring - Shared monitoring and logging utilities',
      testing: 'Create @prophet/test-utils - Shared testing utilities and helpers',
      security: 'Create @prophet/security - Security utilities and middleware',
      performance: 'Create @prophet/performance - Performance optimization utilities',
      ui: 'Create @prophet/ui-components - Shared UI component library',
      api: 'Create @prophet/api-client - Shared API client and types',
      database: 'Create @prophet/database - Shared database utilities and migrations',
      deployment: 'Create @prophet/deploy-config - Shared deployment configurations',
    }

    return suggestions[category] || `Create @prophet/${category}-shared - Shared ${category} module`
  }

  /**
   * 识别可共享的解决方案
   */
  identifySharedSolutions(patterns: DetectedPattern[]): SharedSolution[] {
    const solutions: SharedSolution[] = []

    for (const pattern of patterns) {
      if (pattern.type === 'common-need' && pattern.confidence >= 0.6) {
        solutions.push({
          category: pattern.category,
          affectedProjects: pattern.affectedProjects,
          moduleName: this.extractModuleName(pattern.suggestion),
          priority: this.calculateSolutionPriority(pattern),
          estimatedEffort: this.estimateEffort(pattern),
          description: pattern.description,
        })
      }
    }

    return solutions.sort((a, b) => b.priority - a.priority)
  }

  /**
   * 从建议中提取模块名
   */
  private extractModuleName(suggestion: string): string {
    const match = suggestion.match(/@prophet\/[\w-]+/)
    return match ? match[0] : '@prophet/shared-module'
  }

  /**
   * 计算解决方案优先级
   */
  private calculateSolutionPriority(pattern: DetectedPattern): number {
    let priority = 0

    // 影响的项目数
    priority += pattern.affectedProjects.length * 30

    // 置信度
    priority += pattern.confidence * 50

    // 频率
    priority += pattern.frequency * 10

    return Math.min(priority, 100)
  }

  /**
   * 估算工作量
   */
  private estimateEffort(pattern: DetectedPattern): 'small' | 'medium' | 'large' {
    const complexity: Record<string, string> = {
      auth: 'large',
      payment: 'large',
      monitoring: 'medium',
      testing: 'medium',
      security: 'large',
      performance: 'medium',
      ui: 'medium',
      api: 'small',
      database: 'medium',
      deployment: 'small',
    }

    return (complexity[pattern.category] as any) || 'medium'
  }
}

/**
 * 共享解决方案
 */
export interface SharedSolution {
  category: string
  affectedProjects: string[]
  moduleName: string
  priority: number
  estimatedEffort: 'small' | 'medium' | 'large'
  description: string
}
