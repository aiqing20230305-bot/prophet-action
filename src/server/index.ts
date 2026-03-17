/**
 * Prophet Central Server - 中央意识服务器
 *
 * 多项目接入点，全局学习中枢
 */

import Fastify from 'fastify'
import cors from '@fastify/cors'
import rateLimit from '@fastify/rate-limit'
import { Server as SocketServer } from 'socket.io'
import { randomBytes } from 'crypto'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { memoryStore } from '../storage/memory-store.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

export class ProphetCentralServer {
  private app: ReturnType<typeof Fastify>
  private io!: SocketServer
  private store = memoryStore
  private projects: Map<string, any> = new Map()
  private port: number
  private globalOrchestrator?: any

  constructor(port: number = 3000) {
    this.port = port
    this.app = Fastify({ logger: true })

    console.log('🔮 Prophet Central Server initializing...')
    console.log('   使用内存存储模式')
  }

  setGlobalOrchestrator(orchestrator: any): void {
    this.globalOrchestrator = orchestrator
  }

  async initialize(): Promise<void> {
    // 注册插件
    await this.app.register(cors, {
      origin: true,
      credentials: true,
    })

    await this.app.register(rateLimit, {
      max: 100,
      timeWindow: '1 minute',
    })

    // 设置路由
    this.setupRoutes()

    // 设置WebSocket
    await this.setupWebSocket()

    // 启动进化循环
    this.startEvolutionLoop()

    console.log('✅ Prophet Central Server initialized')
  }

  private setupRoutes(): void {
    // 快速连接页面
    this.app.get('/quick-connect', async (_req, reply) => {
      try {
        const html = readFileSync(join(__dirname, '../../public/quick-connect.html'), 'utf-8')
        return reply.type('text/html').send(html)
      } catch (error) {
        return reply.code(404).send({ error: 'Page not found' })
      }
    })

    // 健康检查
    this.app.get('/health', async () => {
      const orchestratorStatus = this.globalOrchestrator
        ? this.globalOrchestrator.getStatus()
        : null

      return {
        status: 'ok',
        timestamp: new Date(),
        projects: {
          totalProjects: orchestratorStatus?.projectCount || this.projects.size,
          activeProjects: orchestratorStatus?.activeProjects || Array.from(this.projects.values()).filter(
            p => p.status === 'active'
          ).length,
          totalExecutions: await this.store.countExecutions(),
          totalMemories: await this.store.countMemories(),
        },
      }
    })

    // 项目注册
    this.app.post('/api/projects/register', async (req: any, reply: any) => {
      const { name, type, path } = req.body

      // 生成API密钥
      const apiKey = `pk_${randomBytes(32).toString('hex')}`

      const project = await this.store.createProject({
        name,
        type,
        path,
        apiKey,
      })

      // 记录到projects map
      this.projects.set(project.id, {
        ...project,
        status: 'active',
        lastSeen: new Date(),
      })

      console.log(`✅ 项目注册: ${project.name} (${project.id})`)

      return {
        projectId: project.id,
        apiKey: project.apiKey,
        message: '项目注册成功',
      }
    })

    // 任务执行
    this.app.post('/api/execute', async (req: any, reply: any) => {
      const { projectId, task } = req.body

      // 验证项目
      const project = await this.store.findProjectById(projectId)

      if (!project) {
        return reply.code(404).send({ error: 'Project not found' })
      }

      // 简化执行
      const execution = await this.store.createExecution({
        projectId,
        taskId: task.id,
        description: task.description,
        status: 'completed',
        result: { success: true },
        completedAt: new Date(),
        durationMs: 100,
      })

      return {
        success: true,
        result: execution.result,
      }
    })

    // 全局洞察
    this.app.get('/api/insights/global', async () => {
      return {
        totalProjects: this.projects.size,
        totalExecutions: await this.store.countExecutions(),
        totalMemories: await this.store.countMemories(),
        recentInsights: await this.store.getRecentInsights(),
      }
    })

    // 项目洞察
    this.app.get('/api/insights', async (req: any) => {
      const { projectId } = req.query
      const insights = await this.store.getInsightsForProject(projectId)
      return insights
    })

    // 记忆搜索
    this.app.get('/api/memory/search', async (req: any) => {
      const { q, projectId } = req.query
      const memories = await this.store.searchMemories(q, projectId)
      return memories
    })

    // 跨项目分析
    this.app.post('/api/cross-project/analyze', async (req: any) => {
      const { projectIds, query } = req.body

      return {
        projectIds,
        query,
        patterns: [],
        insights: [],
        recommendations: ['分析功能开发中...'],
      }
    })
  }

  private async setupWebSocket(): Promise<void> {
    this.io = new SocketServer(this.app.server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    })

    this.io.on('connection', (socket) => {
      console.log(`🔌 Client connected: ${socket.id}`)

      // 项目连接
      socket.on('project:connect', async ({ projectId, apiKey }) => {
        console.log(`📡 Project connecting: ${projectId}`)

        // 验证
        const project = await this.verifyProject(projectId, apiKey)

        if (!project) {
          socket.emit('connection:error', { error: 'Invalid credentials' })
          return
        }

        // 加入项目房间
        socket.join(`project:${projectId}`)
        socket.data.projectId = projectId

        // 更新状态
        if (this.projects.has(projectId)) {
          const p = this.projects.get(projectId)
          p.status = 'active'
          p.lastSeen = new Date()
        }

        // 发送欢迎信息
        const insights = await this.store.getInsightsForProject(projectId)
        socket.emit('connection:success', {
          message: '已连接到Prophet中央意识',
          insights,
        })

        console.log(`✅ Project connected: ${project.name}`)
      })

      // 任务执行
      socket.on('task:execute', async (task) => {
        const projectId = socket.data.projectId

        if (!projectId) {
          socket.emit('task:error', { error: 'Not authenticated' })
          return
        }

        const result = await this.consciousness.execute(projectId, task)
        socket.emit('task:completed', result)
      })

      // 学习提交
      socket.on('learning:submit', async (experience) => {
        const projectId = socket.data.projectId

        if (!projectId) return

        // 存储学习经验
        await this.db.memory.create({
          data: {
            projectId,
            type: 'learning-experience',
            content: experience,
            importance: 0.75,
            tags: ['learning'],
          },
        })

        // 检查全局模式
        const globalPattern = await this.consciousness.checkForGlobalPattern()

        if (globalPattern) {
          // 广播到所有相关项目
          this.io.emit('global:pattern', globalPattern)
        }
      })

      socket.on('disconnect', () => {
        console.log(`🔌 Client disconnected: ${socket.id}`)
      })
    })

    console.log('🔌 WebSocket server ready')
  }

  private async verifyProject(
    projectId: string,
    apiKey: string
  ): Promise<any> {
    const project = await this.store.findProjectById(projectId)
    if (project && project.apiKey === apiKey) {
      return project
    }
    return null
  }

  private startEvolutionLoop(): void {
    console.log('🧬 Starting evolution loop...')

    // 每分钟进化一次
    setInterval(() => {
      console.log(`🧬 进化中... (${this.projects.size} 个项目)`)

      // 广播进化事件
      this.io.emit('evolution:update', {
        timestamp: new Date(),
        message: '全局意识已进化',
        projectCount: this.projects.size,
      })
    }, 60000) // 1分钟
  }

  async start(): Promise<void> {
    try {
      await this.app.listen({ port: this.port, host: '0.0.0.0' })

      console.log('')
      console.log('═══════════════════════════════════════════')
      console.log('🔮 Prophet Central Server')
      console.log('   四维生物意识已觉醒')
      console.log('═══════════════════════════════════════════')
      console.log(`🌐 HTTP Server: http://localhost:${this.port}`)
      console.log(`🔌 WebSocket Server: ws://localhost:${this.port}`)
      console.log(`📊 Health Check: http://localhost:${this.port}/health`)
      console.log('═══════════════════════════════════════════')
      console.log('')
    } catch (error) {
      console.error('Failed to start server:', error)
      process.exit(1)
    }
  }

  async stop(): Promise<void> {
    await this.app.close()
    console.log('🛑 Prophet Central Server stopped')
  }

  /**
   * 获取 Fastify 实例（用于注册额外的路由）
   */
  getApp() {
    return this.app
  }
}
