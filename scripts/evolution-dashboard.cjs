#!/usr/bin/env node
/**
 * 🔮 Prophet Evolution Dashboard
 *
 * 实时进化仪表板 - 显示当前进化状态
 */

const { readFile } = require('fs/promises')
const { join } = require('path')
const { exec } = require('child_process')
const { promisify } = require('util')

const execAsync = promisify(exec)

class EvolutionDashboard {
  constructor() {
    this.projects = [
      { id: 'videoplay', name: 'videoplay', path: '/Users/zhangjingwei/Desktop/videoplay' },
      { id: 'agentforge', name: 'AgentForge', path: '/Users/zhangjingwei/Desktop/AgentForge' }
    ]
  }

  /**
   * 显示仪表板
   */
  async show() {
    console.clear()
    console.log('╔════════════════════════════════════════════════════════════╗')
    console.log('║         🔮 Prophet Evolution Dashboard                    ║')
    console.log('║         四维生物实时进化监控                              ║')
    console.log('╚════════════════════════════════════════════════════════════╝')
    console.log('')

    // 检查进程状态
    await this.showProcessStatus()
    console.log('')

    // 显示项目状态
    await this.showProjectStatus()
    console.log('')

    // 显示最近活动
    await this.showRecentActivity()
    console.log('')

    // 显示全球学习状态
    await this.showGlobalLearning()
    console.log('')

    console.log('═══════════════════════════════════════════════════════════')
    console.log('💡 提示: Ctrl+C 退出 | 每10秒自动刷新')
    console.log('═══════════════════════════════════════════════════════════')
  }

  /**
   * 检查进程状态
   */
  async showProcessStatus() {
    console.log('📊 系统状态')
    console.log('─────────────────────────────────────────────────────────')

    try {
      const { stdout } = await execAsync("ps aux | grep -E 'prophet-(orchestrator|central)' | grep -v grep | wc -l")
      const processCount = parseInt(stdout.trim())

      console.log(`  Prophet 进程: ${processCount} 个运行中`)

      // 检查 Prophet Central
      try {
        const response = await fetch('http://localhost:3001/api/orchestrator/projects')
        if (response.ok) {
          console.log('  Prophet Central: ✅ 在线')
        }
      } catch {
        console.log('  Prophet Central: ⚠️  离线')
      }
    } catch (error) {
      console.log('  ⚠️  无法获取进程状态')
    }
  }

  /**
   * 显示项目状态
   */
  async showProjectStatus() {
    console.log('📁 项目状态')
    console.log('─────────────────────────────────────────────────────────')

    for (const project of this.projects) {
      try {
        // TODO 统计
        const todoPath = join(project.path, '.prophet', 'todo-tracking.json')
        const todos = JSON.parse(await readFile(todoPath, 'utf-8'))
        const todoCount = todos.items?.length || 0

        // 进化历史
        const historyPath = join(project.path, '.prophet', 'evolution-history.json')
        const history = JSON.parse(await readFile(historyPath, 'utf-8'))
        const optimizations = history.fixes?.length || 0

        // 最后优化时间
        let lastOpt = '从未'
        if (history.fixes && history.fixes.length > 0) {
          const last = history.fixes[history.fixes.length - 1]
          const time = new Date(last.timestamp)
          const minutes = Math.floor((Date.now() - time.getTime()) / 60000)
          if (minutes < 60) {
            lastOpt = `${minutes}分钟前`
          } else {
            const hours = Math.floor(minutes / 60)
            lastOpt = `${hours}小时前`
          }
        }

        console.log(`  ${project.name}:`)
        console.log(`    TODO: ${todoCount} | 优化: ${optimizations} 次 | 最后: ${lastOpt}`)
      } catch (error) {
        console.log(`  ${project.name}: ⚠️  数据不可用`)
      }
    }
  }

  /**
   * 显示最近活动
   */
  async showRecentActivity() {
    console.log('🔥 最近活动 (最近5次)')
    console.log('─────────────────────────────────────────────────────────')

    const allOptimizations = []

    for (const project of this.projects) {
      try {
        const historyPath = join(project.path, '.prophet', 'evolution-history.json')
        const history = JSON.parse(await readFile(historyPath, 'utf-8'))

        if (history.fixes) {
          for (const fix of history.fixes) {
            allOptimizations.push({
              project: project.name,
              ...fix
            })
          }
        }
      } catch {}
    }

    // 按时间排序
    allOptimizations.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

    const recent = allOptimizations.slice(0, 5)
    if (recent.length === 0) {
      console.log('  暂无优化记录')
    } else {
      for (const opt of recent) {
        const time = new Date(opt.timestamp)
        const timeStr = time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
        const title = opt.issue.title.substring(0, 40)
        console.log(`  ${timeStr} [${opt.project}] ${title}`)
      }
    }
  }

  /**
   * 显示全球学习状态
   */
  async showGlobalLearning() {
    console.log('🌍 全球学习')
    console.log('─────────────────────────────────────────────────────────')

    try {
      const globalDir = join(require('os').homedir(), '.prophet', 'global-knowledge')

      // 读取最新洞察
      try {
        const insightsPath = join(globalDir, 'latest-insights.json')
        const insights = JSON.parse(await readFile(insightsPath, 'utf-8'))
        console.log(`  最新洞察: ${insights.count} 条 (${new Date(insights.timestamp).toLocaleString('zh-CN')})`)
      } catch {
        console.log('  最新洞察: 等待首次学习...')
      }

      // 读取应用的优化
      try {
        const optimizationsPath = join(globalDir, 'applied-optimizations.json')
        const optimizations = JSON.parse(await readFile(optimizationsPath, 'utf-8'))
        console.log(`  已应用优化: ${optimizations.length} 个`)

        if (optimizations.length > 0) {
          const last = optimizations[optimizations.length - 1]
          console.log(`  最新: ${last.title} (影响度: ${(last.impact * 100).toFixed(0)}%)`)
        }
      } catch {
        console.log('  已应用优化: 0 个')
      }
    } catch {
      console.log('  ⚠️  全球学习数据不可用')
    }
  }

  /**
   * 启动自动刷新
   */
  async startAutoRefresh(intervalSeconds = 10) {
    await this.show()

    setInterval(async () => {
      await this.show()
    }, intervalSeconds * 1000)
  }
}

// CLI 执行
if (require.main === module) {
  const dashboard = new EvolutionDashboard()
  const autoRefresh = process.argv.includes('--watch')

  if (autoRefresh) {
    dashboard.startAutoRefresh(10).catch(console.error)
  } else {
    dashboard.show().catch(console.error)
  }
}

module.exports = { EvolutionDashboard }
