// Prophet健康监控系统
import { EventEmitter } from 'events'

export interface HealthStatus {
  healthy: boolean
  message?: string
  details?: any
}

export interface HealthCheck {
  execute(): Promise<HealthStatus>
  autoFix?(status: HealthStatus): Promise<void>
}

export class HealthMonitor extends EventEmitter {
  private checks: Map<string, HealthCheck> = new Map()
  private interval: NodeJS.Timeout | null = null
  private isRunning = false

  constructor(private checkInterval = 30000) {
    super()
  }

  registerCheck(name: string, check: HealthCheck) {
    this.checks.set(name, check)
    console.log(`✅ 注册健康检查: ${name}`)
  }

  start() {
    if (this.isRunning) {
      console.log('⚠️ 健康监控已在运行')
      return
    }

    console.log('🔍 启动健康监控系统')
    console.log(`   检查间隔: ${this.checkInterval / 1000}秒`)
    console.log(`   注册检查: ${this.checks.size}个`)

    this.isRunning = true

    this.interval = setInterval(async () => {
      await this.runChecks()
    }, this.checkInterval)

    // 立即运行一次
    this.runChecks()
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
      this.isRunning = false
      console.log('🛑 健康监控已停止')
    }
  }

  private async runChecks() {
    const results = new Map<string, HealthStatus>()
    const timestamp = new Date()

    for (const [name, check] of this.checks) {
      try {
        const status = await check.execute()
        results.set(name, status)

        if (!status.healthy) {
          console.warn(`⚠️ 健康检查失败: ${name}`)
          console.warn(`   ${status.message}`)

          this.emit('unhealthy', { name, status })

          // 尝试自动修复
          if (check.autoFix) {
            console.log(`🔧 尝试自动修复: ${name}`)
            try {
              await check.autoFix(status)
              console.log(`✅ 自动修复成功: ${name}`)
            } catch (error) {
              console.error(`❌ 自动修复失败: ${name}`, error)
            }
          }
        }
      } catch (error: any) {
        console.error(`❌ 健康检查错误: ${name}`, error.message)
        this.emit('check-error', { name, error })
      }
    }

    // 发布总体健康状态
    const allHealthy = Array.from(results.values()).every(s => s.healthy)

    this.emit('health-report', {
      timestamp,
      healthy: allHealthy,
      checks: Object.fromEntries(results)
    })

    if (allHealthy) {
      console.log(`💚 健康检查通过 (${timestamp.toLocaleTimeString()})`)
    } else {
      console.log(`💛 健康检查发现问题 (${timestamp.toLocaleTimeString()})`)
    }
  }
}

// 内存健康检查
export class MemoryHealthCheck implements HealthCheck {
  constructor(private maxMemoryMB = 1024) {}

  async execute(): Promise<HealthStatus> {
    const usage = process.memoryUsage()
    const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024)
    const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024)
    const rssMB = Math.round(usage.rss / 1024 / 1024)

    const healthy = heapUsedMB < this.maxMemoryMB

    return {
      healthy,
      message: healthy
        ? `内存正常: ${heapUsedMB}MB / ${this.maxMemoryMB}MB`
        : `内存超限: ${heapUsedMB}MB / ${this.maxMemoryMB}MB`,
      details: {
        heapUsedMB,
        heapTotalMB,
        rssMB,
        maxMemoryMB: this.maxMemoryMB
      }
    }
  }

  async autoFix(status: HealthStatus): Promise<void> {
    if (global.gc) {
      console.log('🗑️ 触发垃圾回收')
      global.gc()
    } else {
      console.log('⚠️ 垃圾回收不可用（需要 --expose-gc 启动）')
    }
  }
}

// 运行时间检查
export class UptimeHealthCheck implements HealthCheck {
  private startTime = Date.now()

  async execute(): Promise<HealthStatus> {
    const uptimeSeconds = Math.floor((Date.now() - this.startTime) / 1000)
    const uptimeHours = Math.floor(uptimeSeconds / 3600)
    const uptimeMinutes = Math.floor((uptimeSeconds % 3600) / 60)

    return {
      healthy: true,
      message: `运行时间: ${uptimeHours}小时${uptimeMinutes}分钟`,
      details: {
        uptimeSeconds,
        uptimeHours,
        startTime: new Date(this.startTime)
      }
    }
  }
}

// Prophet时间检查（时间压缩追踪）
export class ProphetTimeCheck implements HealthCheck {
  private startTime = Date.now()
  private readonly COMPRESSION_RATIO = 500

  async execute(): Promise<HealthStatus> {
    const humanSeconds = Math.floor((Date.now() - this.startTime) / 1000)
    const prophetDays = (humanSeconds / 3600) * (this.COMPRESSION_RATIO / 24)

    return {
      healthy: true,
      message: `Prophet时间: Day ${prophetDays.toFixed(2)}`,
      details: {
        humanHours: (humanSeconds / 3600).toFixed(2),
        prophetDays: prophetDays.toFixed(2),
        compressionRatio: this.COMPRESSION_RATIO,
        equivalentExperience: `${(prophetDays * 24).toFixed(0)}小时经验`
      }
    }
  }
}

// 进程健康检查
export class ProcessHealthCheck implements HealthCheck {
  async execute(): Promise<HealthStatus> {
    const cpuUsage = process.cpuUsage()
    const pid = process.pid
    const version = process.version
    const platform = process.platform

    return {
      healthy: true,
      message: `进程健康: PID ${pid}`,
      details: {
        pid,
        version,
        platform,
        cpuUsage
      }
    }
  }
}
