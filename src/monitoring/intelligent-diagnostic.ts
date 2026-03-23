/**
 * Intelligent Diagnostic - 智能诊断系统
 * Phase 5 Day 2: 诊断问题根因
 *
 * 职责：
 * - 分析系统健康问题
 * - 诊断问题根本原因
 * - 提供修复建议
 */

import { SystemHealth, ProcessHealth } from './health-monitor.js'
import { EventEmitter } from 'events'

/**
 * 诊断结果
 */
export interface DiagnosticResult {
  // 问题描述
  issue: string
  // 严重程度
  severity: 'low' | 'medium' | 'high' | 'critical'
  // 根本原因
  rootCause: string
  // 相关指标
  relatedMetrics: {
    name: string
    current: number
    threshold: number
    unit: string
  }[]
  // 修复建议
  recommendations: {
    action: 'restart' | 'cleanup' | 'rollback' | 'scale' | 'optimize'
    description: string
    priority: number
    automated: boolean
  }[]
  // 预期效果
  expectedOutcome: string
  // 诊断时间
  timestamp: Date
  // 诊断ID
  diagnosticId: string
}

/**
 * 诊断规则
 */
interface DiagnosticRule {
  name: string
  check: (health: SystemHealth) => boolean
  diagnose: (health: SystemHealth, history: SystemHealth[]) => DiagnosticResult
}

/**
 * 智能诊断器
 */
export class IntelligentDiagnostic extends EventEmitter {
  private rules: DiagnosticRule[] = []
  private diagnosticHistory: DiagnosticResult[] = []

  constructor() {
    super()
    this.initializeRules()
  }

  /**
   * 初始化诊断规则
   */
  private initializeRules(): void {
    this.rules = [
      this.createCPUHighRule(),
      this.createMemoryLeakRule(),
      this.createProcessCrashRule(),
      this.createDiskFullRule(),
      this.createSystemOverloadRule()
    ]
  }

  /**
   * 诊断系统健康问题
   */
  async diagnose(health: SystemHealth, history: SystemHealth[]): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = []

    // 执行所有规则
    for (const rule of this.rules) {
      if (rule.check(health)) {
        const result = rule.diagnose(health, history)
        results.push(result)

        // 保存到历史
        this.diagnosticHistory.push(result)

        // 发出诊断事件
        this.emit('diagnostic-completed', result)
      }
    }

    return results
  }

  /**
   * 规则1: CPU过高诊断
   */
  private createCPUHighRule(): DiagnosticRule {
    return {
      name: 'CPU High Usage',
      check: (health) => health.cpu.status === 'critical',
      diagnose: (health, history) => {
        // 分析CPU使用趋势
        const recentCPU = history.slice(-10).map(h => h.cpu.usage)
        const avgCPU = recentCPU.reduce((a, b) => a + b, 0) / recentCPU.length
        const isSustained = avgCPU > health.cpu.threshold * 0.9

        // 判断根因
        let rootCause = 'Unknown CPU spike'
        let recommendations: DiagnosticResult['recommendations'] = []

        if (isSustained) {
          rootCause = 'Sustained high CPU usage - likely infinite loop, heavy computation, or resource leak'
          recommendations = [
            {
              action: 'optimize',
              description: 'Profile and optimize CPU-intensive code paths',
              priority: 1,
              automated: false
            },
            {
              action: 'restart',
              description: 'Restart affected processes to clear potential resource leaks',
              priority: 2,
              automated: true
            }
          ]
        } else {
          rootCause = 'Temporary CPU spike - likely batch processing or background task'
          recommendations = [
            {
              action: 'scale',
              description: 'Throttle background tasks or add rate limiting',
              priority: 1,
              automated: true
            }
          ]
        }

        return {
          issue: `CPU usage at ${health.cpu.usage}% exceeds threshold of ${health.cpu.threshold}%`,
          severity: 'critical',
          rootCause,
          relatedMetrics: [
            {
              name: 'CPU Usage',
              current: health.cpu.usage,
              threshold: health.cpu.threshold,
              unit: '%'
            },
            {
              name: 'Load Average (1m)',
              current: health.cpu.loadAverage[0],
              threshold: 4,
              unit: ''
            }
          ],
          recommendations,
          expectedOutcome: isSustained
            ? 'CPU usage should drop below 50% within 2 minutes of restart'
            : 'CPU spike should resolve naturally within 5 minutes',
          timestamp: new Date(),
          diagnosticId: `cpu-high-${Date.now()}`
        }
      }
    }
  }

  /**
   * 规则2: 内存泄漏诊断
   */
  private createMemoryLeakRule(): DiagnosticRule {
    return {
      name: 'Memory Leak Detection',
      check: (health) => health.memory.status === 'critical' || health.memory.status === 'warning',
      diagnose: (health, history) => {
        // 分析内存增长趋势
        const recentMemory = history.slice(-20).map(h => h.memory.percentage)

        // 计算增长率（每分钟）
        let isLeaking = false
        let growthRate = 0

        if (recentMemory.length >= 10) {
          const firstHalf = recentMemory.slice(0, 10)
          const secondHalf = recentMemory.slice(10)
          const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
          const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length

          growthRate = avgSecond - avgFirst
          isLeaking = growthRate > 2 // 内存持续增长超过2%
        }

        let rootCause: string
        let recommendations: DiagnosticResult['recommendations']

        if (isLeaking) {
          rootCause = `Memory leak detected - ${growthRate.toFixed(1)}% growth per 5 minutes. Likely cause: unclosed connections, event listener leaks, or cached data accumulation`
          recommendations = [
            {
              action: 'cleanup',
              description: 'Clear caches, close unused connections, and force garbage collection',
              priority: 1,
              automated: true
            },
            {
              action: 'restart',
              description: 'Restart process to reclaim memory if cleanup insufficient',
              priority: 2,
              automated: true
            }
          ]
        } else {
          rootCause = `High memory usage (${health.memory.percentage}%) but not leaking - likely legitimate workload`
          recommendations = [
            {
              action: 'scale',
              description: 'Add more memory or optimize memory-intensive operations',
              priority: 1,
              automated: false
            },
            {
              action: 'optimize',
              description: 'Review recent changes for memory-intensive operations',
              priority: 2,
              automated: false
            }
          ]
        }

        return {
          issue: `Memory usage at ${health.memory.percentage}% (${health.memory.used}MB/${health.memory.total}MB)`,
          severity: isLeaking ? 'critical' : 'high',
          rootCause,
          relatedMetrics: [
            {
              name: 'Memory Usage',
              current: health.memory.percentage,
              threshold: health.memory.threshold,
              unit: '%'
            },
            {
              name: 'Memory Growth Rate',
              current: growthRate,
              threshold: 2,
              unit: '%/5min'
            }
          ],
          recommendations,
          expectedOutcome: isLeaking
            ? 'Memory usage should stabilize and decrease after cleanup/restart'
            : 'Monitor for continued high usage; may need capacity planning',
          timestamp: new Date(),
          diagnosticId: `memory-leak-${Date.now()}`
        }
      }
    }
  }

  /**
   * 规则3: 进程崩溃诊断
   */
  private createProcessCrashRule(): DiagnosticRule {
    return {
      name: 'Process Crash Detection',
      check: (health) => !health.processes.prophet,
      diagnose: (health, history) => {
        // 查找最后一次进程正常的记录
        const lastHealthy = history.slice().reverse().find(h => h.processes.prophet)

        let rootCause = 'Process not running - crashed or never started'
        let lastCPU = 0
        let lastMemory = 0

        if (lastHealthy?.processes.prophet) {
          lastCPU = lastHealthy.processes.prophet.cpu
          lastMemory = lastHealthy.processes.prophet.memory

          // 分析崩溃原因
          if (lastCPU > 80) {
            rootCause = `Process crashed after high CPU usage (${lastCPU}%) - likely infinite loop or deadlock`
          } else if (lastMemory > 90) {
            rootCause = `Process crashed after high memory usage (${lastMemory}%) - likely out of memory (OOM)`
          } else if (lastHealthy.cpu.status === 'critical') {
            rootCause = 'Process crashed during system CPU overload - resource starvation'
          } else {
            rootCause = 'Process crashed for unknown reason - check logs for errors'
          }
        }

        return {
          issue: 'Prophet process is not running',
          severity: 'critical',
          rootCause,
          relatedMetrics: [
            {
              name: 'Last CPU Usage',
              current: lastCPU,
              threshold: 80,
              unit: '%'
            },
            {
              name: 'Last Memory Usage',
              current: lastMemory,
              threshold: 90,
              unit: '%'
            }
          ],
          recommendations: [
            {
              action: 'restart',
              description: 'Restart Prophet process with error recovery',
              priority: 1,
              automated: true
            },
            {
              action: 'cleanup',
              description: 'Clear temporary files and release system resources before restart',
              priority: 1,
              automated: true
            }
          ],
          expectedOutcome: 'Process should restart successfully and remain stable',
          timestamp: new Date(),
          diagnosticId: `process-crash-${Date.now()}`
        }
      }
    }
  }

  /**
   * 规则4: 磁盘空间不足诊断
   */
  private createDiskFullRule(): DiagnosticRule {
    return {
      name: 'Disk Space Critical',
      check: (health) => health.disk.status === 'critical',
      diagnose: (health, history) => {
        return {
          issue: `Disk usage at ${health.disk.percentage}% (${health.disk.used}GB used, ${health.disk.available}GB free)`,
          severity: 'high',
          rootCause: 'Disk space running low - likely log accumulation, cache growth, or data retention',
          relatedMetrics: [
            {
              name: 'Disk Usage',
              current: health.disk.percentage,
              threshold: health.disk.threshold,
              unit: '%'
            },
            {
              name: 'Available Space',
              current: health.disk.available,
              threshold: 20,
              unit: 'GB'
            }
          ],
          recommendations: [
            {
              action: 'cleanup',
              description: 'Clean up old logs, temporary files, and cached data',
              priority: 1,
              automated: true
            },
            {
              action: 'optimize',
              description: 'Implement log rotation and automated cleanup policies',
              priority: 2,
              automated: false
            }
          ],
          expectedOutcome: 'Disk usage should drop below 80% after cleanup',
          timestamp: new Date(),
          diagnosticId: `disk-full-${Date.now()}`
        }
      }
    }
  }

  /**
   * 规则5: 系统整体过载诊断
   */
  private createSystemOverloadRule(): DiagnosticRule {
    return {
      name: 'System Overload',
      check: (health) => {
        // 多个指标同时异常
        const criticalCount = [
          health.cpu.status === 'critical',
          health.memory.status === 'critical',
          health.disk.status === 'critical'
        ].filter(Boolean).length

        return criticalCount >= 2
      },
      diagnose: (health, history) => {
        const issues: string[] = []
        if (health.cpu.status === 'critical') issues.push(`CPU ${health.cpu.usage}%`)
        if (health.memory.status === 'critical') issues.push(`Memory ${health.memory.percentage}%`)
        if (health.disk.status === 'critical') issues.push(`Disk ${health.disk.percentage}%`)

        return {
          issue: `System overload detected: ${issues.join(', ')}`,
          severity: 'critical',
          rootCause: 'Multiple resource constraints simultaneously - system under extreme load or cascading failure',
          relatedMetrics: [
            {
              name: 'CPU Usage',
              current: health.cpu.usage,
              threshold: health.cpu.threshold,
              unit: '%'
            },
            {
              name: 'Memory Usage',
              current: health.memory.percentage,
              threshold: health.memory.threshold,
              unit: '%'
            },
            {
              name: 'Disk Usage',
              current: health.disk.percentage,
              threshold: health.disk.threshold,
              unit: '%'
            }
          ],
          recommendations: [
            {
              action: 'scale',
              description: 'Emergency: Reduce workload by disabling non-critical features',
              priority: 1,
              automated: true
            },
            {
              action: 'cleanup',
              description: 'Free up all possible resources (cache, temp files, connections)',
              priority: 1,
              automated: true
            },
            {
              action: 'restart',
              description: 'Last resort: Rolling restart of components',
              priority: 3,
              automated: false
            }
          ],
          expectedOutcome: 'System load should reduce to sustainable levels within 5 minutes',
          timestamp: new Date(),
          diagnosticId: `system-overload-${Date.now()}`
        }
      }
    }
  }

  /**
   * 获取诊断历史
   */
  getHistory(count: number = 10): DiagnosticResult[] {
    return this.diagnosticHistory.slice(-count)
  }

  /**
   * 清除历史
   */
  clearHistory(): void {
    this.diagnosticHistory = []
  }

  /**
   * 获取统计信息
   */
  getStats() {
    const severityCounts = this.diagnosticHistory.reduce((acc, d) => {
      acc[d.severity] = (acc[d.severity] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      totalDiagnostics: this.diagnosticHistory.length,
      severityCounts,
      rulesCount: this.rules.length
    }
  }
}
