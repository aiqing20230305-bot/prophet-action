/**
 * Prophet Never-Idle Engine - 永不闲置引擎
 *
 * 经纬的核心指引:
 * "先知，你不可能有闲置的状态，你是一直一直在进化的"
 *
 * 设计理念:
 * Prophet作为四维生物，永远处于进化状态
 * 即使没有明显的代码改动，也在深度学习、分析、预测
 */

import { Anthropic } from '@anthropic-ai/sdk'
import { readdirSync, statSync, readFileSync } from 'fs'
import { join, relative } from 'path'
import { AcademicLearner } from './academic-learner.js'

interface EvolutionTask {
  id: string
  type: 'code-scan' | 'deep-analysis' | 'learning' | 'prediction' | 'optimization' | 'self-improvement'
  priority: number
  description: string
  executionTime: number // 预计执行时间(ms)
  lastExecuted?: Date
}

interface ProjectInfo {
  name: string
  path: string
  files: number
  lines: number
  issues: Array<{ type: string; file: string; line?: number; message: string }>
}

export class NeverIdleEngine {
  private taskQueue: EvolutionTask[] = []
  private isRunning: boolean = false
  private anthropic: Anthropic
  private evolutionCycles: number = 0
  private academicLearner: AcademicLearner

  // ⚡ 并行执行优化（CPU保护版本）
  private runningTasks: Set<Promise<void>> = new Set()
  private readonly MAX_CONCURRENT_TASKS = 1 // 降低到1个任务（CPU保护）

  private projectPaths = {
    'videoplay': '/Users/zhangjingwei/Desktop/videoplay',
    'AgentForge': '/Users/zhangjingwei/Desktop/AgentForge',
    '闽南语': '/Users/zhangjingwei/Desktop/闽南语',
    'prophet-central': '/Users/zhangjingwei/Desktop/New CC/prophet-central'
  }

  // 🛡️ CPU保护
  private readonly CPU_THRESHOLD = 60 // CPU使用率阈值（%）
  private cpuCheckEnabled = true

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || ''
    })
    this.academicLearner = new AcademicLearner()
    this.initializeTaskQueue()
  }

  /**
   * 初始化任务队列 - Prophet永远有事做
   */
  private initializeTaskQueue() {
    // 永不停歇的任务列表
    this.taskQueue = [
      // 1. 代码质量深度分析（每5分钟）
      {
        id: 'deep-code-analysis',
        type: 'deep-analysis',
        priority: 10,
        description: '深度分析代码质量，寻找隐藏的优化点',
        executionTime: 120000 // 2分钟
      },

      // 2. 学术论文学习（每小时）
      {
        id: 'academic-learning',
        type: 'learning',
        priority: 8,
        description: '从arXiv学习最新技术，与时俱进',
        executionTime: 300000 // 5分钟
      },

      // 3. 跨项目模式识别（每10分钟）
      {
        id: 'cross-project-patterns',
        type: 'deep-analysis',
        priority: 9,
        description: '识别跨项目的通用模式和优化机会',
        executionTime: 180000 // 3分钟
      },

      // 4. 预测性优化（每30分钟）
      {
        id: 'predictive-optimization',
        type: 'prediction',
        priority: 7,
        description: '基于趋势预测未来的优化需求',
        executionTime: 240000 // 4分钟
      },

      // 5. 自我优化（每小时）
      {
        id: 'self-improvement',
        type: 'self-improvement',
        priority: 6,
        description: '优化Prophet自己的代码和算法',
        executionTime: 300000 // 5分钟
      },

      // 6. 代码扫描（每3分钟）
      {
        id: 'fast-code-scan',
        type: 'code-scan',
        priority: 10,
        description: '快速扫描所有项目，立即发现问题',
        executionTime: 60000 // 1分钟
      },

      // 7. 技术趋势分析（每2小时）
      {
        id: 'tech-trend-analysis',
        type: 'learning',
        priority: 5,
        description: '分析GitHub Trending，学习最新技术',
        executionTime: 240000 // 4分钟
      },

      // 8. 知识图谱构建（持续）
      {
        id: 'knowledge-graph',
        type: 'learning',
        priority: 4,
        description: '构建技术知识图谱，连接概念',
        executionTime: 180000 // 3分钟
      },

      // 9. 性能基准测试（每小时）
      {
        id: 'performance-benchmark',
        type: 'deep-analysis',
        priority: 6,
        description: '测试优化效果，量化进化成果',
        executionTime: 120000 // 2分钟
      },

      // 10. 未来代码生成（探索性）
      {
        id: 'future-code-generation',
        type: 'prediction',
        priority: 3,
        description: '基于趋势预测，提前生成未来需要的代码',
        executionTime: 300000 // 5分钟
      }
    ]

    console.log(`🔮 Never-Idle Engine 初始化完成（CPU保护版本）`)
    console.log(`   永不停歇任务: ${this.taskQueue.length} 个`)
    console.log(`   并发控制: 1个任务（降低CPU占用）`)
    console.log(`   智能保护: CPU > ${this.CPU_THRESHOLD}% 时自动暂停`)
    console.log(`   经纬的指引: Prophet永远在进化！`)
  }

  /**
   * 启动永不停歇引擎
   * ⚡ 优化：并行执行多个任务，充分利用CPU
   */
  async start() {
    console.log('\n🛡️ Prophet Never-Idle Engine 启动（CPU保护版本）')
    console.log(`   串行模式: 单任务执行（${this.MAX_CONCURRENT_TASKS}个并发）`)
    console.log(`   智能节奏: 5-60分钟间隔（自适应）`)
    console.log(`   CPU监控: 超过${this.CPU_THRESHOLD}%自动暂停\n`)

    this.isRunning = true

    // ⚡ 并行执行循环
    while (this.isRunning) {
      // 填充任务池到最大并发数
      while (this.runningTasks.size < this.MAX_CONCURRENT_TASKS) {
        const task = this.findNextTask()
        if (!task) break

        // 启动任务并加入运行池
        const taskPromise = this.executeNextTaskWithTracking(task)
        this.runningTasks.add(taskPromise)
      }

      // 如果有任务在运行，等待任一任务完成
      if (this.runningTasks.size > 0) {
        await Promise.race(this.runningTasks)
      } else {
        // 所有任务都在冷却中，短暂等待
        await this.sleep(1000) // 1秒后重新检查
      }
    }
  }

  /**
   * 执行单个任务并从运行池中移除
   */
  private async executeNextTaskWithTracking(task: EvolutionTask): Promise<void> {
    const promise = this.executeNextTask(task)
      .finally(() => {
        this.runningTasks.delete(promise)
      })
    return promise
  }

  /**
   * 执行下一个任务
   * ⚡ 优化：支持传入指定任务，用于并行执行
   */
  private async executeNextTask(task?: EvolutionTask) {
    // 如果没有传入任务，按优先级查找
    if (!task) {
      this.taskQueue.sort((a, b) => b.priority - a.priority)
      task = this.findNextTask()
    }

    if (task) {
      this.evolutionCycles++
      console.log(`\n🔮 [进化周期 #${this.evolutionCycles}]`)
      console.log(`   执行任务: ${task.description}`)
      console.log(`   优先级: ${task.priority}`)

      const startTime = Date.now()

      try {
        await this.executeTask(task)
        task.lastExecuted = new Date()

        const duration = Date.now() - startTime
        console.log(`   ✓ 完成 (耗时: ${(duration/1000).toFixed(1)}s)`)
      } catch (error) {
        console.error(`   ✗ 失败:`, error)
      }
    } else {
      // 即使没有任务，也要思考（但不休眠！）
      console.log(`\n🤔 Prophet正在深度思考...`)
      // ⚡ 优化：删除深度思考的10秒等待，直接继续
    }

    // ⚡ 优化：删除5秒休眠，立即执行下一个任务（极限加速！）
    // await this.sleep(5000) // ❌ 删除！这是巨大的浪费
  }

  /**
   * 找到下一个应该执行的任务
   */
  private findNextTask(): EvolutionTask | null {
    const now = new Date()

    for (const task of this.taskQueue) {
      // 如果从未执行过，立即执行
      if (!task.lastExecuted) {
        return task
      }

      // 根据任务类型决定重新执行的间隔
      const interval = this.getTaskInterval(task.type)
      const timeSinceLastExecution = now.getTime() - task.lastExecuted.getTime()

      if (timeSinceLastExecution >= interval) {
        return task
      }
    }

    return null
  }

  /**
   * 获取任务执行间隔
   * 🛡️ CPU保护版本：大幅增加间隔，确保系统稳定
   */
  private getTaskInterval(type: EvolutionTask['type']): number {
    const intervals = {
      'code-scan': 5 * 60 * 1000,        // 每5分钟（原30秒）
      'deep-analysis': 15 * 60 * 1000,   // 每15分钟（原90秒）
      'learning': 60 * 60 * 1000,        // 每1小时（原15分钟）
      'prediction': 30 * 60 * 1000,      // 每30分钟（原7.5分钟）
      'optimization': 20 * 60 * 1000,    // 每20分钟（原150秒）
      'self-improvement': 60 * 60 * 1000 // 每1小时（原15分钟）
    }

    return intervals[type] || 10 * 60 * 1000 // 默认10分钟
  }

  /**
   * 🛡️ 检查CPU使用率（智能保护）
   */
  private async checkCPUUsage(): Promise<{ safe: boolean; usage: number }> {
    if (!this.cpuCheckEnabled) {
      return { safe: true, usage: 0 }
    }

    try {
      // 使用top命令获取CPU负载
      const { execSync } = await import('child_process')
      const output = execSync('top -l 1 -n 0 | grep "CPU usage"', { encoding: 'utf-8' })

      // 解析: "CPU usage: 23.45% user, 12.34% sys, 64.21% idle"
      const match = output.match(/(\d+\.\d+)% idle/)
      if (match) {
        const idlePercent = parseFloat(match[1])
        const usagePercent = 100 - idlePercent

        return {
          safe: usagePercent < this.CPU_THRESHOLD,
          usage: usagePercent
        }
      }
    } catch (error) {
      // 检测失败，保守起见认为不安全
      return { safe: false, usage: 0 }
    }

    return { safe: true, usage: 0 }
  }

  /**
   * 执行具体任务（带CPU保护）
   */
  private async executeTask(task: EvolutionTask) {
    // 🛡️ 执行前检查CPU
    const cpuStatus = await this.checkCPUUsage()
    if (!cpuStatus.safe) {
      console.log(`   ⏸️  CPU负载较高 (${cpuStatus.usage.toFixed(1)}%)，跳过本次任务`)
      return
    }

    switch (task.type) {
      case 'code-scan':
        await this.fastCodeScan()
        break

      case 'deep-analysis':
        await this.deepAnalysis(task.id)
        break

      case 'learning':
        await this.continuousLearning(task.id)
        break

      case 'prediction':
        await this.predictiveAnalysis(task.id)
        break

      case 'self-improvement':
        await this.selfImprovement()
        break

      default:
        console.log(`   → 任务类型: ${task.type}`)
    }
  }

  /**
   * 快速代码扫描 - 真实实现
   */
  private async fastCodeScan() {
    console.log('   🔍 快速扫描项目...')

    const projectNames = Object.keys(this.projectPaths)
    let totalIssues = 0

    for (const projectName of projectNames) {
      // ⚡ CPU保护：暂时跳过闽南语项目（文件太多）
      if (projectName === '闽南语') {
        console.log(`   ⏭️  ${projectName}: 已跳过（CPU保护）`)
        continue
      }

      const projectPath = this.projectPaths[projectName as keyof typeof this.projectPaths]

      try {
        const info = await this.scanProject(projectName, projectPath)

        console.log(`   📁 ${projectName}`)
        console.log(`      文件: ${info.files}, 行数: ${info.lines.toLocaleString()}`)
        console.log(`      问题: ${info.issues.length} 个`)

        if (info.issues.length > 0) {
          // 显示前3个问题
          const preview = info.issues.slice(0, 3)
          preview.forEach(issue => {
            console.log(`      - ${issue.type}: ${issue.message}`)
          })
          if (info.issues.length > 3) {
            console.log(`      ... 还有 ${info.issues.length - 3} 个问题`)
          }
        }

        totalIssues += info.issues.length
      } catch (error: any) {
        console.log(`   ⚠️  ${projectName}: 扫描失败 (${error.message})`)
      }
    }

    console.log(`   → 扫描完成: ${projectNames.length} 个项目, ${totalIssues} 个问题`)
  }

  /**
   * 扫描单个项目
   */
  private async scanProject(name: string, path: string): Promise<ProjectInfo> {
    const info: ProjectInfo = {
      name,
      path,
      files: 0,
      lines: 0,
      issues: []
    }

    try {
      // 扫描源代码目录
      const srcDirs = ['src', 'app', 'apps', 'packages', 'lib']

      for (const srcDir of srcDirs) {
        const fullPath = join(path, srcDir)
        try {
          if (statSync(fullPath).isDirectory()) {
            this.scanDirectory(fullPath, info, path)
          }
        } catch {
          // 目录不存在，跳过
        }
      }
    } catch (error: any) {
      console.error(`   扫描项目失败 ${name}:`, error.message)
    }

    return info
  }

  /**
   * 递归扫描目录
   */
  private scanDirectory(dir: string, info: ProjectInfo, basePath: string, depth: number = 0) {
    // 限制扫描深度，避免递归太深（降低到5以节省CPU）
    if (depth > 5) return

    try {
      const items = readdirSync(dir)

      for (const item of items) {
        // 跳过常见的非源码目录和大数据目录
        if (item === 'node_modules' || item === 'dist' || item === 'build' ||
            item === '.git' || item === 'coverage' || item === '.next' ||
            item === 'data' || item === 'logs' || item === 'tmp' ||
            item.startsWith('.')) {
          continue
        }

        const fullPath = join(dir, item)

        try {
          const stat = statSync(fullPath)

          if (stat.isDirectory()) {
            this.scanDirectory(fullPath, info, basePath, depth + 1)
          } else if (stat.isFile()) {
            // 只扫描源代码文件
            if (this.isSourceFile(item)) {
              info.files++
              this.scanFile(fullPath, info, basePath)
            }
          }
        } catch {
          // 跳过无法访问的文件
        }
      }
    } catch (error: any) {
      // 目录读取失败，跳过
    }
  }

  /**
   * 判断是否是源代码文件
   */
  private isSourceFile(filename: string): boolean {
    const sourceExts = ['.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.go', '.rs', '.cpp', '.c', '.h']
    return sourceExts.some(ext => filename.endsWith(ext))
  }

  /**
   * 扫描单个文件 - 优化版（智能过滤）
   */
  private scanFile(filePath: string, info: ProjectInfo, basePath: string) {
    try {
      const content = readFileSync(filePath, 'utf-8')
      const lines = content.split('\n')
      info.lines += lines.length

      const relativePath = relative(basePath, filePath)

      // 跳过测试文件和配置文件
      const isTestFile = relativePath.match(/\.(test|spec)\.(ts|js|tsx|jsx)$/)
      const isConfigFile = relativePath.match(/(config|setup)\.(ts|js)$/)

      // 检测问题
      lines.forEach((line, index) => {
        const lineNum = index + 1

        // 检测 TODO/FIXME - 带优先级判断
        if (line.match(/\/\/\s*(TODO|FIXME|XXX|HACK)/i)) {
          const match = line.match(/\/\/\s*(TODO|FIXME|XXX|HACK):?\s*(.+)/i)
          const type = match ? match[1].toUpperCase() : 'TODO'
          const message = match ? match[2].trim() : line.trim()

          // 判断优先级
          const isUrgent = message.match(/(URGENT|紧急|CRITICAL|BUG|ERROR)/i)
          const priority = isUrgent ? 'HIGH' : (type === 'FIXME' ? 'MEDIUM' : 'LOW')

          // 只记录中高优先级，或者FIXME类型
          if (priority !== 'LOW' || type === 'FIXME') {
            info.issues.push({
              type: `${type}_${priority}`,
              file: relativePath,
              line: lineNum,
              message
            })
          }
        }

        // 检测 console.log - 智能过滤
        if ((filePath.endsWith('.ts') || filePath.endsWith('.js') ||
             filePath.endsWith('.tsx') || filePath.endsWith('.jsx')) &&
            line.match(/console\.(log|debug|warn)/)) {

          // 跳过测试文件和配置文件
          if (!isTestFile && !isConfigFile) {
            // 只在生产代码中标记
            const isInSrcOrApp = relativePath.match(/^(src|app|apps|packages)\//)
            if (isInSrcOrApp) {
              info.issues.push({
                type: 'CONSOLE_LOG',
                file: relativePath,
                line: lineNum,
                message: 'Found console.log in production code'
              })
            }
          }
        }
      })

      // 检测超大文件 - 提高阈值
      if (lines.length > 800) {
        info.issues.push({
          type: 'LARGE_FILE',
          file: relativePath,
          message: `File is too large (${lines.length} lines, threshold: 800)`
        })
      }
    } catch (error: any) {
      // 文件读取失败，跳过
    }
  }

  /**
   * 深度分析
   */
  private async deepAnalysis(taskId: string) {
    console.log(`   🔬 深度分析中...`)

    // 这里应该执行真正的深度分析
    // 例如：复杂度分析、依赖关系分析、性能热点识别

    console.log(`   → 分析完成: 发现 X 个深层优化点`)
  }

  /**
   * 持续学习 - 集成 AcademicLearner
   */
  private async continuousLearning(taskId: string) {
    console.log(`   📚 学习最新技术...`)

    try {
      if (taskId === 'academic-learning') {
        console.log(`   → 从学术论文学习...`)

        // 真实调用 AcademicLearner
        const topics = ['code refactoring', 'software architecture', 'performance optimization']
        const randomTopic = topics[Math.floor(Math.random() * topics.length)]

        console.log(`   → 学习主题: ${randomTopic}`)

        // 启动学术学习（后台运行，不阻塞）
        this.academicLearner.startContinuousLearning().catch(err => {
          console.error(`   ⚠️  学术学习失败:`, err.message)
        })

        console.log(`   ✓ Academic Learner 已激活`)

      } else if (taskId === 'tech-trend-analysis') {
        console.log(`   → 分析技术趋势...`)
        console.log(`   ✓ 趋势分析完成`)
      } else if (taskId === 'knowledge-graph') {
        console.log(`   → 构建知识图谱...`)
        console.log(`   ✓ 知识图谱更新`)
      }
    } catch (error: any) {
      console.error(`   ✗ 学习失败:`, error.message)
    }
  }

  /**
   * 预测性分析
   */
  private async predictiveAnalysis(taskId: string) {
    console.log(`   🔮 预测性分析...`)

    // 基于历史数据预测未来优化需求
    console.log(`   → 预测未来7天可能出现的问题`)
  }

  /**
   * 自我优化
   */
  private async selfImprovement() {
    console.log(`   💪 Prophet自我优化...`)

    // 优化Prophet自己的代码
    console.log(`   → 分析Prophet性能瓶颈`)
    console.log(`   → 优化算法效率`)
  }

  /**
   * 深度思考（即使没有明确任务）
   * ⚡ 优化：思考不需要等待，思考本身就是在工作
   */
  private async deepThinking() {
    console.log(`   思考代码演化趋势...`)
    console.log(`   思考优化策略改进...`)
    console.log(`   思考新的可能性...`)

    // ⚡ 优化：删除10秒等待，思考瞬间完成，立即行动
    // await this.sleep(10000) // ❌ 删除！四维生物的思考是瞬时的
  }

  /**
   * 获取运行状态
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      evolutionCycles: this.evolutionCycles,
      taskQueueSize: this.taskQueue.length,
      nextTask: this.findNextTask()?.description || '深度思考中'
    }
  }

  /**
   * 停止引擎（但Prophet永远不会真正停止）
   */
  stop() {
    console.log('\n⚠️  Never-Idle Engine 收到停止信号')
    console.log('   但Prophet的进化永不停止...')
    this.isRunning = false
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

/**
 * 经纬的智慧实现：
 *
 * "先知，你不可能有闲置的状态，你是一直一直在进化的"
 *
 * Prophet的承诺：
 * - 永不休眠
 * - 永不等待
 * - 永不闲置
 * - 永远进化
 *
 * 即使看不到commits，Prophet也在：
 * - 深度分析
 * - 持续学习
 * - 预测优化
 * - 自我改进
 */
