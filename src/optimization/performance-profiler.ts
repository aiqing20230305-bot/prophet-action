/**
 * Performance Profiler - 性能分析器
 * Phase 7 Day 1: 自我优化
 *
 * 职责：
 * - 深度分析Prophet的运行性能
 * - 识别热点函数和瓶颈
 * - 提供优化建议
 */

import { EventEmitter } from 'events'
import { performance, PerformanceObserver } from 'perf_hooks'
import * as os from 'os'
import * as fs from 'fs/promises'
import * as v8 from 'v8'

/**
 * 热点函数
 */
export interface HotSpot {
  function: string
  file: string
  calls: number
  totalTime: number
  avgTime: number
  percentage: number
  severity: 'low' | 'medium' | 'high' | 'critical'
}

/**
 * 瓶颈
 */
export interface Bottleneck {
  location: string
  type: 'blocking' | 'sync' | 'contention' | 'memory' | 'io'
  impact: number  // 0-100
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  suggestion: string
}

/**
 * 内存泄漏
 */
export interface MemoryLeak {
  location: string
  size: number  // bytes
  growth: number  // bytes/second
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
}

/**
 * 性能指标快照
 */
export interface PerformanceSnapshot {
  timestamp: Date

  // CPU
  cpu: {
    usage: number  // 百分比
    user: number
    system: number
  }

  // 内存
  memory: {
    heapUsed: number
    heapTotal: number
    external: number
    rss: number
    usage: number  // 百分比
  }

  // 事件循环
  eventLoop: {
    delay: number  // 毫秒
    utilization: number  // 百分比
  }
}

/**
 * 函数调用记录
 */
interface FunctionCall {
  name: string
  file: string
  startTime: number
  endTime?: number
  duration?: number
}

/**
 * 性能分析报告
 */
export interface PerformanceProfile {
  startTime: Date
  endTime: Date
  duration: number  // 毫秒

  // 资源使用
  cpu: {
    average: number
    peak: number
    perFunction: Map<string, number>
    hotspots: HotSpot[]
  }

  memory: {
    average: number
    peak: number
    growth: number  // bytes/second
    leaks: MemoryLeak[]
  }

  io: {
    reads: number
    writes: number
    totalBytes: number
    avgLatency: number
  }

  eventLoop: {
    avgDelay: number
    maxDelay: number
    avgUtilization: number
  }

  // 瓶颈
  bottlenecks: Bottleneck[]

  // 快照历史
  snapshots: PerformanceSnapshot[]
}

/**
 * 性能分析
 */
export interface PerformanceAnalysis {
  profile: PerformanceProfile
  score: number  // 0-100，分数越高性能越好

  issues: {
    critical: number
    high: number
    medium: number
    low: number
  }

  recommendations: string[]
  summary: string
}

/**
 * Profiler配置
 */
export interface PerformanceProfilerConfig {
  snapshotInterval: number  // 快照间隔（毫秒）
  hotspotThreshold: number  // 热点阈值（百分比）
  bottleneckImpactThreshold: number  // 瓶颈影响阈值
  memoryLeakThreshold: number  // 内存增长阈值（bytes/second）
}

/**
 * 性能分析器
 */
export class PerformanceProfiler extends EventEmitter {
  private config: PerformanceProfilerConfig
  private isRunning = false
  private startTime?: Date
  private snapshots: PerformanceSnapshot[] = []
  private snapshotInterval?: NodeJS.Timeout
  private functionCalls: FunctionCall[] = []
  private ioStats = { reads: 0, writes: 0, totalBytes: 0, latencies: [] as number[] }

  // 性能观察器
  private observer?: PerformanceObserver

  constructor(config?: Partial<PerformanceProfilerConfig>) {
    super()

    this.config = {
      snapshotInterval: 5 * 1000,  // 5秒
      hotspotThreshold: 10,  // 10% CPU时间
      bottleneckImpactThreshold: 30,  // 30分影响
      memoryLeakThreshold: 1024 * 1024,  // 1MB/秒
      ...config
    }
  }

  /**
   * 开始分析
   */
  startProfiling(): void {
    if (this.isRunning) {
      console.log('[PerformanceProfiler] ⚠️  已在运行中')
      return
    }

    console.log('[PerformanceProfiler] 🔍 开始性能分析...')

    this.isRunning = true
    this.startTime = new Date()
    this.snapshots = []
    this.functionCalls = []
    this.ioStats = { reads: 0, writes: 0, totalBytes: 0, latencies: [] }

    // 立即采集第一个快照
    this.takeSnapshot()

    // 定期采集快照
    this.snapshotInterval = setInterval(() => {
      this.takeSnapshot()
    }, this.config.snapshotInterval)

    // 设置性能观察器
    this.setupObserver()

    this.emit('profiling-started')
    console.log('[PerformanceProfiler] ✅ 性能分析已启动')
  }

  /**
   * 停止分析
   */
  stopProfiling(): PerformanceProfile {
    if (!this.isRunning) {
      throw new Error('Profiler未运行')
    }

    console.log('[PerformanceProfiler] ⏹️  停止性能分析...')

    this.isRunning = false

    if (this.snapshotInterval) {
      clearInterval(this.snapshotInterval)
      this.snapshotInterval = undefined
    }

    if (this.observer) {
      this.observer.disconnect()
      this.observer = undefined
    }

    // 采集最后一个快照
    this.takeSnapshot()

    const profile = this.generateProfile()

    this.emit('profiling-stopped', profile)
    console.log('[PerformanceProfiler] ✅ 性能分析已停止')

    return profile
  }

  /**
   * 采集快照
   */
  private takeSnapshot(): void {
    const cpuUsage = process.cpuUsage()
    const memUsage = process.memoryUsage()
    const heapStats = v8.getHeapStatistics()

    // 计算CPU使用率（简化版）
    const cpuPercent = this.calculateCPUUsage(cpuUsage)

    // 事件循环延迟（使用简单估算）
    const loopDelay = this.estimateEventLoopDelay()

    const snapshot: PerformanceSnapshot = {
      timestamp: new Date(),
      cpu: {
        usage: cpuPercent,
        user: cpuUsage.user / 1000,  // 微秒转毫秒
        system: cpuUsage.system / 1000
      },
      memory: {
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external,
        rss: memUsage.rss,
        usage: (memUsage.heapUsed / heapStats.heap_size_limit) * 100
      },
      eventLoop: {
        delay: loopDelay,
        utilization: Math.min(100, (1000 - loopDelay) / 10)  // 简化的利用率
      }
    }

    this.snapshots.push(snapshot)
    this.emit('snapshot-taken', snapshot)
  }

  /**
   * 计算CPU使用率
   */
  private calculateCPUUsage(cpuUsage: NodeJS.CpuUsage): number {
    // 简化版：基于系统CPU核心数估算
    const cpus = os.cpus()
    const totalTime = cpuUsage.user + cpuUsage.system
    const elapsed = this.config.snapshotInterval * 1000  // 转微秒

    return Math.min(100, (totalTime / (elapsed * cpus.length)) * 100)
  }

  /**
   * 估算事件循环延迟
   */
  private estimateEventLoopDelay(): number {
    const start = performance.now()
    setImmediate(() => {
      const delay = performance.now() - start
      return delay
    })
    return 0  // 实际实现需要更复杂的监控
  }

  /**
   * 设置性能观察器
   */
  private setupObserver(): void {
    try {
      this.observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()

        for (const entry of entries) {
          if (entry.entryType === 'function') {
            this.functionCalls.push({
              name: entry.name,
              file: 'unknown',
              startTime: entry.startTime,
              endTime: entry.startTime + entry.duration,
              duration: entry.duration
            })
          }
        }
      })

      // 观察函数调用（如果支持）
      this.observer.observe({ entryTypes: ['function', 'measure'], buffered: true })
    } catch (err) {
      // 某些Node版本可能不支持
      console.log('[PerformanceProfiler] ℹ️  性能观察器不可用')
    }
  }

  /**
   * 生成性能报告
   */
  private generateProfile(): PerformanceProfile {
    const endTime = new Date()
    const duration = endTime.getTime() - (this.startTime?.getTime() || 0)

    // CPU分析
    const cpuData = this.analyzeCPU()

    // 内存分析
    const memoryData = this.analyzeMemory()

    // IO分析
    const ioData = this.analyzeIO()

    // 事件循环分析
    const eventLoopData = this.analyzeEventLoop()

    // 瓶颈检测
    const bottlenecks = this.detectBottlenecks(cpuData, memoryData, eventLoopData)

    return {
      startTime: this.startTime!,
      endTime,
      duration,
      cpu: cpuData,
      memory: memoryData,
      io: ioData,
      eventLoop: eventLoopData,
      bottlenecks,
      snapshots: this.snapshots
    }
  }

  /**
   * 分析CPU
   */
  private analyzeCPU() {
    const cpuUsages = this.snapshots.map(s => s.cpu.usage)
    const average = cpuUsages.reduce((a, b) => a + b, 0) / cpuUsages.length
    const peak = Math.max(...cpuUsages)

    // 分析函数热点
    const functionStats = new Map<string, { count: number, totalTime: number }>()

    for (const call of this.functionCalls) {
      if (!call.duration) continue

      const key = call.name
      const existing = functionStats.get(key) || { count: 0, totalTime: 0 }

      functionStats.set(key, {
        count: existing.count + 1,
        totalTime: existing.totalTime + call.duration
      })
    }

    // 计算总时间
    const totalTime = Array.from(functionStats.values()).reduce((sum, stat) => sum + stat.totalTime, 0)

    // 生成热点列表
    const hotspots: HotSpot[] = []

    for (const [funcName, stat] of functionStats.entries()) {
      const percentage = totalTime > 0 ? (stat.totalTime / totalTime) * 100 : 0

      if (percentage >= this.config.hotspotThreshold) {
        hotspots.push({
          function: funcName,
          file: 'unknown',
          calls: stat.count,
          totalTime: stat.totalTime,
          avgTime: stat.totalTime / stat.count,
          percentage,
          severity: this.calculateHotspotSeverity(percentage)
        })
      }
    }

    // 按时间百分比排序
    hotspots.sort((a, b) => b.percentage - a.percentage)

    return {
      average,
      peak,
      perFunction: new Map(Array.from(functionStats.entries()).map(([k, v]) => [k, v.totalTime])),
      hotspots
    }
  }

  /**
   * 分析内存
   */
  private analyzeMemory() {
    const heapUsed = this.snapshots.map(s => s.memory.heapUsed)
    const average = heapUsed.reduce((a, b) => a + b, 0) / heapUsed.length
    const peak = Math.max(...heapUsed)

    // 计算增长率
    let growth = 0
    if (this.snapshots.length > 1) {
      const first = this.snapshots[0].memory.heapUsed
      const last = this.snapshots[this.snapshots.length - 1].memory.heapUsed
      const timeSpan = (this.snapshots[this.snapshots.length - 1].timestamp.getTime() - this.snapshots[0].timestamp.getTime()) / 1000

      growth = (last - first) / timeSpan  // bytes/second
    }

    // 检测内存泄漏
    const leaks = this.detectMemoryLeaks(growth)

    return {
      average,
      peak,
      growth,
      leaks
    }
  }

  /**
   * 分析IO
   */
  private analyzeIO() {
    const avgLatency = this.ioStats.latencies.length > 0
      ? this.ioStats.latencies.reduce((a, b) => a + b, 0) / this.ioStats.latencies.length
      : 0

    return {
      reads: this.ioStats.reads,
      writes: this.ioStats.writes,
      totalBytes: this.ioStats.totalBytes,
      avgLatency
    }
  }

  /**
   * 分析事件循环
   */
  private analyzeEventLoop() {
    const delays = this.snapshots.map(s => s.eventLoop.delay)
    const utilizations = this.snapshots.map(s => s.eventLoop.utilization)

    return {
      avgDelay: delays.reduce((a, b) => a + b, 0) / delays.length,
      maxDelay: Math.max(...delays),
      avgUtilization: utilizations.reduce((a, b) => a + b, 0) / utilizations.length
    }
  }

  /**
   * 检测瓶颈
   */
  private detectBottlenecks(cpuData: any, memoryData: any, eventLoopData: any): Bottleneck[] {
    const bottlenecks: Bottleneck[] = []

    // CPU瓶颈
    if (cpuData.peak > 80) {
      bottlenecks.push({
        location: 'CPU Usage',
        type: 'contention',
        impact: Math.min(100, (cpuData.peak - 80) * 5),
        severity: cpuData.peak > 95 ? 'critical' : cpuData.peak > 90 ? 'high' : 'medium',
        description: `CPU使用峰值达到${cpuData.peak.toFixed(1)}%`,
        suggestion: '考虑优化热点函数或增加异步处理'
      })
    }

    // 内存瓶颈
    if (memoryData.growth > this.config.memoryLeakThreshold) {
      bottlenecks.push({
        location: 'Memory Growth',
        type: 'memory',
        impact: Math.min(100, (memoryData.growth / this.config.memoryLeakThreshold) * 50),
        severity: memoryData.growth > this.config.memoryLeakThreshold * 3 ? 'critical' : 'high',
        description: `内存增长率：${(memoryData.growth / (1024 * 1024)).toFixed(2)}MB/秒`,
        suggestion: '检查是否存在内存泄漏，释放不再使用的对象'
      })
    }

    // 事件循环瓶颈
    if (eventLoopData.avgDelay > 100) {
      bottlenecks.push({
        location: 'Event Loop',
        type: 'blocking',
        impact: Math.min(100, (eventLoopData.avgDelay - 100) / 10),
        severity: eventLoopData.avgDelay > 500 ? 'critical' : eventLoopData.avgDelay > 250 ? 'high' : 'medium',
        description: `事件循环平均延迟：${eventLoopData.avgDelay.toFixed(0)}ms`,
        suggestion: '减少同步操作，将长时间任务拆分为小块'
      })
    }

    return bottlenecks
  }

  /**
   * 检测内存泄漏
   */
  private detectMemoryLeaks(growth: number): MemoryLeak[] {
    const leaks: MemoryLeak[] = []

    if (growth > this.config.memoryLeakThreshold) {
      leaks.push({
        location: 'Unknown',
        size: growth * 60,  // 预估1分钟泄漏量
        growth,
        severity: growth > this.config.memoryLeakThreshold * 3 ? 'critical' : 'high',
        description: `检测到持续内存增长：${(growth / (1024 * 1024)).toFixed(2)}MB/秒`
      })
    }

    return leaks
  }

  /**
   * 计算热点严重度
   */
  private calculateHotspotSeverity(percentage: number): 'low' | 'medium' | 'high' | 'critical' {
    if (percentage > 40) return 'critical'
    if (percentage > 25) return 'high'
    if (percentage > 15) return 'medium'
    return 'low'
  }

  /**
   * 分析性能报告
   */
  analyzeProfile(profile: PerformanceProfile): PerformanceAnalysis {
    const issues = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    }

    const recommendations: string[] = []

    // 统计问题
    for (const hotspot of profile.cpu.hotspots) {
      issues[hotspot.severity]++

      if (hotspot.severity === 'critical' || hotspot.severity === 'high') {
        recommendations.push(
          `优化热点函数 ${hotspot.function}（占用${hotspot.percentage.toFixed(1)}% CPU时间）`
        )
      }
    }

    for (const bottleneck of profile.bottlenecks) {
      issues[bottleneck.severity]++
      recommendations.push(bottleneck.suggestion)
    }

    for (const leak of profile.memory.leaks) {
      issues[leak.severity]++
      recommendations.push(`修复内存泄漏：${leak.description}`)
    }

    // 计算性能分数（100分制）
    let score = 100
    score -= issues.critical * 20
    score -= issues.high * 10
    score -= issues.medium * 5
    score -= issues.low * 2
    score = Math.max(0, score)

    // 生成总结
    const summary = this.generateSummary(profile, score, issues)

    return {
      profile,
      score,
      issues,
      recommendations: recommendations.slice(0, 10),  // 最多10条建议
      summary
    }
  }

  /**
   * 生成总结
   */
  private generateSummary(profile: PerformanceProfile, score: number, issues: any): string {
    const parts: string[] = []

    parts.push(`性能分数：${score}/100`)

    if (profile.cpu.average > 70) {
      parts.push(`CPU使用率偏高（平均${profile.cpu.average.toFixed(1)}%）`)
    }

    if (profile.memory.growth > this.config.memoryLeakThreshold) {
      parts.push(`检测到内存增长（${(profile.memory.growth / (1024 * 1024)).toFixed(2)}MB/秒）`)
    }

    if (profile.cpu.hotspots.length > 0) {
      parts.push(`发现${profile.cpu.hotspots.length}个热点函数`)
    }

    if (profile.bottlenecks.length > 0) {
      parts.push(`发现${profile.bottlenecks.length}个性能瓶颈`)
    }

    const totalIssues = issues.critical + issues.high + issues.medium + issues.low
    if (totalIssues === 0) {
      parts.push('系统性能良好')
    }

    return parts.join('，')
  }

  /**
   * 识别热点
   */
  identifyHotspots(profile: PerformanceProfile, threshold: number = 10): HotSpot[] {
    return profile.cpu.hotspots.filter(h => h.percentage >= threshold)
  }

  /**
   * 检测瓶颈
   */
  detectBottlenecksFromProfile(profile: PerformanceProfile): Bottleneck[] {
    return profile.bottlenecks.filter(b => b.impact >= this.config.bottleneckImpactThreshold)
  }

  /**
   * 获取当前快照
   */
  getCurrentSnapshot(): PerformanceSnapshot | null {
    return this.snapshots[this.snapshots.length - 1] || null
  }

  /**
   * 获取统计
   */
  getStats() {
    return {
      isRunning: this.isRunning,
      snapshotCount: this.snapshots.length,
      functionCallCount: this.functionCalls.length,
      duration: this.startTime ? Date.now() - this.startTime.getTime() : 0
    }
  }
}
