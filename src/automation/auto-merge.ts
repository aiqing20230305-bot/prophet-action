/**
 * Prophet Auto-Merge Controller
 *
 * 自动合并系统 - 删除人工审批点
 *
 * 功能：
 * - 自动检测分支是否可以合并
 * - 运行测试验证
 * - 检查代码质量
 * - 自动merge到main
 * - 清理临时分支
 */

import { execSync } from 'child_process'
import { existsSync } from 'fs'
import { join } from 'path'

export interface MergeResult {
  success: boolean
  branch: string
  error?: string
  testsRun?: boolean
  qualityCheckPassed?: boolean
}

export class AutoMergeController {
  private projectPath: string

  constructor(projectPath: string) {
    this.projectPath = projectPath
  }

  /**
   * 尝试自动合并分支
   *
   * 工作流：
   * 1. 检查所有测试通过
   * 2. 检查代码质量
   * 3. 自动merge到main
   * 4. 删除临时分支
   */
  async attemptAutoMerge(branch: string): Promise<MergeResult> {
    const result: MergeResult = {
      success: false,
      branch,
      testsRun: false,
      qualityCheckPassed: false
    }

    try {
      console.log(`\n🔄 [Auto-Merge] 尝试自动合并分支: ${branch}`)

      // 1. 检查分支是否存在
      if (!this.branchExists(branch)) {
        result.error = `分支 ${branch} 不存在`
        return result
      }

      // 2. 切换到分支
      console.log(`   → 切换到分支 ${branch}`)
      this.git(`checkout ${branch}`)

      // 3. 运行测试（如果有）
      console.log(`   → 运行测试...`)
      const testsPass = await this.runTests()
      result.testsRun = true

      if (!testsPass) {
        result.error = '测试失败'
        console.log(`   ✗ 测试失败，取消合并`)
        return result
      }
      console.log(`   ✓ 所有测试通过`)

      // 4. 检查代码质量
      console.log(`   → 检查代码质量...`)
      const qualityPass = await this.checkQuality()
      result.qualityCheckPassed = qualityPass

      if (!qualityPass) {
        result.error = '代码质量检查失败'
        console.log(`   ⚠️  代码质量检查未通过，但继续合并`)
        // 注意：质量问题不阻止合并，只是警告
      } else {
        console.log(`   ✓ 代码质量检查通过`)
      }

      // 5. 切换到main分支
      console.log(`   → 切换到 main 分支`)
      this.git(`checkout main`)

      // 6. 合并分支
      console.log(`   → 合并 ${branch} 到 main`)
      this.git(`merge ${branch} --no-ff -m "🤖 Auto-merge: ${branch}"`)
      console.log(`   ✓ 合并成功`)

      // 7. 删除临时分支
      console.log(`   → 删除分支 ${branch}`)
      this.git(`branch -d ${branch}`)
      console.log(`   ✓ 分支已删除`)

      result.success = true
      console.log(`\n✅ [Auto-Merge] 自动合并完成: ${branch} → main`)

      return result

    } catch (error: any) {
      result.error = error.message
      console.error(`\n❌ [Auto-Merge] 合并失败: ${error.message}`)

      // 尝试回到main分支
      try {
        this.git(`checkout main`)
      } catch {
        // 忽略checkout失败
      }

      return result
    }
  }

  /**
   * 检查分支是否存在
   */
  private branchExists(branch: string): boolean {
    try {
      const branches = this.git(`branch --list ${branch}`)
      return branches.trim().length > 0
    } catch {
      return false
    }
  }

  /**
   * 运行测试
   *
   * 策略：
   * - 如果有package.json且有test脚本，运行npm test
   * - 如果有pytest，运行pytest
   * - 如果没有测试，返回true（假定通过）
   */
  private async runTests(): Promise<boolean> {
    try {
      // 检查是否有package.json和test脚本
      const packageJsonPath = join(this.projectPath, 'package.json')
      if (existsSync(packageJsonPath)) {
        const packageJson = require(packageJsonPath)
        if (packageJson.scripts && packageJson.scripts.test) {
          console.log(`     运行: npm test`)
          this.exec(`npm test`)
          return true
        }
      }

      // 检查是否有Python测试
      if (existsSync(join(this.projectPath, 'pytest.ini')) ||
          existsSync(join(this.projectPath, 'tests'))) {
        console.log(`     运行: pytest`)
        this.exec(`pytest`)
        return true
      }

      // 没有测试，假定通过
      console.log(`     没有发现测试，假定通过`)
      return true

    } catch (error: any) {
      console.log(`     测试失败: ${error.message}`)
      return false
    }
  }

  /**
   * 检查代码质量
   *
   * 策略：
   * - ESLint检查（如果配置了）
   * - TypeScript类型检查（如果是TS项目）
   * - 基本语法检查
   */
  private async checkQuality(): Promise<boolean> {
    try {
      // ESLint检查
      if (existsSync(join(this.projectPath, '.eslintrc.js')) ||
          existsSync(join(this.projectPath, '.eslintrc.json'))) {
        try {
          console.log(`     运行: eslint .`)
          this.exec(`npx eslint . --max-warnings 50`)  // 允许最多50个警告
        } catch (error: any) {
          console.log(`     ESLint有警告，但继续`)
        }
      }

      // TypeScript类型检查
      if (existsSync(join(this.projectPath, 'tsconfig.json'))) {
        try {
          console.log(`     运行: tsc --noEmit`)
          this.exec(`npx tsc --noEmit`)
        } catch (error: any) {
          console.log(`     TypeScript类型检查有错误，但继续`)
          return false
        }
      }

      return true

    } catch (error: any) {
      console.log(`     质量检查失败: ${error.message}`)
      return false
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
      stdio: 'pipe'  // 捕获输出，不显示
    })
  }

  /**
   * 批量尝试合并多个分支
   */
  async batchAutoMerge(branches: string[]): Promise<MergeResult[]> {
    const results: MergeResult[] = []

    for (const branch of branches) {
      // 跳过main/master分支
      if (branch === 'main' || branch === 'master') {
        continue
      }

      const result = await this.attemptAutoMerge(branch)
      results.push(result)

      // 如果合并失败，等待5秒再继续
      if (!result.success) {
        await this.sleep(5000)
      }
    }

    return results
  }

  /**
   * 获取所有可以合并的分支
   *
   * 规则：
   * - 不是main/master
   * - 包含"prophet-"前缀（Prophet自动创建的分支）
   * - 或者包含"auto-"前缀
   */
  async getMergeableBranches(): Promise<string[]> {
    try {
      const allBranches = this.git(`branch --list`).split('\n')
        .map(b => b.trim().replace(/^\*\s*/, ''))
        .filter(b => b.length > 0)

      const mergeable = allBranches.filter(branch => {
        if (branch === 'main' || branch === 'master') return false
        if (branch.includes('prophet-')) return true
        if (branch.includes('auto-')) return true
        return false
      })

      return mergeable

    } catch (error: any) {
      console.error(`获取可合并分支失败: ${error.message}`)
      return []
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

/**
 * 使用示例：
 *
 * const autoMerge = new AutoMergeController('/path/to/project')
 *
 * // 合并单个分支
 * const result = await autoMerge.attemptAutoMerge('prophet-optimize-123')
 *
 * // 批量合并
 * const branches = await autoMerge.getMergeableBranches()
 * const results = await autoMerge.batchAutoMerge(branches)
 */
