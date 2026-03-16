/**
 * Prophet Resource Pool
 * 资源池 - 管理系统资源，避免过载
 *
 * @module utils/resource-pool
 * @prophet-component resource-management
 */

import { EventEmitter } from 'events'
import * as os from 'os'

/**
 * 资源使用统计
 */
export interface ResourceUsage {
  cpu: number // CPU 使用率 (0-100)
  memory: number // 内存使用 MB
  memoryPercent: number // 内存使用率 (0-100)
  available: boolean // 是否有可用资源
  details?: {
    heapUsed: number // 堆内存使用 MB
    heapTotal: number // 堆内存总量 MB
    rss: number // 常驻内存 MB
  }
}

/**
 * 资源池配置
 */
export interface ResourcePoolConfig {
  maxCPUPercent?: number // 最大 CPU 使用率
  maxMemoryMB?: number // 最大内存使用 MB
  checkInterval?: number // 检查间隔（毫秒）
}

/**
 * 资源池
 */
export class ResourcePool extends EventEmitter {
  private maxCPUPercent: number
  private maxMemoryMB: number
  private checkInterval: number
  private isMonitoring = false
  private monitorTimer?: NodeJS.Timeout
  private previousCpuUsage: NodeJS.CpuUsage = { user: 0, system: 0 }
  private lastCpuCheckTime = Date.now()

  constructor(config: ResourcePoolConfig = {}) {
    super()
    // 进程级合理阈值
    this.maxCPUPercent = config.maxCPUPercent ?? 70 // 70% (单进程)
    this.maxMemoryMB = config.maxMemoryMB ?? 512 // 512MB (Prophet进程)
    this.checkInterval = config.checkInterval ?? 5000
  }

  /**
   * 启动资源监控
   */
  startMonitoring(): void {
    if (this.isMonitoring) {
      return
    }

    this.isMonitoring = true
    // 初始化 CPU 基线
    this.previousCpuUsage = process.cpuUsage()
    this.lastCpuCheckTime = Date.now()
    this.monitor()
    this.emit('monitoring-started')
  }

  /**
   * 停止资源监控
   */
  stopMonitoring(): void {
    this.isMonitoring = false
    if (this.monitorTimer) {
      clearTimeout(this.monitorTimer)
      this.monitorTimer = undefined
    }
    this.emit('monitoring-stopped')
  }

  /**
   * 监控循环
   */
  private async monitor(): Promise<void> {
    while (this.isMonitoring) {
      const usage = await this.getResourceUsage()

      if (!usage.available) {
        this.emit('resource-exhausted', usage)
      }

      // 进程 CPU 接近限制（90% 阈值 = 63% CPU）
      if (usage.cpu > this.maxCPUPercent * 0.9) {
        this.emit('high-cpu', usage)
      }

      // 堆内存使用率超过 90%
      if (usage.memoryPercent > 90) {
        this.emit('high-memory', usage)
      }

      await this.sleep(this.checkInterval)
    }
  }

  /**
   * 获取当前资源使用情况（进程级监控）
   */
  async getResourceUsage(): Promise<ResourceUsage> {
    // 1. 进程内存监控
    const mem = process.memoryUsage()
    const heapUsedMB = mem.heapUsed / 1024 / 1024
    const heapTotalMB = mem.heapTotal / 1024 / 1024
    const rssMB = mem.rss / 1024 / 1024

    // 2. 进程 CPU 监控（需要时间间隔计算）
    const currentTime = Date.now()
    const elapsedMs = currentTime - this.lastCpuCheckTime

    let cpuPercent = 0

    // 只有时间间隔足够长时才计算 CPU（避免除零或不准确的值）
    if (elapsedMs >= 100) {
      // 至少 100ms 间隔
      const currentCpu = process.cpuUsage(this.previousCpuUsage)

      // 更新基线
      this.previousCpuUsage = process.cpuUsage()
      this.lastCpuCheckTime = currentTime

      // 计算 CPU 使用率
      // cpuUsage 返回微秒，elapsedMs 是毫秒
      const totalCpuMicroseconds = currentCpu.user + currentCpu.system
      const elapsedCpuMicroseconds = elapsedMs * 1000 // 转换为微秒
      cpuPercent = (totalCpuMicroseconds / elapsedCpuMicroseconds) * 100
    } else {
      // 时间间隔太短，返回上次的值或 0
      cpuPercent = 0
    }

    // 3. 计算内存使用率
    const memoryPercent = (heapUsedMB / heapTotalMB) * 100

    // 4. 判断资源是否可用
    const available =
      cpuPercent < this.maxCPUPercent && heapUsedMB < this.maxMemoryMB

    return {
      cpu: Math.min(cpuPercent, 100),
      memory: heapUsedMB,
      memoryPercent: Math.min(memoryPercent, 100),
      available,
      details: {
        heapUsed: heapUsedMB,
        heapTotal: heapTotalMB,
        rss: rssMB,
      },
    }
  }

  /**
   * 检查是否可以执行新任务
   */
  async canExecuteTask(): Promise<boolean> {
    const usage = await this.getResourceUsage()
    return usage.available
  }

  /**
   * 等待资源可用
   */
  async waitForResources(timeout: number = 60000): Promise<boolean> {
    const startTime = Date.now()

    while (Date.now() - startTime < timeout) {
      if (await this.canExecuteTask()) {
        return true
      }

      await this.sleep(1000)
    }

    return false
  }

  /**
   * 获取系统信息
   */
  getSystemInfo() {
    return {
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus().length,
      totalMemory: os.totalmem() / 1024 / 1024 / 1024, // GB
      freeMemory: os.freemem() / 1024 / 1024 / 1024, // GB
      uptime: os.uptime(),
      loadAverage: os.loadavg(),
    }
  }

  /**
   * 获取配置
   */
  getConfig() {
    return {
      maxCPUPercent: this.maxCPUPercent,
      maxMemoryMB: this.maxMemoryMB,
      checkInterval: this.checkInterval,
    }
  }

  /**
   * Sleep 工具函数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
      this.monitorTimer = setTimeout(resolve, ms)
    })
  }
}
