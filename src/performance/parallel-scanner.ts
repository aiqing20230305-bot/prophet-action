/**
 * Prophet Parallel Scanner - Worker Threads并行扫描系统
 *
 * Phase 2.1: Worker Threads并行
 *
 * 目标：充分利用多核CPU，同时扫描多个项目
 * 预期提速：5-10x
 *
 * 工作原理：
 * - 创建4个worker线程池
 * - 将项目分配到不同worker
 * - 并行执行扫描任务
 * - 结果汇总返回
 */

import { Worker } from 'worker_threads'
import { cpus } from 'os'
import { EventEmitter } from 'events'

export interface ScanTask {
  taskId: string
  projectName: string
  projectPath: string
  scanType: 'full' | 'quick' | 'deep'
}

export interface ScanResult {
  taskId: string
  projectName: string
  success: boolean
  files: number
  lines: number
  issues: number
  duration: number
  error?: string
}

interface WorkerInfo {
  worker: Worker
  id: number
  busy: boolean
  currentTask: ScanTask | null
}

export class ParallelScanner extends EventEmitter {
  private workers: WorkerInfo[] = []
  private workerCount: number
  private taskQueue: ScanTask[] = []
  private results: Map<string, ScanResult> = new Map()
  private isInitialized: boolean = false

  constructor(options: {
    workerCount?: number
    maxConcurrent?: number
  } = {}) {
    super()

    // 默认：CPU核心数-1（留1个给主线程）
    const cpuCount = cpus().length
    this.workerCount = options.workerCount || Math.max(1, cpuCount - 1)

    console.log(`🔧 [ParallelScanner] 初始化并行扫描器`)
    console.log(`   CPU核心数: ${cpuCount}`)
    console.log(`   Worker数量: ${this.workerCount}`)
  }

  /**
   * 初始化worker线程池
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    console.log(`🔧 [ParallelScanner] 创建worker线程池...`)

    for (let i = 0; i < this.workerCount; i++) {
      try {
        // 创建worker（指向worker实现文件）
        const worker = new Worker(
          new URL('./scan-worker.js', import.meta.url).pathname,
          {
            workerData: { workerId: i }
          }
        )

        const workerInfo: WorkerInfo = {
          worker,
          id: i,
          busy: false,
          currentTask: null
        }

        // 监听worker消息
        worker.on('message', (result: ScanResult) => {
          this.handleWorkerResult(workerInfo, result)
        })

        // 监听worker错误
        worker.on('error', (error) => {
          console.error(`⚠️  [ParallelScanner] Worker ${i} 错误:`, error.message)
          workerInfo.busy = false
          workerInfo.currentTask = null
          this.scheduleNextTask()
        })

        // 监听worker退出
        worker.on('exit', (code) => {
          if (code !== 0) {
            console.error(`⚠️  [ParallelScanner] Worker ${i} 异常退出: ${code}`)
          }
        })

        this.workers.push(workerInfo)
        console.log(`   ✓ Worker ${i} 已创建`)

      } catch (error: any) {
        console.error(`⚠️  [ParallelScanner] Worker ${i} 创建失败:`, error.message)
      }
    }

    this.isInitialized = true
    console.log(`   ✓ Worker线程池初始化完成: ${this.workers.length} 个worker`)
  }

  /**
   * 并行扫描多个项目
   *
   * 策略：
   * - 将项目分配到空闲worker
   * - 等待所有worker完成
   * - 返回汇总结果
   */
  async scanProjects(tasks: ScanTask[]): Promise<ScanResult[]> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    console.log(`\n🔍 [ParallelScanner] 开始并行扫描`)
    console.log(`   项目数量: ${tasks.length}`)
    console.log(`   Worker数量: ${this.workers.length}`)
    console.log(`   并行度: ${Math.min(tasks.length, this.workers.length)}`)

    const startTime = Date.now()

    // 将任务加入队列
    this.taskQueue.push(...tasks)
    this.results.clear()

    // 开始调度
    this.scheduleNextTask()

    // 等待所有任务完成
    const results = await this.waitForCompletion(tasks.length)

    const duration = Date.now() - startTime
    console.log(`\n✅ [ParallelScanner] 并行扫描完成`)
    console.log(`   总耗时: ${(duration / 1000).toFixed(2)}s`)
    console.log(`   完成任务: ${results.length}/${tasks.length}`)
    console.log(`   平均速度: ${(duration / results.length).toFixed(0)}ms/项目`)

    return results
  }

  /**
   * 调度下一个任务
   */
  private scheduleNextTask(): void {
    // 如果队列为空，退出
    if (this.taskQueue.length === 0) {
      return
    }

    // 查找空闲worker
    const idleWorker = this.workers.find(w => !w.busy)
    if (!idleWorker) {
      // 所有worker都忙，等待
      return
    }

    // 取出下一个任务
    const task = this.taskQueue.shift()!

    // 分配给worker
    idleWorker.busy = true
    idleWorker.currentTask = task

    console.log(`   → Worker ${idleWorker.id}: 开始扫描 ${task.projectName}`)

    // 发送任务到worker
    idleWorker.worker.postMessage(task)
  }

  /**
   * 处理worker返回的结果
   */
  private handleWorkerResult(workerInfo: WorkerInfo, result: ScanResult): void {
    console.log(`   ✓ Worker ${workerInfo.id}: 完成 ${result.projectName} (${(result.duration / 1000).toFixed(2)}s)`)

    // 保存结果
    this.results.set(result.taskId, result)

    // 标记worker为空闲
    workerInfo.busy = false
    workerInfo.currentTask = null

    // 触发事件
    this.emit('result', result)

    // 调度下一个任务
    this.scheduleNextTask()
  }

  /**
   * 等待所有任务完成
   */
  private waitForCompletion(expectedCount: number): Promise<ScanResult[]> {
    return new Promise((resolve) => {
      const checkCompletion = () => {
        if (this.results.size >= expectedCount && this.taskQueue.length === 0) {
          resolve(Array.from(this.results.values()))
        } else {
          setTimeout(checkCompletion, 100)
        }
      }
      checkCompletion()
    })
  }

  /**
   * 获取worker状态
   */
  getWorkerStatus() {
    return {
      totalWorkers: this.workers.length,
      busyWorkers: this.workers.filter(w => w.busy).length,
      idleWorkers: this.workers.filter(w => !w.busy).length,
      queuedTasks: this.taskQueue.length,
      completedTasks: this.results.size
    }
  }

  /**
   * 终止所有worker
   */
  async shutdown(): Promise<void> {
    console.log(`\n🛑 [ParallelScanner] 关闭worker线程池...`)

    for (const workerInfo of this.workers) {
      try {
        await workerInfo.worker.terminate()
        console.log(`   ✓ Worker ${workerInfo.id} 已终止`)
      } catch (error: any) {
        console.error(`   ⚠️  Worker ${workerInfo.id} 终止失败:`, error.message)
      }
    }

    this.workers = []
    this.isInitialized = false
    console.log(`   ✓ 所有worker已关闭`)
  }
}

/**
 * 使用示例：
 *
 * const scanner = new ParallelScanner({ workerCount: 4 })
 * await scanner.initialize()
 *
 * const tasks: ScanTask[] = [
 *   {
 *     taskId: 'task-1',
 *     projectName: 'videoplay',
 *     projectPath: '/path/to/videoplay',
 *     scanType: 'full'
 *   },
 *   {
 *     taskId: 'task-2',
 *     projectName: 'AgentForge',
 *     projectPath: '/path/to/AgentForge',
 *     scanType: 'full'
 *   }
 * ]
 *
 * const results = await scanner.scanProjects(tasks)
 * console.log(`扫描完成，发现 ${results.length} 个项目`)
 *
 * await scanner.shutdown()
 */
