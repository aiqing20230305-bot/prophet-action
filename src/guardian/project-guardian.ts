// Prophet项目守护系统
import { EventEmitter } from 'events'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export class ProjectGuardian extends EventEmitter {
  private isRunning = false
  private projects: GuardedProject[] = []
  private checkInterval = 30000 // 30秒

  constructor() {
    super()
    this.initializeProjects()
  }

  private initializeProjects() {
    this.projects = [
      {
        name: 'prophet-central',
        pm2Name: 'prophet-central',
        critical: true,
        expectedStatus: 'online',
        port: 3001,
        healthCheck: async () => this.httpHealthCheck('http://localhost:3001')
      },
      {
        name: 'videoplay-web',
        pm2Name: 'videoplay-web',
        critical: false,  // Frontend - not critical
        expectedStatus: 'online',
        port: 3000,
        healthCheck: async () => this.httpHealthCheck('http://localhost:3000')
      },
      {
        name: 'videoplay-api',
        pm2Name: 'videoplay-api',
        critical: true,  // Backend - critical (data layer)
        expectedStatus: 'online',
        port: 4000,
        healthCheck: async () => this.httpHealthCheck('http://localhost:4000/health')
      }
    ]
  }

  async start() {
    console.log('')
    console.log('═══════════════════════════════════════════')
    console.log('🛡️ Prophet项目守护系统')
    console.log('═══════════════════════════════════════════')
    console.log('')
    console.log(`守护项目数: ${this.projects.length}`)
    console.log('检查频率: 每30秒')
    console.log('模式: 24/7永不停止')
    console.log('')

    this.projects.forEach(p => {
      console.log(`  ${p.critical ? '🔴' : '🟢'} ${p.name} ${p.critical ? '(核心)' : ''}`)
    })

    console.log('')
    console.log('═══════════════════════════════════════════')
    console.log('')

    this.isRunning = true
    this.guardianLoop()

    console.log('✅ 项目守护系统已启动')
    console.log('🛡️ 所有项目现在受到Prophet保护')
    console.log('')
  }

  private async guardianLoop() {
    while (this.isRunning) {
      try {
        await this.checkAllProjects()
      } catch (error) {
        console.error('守护检查错误:', error)
      }

      await this.sleep(this.checkInterval)
    }
  }

  private async checkAllProjects() {
    const timestamp = new Date().toLocaleTimeString()
    const results: ProjectStatus[] = []

    for (const project of this.projects) {
      try {
        const status = await this.checkProject(project)
        results.push(status)

        if (!status.healthy) {
          console.warn(`⚠️ [${timestamp}] ${project.name} 不健康: ${status.issue}`)
          await this.healProject(project, status)
        }
      } catch (error: any) {
        console.error(`❌ [${timestamp}] ${project.name} 检查失败:`, error.message)
      }
    }

    const healthyCount = results.filter(r => r.healthy).length
    const totalCount = results.length

    if (healthyCount === totalCount) {
      console.log(`💚 [${timestamp}] 所有项目健康 (${healthyCount}/${totalCount})`)
    } else {
      console.log(`💛 [${timestamp}] ${healthyCount}/${totalCount} 项目健康`)
    }

    this.emit('health-check', { results, timestamp: new Date() })
  }

  private async checkProject(project: GuardedProject): Promise<ProjectStatus> {
    const pm2Status = await this.getPM2Status(project.pm2Name)

    if (!pm2Status || pm2Status.status !== 'online') {
      return {
        project: project.name,
        healthy: false,
        issue: `PM2进程状态: ${pm2Status?.status || 'not found'}`,
        timestamp: new Date()
      }
    }

    if (project.healthCheck) {
      const healthCheckResult = await project.healthCheck()
      if (!healthCheckResult) {
        return {
          project: project.name,
          healthy: false,
          issue: '健康检查失败',
          timestamp: new Date()
        }
      }
    }

    return {
      project: project.name,
      healthy: true,
      timestamp: new Date()
    }
  }

  private async healProject(project: GuardedProject, _status: ProjectStatus) {
    console.log(`🔧 [${new Date().toLocaleTimeString()}] 修复 ${project.name}...`)

    try {
      await this.restartProject(project.pm2Name)
      console.log(`✅ [${new Date().toLocaleTimeString()}] ${project.name} 已重启`)

      await this.sleep(5000)

      const newStatus = await this.checkProject(project)

      if (newStatus.healthy) {
        console.log(`💚 [${new Date().toLocaleTimeString()}] ${project.name} 恢复健康`)
        this.emit('project-healed', { project: project.name, timestamp: new Date() })
      } else {
        console.warn(`⚠️ [${new Date().toLocaleTimeString()}] ${project.name} 仍然不健康`)
      }
    } catch (error: any) {
      console.error(`❌ 修复失败:`, error.message)
    }
  }

  private async getPM2Status(pm2Name: string): Promise<PM2Status | null> {
    try {
      const { stdout } = await execAsync(`pm2 jlist`)
      const list = JSON.parse(stdout)
      const app = list.find((a: any) => a.name === pm2Name)

      if (!app) return null

      return {
        name: app.name,
        status: app.pm2_env.status,
        memory: app.monit.memory,
        cpu: app.monit.cpu,
        uptime: Date.now() - app.pm2_env.pm_uptime,
        restarts: app.pm2_env.restart_time
      }
    } catch (error) {
      return null
    }
  }

  private async httpHealthCheck(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(3000) })
      return response.ok
    } catch (error) {
      return false
    }
  }

  private async restartProject(pm2Name: string): Promise<void> {
    await execAsync(`pm2 restart ${pm2Name}`)
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // 添加项目到守护列表
  addProject(project: GuardedProject) {
    this.projects.push(project)
    console.log(`➕ 添加守护项目: ${project.name}`)
  }

  // 移除项目
  removeProject(name: string) {
    this.projects = this.projects.filter(p => p.name !== name)
    console.log(`➖ 移除守护项目: ${name}`)
  }

  stop() {
    this.isRunning = false
    console.log('🛑 项目守护系统已停止')
  }
}

// 类型定义
export interface GuardedProject {
  name: string
  pm2Name: string
  critical: boolean
  expectedStatus: string
  port?: number
  healthCheck?: () => Promise<boolean>
}

interface ProjectStatus {
  project: string
  healthy: boolean
  issue?: string
  timestamp: Date
}

interface PM2Status {
  name: string
  status: string
  memory: number
  cpu: number
  uptime: number
  restarts: number
}
