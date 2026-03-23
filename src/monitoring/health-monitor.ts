/**
 * Health Monitor - 健康监控器
 * Phase 5: 健康监控与自愈系统
 *
 * 职责:
 * - 持续监控系统各项指标（CPU、内存、磁盘、进程）
 * - 检测异常状态
 * - 触发诊断和修复流程
 */

import { execSync } from 'child_process'
import { EventEmitter } from 'events'
import * as os from 'os'
import * as fs from 'fs'

export interface SystemHealth {
  // 系统资源
  cpu: {
    usage: number        // CPU使用率 (%)
    loadAverage: number[] // 负载均衡
    threshold: number    // 告警阈值
    status: 'healthy' | 'warning' | 'critical'
  }

  memory: {
    used: number         // 已用内存 (MB)
    total: number        // 总内存 (MB)
    percentage: number   // 使用率 (%)
    available: number    // 可用内存 (MB)
    threshold: number    // 告警阈值
    status: 'healthy' | 'warning' | 'critical'
  }

  disk: {
    used: number         // 已用磁盘 (GB)
    available: number    // 可用磁盘 (GB)
    percentage: number   // 使用率 (%)
    threshold: number    // 告警阈值
    status: 'healthy' | 'warning' | 'critical'
  }

  // 进程健康
  processes: {
    prophet: ProcessHealth | null
    automation: ProcessHealth[]
  }

  // 时间戳
  timestamp: Date
  overallStatus: 'healthy' | 'warning' | 'critical'
}

export interface ProcessHealth {
  pid: number
  name: string
  status: 'running' | 'stopped' | 'zombie'
  cpu: number
  memory: number
  uptime: number
  lastError?: string
}

export interface HealthMonitorConfig {
  checkInterval: number        // 检查间隔（毫秒）
  cpuThreshold: number         // CPU告警阈值（%）
  memoryThreshold: number      // 内存告警阈值（%）
  diskThreshold: number        // 磁盘告警阈值（%）
  maxHistorySize: number       // 保留历史记录数量
}

export class HealthMonitor extends EventEmitter {
  private config: HealthMonitorConfig
  private healthHistory: SystemHealth[] = []
  private intervalId?: NodeJS.Timeout
  private isRunning = false

  constructor(config?: Partial<HealthMonitorConfig>) {
    super()

    this.config = {
      checkInterval: 30 * 1000,      // 30秒
      cpuThreshold: 70,               // 70%
      memoryThreshold: 80,            // 80%
      diskThreshold: 90,              // 90%
      maxHistorySize: 1000,           // 保留1000条
      ...config
    }
  }

  /**
   * 启动健康监控
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('[HealthMonitor] 已经在运行中')
      return
    }

    console.log('[HealthMonitor] 🏥 启动健康监控系统...')
    console.log(`   检查间隔: ${this.config.checkInterval / 1000}秒`)
    console.log(`   CPU阈值: ${this.config.cpuThreshold}%`)
    console.log(`   内存阈值: ${this.config.memoryThreshold}%`)
    console.log(`   磁盘阈值: ${this.config.diskThreshold}%`)

    this.isRunning = true

    // 立即执行一次检查
    await this.performHealthCheck()

    // 定期检查
    this.intervalId = setInterval(async () => {
      if (this.isRunning) {
        await this.performHealthCheck()
      }
    }, this.config.checkInterval)

    console.log('[HealthMonitor] ✅ 健康监控已启动')
  }

  /**
   * 停止健康监控
   */
  stop(): void {
    if (!this.isRunning) {
      return
    }

    console.log('[HealthMonitor] ⏹️  停止健康监控')

    this.isRunning = false

    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = undefined
    }
  }

  /**
   * 执行健康检查
   */
  private async performHealthCheck(): Promise<void> {
    try {
      const health = await this.collectHealthData()

      // 保存到历史
      this.healthHistory.push(health)

      // 保持历史大小
      if (this.healthHistory.length > this.config.maxHistorySize) {
        this.healthHistory.shift()
      }

      // 发出健康状态事件
      this.emit('health-check', health)

      // 如果状态异常，发出告警
      if (health.overallStatus !== 'healthy') {
        console.log(`[HealthMonitor] ⚠️  系统健康状态: ${health.overallStatus}`)
        this.emit('health-issue', health)
      }

      // 详细日志（仅在异常时）
      if (health.overallStatus === 'warning') {
        this.logWarnings(health)
      } else if (health.overallStatus === 'critical') {
        this.logCritical(health)
      }

    } catch (error: any) {
      console.error('[HealthMonitor] 健康检查失败:', error.message)
    }
  }

  /**
   * 收集健康数据
   */
  private async collectHealthData(): Promise<SystemHealth> {
    const cpu = await this.getCPUMetrics()
    const memory = await this.getMemoryMetrics()
    const disk = await this.getDiskMetrics()
    const processes = await this.getProcessHealth()

    const overallStatus = this.calculateOverallStatus(cpu, memory, disk, processes)

    return {
      cpu,
      memory,
      disk,
      processes,
      timestamp: new Date(),
      overallStatus
    }
  }

  /**
   * 获取CPU指标
   */
  private async getCPUMetrics(): Promise<SystemHealth['cpu']> {
    try {
      // macOS使用top命令获取CPU
      const output = execSync('top -l 1 -n 0 | grep "CPU usage"', {
        encoding: 'utf-8',
        timeout: 5000
      })

      // 解析: "CPU usage: 23.45% user, 12.34% sys, 64.21% idle"
      const match = output.match(/(\d+\.\d+)% idle/)

      if (match) {
        const idlePercent = parseFloat(match[1])
        const usagePercent = 100 - idlePercent

        const status = this.getStatus(usagePercent, this.config.cpuThreshold)

        return {
          usage: Math.round(usagePercent * 10) / 10,
          loadAverage: os.loadavg(),
          threshold: this.config.cpuThreshold,
          status
        }
      }
    } catch (error) {
      console.error('[HealthMonitor] CPU检测失败:', error)
    }

    // 默认返回（检测失败）
    return {
      usage: 0,
      loadAverage: os.loadavg(),
      threshold: this.config.cpuThreshold,
      status: 'healthy'
    }
  }

  /**
   * 获取内存指标
   */
  private async getMemoryMetrics(): Promise<SystemHealth['memory']> {
    try {
      // macOS: 使用vm_stat获取准确的内存信息
      const vmstat = execSync('vm_stat', {
        encoding: 'utf-8',
        timeout: 5000
      })

      // 解析vm_stat输出
      const pageSize = 4096 // macOS page size
      const lines = vmstat.split('\n')

      const parsePages = (line: string): number => {
        const match = line.match(/:\s+(\d+)\.?/)
        return match ? parseInt(match[1]) : 0
      }

      let free = 0
      let active = 0
      let inactive = 0
      let speculative = 0
      let wired = 0
      let compressed = 0

      for (const line of lines) {
        if (line.includes('Pages free')) {
          free = parsePages(line)
        } else if (line.includes('Pages active')) {
          active = parsePages(line)
        } else if (line.includes('Pages inactive')) {
          inactive = parsePages(line)
        } else if (line.includes('Pages speculative')) {
          speculative = parsePages(line)
        } else if (line.includes('Pages wired down')) {
          wired = parsePages(line)
        } else if (line.includes('Pages occupied by compressor')) {
          compressed = parsePages(line)
        }
      }

      // 计算真实内存使用
      // macOS内存模型：
      // - 已用 = wired + active + compressed
      // - 可用 = free + inactive + speculative
      const totalMemoryBytes = os.totalmem()
      const totalPages = totalMemoryBytes / pageSize

      const usedPages = wired + active + compressed
      const availablePages = free + inactive + speculative

      const usedMemory = usedPages * pageSize
      const availableMemory = availablePages * pageSize

      const totalMB = Math.round(totalMemoryBytes / 1024 / 1024)
      const usedMB = Math.round(usedMemory / 1024 / 1024)
      const availableMB = Math.round(availableMemory / 1024 / 1024)
      const percentage = Math.round((usedMemory / totalMemoryBytes) * 100)

      const status = this.getStatus(percentage, this.config.memoryThreshold)

      return {
        used: usedMB,
        total: totalMB,
        percentage,
        available: availableMB,
        threshold: this.config.memoryThreshold,
        status
      }

    } catch (error) {
      // 回退到os.freemem()（虽然不准确）
      console.error('[HealthMonitor] vm_stat失败，使用回退方案:', error)

      const totalMemory = os.totalmem()
      const freeMemory = os.freemem()
      const usedMemory = totalMemory - freeMemory

      const totalMB = Math.round(totalMemory / 1024 / 1024)
      const usedMB = Math.round(usedMemory / 1024 / 1024)
      const availableMB = Math.round(freeMemory / 1024 / 1024)
      const percentage = Math.round((usedMemory / totalMemory) * 100)

      const status = this.getStatus(percentage, this.config.memoryThreshold)

      return {
        used: usedMB,
        total: totalMB,
        percentage,
        available: availableMB,
        threshold: this.config.memoryThreshold,
        status
      }
    }
  }

  /**
   * 获取磁盘指标
   */
  private async getDiskMetrics(): Promise<SystemHealth['disk']> {
    try {
      // macOS使用df命令
      const output = execSync('df -h / | tail -1', {
        encoding: 'utf-8',
        timeout: 5000
      })

      // 解析: "/dev/disk1s1 ... 234Gi 123Gi 111Gi 53% ..."
      const parts = output.trim().split(/\s+/)

      if (parts.length >= 5) {
        const usedStr = parts[2]
        const availableStr = parts[3]
        const percentageStr = parts[4]

        const used = this.parseSize(usedStr)
        const available = this.parseSize(availableStr)
        const percentage = parseInt(percentageStr.replace('%', ''))

        const status = this.getStatus(percentage, this.config.diskThreshold)

        return {
          used,
          available,
          percentage,
          threshold: this.config.diskThreshold,
          status
        }
      }
    } catch (error) {
      console.error('[HealthMonitor] 磁盘检测失败:', error)
    }

    // 默认返回
    return {
      used: 0,
      available: 0,
      percentage: 0,
      threshold: this.config.diskThreshold,
      status: 'healthy'
    }
  }

  /**
   * 解析磁盘大小（Gi/Mi -> GB）
   */
  private parseSize(sizeStr: string): number {
    const match = sizeStr.match(/^([\d.]+)([KMGT])i?$/i)
    if (!match) return 0

    const value = parseFloat(match[1])
    const unit = match[2].toUpperCase()

    const multipliers: Record<string, number> = {
      'K': 0.001,
      'M': 0.001,
      'G': 1,
      'T': 1000
    }

    return Math.round(value * (multipliers[unit] || 1))
  }

  /**
   * 获取进程健康状态
   */
  private async getProcessHealth(): Promise<SystemHealth['processes']> {
    return {
      prophet: await this.checkProphetProcess(),
      automation: []
    }
  }

  /**
   * 检查Prophet进程
   */
  private async checkProphetProcess(): Promise<ProcessHealth | null> {
    try {
      let pid: number | null = null

      // 方法1: 从PID文件读取（主要方法）
      const pidFiles = [
        '/tmp/prophet-phase5.pid',
        '/tmp/prophet-central.pid',
        '/tmp/prophet.pid'
      ]

      for (const pidFile of pidFiles) {
        try {
          if (fs.existsSync(pidFile)) {
            const pidStr = fs.readFileSync(pidFile, 'utf-8').trim()
            const filePid = parseInt(pidStr)

            // 验证进程是否真实存在
            execSync(`ps -p ${filePid}`, { stdio: 'ignore' })
            pid = filePid
            break
          }
        } catch {
          // PID文件存在但进程不存在，继续尝试
        }
      }

      // 方法2: 使用pgrep查找（备用方法）
      if (pid === null) {
        try {
          const output = execSync('pgrep -f "prophet-central"', {
            encoding: 'utf-8',
            timeout: 5000
          }).trim()

          if (output) {
            pid = parseInt(output.split('\n')[0])
          }
        } catch {
          // pgrep失败，继续
        }
      }

      // 方法3: 使用当前进程PID（如果上述都失败）
      if (pid === null) {
        // 如果HealthMonitor在Prophet进程内运行，使用当前PID
        pid = process.pid
      }

      if (pid === null) {
        return null
      }

      // 获取进程详细信息
      const psOutput = execSync(`ps -p ${pid} -o %cpu,%mem,etime`, {
        encoding: 'utf-8',
        timeout: 5000
      })

      const lines = psOutput.trim().split('\n')
      if (lines.length < 2) {
        return null
      }

      const stats = lines[1].trim().split(/\s+/)
      const cpu = parseFloat(stats[0])
      const memory = parseFloat(stats[1])
      const uptime = stats[2]

      return {
        pid,
        name: 'prophet-central',
        status: 'running',
        cpu,
        memory,
        uptime: this.parseUptime(uptime)
      }

    } catch (error) {
      return null
    }
  }

  /**
   * 解析uptime字符串（格式：HH:MM:SS或DD-HH:MM:SS）
   */
  private parseUptime(uptimeStr: string): number {
    const parts = uptimeStr.split(/[-:]/).map(p => parseInt(p))

    if (parts.length === 3) {
      // HH:MM:SS
      return parts[0] * 3600 + parts[1] * 60 + parts[2]
    } else if (parts.length === 4) {
      // DD-HH:MM:SS
      return parts[0] * 86400 + parts[1] * 3600 + parts[2] * 60 + parts[3]
    }

    return 0
  }

  /**
   * 获取状态（基于阈值）
   */
  private getStatus(value: number, threshold: number): 'healthy' | 'warning' | 'critical' {
    if (value < threshold * 0.85) {
      return 'healthy'
    } else if (value < threshold) {
      return 'warning'
    } else {
      return 'critical'
    }
  }

  /**
   * 计算整体状态
   */
  private calculateOverallStatus(
    cpu: SystemHealth['cpu'],
    memory: SystemHealth['memory'],
    disk: SystemHealth['disk'],
    processes: SystemHealth['processes']
  ): 'healthy' | 'warning' | 'critical' {
    // 任何critical状态 -> critical
    if (cpu.status === 'critical' || memory.status === 'critical' || disk.status === 'critical') {
      return 'critical'
    }

    // Prophet进程不存在 -> critical
    if (!processes.prophet) {
      return 'critical'
    }

    // 任何warning状态 -> warning
    if (cpu.status === 'warning' || memory.status === 'warning' || disk.status === 'warning') {
      return 'warning'
    }

    return 'healthy'
  }

  /**
   * 记录警告
   */
  private logWarnings(health: SystemHealth): void {
    if (health.cpu.status === 'warning') {
      console.log(`[HealthMonitor] ⚠️  CPU使用率较高: ${health.cpu.usage}% (阈值: ${health.cpu.threshold}%)`)
    }

    if (health.memory.status === 'warning') {
      console.log(`[HealthMonitor] ⚠️  内存使用率较高: ${health.memory.percentage}% (阈值: ${health.memory.threshold}%)`)
    }

    if (health.disk.status === 'warning') {
      console.log(`[HealthMonitor] ⚠️  磁盘使用率较高: ${health.disk.percentage}% (阈值: ${health.disk.threshold}%)`)
    }
  }

  /**
   * 记录严重问题
   */
  private logCritical(health: SystemHealth): void {
    console.log(`[HealthMonitor] 🚨 系统健康状态: CRITICAL`)

    if (!health.processes.prophet) {
      console.log(`[HealthMonitor] 🚨 Prophet进程未运行！`)
    }

    if (health.cpu.status === 'critical') {
      console.log(`[HealthMonitor] 🚨 CPU使用率过高: ${health.cpu.usage}%`)
    }

    if (health.memory.status === 'critical') {
      console.log(`[HealthMonitor] 🚨 内存使用率过高: ${health.memory.percentage}%`)
    }

    if (health.disk.status === 'critical') {
      console.log(`[HealthMonitor] 🚨 磁盘使用率过高: ${health.disk.percentage}%`)
    }
  }

  /**
   * 获取最近的健康历史
   */
  getRecentHistory(count: number): SystemHealth[] {
    return this.healthHistory.slice(-count)
  }

  /**
   * 获取当前健康状态
   */
  getCurrentHealth(): SystemHealth | null {
    return this.healthHistory[this.healthHistory.length - 1] || null
  }

  /**
   * 获取统计信息
   */
  getStats() {
    const current = this.getCurrentHealth()

    return {
      isRunning: this.isRunning,
      historySize: this.healthHistory.length,
      currentStatus: current?.overallStatus || 'unknown',
      lastCheckTime: current?.timestamp || null
    }
  }
}
