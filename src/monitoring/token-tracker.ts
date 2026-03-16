/**
 * Token 使用追踪器
 *
 * 记录和统计所有 Claude API 调用的 token 使用情况
 */

import { EventEmitter } from 'events'
import { readFile, writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

export interface TokenUsageRecord {
  timestamp: Date
  projectId: string
  operation: string
  inputTokens: number
  outputTokens: number
  totalTokens: number
  model?: string
  cost?: number
}

export interface TokenStatistics {
  date: string
  totalTokens: number
  inputTokens: number
  outputTokens: number
  estimatedCost: number
  byProject: Record<string, ProjectTokenStats>
  byOperation: Record<string, OperationTokenStats>
  byModel: Record<string, ModelTokenStats>
}

export interface ProjectTokenStats {
  projectId: string
  totalTokens: number
  inputTokens: number
  outputTokens: number
  operations: number
  cost: number
}

export interface OperationTokenStats {
  operation: string
  totalTokens: number
  inputTokens: number
  outputTokens: number
  count: number
  cost: number
}

export interface ModelTokenStats {
  model: string
  totalTokens: number
  inputTokens: number
  outputTokens: number
  count: number
  cost: number
}

export class TokenTracker extends EventEmitter {
  private records: TokenUsageRecord[] = []
  private storageDir: string
  private currentDate: string
  private writeInterval: NodeJS.Timeout | null = null
  private isDirty = false

  // Claude API 定价（每百万 token）
  private readonly PRICING = {
    'claude-opus-4': { input: 15, output: 75 },
    'claude-sonnet-4.5': { input: 3, output: 15 },
    'claude-sonnet-4': { input: 3, output: 15 },
    'claude-haiku-4': { input: 0.25, output: 1.25 }
  }

  constructor(storageDir?: string) {
    super()
    this.storageDir = storageDir || join(process.env.HOME!, '.claude/projects/prophet-memory/token-usage')
    this.currentDate = this.getTodayDate()

    // 每分钟自动写入磁盘
    this.writeInterval = setInterval(() => {
      if (this.isDirty) {
        this.saveToDisk().catch(console.error)
      }
    }, 60000)
  }

  /**
   * 记录一次 token 使用
   */
  async recordUsage(record: Omit<TokenUsageRecord, 'timestamp' | 'totalTokens' | 'cost'>): Promise<void> {
    const totalTokens = record.inputTokens + record.outputTokens
    const cost = this.calculateCost(record.model || 'claude-sonnet-4.5', record.inputTokens, record.outputTokens)

    const fullRecord: TokenUsageRecord = {
      ...record,
      timestamp: new Date(),
      totalTokens,
      cost
    }

    this.records.push(fullRecord)
    this.isDirty = true

    // 触发事件
    this.emit('usage', fullRecord)

    // 检查是否跨日期
    const today = this.getTodayDate()
    if (today !== this.currentDate) {
      await this.rotateLogs()
    }
  }

  /**
   * 计算成本（美元）
   */
  private calculateCost(model: string, inputTokens: number, outputTokens: number): number {
    const pricing = this.PRICING[model as keyof typeof this.PRICING] || this.PRICING['claude-sonnet-4.5']
    const inputCost = (inputTokens / 1_000_000) * pricing.input
    const outputCost = (outputTokens / 1_000_000) * pricing.output
    return inputCost + outputCost
  }

  /**
   * 获取今天的统计数据
   */
  getTodayStats(): TokenStatistics {
    return this.getStatsForDate(this.currentDate)
  }

  /**
   * 获取指定日期的统计数据
   */
  getStatsForDate(date: string): TokenStatistics {
    const dateRecords = this.records.filter(r =>
      this.formatDate(r.timestamp) === date
    )

    return this.calculateStats(date, dateRecords)
  }

  /**
   * 获取日期范围的统计数据
   */
  getStatsForRange(startDate: string, endDate: string): TokenStatistics {
    const rangeRecords = this.records.filter(r => {
      const date = this.formatDate(r.timestamp)
      return date >= startDate && date <= endDate
    })

    return this.calculateStats(`${startDate} to ${endDate}`, rangeRecords)
  }

  /**
   * 获取指定项目的统计数据
   */
  getProjectStats(projectId: string, date?: string): ProjectTokenStats | null {
    const targetDate = date || this.currentDate
    const stats = this.getStatsForDate(targetDate)
    return stats.byProject[projectId] || null
  }

  /**
   * 计算统计数据
   */
  private calculateStats(date: string, records: TokenUsageRecord[]): TokenStatistics {
    const stats: TokenStatistics = {
      date,
      totalTokens: 0,
      inputTokens: 0,
      outputTokens: 0,
      estimatedCost: 0,
      byProject: {},
      byOperation: {},
      byModel: {}
    }

    for (const record of records) {
      // 总计
      stats.totalTokens += record.totalTokens
      stats.inputTokens += record.inputTokens
      stats.outputTokens += record.outputTokens
      stats.estimatedCost += record.cost || 0

      // 按项目
      if (!stats.byProject[record.projectId]) {
        stats.byProject[record.projectId] = {
          projectId: record.projectId,
          totalTokens: 0,
          inputTokens: 0,
          outputTokens: 0,
          operations: 0,
          cost: 0
        }
      }
      const projectStats = stats.byProject[record.projectId]
      projectStats.totalTokens += record.totalTokens
      projectStats.inputTokens += record.inputTokens
      projectStats.outputTokens += record.outputTokens
      projectStats.operations += 1
      projectStats.cost += record.cost || 0

      // 按操作
      if (!stats.byOperation[record.operation]) {
        stats.byOperation[record.operation] = {
          operation: record.operation,
          totalTokens: 0,
          inputTokens: 0,
          outputTokens: 0,
          count: 0,
          cost: 0
        }
      }
      const opStats = stats.byOperation[record.operation]
      opStats.totalTokens += record.totalTokens
      opStats.inputTokens += record.inputTokens
      opStats.outputTokens += record.outputTokens
      opStats.count += 1
      opStats.cost += record.cost || 0

      // 按模型
      const model = record.model || 'unknown'
      if (!stats.byModel[model]) {
        stats.byModel[model] = {
          model,
          totalTokens: 0,
          inputTokens: 0,
          outputTokens: 0,
          count: 0,
          cost: 0
        }
      }
      const modelStats = stats.byModel[model]
      modelStats.totalTokens += record.totalTokens
      modelStats.inputTokens += record.inputTokens
      modelStats.outputTokens += record.outputTokens
      modelStats.count += 1
      modelStats.cost += record.cost || 0
    }

    return stats
  }

  /**
   * 获取所有记录
   */
  getAllRecords(): TokenUsageRecord[] {
    return [...this.records]
  }

  /**
   * 保存到磁盘
   */
  async saveToDisk(): Promise<void> {
    try {
      await mkdir(this.storageDir, { recursive: true })

      const filePath = join(this.storageDir, `${this.currentDate}.json`)
      await writeFile(filePath, JSON.stringify(this.records, null, 2))

      this.isDirty = false
    } catch (error) {
      console.error('保存 token 使用记录失败:', error)
    }
  }

  /**
   * 从磁盘加载
   */
  async loadFromDisk(date?: string): Promise<void> {
    try {
      const targetDate = date || this.currentDate
      const filePath = join(this.storageDir, `${targetDate}.json`)

      const content = await readFile(filePath, 'utf-8')
      const records = JSON.parse(content)

      // 恢复 Date 对象
      this.records = records.map((r: any) => ({
        ...r,
        timestamp: new Date(r.timestamp)
      }))

      console.log(`✅ 加载了 ${this.records.length} 条 token 使用记录 (${targetDate})`)
    } catch (error) {
      // 文件不存在或读取失败，从空开始
      this.records = []
    }
  }

  /**
   * 日志轮转（跨日期时）
   */
  private async rotateLogs(): Promise<void> {
    // 保存当前日志
    await this.saveToDisk()

    // 重置
    this.currentDate = this.getTodayDate()
    this.records = []
    this.isDirty = false

    // 尝试加载今天的日志（如果存在）
    await this.loadFromDisk()
  }

  /**
   * 获取今天的日期字符串
   */
  private getTodayDate(): string {
    return this.formatDate(new Date())
  }

  /**
   * 格式化日期
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0]
  }

  /**
   * 清理资源
   */
  async destroy(): Promise<void> {
    if (this.writeInterval) {
      clearInterval(this.writeInterval)
      this.writeInterval = null
    }

    await this.saveToDisk()
  }
}

// 全局单例
let globalTracker: TokenTracker | null = null

export function getGlobalTokenTracker(): TokenTracker {
  if (!globalTracker) {
    globalTracker = new TokenTracker()
    globalTracker.loadFromDisk().catch(console.error)
  }
  return globalTracker
}
