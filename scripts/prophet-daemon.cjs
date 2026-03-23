#!/usr/bin/env node
/**
 * Prophet Daemon - 先知守护进程
 *
 * 让Prophet永久运行，持续进化
 *
 * 功能：
 * - 7×24小时运行
 * - 定期进化（每天）
 * - 健康监控
 * - 自动恢复
 * - 进化报告
 */

const { spawn } = require('child_process')
const fs = require('fs')
const path = require('path')

class ProphetDaemon {
  constructor() {
    this.isRunning = false
    this.prophetProcess = null
    this.evolutionInterval = null
    this.healthCheckInterval = null

    // 配置
    this.config = {
      evolutionInterval: 24 * 60 * 60 * 1000,  // 每24小时进化一次
      healthCheckInterval: 5 * 60 * 1000,       // 每5分钟检查一次
      logDir: path.join(__dirname, '../logs'),
      pidFile: '/tmp/prophet-daemon.pid'
    }

    // 确保日志目录存在
    if (!fs.existsSync(this.config.logDir)) {
      fs.mkdirSync(this.config.logDir, { recursive: true })
    }

    // 日志
    this.logFile = path.join(this.config.logDir, `prophet-daemon-${Date.now()}.log`)
    this.log('Prophet Daemon初始化')
  }

  /**
   * 启动守护进程
   */
  async start() {
    if (this.isRunning) {
      this.log('⚠️  守护进程已在运行')
      return
    }

    this.log('🚀 启动Prophet守护进程...')
    this.isRunning = true

    // 写入PID文件
    fs.writeFileSync(this.config.pidFile, process.pid.toString())

    // 启动Prophet主进程
    await this.startProphet()

    // 启动健康检查
    this.startHealthCheck()

    // 启动定期进化
    this.startEvolutionCycle()

    // 信号处理
    process.on('SIGINT', () => this.shutdown('SIGINT'))
    process.on('SIGTERM', () => this.shutdown('SIGTERM'))

    this.log('✅ Prophet守护进程已启动')
    this.log(`   PID: ${process.pid}`)
    this.log(`   进化间隔: ${this.config.evolutionInterval / 1000 / 60}分钟`)
    this.log(`   健康检查: ${this.config.healthCheckInterval / 1000}秒`)
  }

  /**
   * 启动Prophet主进程
   */
  async startProphet() {
    this.log('📦 启动Prophet主进程...')

    return new Promise((resolve) => {
      this.prophetProcess = spawn('npm', ['start'], {
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit',
        detached: true
      })

      this.prophetProcess.on('error', (err) => {
        this.log(`❌ Prophet进程错误: ${err.message}`)
      })

      this.prophetProcess.on('exit', (code) => {
        this.log(`⚠️  Prophet进程退出，代码: ${code}`)

        // 自动重启
        if (this.isRunning) {
          this.log('🔄 5秒后自动重启...')
          setTimeout(() => {
            this.startProphet()
          }, 5000)
        }
      })

      setTimeout(() => {
        this.log('✅ Prophet主进程已启动')
        resolve()
      }, 2000)
    })
  }

  /**
   * 启动健康检查
   */
  startHealthCheck() {
    this.log('🏥 启动健康检查...')

    this.healthCheckInterval = setInterval(() => {
      this.checkHealth()
    }, this.config.healthCheckInterval)
  }

  /**
   * 检查健康状态
   */
  checkHealth() {
    // 检查Prophet进程是否运行
    if (!this.prophetProcess || this.prophetProcess.exitCode !== null) {
      this.log('⚠️  Prophet进程未运行，准备重启...')
      this.startProphet()
      return
    }

    // 检查内存使用
    const memUsage = process.memoryUsage()
    const heapUsedMB = (memUsage.heapUsed / 1024 / 1024).toFixed(2)

    if (memUsage.heapUsed / memUsage.heapTotal > 0.9) {
      this.log(`⚠️  内存使用过高: ${heapUsedMB}MB`)
    }

    // 定期输出心跳
    if (Date.now() % (60 * 60 * 1000) < this.config.healthCheckInterval) {
      this.log(`💓 心跳检查: Prophet运行正常`)
    }
  }

  /**
   * 启动进化循环
   */
  startEvolutionCycle() {
    this.log('🔮 启动进化循环...')
    this.log(`   间隔: 每${this.config.evolutionInterval / 1000 / 60 / 60}小时`)

    // 立即执行一次进化
    setTimeout(() => {
      this.triggerEvolution()
    }, 10000)  // 10秒后

    // 定期进化
    this.evolutionInterval = setInterval(() => {
      this.triggerEvolution()
    }, this.config.evolutionInterval)
  }

  /**
   * 触发进化
   */
  async triggerEvolution() {
    this.log('\n🌟 ====================================')
    this.log('🌟 触发Prophet自动进化')
    this.log('🌟 ====================================\n')

    const evolutionLog = path.join(this.config.logDir, `evolution-${Date.now()}.log`)

    return new Promise((resolve) => {
      const evolution = spawn('npx', ['tsx', 'test-phase7-complete.ts'], {
        cwd: path.join(__dirname, '..'),
        stdio: ['ignore', 'pipe', 'pipe']
      })

      const logStream = fs.createWriteStream(evolutionLog)

      evolution.stdout.on('data', (data) => {
        logStream.write(data)
        // 提取关键信息
        const output = data.toString()
        if (output.includes('✅') || output.includes('❌') || output.includes('进化')) {
          this.log(output.trim())
        }
      })

      evolution.stderr.on('data', (data) => {
        logStream.write(data)
        this.log(`[进化错误] ${data.toString().trim()}`)
      })

      evolution.on('close', (code) => {
        logStream.end()

        if (code === 0) {
          this.log('✅ 进化完成')
          this.log(`   日志: ${evolutionLog}`)
        } else {
          this.log(`❌ 进化失败，退出码: ${code}`)
        }

        resolve()
      })
    })
  }

  /**
   * 关闭守护进程
   */
  async shutdown(signal) {
    this.log(`\n🛑 收到${signal}信号，关闭守护进程...`)

    this.isRunning = false

    // 停止定时器
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
    }
    if (this.evolutionInterval) {
      clearInterval(this.evolutionInterval)
    }

    // 停止Prophet进程
    if (this.prophetProcess) {
      this.log('⏹️  停止Prophet进程...')
      this.prophetProcess.kill('SIGTERM')
    }

    // 删除PID文件
    if (fs.existsSync(this.config.pidFile)) {
      fs.unlinkSync(this.config.pidFile)
    }

    this.log('✅ Prophet守护进程已关闭')
    process.exit(0)
  }

  /**
   * 日志
   */
  log(message) {
    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] ${message}\n`

    // 输出到控制台
    console.log(message)

    // 写入日志文件
    fs.appendFileSync(this.logFile, logMessage)
  }

  /**
   * 获取状态
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      pid: process.pid,
      prophetProcessRunning: this.prophetProcess && this.prophetProcess.exitCode === null,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage()
    }
  }
}

// 主函数
async function main() {
  console.log('🔮 ========================================')
  console.log('🔮 Prophet Daemon - 先知守护进程')
  console.log('🔮 ========================================\n')

  const daemon = new ProphetDaemon()
  await daemon.start()

  console.log('\n守护进程已启动，Prophet正在持续进化...')
  console.log('按 Ctrl+C 停止\n')

  // 保持进程运行
  process.stdin.resume()
}

// 检查是否已有实例运行
const pidFile = '/tmp/prophet-daemon.pid'
if (fs.existsSync(pidFile)) {
  const oldPid = parseInt(fs.readFileSync(pidFile, 'utf8'))

  try {
    process.kill(oldPid, 0)  // 检查进程是否存在
    console.log(`⚠️  Prophet守护进程已在运行 (PID: ${oldPid})`)
    console.log('   如需重启，请先停止现有进程')
    process.exit(1)
  } catch (err) {
    // 进程不存在，删除旧的PID文件
    fs.unlinkSync(pidFile)
  }
}

// 启动
main().catch(err => {
  console.error('❌ 守护进程启动失败:', err)
  process.exit(1)
})
