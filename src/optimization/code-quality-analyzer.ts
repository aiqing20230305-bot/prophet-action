/**
 * Code Quality Analyzer - 代码质量分析器
 * Phase 7 Day 2: 自我优化
 *
 * 职责：
 * - 分析代码质量
 * - 检测代码异味
 * - 识别优化机会
 */

import { EventEmitter } from 'events'
import * as fs from 'fs/promises'
import * as path from 'path'
import { PerformanceProfile } from './performance-profiler.js'

/**
 * 代码位置
 */
export interface CodeLocation {
  file: string
  line: number
  function?: string
}

/**
 * 复杂度指标
 */
export interface ComplexityMetrics {
  cyclomaticComplexity: number    // 圈复杂度
  cognitiveComplexity: number     // 认知复杂度
  nestingDepth: number            // 嵌套深度
  linesOfCode: number             // 代码行数
  location: CodeLocation
}

/**
 * 代码异味
 */
export interface CodeSmell {
  type: 'duplication' | 'long-function' | 'large-class' | 'long-parameter-list' |
        'magic-number' | 'nested-conditionals' | 'god-class'
  location: CodeLocation
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  suggestion: string
  metrics?: {
    actual: number
    threshold: number
  }
}

/**
 * 优化机会
 */
export interface OptimizationOpportunity {
  type: 'caching' | 'parallelization' | 'simplification' | 'extraction' |
        'async-conversion' | 'batch-processing'
  location: CodeLocation
  estimatedGain: number           // 预期性能提升百分比
  effort: 'low' | 'medium' | 'high'
  confidence: number              // 0-100，建议可靠性
  description: string
  implementation: string          // 实施建议
}

/**
 * 代码质量报告
 */
export interface CodeQualityReport {
  analyzedAt: Date
  totalFiles: number
  totalLines: number

  // 复杂度
  complexity: {
    average: number
    high: ComplexityMetrics[]     // 高复杂度代码
    distribution: {
      low: number       // <10
      medium: number    // 10-20
      high: number      // 20-50
      critical: number  // >50
    }
  }

  // 代码异味
  smells: CodeSmell[]

  // 优化机会
  opportunities: OptimizationOpportunity[]

  // 质量分数
  score: number  // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F'

  // 统计
  stats: {
    totalSmells: number
    criticalIssues: number
    totalOpportunities: number
    estimatedTotalGain: number
  }
}

/**
 * 分析器配置
 */
export interface CodeQualityAnalyzerConfig {
  // 阈值
  maxCyclomaticComplexity: number
  maxCognitiveComplexity: number
  maxFunctionLines: number
  maxClassLines: number
  maxParameters: number
  maxNestingDepth: number

  // 分析范围
  includePaths: string[]
  excludePaths: string[]
  fileExtensions: string[]
}

/**
 * 代码质量分析器
 */
export class CodeQualityAnalyzer extends EventEmitter {
  private config: CodeQualityAnalyzerConfig

  constructor(config?: Partial<CodeQualityAnalyzerConfig>) {
    super()

    this.config = {
      maxCyclomaticComplexity: 10,
      maxCognitiveComplexity: 15,
      maxFunctionLines: 50,
      maxClassLines: 300,
      maxParameters: 5,
      maxNestingDepth: 4,
      includePaths: ['src/**/*.ts'],
      excludePaths: ['node_modules/**', 'dist/**', '*.test.ts', '*.spec.ts'],
      fileExtensions: ['.ts', '.js'],
      ...config
    }
  }

  /**
   * 分析代码库
   */
  async analyzeCodebase(basePath: string): Promise<CodeQualityReport> {
    console.log('[CodeQualityAnalyzer] 🔍 开始分析代码库...')
    console.log(`   路径: ${basePath}`)

    const startTime = Date.now()

    // 1. 扫描文件
    const files = await this.scanFiles(basePath)
    console.log(`   发现 ${files.length} 个文件`)

    // 2. 分析每个文件
    const allComplexity: ComplexityMetrics[] = []
    const allSmells: CodeSmell[] = []
    let totalLines = 0

    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf-8')
        totalLines += content.split('\n').length

        // 分析复杂度
        const complexity = await this.analyzeFileComplexity(file, content)
        allComplexity.push(...complexity)

        // 检测代码异味
        const smells = await this.detectFileSmells(file, content)
        allSmells.push(...smells)

      } catch (err: any) {
        console.log(`   ⚠️  跳过文件 ${file}: ${err.message}`)
      }
    }

    // 3. 识别优化机会（基于性能分析）
    const opportunities = this.identifyOptimizationOpportunities(allComplexity, allSmells)

    // 4. 计算分数和等级
    const score = this.calculateQualityScore(allComplexity, allSmells)
    const grade = this.calculateGrade(score)

    // 5. 生成报告
    const report: CodeQualityReport = {
      analyzedAt: new Date(),
      totalFiles: files.length,
      totalLines,
      complexity: this.summarizeComplexity(allComplexity),
      smells: allSmells,
      opportunities,
      score,
      grade,
      stats: {
        totalSmells: allSmells.length,
        criticalIssues: allSmells.filter(s => s.severity === 'critical').length,
        totalOpportunities: opportunities.length,
        estimatedTotalGain: opportunities.reduce((sum, o) => sum + o.estimatedGain, 0)
      }
    }

    const duration = Date.now() - startTime
    console.log(`[CodeQualityAnalyzer] ✅ 分析完成（${(duration / 1000).toFixed(1)}秒）`)

    this.emit('analysis-completed', report)

    return report
  }

  /**
   * 扫描文件
   */
  private async scanFiles(basePath: string): Promise<string[]> {
    const files: string[] = []

    async function scan(dir: string) {
      const entries = await fs.readdir(dir, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)

        if (entry.isDirectory()) {
          // 排除目录
          if (!['node_modules', 'dist', '.git', 'coverage'].includes(entry.name)) {
            await scan(fullPath)
          }
        } else if (entry.isFile()) {
          // 包含TypeScript和JavaScript文件
          if (['.ts', '.js'].includes(path.extname(entry.name)) &&
              !entry.name.includes('.test.') &&
              !entry.name.includes('.spec.')) {
            files.push(fullPath)
          }
        }
      }
    }

    await scan(basePath)
    return files
  }

  /**
   * 分析文件复杂度
   */
  private async analyzeFileComplexity(file: string, content: string): Promise<ComplexityMetrics[]> {
    const metrics: ComplexityMetrics[] = []
    const lines = content.split('\n')

    // 查找函数定义
    const functionRegex = /(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\(|(\w+)\s*\(.*\)\s*{|(?:async\s+)?(\w+)\s*\()/g

    let match
    let lineNumber = 0

    for (const line of lines) {
      lineNumber++

      // 重置正则表达式
      functionRegex.lastIndex = 0
      match = functionRegex.exec(line)

      if (match) {
        const functionName = match[1] || match[2] || match[3] || match[4] || 'anonymous'

        // 提取函数体（简化版）
        const functionBody = this.extractFunctionBody(lines, lineNumber - 1)

        // 计算复杂度
        const cyclomatic = this.calculateCyclomaticComplexity(functionBody)
        const cognitive = this.calculateCognitiveComplexity(functionBody)
        const nesting = this.calculateNestingDepth(functionBody)
        const loc = functionBody.split('\n').length

        metrics.push({
          cyclomaticComplexity: cyclomatic,
          cognitiveComplexity: cognitive,
          nestingDepth: nesting,
          linesOfCode: loc,
          location: {
            file,
            line: lineNumber,
            function: functionName
          }
        })
      }
    }

    return metrics
  }

  /**
   * 提取函数体
   */
  private extractFunctionBody(lines: string[], startLine: number): string {
    let braceCount = 0
    let inFunction = false
    const body: string[] = []

    for (let i = startLine; i < lines.length && i < startLine + 200; i++) {
      const line = lines[i]

      for (const char of line) {
        if (char === '{') {
          braceCount++
          inFunction = true
        } else if (char === '}') {
          braceCount--
        }
      }

      if (inFunction) {
        body.push(line)
      }

      if (inFunction && braceCount === 0) {
        break
      }
    }

    return body.join('\n')
  }

  /**
   * 计算圈复杂度
   */
  private calculateCyclomaticComplexity(code: string): number {
    // 简化版：统计决策点
    let complexity = 1  // 基础复杂度

    // 条件语句
    complexity += (code.match(/\bif\b/g) || []).length
    complexity += (code.match(/\belse\s+if\b/g) || []).length
    complexity += (code.match(/\bwhile\b/g) || []).length
    complexity += (code.match(/\bfor\b/g) || []).length
    complexity += (code.match(/\bcase\b/g) || []).length
    complexity += (code.match(/\bcatch\b/g) || []).length
    complexity += (code.match(/\&\&/g) || []).length
    complexity += (code.match(/\|\|/g) || []).length
    complexity += (code.match(/\?/g) || []).length  // 三元运算符

    return complexity
  }

  /**
   * 计算认知复杂度
   */
  private calculateCognitiveComplexity(code: string): number {
    // 简化版：类似圈复杂度但考虑嵌套
    const lines = code.split('\n')
    let complexity = 0
    let nestingLevel = 0

    for (const line of lines) {
      // 增加嵌套
      if (line.match(/\{/)) {
        nestingLevel++
      }

      // 决策点（乘以嵌套级别）
      if (line.match(/\b(if|while|for|case)\b/)) {
        complexity += nestingLevel + 1
      }

      // 减少嵌套
      if (line.match(/\}/)) {
        nestingLevel = Math.max(0, nestingLevel - 1)
      }
    }

    return complexity
  }

  /**
   * 计算嵌套深度
   */
  private calculateNestingDepth(code: string): number {
    let maxDepth = 0
    let currentDepth = 0

    for (const char of code) {
      if (char === '{') {
        currentDepth++
        maxDepth = Math.max(maxDepth, currentDepth)
      } else if (char === '}') {
        currentDepth = Math.max(0, currentDepth - 1)
      }
    }

    return maxDepth
  }

  /**
   * 检测文件中的代码异味
   */
  private async detectFileSmells(file: string, content: string): Promise<CodeSmell[]> {
    const smells: CodeSmell[] = []
    const lines = content.split('\n')

    // 1. 长函数
    let currentFunction = ''
    let functionStartLine = 0
    let functionLines = 0

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      // 检测函数开始
      if (line.match(/(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\(|(\w+)\s*\(.*\)\s*{)/)) {
        currentFunction = line.match(/\w+/)?.[0] || 'anonymous'
        functionStartLine = i + 1
        functionLines = 0
      }

      // 统计函数行数
      if (currentFunction && line.trim()) {
        functionLines++
      }

      // 检测函数结束
      if (line.match(/^\s*}\s*$/) && currentFunction) {
        if (functionLines > this.config.maxFunctionLines) {
          smells.push({
            type: 'long-function',
            location: { file, line: functionStartLine, function: currentFunction },
            severity: functionLines > this.config.maxFunctionLines * 2 ? 'high' : 'medium',
            description: `函数 ${currentFunction} 过长（${functionLines}行）`,
            suggestion: `将函数拆分为更小的函数（推荐<${this.config.maxFunctionLines}行）`,
            metrics: { actual: functionLines, threshold: this.config.maxFunctionLines }
          })
        }
        currentFunction = ''
      }
    }

    // 2. 魔法数字
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const magicNumbers = line.match(/\b\d{3,}\b/g)  // 3位以上的数字

      if (magicNumbers && !line.includes('//') && !line.includes('const')) {
        smells.push({
          type: 'magic-number',
          location: { file, line: i + 1 },
          severity: 'low',
          description: `发现魔法数字: ${magicNumbers.join(', ')}`,
          suggestion: '将魔法数字提取为常量'
        })
      }
    }

    // 3. 过多参数
    const longParamRegex = /\(([^)]{50,})\)/g  // 参数列表超过50字符
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (longParamRegex.test(line)) {
        const paramCount = (line.match(/,/g) || []).length + 1

        if (paramCount > this.config.maxParameters) {
          smells.push({
            type: 'long-parameter-list',
            location: { file, line: i + 1 },
            severity: paramCount > this.config.maxParameters * 2 ? 'high' : 'medium',
            description: `参数过多（${paramCount}个）`,
            suggestion: `考虑使用对象参数或拆分函数（推荐<${this.config.maxParameters}个）`,
            metrics: { actual: paramCount, threshold: this.config.maxParameters }
          })
        }
      }
    }

    // 4. 深度嵌套
    let nestingLevel = 0
    let maxNesting = 0
    let maxNestingLine = 0

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      if (line.match(/\{/)) {
        nestingLevel++
        if (nestingLevel > maxNesting) {
          maxNesting = nestingLevel
          maxNestingLine = i + 1
        }
      }

      if (line.match(/\}/)) {
        nestingLevel = Math.max(0, nestingLevel - 1)
      }
    }

    if (maxNesting > this.config.maxNestingDepth) {
      smells.push({
        type: 'nested-conditionals',
        location: { file, line: maxNestingLine },
        severity: maxNesting > this.config.maxNestingDepth * 2 ? 'critical' : 'high',
        description: `嵌套层级过深（${maxNesting}层）`,
        suggestion: `使用早返回或提取函数来减少嵌套（推荐<${this.config.maxNestingDepth}层）`,
        metrics: { actual: maxNesting, threshold: this.config.maxNestingDepth }
      })
    }

    // 5. 重复代码检测（简化版）
    const codeBlocks = new Map<string, number[]>()

    for (let i = 0; i < lines.length - 3; i++) {
      const block = lines.slice(i, i + 4).join('\n').trim()

      if (block.length > 50 && !block.includes('//')) {
        if (!codeBlocks.has(block)) {
          codeBlocks.set(block, [])
        }
        codeBlocks.get(block)!.push(i + 1)
      }
    }

    for (const [block, locations] of codeBlocks.entries()) {
      if (locations.length > 1) {
        smells.push({
          type: 'duplication',
          location: { file, line: locations[0] },
          severity: locations.length > 3 ? 'high' : 'medium',
          description: `代码重复出现${locations.length}次`,
          suggestion: '提取公共函数或使用循环',
          metrics: { actual: locations.length, threshold: 1 }
        })
      }
    }

    return smells
  }

  /**
   * 识别优化机会
   */
  private identifyOptimizationOpportunities(
    complexity: ComplexityMetrics[],
    smells: CodeSmell[]
  ): OptimizationOpportunity[] {
    const opportunities: OptimizationOpportunity[] = []

    // 1. 基于高复杂度的机会
    for (const metric of complexity) {
      if (metric.cyclomaticComplexity > this.config.maxCyclomaticComplexity) {
        opportunities.push({
          type: 'simplification',
          location: metric.location,
          estimatedGain: Math.min(30, (metric.cyclomaticComplexity - this.config.maxCyclomaticComplexity) * 2),
          effort: metric.cyclomaticComplexity > 30 ? 'high' : 'medium',
          confidence: 75,
          description: `简化高复杂度函数（复杂度: ${metric.cyclomaticComplexity}）`,
          implementation: '使用策略模式或提取子函数来降低复杂度'
        })
      }
    }

    // 2. 基于代码异味的机会
    for (const smell of smells) {
      if (smell.type === 'duplication') {
        opportunities.push({
          type: 'extraction',
          location: smell.location,
          estimatedGain: 20,
          effort: 'low',
          confidence: 90,
          description: '提取重复代码',
          implementation: '创建公共函数或使用工具函数库'
        })
      }

      if (smell.type === 'long-function') {
        opportunities.push({
          type: 'extraction',
          location: smell.location,
          estimatedGain: 15,
          effort: 'medium',
          confidence: 80,
          description: '拆分长函数',
          implementation: '按职责拆分为多个小函数，提高可读性和可测试性'
        })
      }
    }

    // 3. 通用优化机会
    // 缓存机会（基于重复计算的假设）
    opportunities.push({
      type: 'caching',
      location: { file: 'global', line: 0 },
      estimatedGain: 25,
      effort: 'low',
      confidence: 60,
      description: '实现结果缓存',
      implementation: '对频繁调用的纯函数添加缓存层'
    })

    // 并行化机会
    opportunities.push({
      type: 'parallelization',
      location: { file: 'global', line: 0 },
      estimatedGain: 40,
      effort: 'medium',
      confidence: 50,
      description: '并行化独立任务',
      implementation: '使用Promise.all或Worker线程并行执行独立任务'
    })

    return opportunities
  }

  /**
   * 汇总复杂度
   */
  private summarizeComplexity(metrics: ComplexityMetrics[]) {
    if (metrics.length === 0) {
      return {
        average: 0,
        high: [],
        distribution: { low: 0, medium: 0, high: 0, critical: 0 }
      }
    }

    const average = metrics.reduce((sum, m) => sum + m.cyclomaticComplexity, 0) / metrics.length

    const high = metrics
      .filter(m => m.cyclomaticComplexity > this.config.maxCyclomaticComplexity)
      .sort((a, b) => b.cyclomaticComplexity - a.cyclomaticComplexity)

    const distribution = {
      low: metrics.filter(m => m.cyclomaticComplexity < 10).length,
      medium: metrics.filter(m => m.cyclomaticComplexity >= 10 && m.cyclomaticComplexity < 20).length,
      high: metrics.filter(m => m.cyclomaticComplexity >= 20 && m.cyclomaticComplexity < 50).length,
      critical: metrics.filter(m => m.cyclomaticComplexity >= 50).length
    }

    return { average, high, distribution }
  }

  /**
   * 计算质量分数
   */
  private calculateQualityScore(complexity: ComplexityMetrics[], smells: CodeSmell[]): number {
    let score = 100

    // 复杂度扣分
    for (const metric of complexity) {
      if (metric.cyclomaticComplexity > this.config.maxCyclomaticComplexity) {
        score -= Math.min(5, (metric.cyclomaticComplexity - this.config.maxCyclomaticComplexity) * 0.5)
      }
    }

    // 代码异味扣分
    for (const smell of smells) {
      switch (smell.severity) {
        case 'critical': score -= 10; break
        case 'high': score -= 5; break
        case 'medium': score -= 2; break
        case 'low': score -= 1; break
      }
    }

    return Math.max(0, Math.round(score))
  }

  /**
   * 计算等级
   */
  private calculateGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A'
    if (score >= 80) return 'B'
    if (score >= 70) return 'C'
    if (score >= 60) return 'D'
    return 'F'
  }

  /**
   * 基于性能分析寻找优化机会
   */
  findOpportunities(profile: PerformanceProfile): OptimizationOpportunity[] {
    const opportunities: OptimizationOpportunity[] = []

    // 基于CPU热点
    for (const hotspot of profile.cpu.hotspots) {
      if (hotspot.percentage > 20) {
        opportunities.push({
          type: 'caching',
          location: { file: hotspot.file, line: 0, function: hotspot.function },
          estimatedGain: Math.min(50, hotspot.percentage * 0.6),
          effort: 'medium',
          confidence: 80,
          description: `优化热点函数 ${hotspot.function}（占用${hotspot.percentage.toFixed(1)}% CPU）`,
          implementation: '实现缓存或算法优化'
        })
      }
    }

    // 基于内存泄漏
    if (profile.memory.leaks.length > 0) {
      opportunities.push({
        type: 'simplification',
        location: { file: 'unknown', line: 0 },
        estimatedGain: 30,
        effort: 'high',
        confidence: 70,
        description: '修复内存泄漏',
        implementation: '检查对象引用，确保及时释放'
      })
    }

    return opportunities
  }
}
