/**
 * Global Consciousness - Prophet的全局意识
 *
 * 感知所有项目，跨项目学习，持续进化
 */

import { EventEmitter } from 'events'
import type { PrismaClient } from '@prisma/client'
import type { Redis } from 'ioredis'
import { SwarmCoordinator, type GlobalPredictionTask } from './swarm-coordinator.js'

export interface Project {
  id: string
  name: string
  type?: string
  path?: string
  apiKey: string
  createdAt: Date
  lastActiveAt?: Date
  metadata?: any
}

export interface Task {
  id: string
  description: string
  context?: any
}

export interface ProjectState {
  id: string
  name: string
  status: 'active' | 'idle' | 'offline'
  lastSeen: Date
  metrics?: any
}

export class GlobalConsciousness extends EventEmitter {
  private projects: Map<string, ProjectState> = new Map()
  private db: PrismaClient
  private cache: Redis
  public swarmCoordinator: SwarmCoordinator

  constructor(db: PrismaClient, cache: Redis) {
    super()
    this.db = db
    this.cache = cache
    this.swarmCoordinator = new SwarmCoordinator(db, cache)
    console.log('🧠 Global Consciousness initializing with swarm intelligence...')
  }

  /**
   * 项目连接
   */
  async projectConnected(project: Project): Promise<void> {
    console.log(`\n🌟 新项目接入: ${project.name}`)
    console.log(`   ID: ${project.id}`)
    console.log(`   类型: ${project.type || 'unknown'}`)

    this.projects.set(project.id, {
      id: project.id,
      name: project.name,
      status: 'active',
      lastSeen: new Date(),
    })

    // 缓存项目状态
    await this.cache.set(
      `project:${project.id}:status`,
      JSON.stringify({ status: 'active', lastSeen: new Date() })
    )

    // 添加到活跃项目集合
    await this.cache.sadd('realtime:active_projects', project.id)

    // 分析新项目
    await this.analyzeNewProject(project)

    this.emit('project:connected', project)
  }

  /**
   * 项目上线
   */
  async projectOnline(projectId: string): Promise<void> {
    const state = this.projects.get(projectId)
    if (state) {
      state.status = 'active'
      state.lastSeen = new Date()
      this.projects.set(projectId, state)
    }

    await this.cache.sadd('realtime:active_projects', projectId)
    console.log(`✅ 项目上线: ${projectId}`)
  }

  /**
   * 执行任务
   */
  async execute(projectId: string, task: Task): Promise<any> {
    console.log(`\n⚡ [执行] 项目: ${projectId}`)
    console.log(`   任务: ${task.description}`)

    const startTime = Date.now()

    // 1. 从全局记忆中查找相关经验
    const relevantMemories = await this.searchGlobalMemory(task.description)
    console.log(`   📚 找到 ${relevantMemories.length} 条相关记忆`)

    // 2. 执行任务（简化版 - 实际会调用具体执行引擎）
    const result = await this.executeWithMemory(task, relevantMemories)

    // 3. 记录执行
    const execution = await this.db.execution.create({
      data: {
        projectId,
        taskId: task.id,
        description: task.description,
        status: 'completed',
        result,
        startedAt: new Date(startTime),
        completedAt: new Date(),
        durationMs: Date.now() - startTime,
      },
    })

    // 4. 学习
    await this.learn(projectId, { task, result })

    // 5. 检查是否能应用到其他项目
    await this.propagateInsights(projectId, result)

    this.emit('execution:completed', { projectId, execution })

    return result
  }

  /**
   * 跨项目分析
   * Now powered by swarm intelligence!
   */
  async crossProjectAnalysis(projectIds: string[], query: string): Promise<any> {
    console.log(`\n🌍 跨项目分析启动 (Swarm-Powered)`)
    console.log(`   查询: ${query}`)
    console.log(`   涉及项目: ${projectIds.length}个`)

    // Use swarm intelligence for cross-project analysis
    const prediction = await this.swarmCoordinator.predictGlobal({
      query,
      projectIds,
      agentCount: Math.min(200, projectIds.length * 30),
      simulationSteps: 300
    })

    console.log(`   🔍 发现 ${prediction.patterns.length} 个模式`)
    console.log(`   💡 置信度: ${(prediction.confidence * 100).toFixed(1)}%`)

    return {
      patterns: prediction.patterns,
      insights: prediction.patterns.map(p => ({
        type: p.type,
        description: p.description,
        confidence: p.confidence
      })),
      recommendations: [prediction.prediction],
      swarmAnalysis: {
        confidence: prediction.confidence,
        reasoning: prediction.reasoning,
        affectedProjects: prediction.affectedProjects
      }
    }
  }

  /**
   * 全局进化
   */
  async evolve(): Promise<void> {
    console.log('\n🧬 全局意识进化中...')
    console.log(`   当前管理项目: ${this.projects.size}个`)

    // 1. 压缩记忆
    await this.compressMemories()

    // 2. 提取跨项目模式
    const patterns = await this.extractGlobalPatterns()
    console.log(`   📊 提取到 ${patterns.length} 个全局模式`)

    // 3. 优化全局策略
    await this.optimizeGlobalStrategy(patterns)

    // 4. 更新所有项目的建议
    await this.updateAllProjectInsights()

    this.emit('evolution:completed', { patterns })
    console.log('✨ 进化完成\n')
  }

  /**
   * 获取全局洞察
   * Now includes swarm statistics
   */
  async getGlobalInsights(): Promise<any> {
    try {
      const totalExecutions = await this.db.execution.count()
      const totalMemories = await this.db.memory.count()
      const recentInsights = await this.db.insight.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
      })

      // Get swarm stats
      const swarmStats = await this.swarmCoordinator.getSwarmStats()

      return {
        totalProjects: this.projects.size,
        activeProjects: Array.from(this.projects.values()).filter(
          p => p.status === 'active'
        ).length,
        totalExecutions,
        totalMemories,
        recentInsights,
        evolutionCycles: await this.getEvolutionCycles(),
        swarmIntelligence: swarmStats
      }
    } catch (error) {
      // 数据库未初始化时返回基础信息
      return {
        totalProjects: this.projects.size,
        activeProjects: Array.from(this.projects.values()).filter(
          p => p.status === 'active'
        ).length,
        totalExecutions: 0,
        totalMemories: 0,
        recentInsights: [],
        evolutionCycles: 0,
        swarmIntelligence: {
          totalSimulations: 0,
          averageConfidence: 0,
          recentSimulations: [],
          activeSwarms: 0
        }
      }
    }
  }

  /**
   * 获取项目的洞察
   */
  async getInsightsFor(projectId: string): Promise<any[]> {
    return this.db.insight.findMany({
      where: {
        OR: [
          { sourceProjectId: projectId },
          { applicableToProjects: { has: projectId } },
        ],
      },
      orderBy: { confidence: 'desc' },
      take: 20,
    })
  }

  /**
   * 检查全局模式
   */
  async checkForGlobalPattern(): Promise<any> {
    // 简化实现 - 实际会进行复杂的模式识别
    const recentExecutions = await this.db.execution.findMany({
      take: 100,
      orderBy: { startedAt: 'desc' },
    })

    if (recentExecutions.length > 50) {
      return {
        type: 'high-activity',
        description: '检测到高活跃度模式',
        confidence: 0.85,
      }
    }

    return null
  }

  // ========== 私有方法 ==========

  private async analyzeNewProject(project: Project): Promise<void> {
    console.log(`   🔍 分析新项目...`)

    // 创建初始记忆
    await this.db.memory.create({
      data: {
        projectId: project.id,
        type: 'project-init',
        content: {
          name: project.name,
          type: project.type,
          connectedAt: new Date(),
        },
        importance: 0.8,
        tags: ['initialization', project.type || 'unknown'],
      },
    })
  }

  private async searchGlobalMemory(query: string): Promise<any[]> {
    // 简化实现 - 实际会使用向量搜索
    return this.db.memory.findMany({
      where: {
        OR: [
          { type: { contains: query } },
          { tags: { hasSome: query.split(' ') } },
        ],
      },
      orderBy: { importance: 'desc' },
      take: 10,
    })
  }

  private async executeWithMemory(_task: Task, _memories: any[]): Promise<any> {
    // 简化实现
    return {
      success: true,
      output: '任务执行完成',
      learnedFrom: _memories.length,
    }
  }

  private async learn(projectId: string, experience: any): Promise<void> {
    await this.db.memory.create({
      data: {
        projectId,
        type: 'execution-experience',
        content: experience,
        importance: 0.7,
        tags: ['execution'],
      },
    })
  }

  private async propagateInsights(_projectId: string, _result: any): Promise<void> {
    // 检查结果是否值得传播到其他项目
    // 简化实现
  }

  private async getProjectData(projectId: string, _query: string): Promise<any> {
    return {
      projectId,
      executions: await this.db.execution.findMany({
        where: { projectId },
        take: 50,
      }),
      memories: await this.db.memory.findMany({
        where: { projectId },
        take: 50,
      }),
    }
  }

  private async findCrossProjectPatterns(_allData: any[]): Promise<any[]> {
    // 简化实现 - 实际会进行复杂的模式识别
    return []
  }

  private async generateGlobalInsights(_patterns: any[]): Promise<any[]> {
    return []
  }

  private generateRecommendations(_insights: any[]): any[] {
    return []
  }

  private async compressMemories(): Promise<void> {
    console.log('   🗜️  压缩记忆...')
    // 实现记忆压缩逻辑
  }

  private async extractGlobalPatterns(): Promise<any[]> {
    const patterns = await this.db.crossProjectPattern.findMany({
      take: 20,
      orderBy: { effectiveness: 'desc' },
    })
    return patterns
  }

  private async optimizeGlobalStrategy(_patterns: any[]): Promise<void> {
    console.log('   ⚡ 优化全局策略...')
    // 实现策略优化
  }

  private async updateAllProjectInsights(): Promise<void> {
    console.log('   📤 更新所有项目洞察...')
    // 为每个项目更新洞察
  }

  private async getEvolutionCycles(): Promise<number> {
    return this.db.evolutionMetric.count()
  }

  /**
   * Run global swarm prediction
   * Direct access to swarm intelligence
   */
  async swarmPredict(task: GlobalPredictionTask): Promise<any> {
    return this.swarmCoordinator.predictGlobal(task)
  }

  /**
   * Get active swarms
   */
  async getActiveSwarms(): Promise<any[]> {
    return this.swarmCoordinator.getActiveSwarms()
  }
}
