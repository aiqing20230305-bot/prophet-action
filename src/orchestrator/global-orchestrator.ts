/**
 * Prophet Global Orchestrator
 * 全局编排器 - 管理所有项目的自动进化系统
 *
 * @module orchestrator/global-orchestrator
 * @prophet-component core
 */

import { EventEmitter } from 'events'
import { ProjectConfig, ProjectStatus, Issue, ScanResult } from '../types/orchestrator'
import { GlobalScheduler } from './global-scheduler'
import { ParallelHeartMonitor } from '../monitor/parallel-heart-monitor'
import { CrossProjectPatternDetector } from '../monitor/pattern-detector'
import { CrossProjectDeveloper } from '../developer/cross-project-developer'
import { SharedModuleGenerator } from '../developer/shared-module-generator'
import { AgentCommunicationHub } from '../agent/communication-hub'
import { TeamCoordinator } from '../agent/team-coordinator'
import { ResourcePool } from '../utils/resource-pool'

/**
 * 全局编排器配置
 */
export interface GlobalOrchestratorConfig {
  concurrencyLimit?: number
  enableAutoOptimize?: boolean
  enableAgentCommunication?: boolean
  resourcePool?: ResourcePool
}

/**
 * 项目编排器状态
 */
interface ProjectOrchestratorState {
  config: ProjectConfig
  status: ProjectStatus
  lastScan?: ScanResult
  isActive: boolean
}

/**
 * 全局编排器
 * 协调所有项目的监控、开发、Agent 通信
 */
export class GlobalOrchestrator extends EventEmitter {
  private projects: Map<string, ProjectOrchestratorState> = new Map()
  private scheduler: GlobalScheduler
  private heartMonitor: ParallelHeartMonitor
  private patternDetector: CrossProjectPatternDetector
  private developer: CrossProjectDeveloper
  private moduleGenerator: SharedModuleGenerator
  private agentHub: AgentCommunicationHub
  private teamCoordinator: TeamCoordinator
  private resourcePool: ResourcePool
  private isRunning = false
  private config: GlobalOrchestratorConfig

  constructor(config: GlobalOrchestratorConfig = {}) {
    super()
    this.config = config

    // 初始化组件
    this.scheduler = new GlobalScheduler({
      concurrencyLimit: config.concurrencyLimit ?? 3,
      maxQueueSize: 1000,  // 限制队列大小，防止性能问题
    })

    this.heartMonitor = new ParallelHeartMonitor()
    this.patternDetector = new CrossProjectPatternDetector()
    this.developer = new CrossProjectDeveloper()
    this.moduleGenerator = new SharedModuleGenerator()
    this.agentHub = new AgentCommunicationHub()
    this.teamCoordinator = new TeamCoordinator(this.agentHub)
    this.resourcePool = config.resourcePool ?? new ResourcePool()

    this.setupEventHandlers()
  }

  /**
   * 设置事件处理器
   */
  private setupEventHandlers(): void {
    // 调度器事件
    this.scheduler.on('task-execute', async (task, callback) => {
      try {
        await this.executeTask(task)
        callback()
      } catch (error) {
        callback(error as Error)
      }
    })

    // 心跳监控事件
    this.heartMonitor.on('scan-completed', (projectId, result) => {
      this.onScanCompleted(projectId, result)
    })

    // 开发者事件
    this.developer.on('shared-solution-started', (issue) => {
      console.log(`🔮 开始开发共享解决方案: ${issue.title}`)
    })

    this.developer.on('generate-shared-module', async (issue, requirements) => {
      await this.generateSharedModule(issue, requirements)
    })

    // Agent 通信事件
    if (this.config.enableAgentCommunication) {
      this.agentHub.on('agents-discovered', (projectId, agents) => {
        console.log(`🤖 发现 ${agents.length} 个 Agents (${projectId})`)
      })

      this.agentHub.on('task-completed', (conn, task) => {
        console.log(`✅ Agent ${conn.name} 完成任务: ${task.id}`)
      })
    }

    // 资源池事件
    this.resourcePool.on('resource-exhausted', (usage) => {
      console.warn(`⚠️  资源耗尽: CPU ${usage.cpu}%, Memory ${usage.memory}MB`)
      this.emit('resource-warning', usage)
    })
  }

  /**
   * 注册项目
   */
  async registerProject(config: ProjectConfig): Promise<void> {
    if (this.projects.has(config.id)) {
      throw new Error(`Project ${config.id} already registered`)
    }

    const state: ProjectOrchestratorState = {
      config,
      status: {
        projectId: config.id,
        status: 'idle',
        lastHeartbeat: new Date(),
        lastChange: null,
        health: 'healthy',
        metrics: {
          fileCount: 0,
          lineCount: 0,
          changedFiles: 0,
          todoCount: 0,
          opportunityCount: 0,
          autoOptimizations: 0,
          generatedLines: 0,
        },
        issues: [],
      },
      isActive: true,
    }

    this.projects.set(config.id, state)

    // 注册开发者
    this.developer.registerProject(config)

    // 调度心跳任务
    await this.scheduler.schedule({
      id: `heart-${config.id}`,
      projectId: config.id,
      type: 'heart',
      priority: config.priority === 'critical' ? 100 : 50,
      nextRun: Date.now() + 10000, // 10秒后开始
      interval: config.monitoringInterval,
      status: 'pending',
    })

    // 调度开发任务
    await this.scheduler.schedule({
      id: `developer-${config.id}`,
      projectId: config.id,
      type: 'developer',
      priority: config.priority === 'critical' ? 80 : 40,
      nextRun: Date.now() + 60000, // 1分钟后开始
      interval: 30 * 60 * 1000, // 30分钟
      status: 'pending',
    })

    this.emit('project-registered', config)

    console.log(`📋 项目已注册: ${config.name} (${config.id})`)
  }

  /**
   * 取消注册项目
   */
  async unregisterProject(projectId: string): Promise<void> {
    const state = this.projects.get(projectId)
    if (!state) {
      return
    }

    // 取消所有任务
    this.scheduler.cancelTask(`heart-${projectId}`)
    this.scheduler.cancelTask(`developer-${projectId}`)

    // 标记为非活跃
    state.isActive = false
    this.projects.delete(projectId)

    this.emit('project-unregistered', projectId)

    console.log(`📤 项目已取消注册: ${projectId}`)
  }

  /**
   * 启动全局编排器
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      return
    }

    this.isRunning = true

    // 启动调度器
    this.scheduler.start()

    // 启动资源池监控
    this.resourcePool.startMonitoring()

    this.emit('started')

    console.log('🚀 Prophet Global Orchestrator 已启动')
    console.log(`   并发限制: ${this.config.concurrencyLimit ?? 3}`)
    console.log(`   注册项目数: ${this.projects.size}`)
  }

  /**
   * 停止全局编排器
   */
  async stop(): Promise<void> {
    this.isRunning = false

    // 停止调度器
    this.scheduler.stop()

    // 停止资源池监控
    this.resourcePool.stopMonitoring()

    // 断开所有 Agent 连接
    if (this.config.enableAgentCommunication) {
      await this.agentHub.disconnect()
    }

    this.emit('stopped')

    console.log('🛑 Prophet Global Orchestrator 已停止')
  }

  /**
   * 执行任务
   */
  private async executeTask(task: any): Promise<void> {
    const state = this.projects.get(task.projectId)
    if (!state || !state.isActive) {
      return
    }

    // 检查资源
    const hasResources = await this.resourcePool.canExecuteTask()
    if (!hasResources) {
      console.warn(`⚠️  资源不足，跳过任务: ${task.type} (${task.projectId})`)
      return
    }

    switch (task.type) {
      case 'heart':
        await this.executeHeartbeat([state.config])
        break

      case 'developer':
        await this.executeDevelopment([state.config])
        break

      case 'analyzer':
        await this.executeAnalysis(state.config)
        break

      default:
        console.warn(`未知任务类型: ${task.type}`)
    }
  }

  /**
   * 执行心跳监控
   */
  private async executeHeartbeat(projects: ProjectConfig[]): Promise<void> {
    console.log(`💓 执行心跳监控: ${projects.map((p) => p.name).join(', ')}`)

    const results = await this.heartMonitor.monitorProjects(projects)

    // 更新项目状态
    for (const [projectId, result] of results.entries()) {
      const state = this.projects.get(projectId)
      if (state) {
        state.lastScan = result
        state.status.lastHeartbeat = new Date()

        if (result.changes.hasChanges) {
          state.status.lastChange = new Date()
        }

        state.status.metrics.todoCount = result.opportunities.filter(
          (o) => o.type === 'todo'
        ).length
        state.status.metrics.opportunityCount = result.opportunities.length
        state.status.metrics.autoOptimizations += result.optimizations.length
      }
    }

    // 跨项目模式检测
    if (results.size >= 2) {
      await this.detectCrossProjectPatterns(Array.from(results.values()))
    }
  }

  /**
   * 检测跨项目模式
   */
  private async detectCrossProjectPatterns(scanResults: ScanResult[]): Promise<void> {
    const patterns = await this.patternDetector.analyze(scanResults)

    if (patterns.length > 0) {
      console.log(`🔍 检测到 ${patterns.length} 个跨项目模式`)

      // 识别共享解决方案
      const solutions = this.patternDetector.identifySharedSolutions(patterns)

      for (const solution of solutions) {
        console.log(`💡 共享解决方案: ${solution.moduleName}`)
        await this.developer.processSharedSolution(solution)
      }

      this.emit('patterns-detected', patterns)
    }
  }

  /**
   * 执行开发
   */
  private async executeDevelopment(projects: ProjectConfig[]): Promise<void> {
    console.log(`🔧 执行开发协调: ${projects.map((p) => p.name).join(', ')}`)

    // 收集所有问题
    const allIssues: Issue[] = []

    for (const project of projects) {
      const state = this.projects.get(project.id)
      if (state?.lastScan) {
        const issues = state.lastScan.opportunities.map((o) => ({
          ...o,
          projectId: project.id,
          affectedProjects: [project.id],
        }))
        allIssues.push(...issues)
      }
    }

    // 协调开发
    if (allIssues.length > 0) {
      await this.developer.coordinatedDevelopment(allIssues)
    }
  }

  /**
   * 执行分析
   */
  private async executeAnalysis(project: ProjectConfig): Promise<void> {
    console.log(`📊 执行深度分析: ${project.name}`)
    // TODO: 实现深度分析逻辑
  }

  /**
   * 扫描完成处理
   */
  private onScanCompleted(projectId: string, result: ScanResult): void {
    console.log(`✅ 扫描完成: ${projectId}`)
    console.log(`   变更: ${result.changes.modified.length} 修改, ${result.changes.added.length} 新增`)
    console.log(`   机会: ${result.opportunities.length}`)
    console.log(`   优化: ${result.optimizations.length}`)
  }

  /**
   * 生成共享模块
   */
  private async generateSharedModule(issue: Issue, requirements: any): Promise<void> {
    console.log(`📦 生成共享模块: ${requirements.category}`)

    let module
    switch (requirements.category) {
      case 'auth':
        module = await this.moduleGenerator.generateAuthModule(requirements)
        break

      case 'payment':
        module = await this.moduleGenerator.generatePaymentModule(
          issue.affectedProjects
        )
        break

      case 'monitoring':
        module = await this.moduleGenerator.generateMonitoringModule(
          issue.affectedProjects
        )
        break

      default:
        console.warn(`未支持的模块类别: ${requirements.category}`)
        return
    }

    this.emit('shared-module-generated', module)

    console.log(`✅ 共享模块已生成: ${module.name}`)
  }

  /**
   * 获取项目状态
   */
  getProjectStatus(projectId: string): ProjectStatus | undefined {
    return this.projects.get(projectId)?.status
  }

  /**
   * 获取所有项目状态
   */
  getAllProjectsStatus(): Map<string, ProjectStatus> {
    const statuses = new Map<string, ProjectStatus>()

    for (const [projectId, state] of this.projects.entries()) {
      statuses.set(projectId, state.status)
    }

    return statuses
  }

  /**
   * 获取全局状态
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      projectCount: this.projects.size,
      activeProjects: Array.from(this.projects.values()).filter((s) => s.isActive)
        .length,
      scheduler: this.scheduler.getStatus(),
      developer: this.developer.getStatus(),
      agentHub: this.config.enableAgentCommunication
        ? this.agentHub.getStatus()
        : null,
      resourceUsage: this.resourcePool.getSystemInfo(),
    }
  }

  /**
   * 清空任务队列（性能优化）
   */
  clearTaskQueue(): void {
    this.scheduler.clearQueue()
    console.log('✅ Prophet Central 任务队列已清空')
  }

  /**
   * 发现并注册 Agent
   */
  async discoverAndRegisterAgents(projectId: string): Promise<void> {
    if (!this.config.enableAgentCommunication) {
      return
    }

    const agents = await this.agentHub.discoverAgents(projectId)
    console.log(`🤖 发现 ${agents.length} 个 Agents (${projectId})`)
  }

  /**
   * 创建跨项目团队
   */
  async createCrossProjectTeam(projectIds: string[], goal: string) {
    if (!this.config.enableAgentCommunication) {
      throw new Error('Agent communication is not enabled')
    }

    return await this.teamCoordinator.createCrossProjectTeam(projectIds, goal)
  }

  /**
   * 获取所有项目
   */
  getAllProjects() {
    return Array.from(this.projects.values()).map((state) => ({
      id: state.config.id,
      name: state.config.name,
      type: state.config.type,
      priority: state.config.priority,
      status: state.status.status,
      health: state.status.health,
      lastHeartbeat: state.status.lastHeartbeat,
      metrics: state.status.metrics,
    }))
  }

  /**
   * 触发全局心跳
   */
  async triggerGlobalHeartbeat(): Promise<void> {
    const projectConfigs = Array.from(this.projects.values()).map((s) => s.config)
    await this.executeHeartbeat(projectConfigs)
  }

  /**
   * 触发项目心跳
   */
  async triggerProjectHeartbeat(projectId: string): Promise<void> {
    const state = this.projects.get(projectId)
    if (!state) {
      throw new Error(`Project ${projectId} not found`)
    }

    await this.executeHeartbeat([state.config])
  }

  /**
   * 触发跨项目开发
   */
  async triggerCrossProjectDevelopment(): Promise<void> {
    const projects = Array.from(this.projects.values()).map((s) => s.config)
    await this.executeDevelopment(projects)
  }

  /**
   * 触发项目开发
   */
  async triggerProjectDevelopment(projectId: string): Promise<void> {
    const state = this.projects.get(projectId)
    if (!state) {
      throw new Error(`Project ${projectId} not found`)
    }

    await this.executeDevelopment([state.config])
  }

  /**
   * 获取所有 Agents
   */
  getAllAgents() {
    if (!this.config.enableAgentCommunication) {
      return []
    }

    return this.agentHub.getAllAgents()
  }

  /**
   * 获取项目的 Agents
   */
  getProjectAgents(projectId: string) {
    if (!this.config.enableAgentCommunication) {
      return []
    }

    return this.agentHub.getProjectAgents(projectId)
  }

  /**
   * 发送消息给 Agent
   */
  async sendAgentMessage(
    agentId: string,
    message: { type: string; content: string }
  ): Promise<void> {
    if (!this.config.enableAgentCommunication) {
      throw new Error('Agent communication is not enabled')
    }

    await this.agentHub.sendMessage(agentId, message as any)
  }

  /**
   * 协调 Agent Swarm
   */
  async coordinateAgentSwarm(
    projectIds: string[],
    task: { description: string; goal: string }
  ) {
    if (!this.config.enableAgentCommunication) {
      throw new Error('Agent communication is not enabled')
    }

    const swarmId = `swarm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    return await this.agentHub.coordinateSwarm(projectIds, {
      id: swarmId,
      description: task.description,
      goal: task.goal,
      subtask: task.description,
    })
  }
}
