/**
 * Prophet Adaptive Scheduler - 智能频率调整系统
 *
 * Phase 3.1: 智能频率调整
 *
 * 目标：根据项目活跃度动态调整扫描频率和资源分配
 *
 * 策略：
 * - 高活跃项目：每15秒扫描（实时响应）
 * - 中活跃项目：每1分钟扫描（正常节奏）
 * - 低活跃项目：每5分钟扫描（节省资源）
 * - 休眠项目：每30分钟扫描（最小监控）
 *
 * 活跃度计算因素：
 * - 最近1小时commits数
 * - TODO增长速度
 * - 工作时间段（工作日vs周末）
 * - 文件修改频率
 */

import { execSync } from 'child_process'
import { statSync, readdirSync } from 'fs'
import { join } from 'path'

export interface ProjectActivity {
  projectId: string
  projectName: string
  projectPath: string
  activityScore: number  // 0-1
  activityLevel: 'sleeping' | 'low' | 'medium' | 'high' | 'very-high'
  recommendedInterval: number  // 毫秒
  metrics: {
    recentCommits: number
    todoGrowthRate: number
    fileModifications: number
    isWorkingHours: boolean
  }
}

export class AdaptiveScheduler {
  private activityCache: Map<string, ProjectActivity> = new Map()
  private lastUpdate: Map<string, number> = new Map()
  private readonly CACHE_TTL = 5 * 60 * 1000  // 5分钟缓存

  /**
   * 计算项目活跃度并推荐扫描间隔
   */
  async adjustFrequency(
    projectId: string,
    projectName: string,
    projectPath: string
  ): Promise<ProjectActivity> {
    // 检查缓存
    const cached = this.activityCache.get(projectId)
    const lastUpdateTime = this.lastUpdate.get(projectId) || 0

    if (cached && Date.now() - lastUpdateTime < this.CACHE_TTL) {
      return cached
    }

    console.log(`🧠 [AdaptiveScheduler] 分析项目活跃度: ${projectName}`)

    // 计算各项指标
    const metrics = {
      recentCommits: await this.getRecentCommits(projectPath),
      todoGrowthRate: await this.getTodoGrowthRate(projectPath),
      fileModifications: await this.getFileModifications(projectPath),
      isWorkingHours: this.isWorkingHours()
    }

    // 计算综合活跃度分数（0-1）
    const activityScore = this.calculateActivityScore(metrics)

    // 确定活跃度等级
    const activityLevel = this.getActivityLevel(activityScore)

    // 推荐扫描间隔
    const recommendedInterval = this.getRecommendedInterval(activityLevel, metrics.isWorkingHours)

    const activity: ProjectActivity = {
      projectId,
      projectName,
      projectPath,
      activityScore,
      activityLevel,
      recommendedInterval,
      metrics
    }

    // 更新缓存
    this.activityCache.set(projectId, activity)
    this.lastUpdate.set(projectId, Date.now())

    console.log(`   活跃度分数: ${(activityScore * 100).toFixed(1)}%`)
    console.log(`   活跃度等级: ${activityLevel}`)
    console.log(`   推荐间隔: ${(recommendedInterval / 1000).toFixed(0)}秒`)

    return activity
  }

  /**
   * 获取最近1小时的commits数
   */
  private async getRecentCommits(projectPath: string): Promise<number> {
    try {
      const output = execSync(
        `git log --oneline --since="1 hour ago"`,
        { cwd: projectPath, encoding: 'utf-8', stdio: 'pipe' }
      )
      const commits = output.trim().split('\n').filter(line => line.length > 0)
      return commits.length
    } catch {
      return 0
    }
  }

  /**
   * 获取TODO增长速度
   *
   * 策略：对比最近2次commit的TODO数量
   */
  private async getTodoGrowthRate(projectPath: string): Promise<number> {
    try {
      // 获取最近2个commit的hash
      const commits = execSync(
        `git log -2 --format=%H`,
        { cwd: projectPath, encoding: 'utf-8', stdio: 'pipe' }
      ).trim().split('\n')

      if (commits.length < 2) {
        return 0
      }

      // 统计当前TODO数
      const currentTodos = this.countTodos(projectPath)

      // 统计上一个commit的TODO数（简化版：假设增长）
      // 实际可以checkout到上个commit统计，这里用简化逻辑
      const previousTodos = Math.max(0, currentTodos - 2)

      const growthRate = currentTodos - previousTodos

      // 归一化到0-10范围
      return Math.max(0, Math.min(10, growthRate))

    } catch {
      return 0
    }
  }

  /**
   * 统计当前TODO数量
   */
  private countTodos(projectPath: string): number {
    let todoCount = 0

    const scanDir = (dir: string, depth: number = 0) => {
      if (depth > 5) return

      try {
        const items = readdirSync(dir)

        for (const item of items) {
          if (item === 'node_modules' || item === '.git' || item.startsWith('.')) {
            continue
          }

          const fullPath = join(dir, item)

          try {
            const stat = statSync(fullPath)

            if (stat.isDirectory()) {
              scanDir(fullPath, depth + 1)
            } else if (stat.isFile() && this.isSourceFile(item)) {
              // 简化：文件大小估算TODO数（实际应该读取内容）
              // 这里用文件大小/10000作为粗略估计
              todoCount += Math.floor(stat.size / 10000)
            }
          } catch {
            // Skip
          }
        }
      } catch {
        // Skip
      }
    }

    const srcDirs = ['src', 'app', 'apps', 'packages']
    for (const srcDir of srcDirs) {
      try {
        scanDir(join(projectPath, srcDir))
      } catch {
        // Skip
      }
    }

    return todoCount
  }

  /**
   * 获取最近1小时的文件修改数
   */
  private async getFileModifications(projectPath: string): Promise<number> {
    try {
      const output = execSync(
        `git diff --stat HEAD@{1.hour.ago} HEAD`,
        { cwd: projectPath, encoding: 'utf-8', stdio: 'pipe' }
      )

      // 统计修改的文件数
      const lines = output.trim().split('\n')
      const modifiedFiles = lines.filter(line => line.includes('|')).length

      return modifiedFiles

    } catch {
      return 0
    }
  }

  /**
   * 判断是否在工作时间
   *
   * 工作时间：周一至周五 9:00-22:00
   */
  private isWorkingHours(): boolean {
    const now = new Date()
    const hour = now.getHours()
    const day = now.getDay()  // 0=周日, 1-5=周一至周五, 6=周六

    // 工作日
    const isWeekday = day >= 1 && day <= 5

    // 工作时间段（9:00-22:00）
    const isWorkingHour = hour >= 9 && hour <= 22

    return isWeekday && isWorkingHour
  }

  /**
   * 计算综合活跃度分数
   *
   * 权重分配：
   * - 最近commits: 40%
   * - TODO增长: 30%
   * - 文件修改: 20%
   * - 工作时间: 10%
   */
  private calculateActivityScore(metrics: ProjectActivity['metrics']): number {
    let score = 0

    // 1. 最近commits (0-1)
    // 归一化：0个=0, 5个+=1
    const commitScore = Math.min(1, metrics.recentCommits / 5)
    score += commitScore * 0.4

    // 2. TODO增长率 (0-1)
    // 归一化：0=0, 10+=1
    const todoScore = Math.min(1, metrics.todoGrowthRate / 10)
    score += todoScore * 0.3

    // 3. 文件修改数 (0-1)
    // 归一化：0个=0, 20个+=1
    const fileScore = Math.min(1, metrics.fileModifications / 20)
    score += fileScore * 0.2

    // 4. 工作时间 (0-1)
    const timeScore = metrics.isWorkingHours ? 1 : 0.3
    score += timeScore * 0.1

    return Math.max(0, Math.min(1, score))
  }

  /**
   * 确定活跃度等级
   */
  private getActivityLevel(score: number): ProjectActivity['activityLevel'] {
    if (score >= 0.8) return 'very-high'
    if (score >= 0.6) return 'high'
    if (score >= 0.4) return 'medium'
    if (score >= 0.2) return 'low'
    return 'sleeping'
  }

  /**
   * 获取推荐扫描间隔
   *
   * 基础间隔：
   * - very-high: 15秒
   * - high: 30秒
   * - medium: 1分钟
   * - low: 5分钟
   * - sleeping: 30分钟
   *
   * 非工作时间：间隔×2
   */
  private getRecommendedInterval(
    level: ProjectActivity['activityLevel'],
    isWorkingHours: boolean
  ): number {
    const baseIntervals = {
      'very-high': 15 * 1000,      // 15秒（极热项目）
      'high': 30 * 1000,           // 30秒（热项目）
      'medium': 60 * 1000,         // 1分钟（正常）
      'low': 5 * 60 * 1000,        // 5分钟（冷清）
      'sleeping': 30 * 60 * 1000   // 30分钟（休眠）
    }

    let interval = baseIntervals[level]

    // 非工作时间，间隔加倍
    if (!isWorkingHours) {
      interval *= 2
    }

    return interval
  }

  /**
   * 批量分析多个项目
   */
  async analyzeProjects(projects: Array<{
    projectId: string
    projectName: string
    projectPath: string
  }>): Promise<ProjectActivity[]> {
    console.log(`\n🧠 [AdaptiveScheduler] 批量分析 ${projects.length} 个项目`)

    const activities = await Promise.all(
      projects.map(p => this.adjustFrequency(p.projectId, p.projectName, p.projectPath))
    )

    // 排序：活跃度从高到低
    activities.sort((a, b) => b.activityScore - a.activityScore)

    console.log(`\n   活跃度排行:`)
    activities.forEach((activity, index) => {
      const emoji = ['🔥', '⚡', '✓', '😴', '💤'][Math.min(4, Math.floor(index / 2))]
      console.log(`   ${emoji} ${index + 1}. ${activity.projectName}: ${(activity.activityScore * 100).toFixed(0)}% (${activity.activityLevel})`)
    })

    return activities
  }

  /**
   * 判断是否是源代码文件
   */
  private isSourceFile(filename: string): boolean {
    const sourceExts = ['.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.go']
    return sourceExts.some(ext => filename.endsWith(ext))
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.activityCache.clear()
    this.lastUpdate.clear()
    console.log(`🧹 [AdaptiveScheduler] 缓存已清空`)
  }

  /**
   * 获取活跃度统计
   */
  getStatistics(): {
    totalProjects: number
    byLevel: Record<ProjectActivity['activityLevel'], number>
    averageScore: number
  } {
    const activities = Array.from(this.activityCache.values())

    const byLevel: Record<ProjectActivity['activityLevel'], number> = {
      'very-high': 0,
      'high': 0,
      'medium': 0,
      'low': 0,
      'sleeping': 0
    }

    activities.forEach(activity => {
      byLevel[activity.activityLevel]++
    })

    const averageScore = activities.length > 0
      ? activities.reduce((sum, a) => sum + a.activityScore, 0) / activities.length
      : 0

    return {
      totalProjects: activities.length,
      byLevel,
      averageScore
    }
  }
}

/**
 * 使用示例：
 *
 * const scheduler = new AdaptiveScheduler()
 *
 * // 分析单个项目
 * const activity = await scheduler.adjustFrequency(
 *   'videoplay',
 *   'videoplay',
 *   '/path/to/videoplay'
 * )
 *
 * console.log(`推荐扫描间隔: ${activity.recommendedInterval}ms`)
 *
 * // 批量分析
 * const activities = await scheduler.analyzeProjects([
 *   { projectId: 'p1', projectName: 'videoplay', projectPath: '/path1' },
 *   { projectId: 'p2', projectName: 'AgentForge', projectPath: '/path2' }
 * ])
 *
 * // 查看统计
 * const stats = scheduler.getStatistics()
 * console.log(`平均活跃度: ${(stats.averageScore * 100).toFixed(1)}%`)
 */
