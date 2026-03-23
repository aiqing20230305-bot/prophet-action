/**
 * Health Trend Analyzer - 健康趋势分析器
 * Phase 6 Day 1: 预防性维护
 *
 * 职责：
 * - 分析历史健康数据
 * - 识别趋势模式
 * - 预测未来问题
 * - 为预防措施提供数据
 */

import { SystemHealth } from './health-monitor.js'
import { EventEmitter } from 'events'

/**
 * 健康趋势
 */
export interface HealthTrend {
  metric: 'cpu' | 'memory' | 'disk'
  direction: 'increasing' | 'decreasing' | 'stable'
  rate: number                        // 变化速率（每小时）
  currentValue: number                // 当前值
  predictedValue24h: number           // 24小时后预测值
  predictedThresholdTime?: Date       // 预测何时超过阈值
  threshold: number                   // 阈值
  confidence: number                  // 预测置信度 (0-1)
  severity: 'low' | 'medium' | 'high' | 'critical'
  timestamp: Date
}

/**
 * 模式类型
 */
export interface Pattern {
  type: 'daily' | 'weekly' | 'hourly' | 'spike'
  metric: 'cpu' | 'memory' | 'disk'
  description: string
  strength: number                    // 模式强度 (0-1)
  peakHours?: number[]                // 高峰时段
  lowHours?: number[]                 // 低谷时段
}

/**
 * 未来状态预测
 */
export interface FutureHealthPrediction {
  hoursAhead: number
  predictedHealth: {
    cpu: number
    memory: number
    disk: number
  }
  confidence: number
  risks: string[]                     // 预测的风险
}

/**
 * 趋势分析器配置
 */
export interface HealthTrendAnalyzerConfig {
  minHistorySize: number              // 最少历史样本数
  trendDetectionWindow: number        // 趋势检测窗口（小时）
  stabilityThreshold: number          // 稳定阈值（变化率）
}

/**
 * 健康趋势分析器
 */
export class HealthTrendAnalyzer extends EventEmitter {
  private config: HealthTrendAnalyzerConfig

  constructor(config?: Partial<HealthTrendAnalyzerConfig>) {
    super()

    this.config = {
      minHistorySize: 10,
      trendDetectionWindow: 24,
      stabilityThreshold: 2,
      ...config
    }
  }

  /**
   * 分析所有指标的趋势
   */
  analyzeTrends(history: SystemHealth[]): HealthTrend[] {
    if (history.length < this.config.minHistorySize) {
      return []
    }

    const trends: HealthTrend[] = []

    // 分析CPU趋势
    const cpuTrend = this.analyzeCPUTrend(history)
    if (cpuTrend) trends.push(cpuTrend)

    // 分析内存趋势
    const memoryTrend = this.analyzeMemoryTrend(history)
    if (memoryTrend) trends.push(memoryTrend)

    // 分析磁盘趋势
    const diskTrend = this.analyzeDiskTrend(history)
    if (diskTrend) trends.push(diskTrend)

    // 发出事件
    for (const trend of trends) {
      if (trend.severity === 'high' || trend.severity === 'critical') {
        this.emit('critical-trend', trend)
      }
    }

    return trends
  }

  /**
   * 分析CPU趋势
   */
  private analyzeCPUTrend(history: SystemHealth[]): HealthTrend | null {
    const values = history.map(h => h.cpu.usage)
    const threshold = history[0].cpu.threshold

    return this.analyzeMetricTrend('cpu', values, threshold, history[history.length - 1].timestamp)
  }

  /**
   * 分析内存趋势
   */
  private analyzeMemoryTrend(history: SystemHealth[]): HealthTrend | null {
    const values = history.map(h => h.memory.percentage)
    const threshold = history[0].memory.threshold

    return this.analyzeMetricTrend('memory', values, threshold, history[history.length - 1].timestamp)
  }

  /**
   * 分析磁盘趋势
   */
  private analyzeDiskTrend(history: SystemHealth[]): HealthTrend | null {
    const values = history.map(h => h.disk.percentage)
    const threshold = history[0].disk.threshold

    return this.analyzeMetricTrend('disk', values, threshold, history[history.length - 1].timestamp)
  }

  /**
   * 通用指标趋势分析
   */
  private analyzeMetricTrend(
    metric: 'cpu' | 'memory' | 'disk',
    values: number[],
    threshold: number,
    timestamp: Date
  ): HealthTrend | null {
    if (values.length < this.config.minHistorySize) {
      return null
    }

    // 计算线性回归
    const regression = this.calculateLinearRegression(values)
    const currentValue = values[values.length - 1]

    // 判断趋势方向
    let direction: 'increasing' | 'decreasing' | 'stable'
    if (Math.abs(regression.slope) < this.config.stabilityThreshold) {
      direction = 'stable'
    } else if (regression.slope > 0) {
      direction = 'increasing'
    } else {
      direction = 'decreasing'
    }

    // 预测24小时后的值
    const hoursAhead = 24
    const predictedValue24h = regression.slope * (values.length + hoursAhead) + regression.intercept

    // 预测何时会超过阈值
    let predictedThresholdTime: Date | undefined
    if (direction === 'increasing' && currentValue < threshold) {
      const hoursUntilThreshold = (threshold - currentValue) / regression.slope
      if (hoursUntilThreshold > 0 && hoursUntilThreshold < 168) { // 7天内
        predictedThresholdTime = new Date(timestamp.getTime() + hoursUntilThreshold * 60 * 60 * 1000)
      }
    }

    // 计算严重程度
    const severity = this.calculateTrendSeverity(
      currentValue,
      threshold,
      direction,
      regression.slope,
      predictedThresholdTime
    )

    // 计算置信度
    const confidence = this.calculateConfidence(regression.r2, values.length)

    return {
      metric,
      direction,
      rate: regression.slope,
      currentValue,
      predictedValue24h: Math.max(0, Math.min(100, predictedValue24h)),
      predictedThresholdTime,
      threshold,
      confidence,
      severity,
      timestamp
    }
  }

  /**
   * 计算线性回归
   */
  private calculateLinearRegression(values: number[]): {
    slope: number
    intercept: number
    r2: number
  } {
    const n = values.length

    // 计算均值
    const meanX = (n - 1) / 2
    const meanY = values.reduce((sum, v) => sum + v, 0) / n

    // 计算斜率和截距
    let numerator = 0
    let denominator = 0

    for (let i = 0; i < n; i++) {
      numerator += (i - meanX) * (values[i] - meanY)
      denominator += (i - meanX) * (i - meanX)
    }

    const slope = numerator / denominator
    const intercept = meanY - slope * meanX

    // 计算R²（拟合优度）
    let ssRes = 0
    let ssTot = 0

    for (let i = 0; i < n; i++) {
      const predicted = slope * i + intercept
      ssRes += Math.pow(values[i] - predicted, 2)
      ssTot += Math.pow(values[i] - meanY, 2)
    }

    const r2 = 1 - (ssRes / ssTot)

    return { slope, intercept, r2 }
  }

  /**
   * 计算趋势严重程度
   */
  private calculateTrendSeverity(
    currentValue: number,
    threshold: number,
    direction: 'increasing' | 'decreasing' | 'stable',
    rate: number,
    predictedThresholdTime?: Date
  ): 'low' | 'medium' | 'high' | 'critical' {
    // 稳定趋势：低严重性
    if (direction === 'stable') {
      return 'low'
    }

    // 下降趋势：低严重性
    if (direction === 'decreasing') {
      return 'low'
    }

    // 上升趋势：根据当前值和预测时间判断
    const currentPercentOfThreshold = (currentValue / threshold) * 100

    if (predictedThresholdTime) {
      const hoursUntilThreshold = (predictedThresholdTime.getTime() - Date.now()) / (1000 * 60 * 60)

      if (hoursUntilThreshold < 12) {
        return 'critical' // 12小时内会超过阈值
      } else if (hoursUntilThreshold < 48) {
        return 'high' // 48小时内会超过阈值
      } else {
        return 'medium' // 48小时以上
      }
    }

    // 没有预测到会超过阈值，根据当前值判断
    if (currentPercentOfThreshold > 85) {
      return 'high'
    } else if (currentPercentOfThreshold > 70) {
      return 'medium'
    } else {
      return 'low'
    }
  }

  /**
   * 计算置信度
   */
  private calculateConfidence(r2: number, sampleSize: number): number {
    // R²越高，拟合越好
    // 样本越多，越可靠
    const r2Confidence = Math.max(0, Math.min(1, r2))
    const sampleConfidence = Math.min(1, sampleSize / 100)

    return (r2Confidence * 0.7 + sampleConfidence * 0.3)
  }

  /**
   * 预测未来状态
   */
  predictFutureState(history: SystemHealth[], hoursAhead: number): FutureHealthPrediction {
    if (history.length < this.config.minHistorySize) {
      throw new Error('历史数据不足，无法预测')
    }

    // 预测各指标
    const cpuValues = history.map(h => h.cpu.usage)
    const memoryValues = history.map(h => h.memory.percentage)
    const diskValues = history.map(h => h.disk.percentage)

    const cpuRegression = this.calculateLinearRegression(cpuValues)
    const memoryRegression = this.calculateLinearRegression(memoryValues)
    const diskRegression = this.calculateLinearRegression(diskValues)

    const predictedCpu = cpuRegression.slope * (cpuValues.length + hoursAhead) + cpuRegression.intercept
    const predictedMemory = memoryRegression.slope * (memoryValues.length + hoursAhead) + memoryRegression.intercept
    const predictedDisk = diskRegression.slope * (diskValues.length + hoursAhead) + diskRegression.intercept

    // 计算置信度
    const confidence = (
      this.calculateConfidence(cpuRegression.r2, cpuValues.length) +
      this.calculateConfidence(memoryRegression.r2, memoryValues.length) +
      this.calculateConfidence(diskRegression.r2, diskValues.length)
    ) / 3

    // 识别风险
    const risks: string[] = []
    const cpuThreshold = history[0].cpu.threshold
    const memoryThreshold = history[0].memory.threshold
    const diskThreshold = history[0].disk.threshold

    if (predictedCpu > cpuThreshold) {
      risks.push(`CPU预计将达到${predictedCpu.toFixed(1)}%，超过${cpuThreshold}%阈值`)
    }
    if (predictedMemory > memoryThreshold) {
      risks.push(`内存预计将达到${predictedMemory.toFixed(1)}%，超过${memoryThreshold}%阈值`)
    }
    if (predictedDisk > diskThreshold) {
      risks.push(`磁盘预计将达到${predictedDisk.toFixed(1)}%，超过${diskThreshold}%阈值`)
    }

    return {
      hoursAhead,
      predictedHealth: {
        cpu: Math.max(0, Math.min(100, predictedCpu)),
        memory: Math.max(0, Math.min(100, predictedMemory)),
        disk: Math.max(0, Math.min(100, predictedDisk))
      },
      confidence,
      risks
    }
  }

  /**
   * 识别模式
   */
  identifyPatterns(history: SystemHealth[]): Pattern[] {
    if (history.length < 24) {
      return []
    }

    const patterns: Pattern[] = []

    // 识别每日模式
    const dailyPattern = this.identifyDailyPattern(history)
    if (dailyPattern) patterns.push(dailyPattern)

    // 识别突发模式
    const spikePatterns = this.identifySpikePatterns(history)
    patterns.push(...spikePatterns)

    return patterns
  }

  /**
   * 识别每日模式
   */
  private identifyDailyPattern(history: SystemHealth[]): Pattern | null {
    // 按小时分组统计
    const hourlyStats: { [hour: number]: number[] } = {}

    for (const health of history) {
      const hour = health.timestamp.getHours()
      if (!hourlyStats[hour]) {
        hourlyStats[hour] = []
      }
      hourlyStats[hour].push(health.cpu.usage)
    }

    // 计算每小时的平均值
    const hourlyAverages: { [hour: number]: number } = {}
    for (const hour in hourlyStats) {
      const values = hourlyStats[hour]
      hourlyAverages[hour] = values.reduce((a, b) => a + b, 0) / values.length
    }

    // 找出高峰和低谷
    const hours = Object.keys(hourlyAverages).map(h => parseInt(h))
    if (hours.length < 12) {
      return null
    }

    const averages = hours.map(h => hourlyAverages[h])
    const meanAvg = averages.reduce((a, b) => a + b, 0) / averages.length
    const stdDev = Math.sqrt(
      averages.reduce((sum, v) => sum + Math.pow(v - meanAvg, 2), 0) / averages.length
    )

    const peakHours: number[] = []
    const lowHours: number[] = []

    for (const hour of hours) {
      if (hourlyAverages[hour] > meanAvg + stdDev) {
        peakHours.push(hour)
      } else if (hourlyAverages[hour] < meanAvg - stdDev) {
        lowHours.push(hour)
      }
    }

    if (peakHours.length === 0 || lowHours.length === 0) {
      return null
    }

    return {
      type: 'daily',
      metric: 'cpu',
      description: `每日模式：高峰时段 ${peakHours.join(',')}点，低谷时段 ${lowHours.join(',')}点`,
      strength: Math.min(1, stdDev / meanAvg),
      peakHours,
      lowHours
    }
  }

  /**
   * 识别突发模式
   */
  private identifySpikePatterns(history: SystemHealth[]): Pattern[] {
    const patterns: Pattern[] = []

    // 检测CPU突发
    const cpuSpike = this.detectSpike(history.map(h => h.cpu.usage), 'cpu')
    if (cpuSpike) patterns.push(cpuSpike)

    // 检测内存突发
    const memorySpike = this.detectSpike(history.map(h => h.memory.percentage), 'memory')
    if (memorySpike) patterns.push(memorySpike)

    return patterns
  }

  /**
   * 检测突发
   */
  private detectSpike(values: number[], metric: 'cpu' | 'memory' | 'disk'): Pattern | null {
    if (values.length < 10) {
      return null
    }

    const mean = values.reduce((a, b) => a + b, 0) / values.length
    const stdDev = Math.sqrt(
      values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length
    )

    // 检测是否有超过2个标准差的突发
    const spikes = values.filter(v => v > mean + 2 * stdDev)

    if (spikes.length > 0) {
      return {
        type: 'spike',
        metric,
        description: `检测到${spikes.length}次${metric}突发（超过均值${(2 * stdDev).toFixed(1)}%）`,
        strength: Math.min(1, spikes.length / values.length)
      }
    }

    return null
  }

  /**
   * 获取统计信息
   */
  getStats(trends: HealthTrend[]) {
    return {
      totalTrends: trends.length,
      criticalTrends: trends.filter(t => t.severity === 'critical').length,
      highTrends: trends.filter(t => t.severity === 'high').length,
      increasingTrends: trends.filter(t => t.direction === 'increasing').length,
      predictionsWithThreshold: trends.filter(t => t.predictedThresholdTime).length
    }
  }
}
