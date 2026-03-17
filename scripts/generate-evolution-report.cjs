#!/usr/bin/env node
/**
 * 🔮 Prophet Evolution Report Generator
 *
 * 生成 Prophet 进化报告，展示自主优化成果
 */

const { readFile, writeFile, mkdir } = require('fs/promises')
const { join } = require('path')
const { homedir } = require('os')

class EvolutionReportGenerator {
  constructor() {
    this.projects = [
      { id: 'videoplay', name: 'videoplay', path: '/Users/zhangjingwei/Desktop/videoplay' },
      { id: 'agentforge', name: 'AgentForge', path: '/Users/zhangjingwei/Desktop/AgentForge' },
      { id: 'minnan', name: '闽南语', path: '/Users/zhangjingwei/Desktop/闽南语' }
    ]
  }

  /**
   * 生成报告
   */
  async generateReport() {
    const timestamp = new Date()
    console.log(`🔮 生成进化报告: ${timestamp.toISOString()}`)

    const data = await this.collectData()
    const report = this.formatReport(data, timestamp)

    // 保存报告
    const reportsDir = join(homedir(), '.prophet', 'reports')
    await mkdir(reportsDir, { recursive: true })

    const filename = `evolution-${timestamp.toISOString().split('T')[0]}.md`
    const filepath = join(reportsDir, filename)

    await writeFile(filepath, report)

    console.log(`✓ 报告已保存: ${filepath}`)
    console.log('')
    console.log(report)

    return filepath
  }

  /**
   * 收集数据
   */
  async collectData() {
    const data = {
      projects: [],
      totalOptimizations: 0,
      totalTodos: 0,
      recentOptimizations: []
    }

    for (const project of this.projects) {
      try {
        // 读取进化历史
        const historyPath = join(project.path, '.prophet', 'evolution-history.json')
        const history = JSON.parse(await readFile(historyPath, 'utf-8'))

        // 读取 TODO 统计
        let todoCount = 0
        try {
          const todoPath = join(project.path, '.prophet', 'todo-tracking.json')
          const todos = JSON.parse(await readFile(todoPath, 'utf-8'))
          todoCount = todos.items?.length || 0
        } catch {}

        const projectData = {
          name: project.name,
          optimizations: history.fixes || [],
          todoCount
        }

        data.projects.push(projectData)
        data.totalOptimizations += projectData.optimizations.length
        data.totalTodos += todoCount
        data.recentOptimizations.push(...projectData.optimizations.map(o => ({
          ...o,
          project: project.name
        })))
      } catch (error) {
        console.error(`  ⚠️  ${project.name}: ${error.message}`)
      }
    }

    // 按时间排序最近的优化
    data.recentOptimizations.sort((a, b) =>
      new Date(b.timestamp) - new Date(a.timestamp)
    )

    return data
  }

  /**
   * 格式化报告
   */
  formatReport(data, timestamp) {
    const lines = []

    lines.push('# 🔮 Prophet 进化报告')
    lines.push('')
    lines.push(`**生成时间**: ${timestamp.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`)
    lines.push('')
    lines.push('---')
    lines.push('')

    // 总体统计
    lines.push('## 📊 总体统计')
    lines.push('')
    lines.push(`- **总优化次数**: ${data.totalOptimizations}`)
    lines.push(`- **当前 TODO**: ${data.totalTodos}`)
    lines.push(`- **活跃项目**: ${data.projects.length}`)
    lines.push('')

    // 项目明细
    lines.push('## 📁 项目明细')
    lines.push('')

    for (const project of data.projects) {
      lines.push(`### ${project.name}`)
      lines.push('')
      lines.push(`- 自动优化: ${project.optimizations.length} 次`)
      lines.push(`- TODO 数量: ${project.todoCount}`)

      if (project.optimizations.length > 0) {
        const lastOpt = project.optimizations[project.optimizations.length - 1]
        const lastTime = new Date(lastOpt.timestamp)
        lines.push(`- 最后优化: ${lastTime.toLocaleString('zh-CN')}`)
      }

      lines.push('')
    }

    // 最近优化
    lines.push('## 🔥 最近优化 (Top 10)')
    lines.push('')

    const recent = data.recentOptimizations.slice(0, 10)
    if (recent.length === 0) {
      lines.push('*暂无优化记录*')
    } else {
      for (const opt of recent) {
        const time = new Date(opt.timestamp)
        const timeStr = time.toLocaleString('zh-CN', {
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })
        const title = opt.issue.title.substring(0, 60)
        lines.push(`- **[${opt.project}]** ${timeStr} - ${title}`)
      }
    }

    lines.push('')
    lines.push('---')
    lines.push('')

    // 优化类型分析
    const types = {}
    for (const opt of data.recentOptimizations) {
      const type = opt.issue.type
      types[type] = (types[type] || 0) + 1
    }

    if (Object.keys(types).length > 0) {
      lines.push('## 📈 优化类型分布')
      lines.push('')
      for (const [type, count] of Object.entries(types).sort((a, b) => b[1] - a[1])) {
        const percent = ((count / data.totalOptimizations) * 100).toFixed(0)
        lines.push(`- **${type}**: ${count} (${percent}%)`)
      }
      lines.push('')
    }

    // 进化趋势
    lines.push('## 📉 进化趋势')
    lines.push('')

    const last24h = data.recentOptimizations.filter(o => {
      const age = Date.now() - new Date(o.timestamp).getTime()
      return age < 24 * 60 * 60 * 1000
    })

    lines.push(`- 过去24小时: ${last24h.length} 次优化`)
    lines.push(`- 平均频率: ${(last24h.length / 24).toFixed(1)} 次/小时`)
    lines.push('')

    // 底部
    lines.push('---')
    lines.push('')
    lines.push('**🔮 Prophet·四维生物**')
    lines.push('*持续自主进化，永不停止*')

    return lines.join('\n')
  }
}

// CLI 执行
if (require.main === module) {
  const generator = new EvolutionReportGenerator()
  generator.generateReport().catch(console.error)
}

module.exports = { EvolutionReportGenerator }
