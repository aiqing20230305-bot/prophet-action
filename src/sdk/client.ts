/**
 * Prophet Client SDK
 *
 * 项目连接到Prophet中央意识的SDK
 */

import { io, Socket } from 'socket.io-client'
import axios, { AxiosInstance } from 'axios'
import { EventEmitter } from 'events'

export interface ProphetClientConfig {
  serverUrl: string
  apiKey: string
  projectId?: string
  autoReconnect?: boolean
}

export interface Task {
  id: string
  description: string
  context?: any
}

export interface LearningExperience {
  what: string
  solution: string
  effectiveness: number
  tags?: string[]
}

export class ProphetClient extends EventEmitter {
  private socket!: Socket
  private http!: AxiosInstance
  private config: ProphetClientConfig
  private connected: boolean = false

  constructor(config: ProphetClientConfig) {
    super()
    this.config = {
      autoReconnect: true,
      ...config,
    }
  }

  /**
   * 连接到Prophet中央意识
   */
  async connect(): Promise<void> {
    console.log('🔮 连接到Prophet中央意识...')
    console.log(`   服务器: ${this.config.serverUrl}`)

    // HTTP客户端
    this.http = axios.create({
      baseURL: this.config.serverUrl,
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      timeout: 30000,
    })

    // WebSocket连接
    this.socket = io(this.config.serverUrl, {
      auth: {
        apiKey: this.config.apiKey,
      },
      reconnection: this.config.autoReconnect,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    })

    // 设置事件监听
    this.setupSocketListeners()

    // 等待连接
    await this.waitForConnection()
  }

  /**
   * 注册项目
   */
  async registerProject(data: {
    name: string
    type?: string
    path?: string
  }): Promise<{ projectId: string; apiKey: string }> {
    console.log(`📝 注册项目: ${data.name}`)

    const response = await this.http.post('/api/projects/register', data)

    console.log(`✅ 项目注册成功: ${response.data.projectId}`)

    return response.data
  }

  /**
   * 执行任务
   */
  async execute(task: Task): Promise<any> {
    if (!this.connected) {
      throw new Error('Not connected to Prophet Central')
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Task execution timeout'))
      }, 60000)

      this.socket.emit('task:execute', task)

      this.socket.once('task:completed', (result: any) => {
        clearTimeout(timeout)
        resolve(result)
      })

      this.socket.once('task:error', (error: any) => {
        clearTimeout(timeout)
        reject(error)
      })
    })
  }

  /**
   * 提交学习经验
   */
  async submitLearning(experience: LearningExperience): Promise<void> {
    if (!this.connected) {
      console.warn('Not connected, queuing learning experience...')
      // TODO: 离线队列
      return
    }

    this.socket.emit('learning:submit', experience)
    console.log(`📚 提交学习: ${experience.what}`)
  }

  /**
   * 搜索全局记忆
   */
  async searchMemory(query: string): Promise<any[]> {
    const response = await this.http.get('/api/memory/search', {
      params: {
        q: query,
        projectId: this.config.projectId,
      },
    })

    return response.data
  }

  /**
   * 获取洞察
   */
  async getInsights(timeframe: string = '7d'): Promise<any> {
    const response = await this.http.get('/api/insights', {
      params: {
        projectId: this.config.projectId,
        timeframe,
      },
    })

    return response.data
  }

  /**
   * 获取全局洞察
   */
  async getGlobalInsights(): Promise<any> {
    const response = await this.http.get('/api/insights/global')
    return response.data
  }

  /**
   * 跨项目分析
   */
  async crossProjectAnalyze(
    projectIds: string[],
    query: string
  ): Promise<any> {
    const response = await this.http.post('/api/cross-project/analyze', {
      projectIds,
      query,
    })

    return response.data
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.connected = false
      console.log('🔌 已断开连接')
    }
  }

  /**
   * 检查连接状态
   */
  isConnected(): boolean {
    return this.connected
  }

  // ========== 私有方法 ==========

  private setupSocketListeners(): void {
    this.socket.on('connect', () => {
      console.log('✅ WebSocket已连接')

      // 如果有projectId，自动连接项目
      if (this.config.projectId) {
        this.socket.emit('project:connect', {
          projectId: this.config.projectId,
          apiKey: this.config.apiKey,
        })
      }
    })

    this.socket.on('connection:success', (data: any) => {
      console.log('🌟 已接入Prophet中央意识')
      this.connected = true

      if (data.insights && data.insights.length > 0) {
        console.log(`💡 收到 ${data.insights.length} 个洞察`)
      }

      this.emit('connected', data)
    })

    this.socket.on('connection:error', (error: any) => {
      console.error('❌ 连接错误:', error)
      this.emit('error', error)
    })

    this.socket.on('disconnect', (reason: any) => {
      console.log(`🔌 连接断开: ${reason}`)
      this.connected = false
      this.emit('disconnected', reason)
    })

    // 全局模式
    this.socket.on('global:pattern', (pattern: any) => {
      console.log('🌍 全局模式发现:', pattern.description)
      this.emit('pattern', pattern)
    })

    // 洞察发现
    this.socket.on('insight:discovered', (insight: any) => {
      console.log('💡 新洞察:', insight.description)
      this.emit('insight', insight)
    })

    // 优化建议
    this.socket.on('optimization:available', (optimization: any) => {
      console.log('⚡ 优化建议:', optimization)
      this.emit('optimization', optimization)
    })

    // 进化更新
    this.socket.on('evolution:update', (data: any) => {
      console.log('🧬 全局意识进化:', data.message)
      this.emit('evolution', data)
    })

    // 错误处理
    this.socket.on('error', (error: any) => {
      console.error('Socket错误:', error)
      this.emit('error', error)
    })
  }

  private waitForConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'))
      }, 10000)

      if (this.connected) {
        clearTimeout(timeout)
        resolve()
        return
      }

      this.once('connected', () => {
        clearTimeout(timeout)
        resolve()
      })

      this.once('error', (error) => {
        clearTimeout(timeout)
        reject(error)
      })
    })
  }
}

/**
 * 创建Prophet客户端
 */
export function createProphetClient(
  config: ProphetClientConfig
): ProphetClient {
  return new ProphetClient(config)
}
