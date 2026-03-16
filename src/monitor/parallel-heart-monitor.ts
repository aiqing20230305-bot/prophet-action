/**
 * Prophet Parallel Heart Monitor
 * 并行心跳监控器 - 同时监控多个项目，共享缓存和资源
 *
 * @module monitor/parallel-heart-monitor
 * @prophet-component monitoring
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import { EventEmitter } from 'events'
import * as fs from 'fs/promises'
import * as path from 'path'
import {
  ProjectConfig,
  ScanResult,
  GitChanges,
  Issue,
  OptimizationResult,
  CachedScanResult,
} from '../types/orchestrator'

const execAsync = promisify(exec)

/**
 * 并行心跳监控器
 */
export class ParallelHeartMonitor extends EventEmitter {
  private scanCache: Map<string, CachedScanResult> = new Map()
  private projectStates: Map<string, ProjectMonitorState> = new Map()
  private cacheTimeout = 60000 // 1分钟缓存

  /**
   * 监控多个项目
   */
  async monitorProjects(projects: ProjectConfig[]): Promise<Map<string, ScanResult>> {
    const results = new Map<string, ScanResult>()

    // 并行扫描所有项目
    const scanPromises = projects.map(async (project) => {
      try {
        const result = await this.scanProject(project)
        results.set(project.id, result)
        return result
      } catch (error) {
        this.emit('scan-error', project.id, error)
        return null
      }
    })

    await Promise.all(scanPromises)

    return results
  }

  /**
   * 扫描单个项目
   */
  private async scanProject(project: ProjectConfig): Promise<ScanResult> {
    this.emit('scan-started', project.id)

    // 1. 检测变化（git status）
    const changes = await this.detectChanges(project.path)

    // 2. 扫描优化机会
    const opportunities = await this.scanOpportunities(project)

    // 3. 执行安全优化（如果启用）
    const optimizations: OptimizationResult[] = []
    if (project.autoOptimize) {
      const safeOpportunities = opportunities.filter(
        (o) => o.autoExecutable && o.safe
      )
      for (const opportunity of safeOpportunities) {
        const result = await this.executeOptimization(project, opportunity)
        optimizations.push(result)
      }
    }

    const result: ScanResult = {
      projectId: project.id,
      timestamp: new Date(),
      changes,
      opportunities,
      optimizations,
      patterns: [], // 模式检测由 PatternDetector 处理
    }

    this.emit('scan-completed', project.id, result)

    return result
  }

  /**
   * 检测 Git 变化
   */
  private async detectChanges(projectPath: string): Promise<GitChanges> {
    // 使用缓存避免频繁 git 调用
    const cacheKey = `${projectPath}:status`
    const cached = this.scanCache.get(cacheKey)

    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data as GitChanges
    }

    try {
      const { stdout } = await execAsync('git status --porcelain', {
        cwd: projectPath,
      })

      const changes = this.parseGitStatus(stdout)
      this.scanCache.set(cacheKey, {
        data: changes,
        timestamp: Date.now(),
      })

      return changes
    } catch (error) {
      // 不是 git 仓库或其他错误
      return {
        modified: [],
        added: [],
        deleted: [],
        untracked: [],
        hasChanges: false,
      }
    }
  }

  /**
   * 解析 git status 输出
   */
  private parseGitStatus(output: string): GitChanges {
    const lines = output.split('\n').filter((line) => line.trim())
    const modified: string[] = []
    const added: string[] = []
    const deleted: string[] = []
    const untracked: string[] = []

    for (const line of lines) {
      const status = line.substring(0, 2)
      const file = line.substring(3)

      if (status.includes('M')) {
        modified.push(file)
      } else if (status.includes('A')) {
        added.push(file)
      } else if (status.includes('D')) {
        deleted.push(file)
      } else if (status.includes('?')) {
        untracked.push(file)
      }
    }

    return {
      modified,
      added,
      deleted,
      untracked,
      hasChanges: modified.length + added.length + deleted.length + untracked.length > 0,
    }
  }

  /**
   * 扫描优化机会
   */
  private async scanOpportunities(project: ProjectConfig): Promise<Issue[]> {
    const opportunities: Issue[] = []

    try {
      // 1. 扫描 TODO 注释
      const todos = await this.scanTodos(project.path)
      opportunities.push(...todos)

      // 2. 扫描代码质量问题
      const qualityIssues = await this.scanQualityIssues(project.path)
      opportunities.push(...qualityIssues)

      // 3. 扫描性能优化机会
      const perfIssues = await this.scanPerformanceIssues(project.path)
      opportunities.push(...perfIssues)
    } catch (error) {
      this.emit('scan-opportunities-error', project.id, error)
    }

    return opportunities
  }

  /**
   * 扫描 TODO 注释
   */
  private async scanTodos(projectPath: string): Promise<Issue[]> {
    const cacheKey = `${projectPath}:todos`
    const cached = this.scanCache.get(cacheKey)

    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data as Issue[]
    }

    const todos: Issue[] = []

    try {
      // 使用 ripgrep 或 grep 搜索 TODO
      const { stdout } = await execAsync(
        'git grep -n "TODO\\|FIXME\\|XXX\\|HACK" || grep -rn "TODO\\|FIXME\\|XXX\\|HACK" . || true',
        { cwd: projectPath, maxBuffer: 10 * 1024 * 1024 }
      )

      const lines = stdout.split('\n').filter((line) => line.trim())

      for (const line of lines.slice(0, 100)) {
        // 限制最多100个
        const match = line.match(/^(.+?):(\d+):(.+)$/)
        if (match) {
          const [, filePath, lineNumber, content] = match
          todos.push({
            id: `todo-${Date.now()}-${Math.random()}`,
            projectId: '',
            type: 'todo',
            title: content.trim().substring(0, 100),
            description: content.trim(),
            priority: this.determineTodoPriority(content),
            affectedProjects: [],
            autoExecutable: false,
            safe: true,
            estimatedImpact: 'low',
            createdAt: new Date(),
            filePath,
            lineNumber: parseInt(lineNumber),
          })
        }
      }

      this.scanCache.set(cacheKey, {
        data: todos,
        timestamp: Date.now(),
      })
    } catch (error) {
      // 忽略错误
    }

    return todos
  }

  /**
   * 确定 TODO 优先级
   */
  private determineTodoPriority(content: string): 'critical' | 'high' | 'medium' | 'low' {
    const lower = content.toLowerCase()
    if (lower.includes('critical') || lower.includes('urgent')) {
      return 'critical'
    }
    if (lower.includes('fixme') || lower.includes('bug')) {
      return 'high'
    }
    if (lower.includes('important')) {
      return 'medium'
    }
    return 'low'
  }

  /**
   * 扫描代码质量问题
   */
  private async scanQualityIssues(projectPath: string): Promise<Issue[]> {
    const issues: Issue[] = []

    try {
      // 检查是否有 ESLint 或 TypeScript 错误
      const files = await this.findFiles(projectPath, ['.ts', '.tsx', '.js', '.jsx'])

      // 简单的代码质量检查
      for (const file of files.slice(0, 50)) {
        // 限制检查文件数
        const content = await fs.readFile(path.join(projectPath, file), 'utf-8')

        // 检查过长的函数
        if (this.hasLongFunctions(content)) {
          issues.push({
            id: `quality-${Date.now()}-${Math.random()}`,
            projectId: '',
            type: 'refactor',
            title: `Long function detected in ${file}`,
            description: 'Consider breaking down long functions for better maintainability',
            priority: 'low',
            affectedProjects: [],
            autoExecutable: false,
            safe: false,
            estimatedImpact: 'medium',
            createdAt: new Date(),
            filePath: file,
          })
        }
      }
    } catch (error) {
      // 忽略错误
    }

    return issues
  }

  /**
   * 扫描性能问题
   */
  private async scanPerformanceIssues(projectPath: string): Promise<Issue[]> {
    const issues: Issue[] = []

    // TODO: 实现性能分析逻辑
    // - 检查大循环
    // - 检查未优化的查询
    // - 检查内存泄漏风险

    return issues
  }

  /**
   * 查找特定扩展名的文件
   */
  private async findFiles(projectPath: string, extensions: string[]): Promise<string[]> {
    const files: string[] = []

    try {
      const extensionPattern = extensions.map((ext) => `*${ext}`).join(' -o -name ')
      const { stdout } = await execAsync(
        `find . -type f \\( -name ${extensionPattern} \\) -not -path "*/node_modules/*" -not -path "*/.git/*" | head -100`,
        { cwd: projectPath, maxBuffer: 10 * 1024 * 1024 }
      )

      files.push(...stdout.split('\n').filter((line) => line.trim()))
    } catch (error) {
      // 忽略错误
    }

    return files
  }

  /**
   * 检查是否有过长的函数
   */
  private hasLongFunctions(content: string): boolean {
    const functionRegex = /function\s+\w+\s*\([^)]*\)\s*\{/g
    const matches = content.match(functionRegex)

    if (!matches) {
      return false
    }

    // 简单启发式：函数体超过100行
    const lines = content.split('\n')
    return lines.length > 100
  }

  /**
   * 执行优化
   */
  private async executeOptimization(
    project: ProjectConfig,
    opportunity: Issue
  ): Promise<OptimizationResult> {
    // 这里应该调用实际的优化逻辑
    // 目前只是占位符

    return {
      issueId: opportunity.id,
      action: 'Auto-optimization placeholder',
      success: false,
      linesAdded: 0,
      linesModified: 0,
      filesChanged: [],
      message: 'Auto-optimization not yet implemented',
    }
  }

  /**
   * 清理缓存
   */
  clearCache(): void {
    this.scanCache.clear()
  }

  /**
   * 获取缓存统计
   */
  getCacheStats() {
    return {
      size: this.scanCache.size,
      timeout: this.cacheTimeout,
    }
  }
}

/**
 * 项目监控状态
 */
interface ProjectMonitorState {
  lastScan: Date
  consecutiveErrors: number
  health: 'healthy' | 'warning' | 'critical'
}
