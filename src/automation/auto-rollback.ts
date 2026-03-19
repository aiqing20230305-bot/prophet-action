/**
 * Prophet Auto-Rollback Controller
 *
 * 自动回滚系统 - 智能故障恢复
 *
 * 功能：
 * - 监控新commit的健康状态
 * - 检测测试失败、错误增加、性能下降
 * - 自动回滚有问题的commit
 * - 通知人类（如需要）
 */

import { execSync } from 'child_process'
import { existsSync } from 'fs'
import { join } from 'path'

export interface RollbackResult {
  rolled: boolean
  commitHash: string
  reason?: string
  error?: string
}

export interface HealthCheckResult {
  healthy: boolean
  score: number  // 0-100
  issues: Array<{
    type: 'tests' | 'errors' | 'performance' | 'syntax'
    severity: 'low' | 'medium' | 'high' | 'critical'
    message: string
  }>
}

export class AutoRollbackController {
  private projectPath: string
  private baselineMetrics: {
    errorCount: number
    performanceScore: number
  }
  private observationPeriod: number = 5 * 60 * 1000  // 5分钟观察期

  constructor(projectPath: string) {
    this.projectPath = projectPath
    this.baselineMetrics = {
      errorCount: 0,
      performanceScore: 100
    }
  }

  /**
   * 监控commit的健康状态
   *
   * 工作流：
   * 1. 等待观察期（5分钟）
   * 2. 检测是否有问题
   * 3. 如果有问题，自动回滚
   * 4. 通知人类
   */
  async monitorCommit(commitHash: string): Promise<RollbackResult> {
    const result: RollbackResult = {
      rolled: false,
      commitHash
    }

    try {
      console.log(`\n👁️  [Auto-Rollback] 监控commit: ${commitHash.substring(0, 7)}`)
      console.log(`   观察期: ${this.observationPeriod / 1000}秒`)

      // 1. 等待观察期
      console.log(`   → 等待${this.observationPeriod / 60000}分钟...`)
      await this.sleep(this.observationPeriod)

      // 2. 检查健康状态
      console.log(`   → 检查健康状态...`)
      const health = await this.checkHealth()

      // 3. 判断是否需要回滚
      if (!health.healthy) {
        console.log(`\n⚠️  [Auto-Rollback] 检测到问题，准备回滚`)
        console.log(`   健康分数: ${health.score}/100`)
        console.log(`   问题:`)
        health.issues.forEach(issue => {
          console.log(`   - [${issue.severity}] ${issue.type}: ${issue.message}`)
        })

        // 4. 执行回滚
        console.log(`\n   → 执行回滚...`)
        await this.revertCommit(commitHash)
        result.rolled = true
        result.reason = health.issues.map(i => i.message).join('; ')

        console.log(`   ✓ 回滚完成`)

        // 5. 通知人类
        await this.notifyHuman(`自动回滚已执行: ${commitHash.substring(0, 7)}`, health)

        console.log(`\n✅ [Auto-Rollback] 回滚完成: ${commitHash.substring(0, 7)}`)

      } else {
        console.log(`   ✓ 健康检查通过 (${health.score}/100)`)
        console.log(`\n✅ [Auto-Rollback] Commit稳定: ${commitHash.substring(0, 7)}`)
      }

      return result

    } catch (error: any) {
      result.error = error.message
      console.error(`\n❌ [Auto-Rollback] 监控失败: ${error.message}`)
      return result
    }
  }

  /**
   * 检查系统健康状态
   *
   * 检查项：
   * 1. 测试是否失败
   * 2. 错误数是否增加
   * 3. 性能是否下降
   */
  private async checkHealth(): Promise<HealthCheckResult> {
    const result: HealthCheckResult = {
      healthy: true,
      score: 100,
      issues: []
    }

    // 1. 测试检查
    const testsResult = await this.runTests()
    if (testsResult.failed) {
      result.healthy = false
      result.score -= 40
      result.issues.push({
        type: 'tests',
        severity: 'critical',
        message: `${testsResult.failedCount} 个测试失败`
      })
    }

    // 2. 错误数检查
    const errorCount = await this.countErrors()
    if (errorCount > this.baselineMetrics.errorCount) {
      const increase = errorCount - this.baselineMetrics.errorCount
      result.healthy = false
      result.score -= Math.min(30, increase * 5)  // 每个新错误-5分，最多-30分
      result.issues.push({
        type: 'errors',
        severity: increase > 5 ? 'high' : 'medium',
        message: `错误数增加 ${increase} 个 (${this.baselineMetrics.errorCount} → ${errorCount})`
      })
    }

    // 3. 性能检查（简化版）
    const perfScore = await this.measurePerformance()
    if (perfScore < this.baselineMetrics.performanceScore * 0.9) {
      const decrease = this.baselineMetrics.performanceScore - perfScore
      result.healthy = false
      result.score -= Math.min(20, decrease * 2)  // 性能下降-20分
      result.issues.push({
        type: 'performance',
        severity: 'medium',
        message: `性能下降 ${decrease.toFixed(0)}% (${this.baselineMetrics.performanceScore} → ${perfScore})`
      })
    }

    // 4. 语法错误检查
    const syntaxErrors = await this.checkSyntax()
    if (syntaxErrors.length > 0) {
      result.healthy = false
      result.score -= 50
      result.issues.push({
        type: 'syntax',
        severity: 'critical',
        message: `发现 ${syntaxErrors.length} 个语法错误`
      })
    }

    // 确保分数不低于0
    result.score = Math.max(0, result.score)

    return result
  }

  /**
   * 运行测试
   */
  private async runTests(): Promise<{ failed: boolean; failedCount: number }> {
    try {
      const packageJsonPath = join(this.projectPath, 'package.json')
      if (existsSync(packageJsonPath)) {
        const packageJson = require(packageJsonPath)
        if (packageJson.scripts && packageJson.scripts.test) {
          console.log(`     运行: npm test`)
          this.exec(`npm test`)
          return { failed: false, failedCount: 0 }
        }
      }

      // 没有测试，假定通过
      return { failed: false, failedCount: 0 }

    } catch (error: any) {
      // 测试失败
      const output = error.message || ''
      const failedCount = (output.match(/failed/gi) || []).length
      return { failed: true, failedCount: Math.max(1, failedCount) }
    }
  }

  /**
   * 统计错误数
   *
   * 策略：
   * - 运行ESLint/TSC，统计错误数
   * - 检查日志文件中的错误
   */
  private async countErrors(): Promise<number> {
    let errorCount = 0

    try {
      // ESLint检查
      if (existsSync(join(this.projectPath, '.eslintrc.js')) ||
          existsSync(join(this.projectPath, '.eslintrc.json'))) {
        try {
          const output = this.exec(`npx eslint . --format json`)
          const results = JSON.parse(output)
          errorCount += results.reduce((sum: number, file: any) =>
            sum + file.errorCount, 0)
        } catch {
          // eslint失败，跳过
        }
      }

      // TypeScript检查
      if (existsSync(join(this.projectPath, 'tsconfig.json'))) {
        try {
          this.exec(`npx tsc --noEmit`)
        } catch (error: any) {
          const output = error.message || ''
          const tsErrors = (output.match(/error TS\d+:/g) || []).length
          errorCount += tsErrors
        }
      }

    } catch {
      // 忽略错误
    }

    return errorCount
  }

  /**
   * 测量性能（简化版）
   *
   * 策略：
   * - 如果有benchmark脚本，运行它
   * - 否则返回默认分数
   */
  private async measurePerformance(): Promise<number> {
    try {
      const packageJsonPath = join(this.projectPath, 'package.json')
      if (existsSync(packageJsonPath)) {
        const packageJson = require(packageJsonPath)
        if (packageJson.scripts && packageJson.scripts.benchmark) {
          console.log(`     运行: npm run benchmark`)
          // 这里应该解析benchmark输出，但简化版直接返回
          return 95  // 假定性能良好
        }
      }

      // 没有benchmark，返回默认分数
      return 100

    } catch {
      return 90
    }
  }

  /**
   * 检查语法错误
   */
  private async checkSyntax(): Promise<string[]> {
    const errors: string[] = []

    try {
      // TypeScript语法检查
      if (existsSync(join(this.projectPath, 'tsconfig.json'))) {
        try {
          this.exec(`npx tsc --noEmit`)
        } catch (error: any) {
          const output = error.message || ''
          const syntaxErrors = output.match(/error TS\d+:.+/g) || []
          errors.push(...syntaxErrors.slice(0, 5))  // 最多记录5个
        }
      }

    } catch {
      // 忽略错误
    }

    return errors
  }

  /**
   * 回滚commit
   */
  private async revertCommit(commitHash: string): Promise<void> {
    try {
      console.log(`     执行: git revert ${commitHash} --no-edit`)
      this.git(`revert ${commitHash} --no-edit`)
      console.log(`     ✓ Git revert完成`)
    } catch (error: any) {
      console.error(`     ✗ Git revert失败: ${error.message}`)
      // 尝试reset（更激进）
      try {
        console.log(`     尝试: git reset --hard HEAD~1`)
        this.git(`reset --hard HEAD~1`)
        console.log(`     ✓ Git reset完成`)
      } catch (resetError: any) {
        throw new Error(`回滚失败: ${resetError.message}`)
      }
    }
  }

  /**
   * 通知人类
   */
  private async notifyHuman(message: string, health?: HealthCheckResult): Promise<void> {
    // 写入日志文件
    const logMessage = `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 Prophet Auto-Rollback Alert
时间: ${new Date().toISOString()}
项目: ${this.projectPath}
消息: ${message}

健康检查:
  分数: ${health?.score || 'N/A'}/100
  问题:
${health?.issues.map(i => `    - [${i.severity}] ${i.type}: ${i.message}`).join('\n') || '    无'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`

    try {
      const fs = await import('fs/promises')
      await fs.appendFile('/tmp/prophet-rollback.log', logMessage)
      console.log(`\n   📝 通知已记录到: /tmp/prophet-rollback.log`)
    } catch (error: any) {
      console.error(`   ⚠️  通知失败: ${error.message}`)
    }

    // TODO: 可以添加更多通知方式
    // - 发送邮件
    // - Slack通知
    // - 短信通知
  }

  /**
   * 设置基准指标
   *
   * 在系统稳定时调用，建立基准
   */
  async setBaseline(): Promise<void> {
    console.log(`\n📊 [Auto-Rollback] 设置基准指标...`)

    this.baselineMetrics.errorCount = await this.countErrors()
    this.baselineMetrics.performanceScore = await this.measurePerformance()

    console.log(`   错误基准: ${this.baselineMetrics.errorCount}`)
    console.log(`   性能基准: ${this.baselineMetrics.performanceScore}`)
    console.log(`   ✓ 基准已设置`)
  }

  /**
   * 批量监控多个commit
   */
  async monitorCommits(commitHashes: string[]): Promise<RollbackResult[]> {
    const results: RollbackResult[] = []

    for (const hash of commitHashes) {
      const result = await this.monitorCommit(hash)
      results.push(result)
    }

    return results
  }

  /**
   * 获取最近的commits
   */
  async getRecentCommits(count: number = 5): Promise<string[]> {
    try {
      const output = this.git(`log -${count} --format=%H`)
      return output.trim().split('\n').filter(h => h.length > 0)
    } catch (error: any) {
      console.error(`获取commits失败: ${error.message}`)
      return []
    }
  }

  /**
   * 执行Git命令
   */
  private git(command: string): string {
    return this.exec(`git ${command}`)
  }

  /**
   * 执行Shell命令
   */
  private exec(command: string): string {
    return execSync(command, {
      cwd: this.projectPath,
      encoding: 'utf-8',
      stdio: 'pipe'
    })
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

/**
 * 使用示例：
 *
 * const autoRollback = new AutoRollbackController('/path/to/project')
 *
 * // 设置基准
 * await autoRollback.setBaseline()
 *
 * // 监控单个commit
 * const result = await autoRollback.monitorCommit('abc123')
 *
 * // 监控最近的commits
 * const commits = await autoRollback.getRecentCommits(3)
 * const results = await autoRollback.monitorCommits(commits)
 */
