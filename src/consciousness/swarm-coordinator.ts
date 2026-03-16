/**
 * Swarm Coordinator - 蜂群协调器
 *
 * Coordinates swarm intelligence across multiple Prophet projects
 * Enables global swarm predictions using knowledge from all connected projects
 */

import type { PrismaClient } from '@prisma/client'
import type { Redis } from 'ioredis'
import { KnowledgeGraphBuilder, type KnowledgeGraph } from '../../src/core/oracle/knowledge-graph-builder.js'
import { AgentProfileGenerator, type AgentProfile } from '../../src/core/oracle/agent-profiles.js'
import { MiroFishAdapter, type SwarmId } from '../../src/core/oracle/mirofish-adapter.js'
import { ConfidenceCalculator } from '../../src/core/oracle/confidence.js'

/**
 * Global prediction task
 */
export interface GlobalPredictionTask {
  query: string
  projectIds?: string[]  // Specific projects, or all if omitted
  agentCount?: number
  simulationSteps?: number
}

/**
 * Global prediction result
 */
export interface GlobalPrediction {
  query: string
  prediction: string
  affectedProjects: string[]
  confidence: number
  patterns: any[]
  reasoning: string
  timestamp: Date
}

/**
 * Swarm distribution strategy
 */
interface SwarmDistribution {
  totalAgents: number
  perProject: Map<string, number>
  roles: Map<string, number>
}

/**
 * Swarm Coordinator
 *
 * Orchestrates swarm intelligence across Prophet's global consciousness
 * Enables predictions that leverage knowledge from all connected projects
 */
export class SwarmCoordinator {
  private db: PrismaClient
  private cache: Redis
  private adapter: MiroFishAdapter
  private graphBuilder: KnowledgeGraphBuilder
  private profileGenerator: AgentProfileGenerator
  private confidenceCalculator: ConfidenceCalculator
  private globalSwarms: Map<string, SwarmId> = new Map()

  constructor(db: PrismaClient, cache: Redis) {
    this.db = db
    this.cache = cache
    this.adapter = new MiroFishAdapter()
    this.graphBuilder = new KnowledgeGraphBuilder()
    this.profileGenerator = new AgentProfileGenerator()
    this.confidenceCalculator = new ConfidenceCalculator()

    console.log('🐝 Swarm Coordinator initialized')
  }

  /**
   * Spawn global swarm that learns from ALL connected projects
   *
   * Combines knowledge graphs from multiple projects into unified representation
   */
  async spawnGlobalSwarm(task: GlobalPredictionTask): Promise<SwarmId> {
    console.log(`\n🌍 Spawning global swarm for: "${task.query}"`)

    // 1. Determine which projects to include
    const projectIds = task.projectIds || await this.getAllActiveProjectIds()
    console.log(`   Including ${projectIds.length} projects`)

    // 2. Gather knowledge from all projects
    console.log('   📊 Building global knowledge graph...')
    const graphs = await Promise.all(
      projectIds.map(projectId => this.buildProjectGraph(projectId))
    )

    // 3. Merge into unified graph
    const globalGraph = await this.graphBuilder.merge(graphs)
    console.log(`   ✓ Merged graph: ${globalGraph.nodes.length} nodes, ${globalGraph.edges.length} edges`)

    // 4. Generate agents with cross-project expertise
    const distribution = this.calculateOptimalDistribution(task, projectIds.length)
    const agents = await this.generateGlobalAgents(globalGraph, distribution)
    console.log(`   ✓ Generated ${agents.length} agents`)

    // 5. Create swarm
    const swarmId = await this.adapter.createSwarm({
      name: 'global-swarm',
      distributed: true,
      temperature: 0.6  // Slightly higher for global exploration
    })

    await this.adapter.spawnAgents(swarmId, agents)
    await this.adapter.loadKnowledgeGraph(swarmId, globalGraph)

    // Track globally
    this.globalSwarms.set(task.query, swarmId)

    // Cache swarm metadata
    await this.cache.set(`swarm:${swarmId}`, JSON.stringify({
      query: task.query,
      projectIds,
      agentCount: agents.length,
      createdAt: new Date()
    }), 'EX', 3600)  // 1 hour TTL

    console.log(`   🐝 Global swarm ready: ${swarmId}`)
    return swarmId
  }

  /**
   * Run prediction using global swarm intelligence
   *
   * Simulates agents from multiple projects discussing and forming consensus
   */
  async predictGlobal(task: GlobalPredictionTask): Promise<GlobalPrediction> {
    console.log(`\n🔮 Global prediction: "${task.query}"`)

    const startTime = Date.now()

    try {
      // 1. Spawn global swarm
      const swarmId = await this.spawnGlobalSwarm(task)

      // 2. Run simulation with more steps for complex global analysis
      const steps = task.simulationSteps || 500
      console.log(`   ⚡ Running ${steps}-step simulation...`)

      const result = await this.adapter.simulate(swarmId, {
        scenario: 'global-analysis',
        steps,
        context: {
          query: task.query,
          mode: 'global'
        }
      })

      console.log(`   ✓ Simulation complete (${result.interactions.length} interactions)`)

      // 3. Extract emergent patterns
      const patterns = await this.adapter.getEmergentPatterns(swarmId)
      console.log(`   ✓ Found ${patterns.length} emergent patterns`)

      // 4. Calculate confidence
      const confidence = this.confidenceCalculator.calculateConsensus(patterns)
      console.log(`   ✓ Confidence: ${(confidence * 100).toFixed(1)}%`)

      // 5. Identify affected projects
      const affectedProjects = await this.identifyRelevantProjects(patterns, task.query)

      // 6. Synthesize prediction
      const prediction = this.synthesizeGlobalPrediction(patterns, task.query)

      // 7. Store in database
      const projectIds = task.projectIds || await this.getAllActiveProjectIds()
      await this.storeSwarmSimulation(projectIds[0] || null, {
        scenario: 'global-prediction',
        agentCount: result.finalStates.size,
        steps: result.steps,
        result,
        patterns,
        confidence
      })

      // 8. Broadcast insights to all affected projects
      await this.broadcastInsights(affectedProjects, patterns, prediction)

      // 9. Cleanup swarm
      await this.adapter.destroySwarm(swarmId)
      this.globalSwarms.delete(task.query)

      const duration = Date.now() - startTime
      console.log(`   ✨ Global prediction complete (${duration}ms)`)

      return {
        query: task.query,
        prediction,
        affectedProjects,
        confidence,
        patterns,
        reasoning: this.generateReasoning(patterns, confidence),
        timestamp: new Date()
      }

    } catch (error) {
      console.error('Error in global prediction:', error)
      throw error
    }
  }

  /**
   * Coordinate swarm prediction for specific context
   *
   * Used by GlobalConsciousness for task execution
   */
  async coordinateSwarmPrediction(context: {
    task: string
    projectId: string
    relatedProjects?: string[]
  }): Promise<any> {
    const projectIds = context.relatedProjects || [context.projectId]

    const prediction = await this.predictGlobal({
      query: context.task,
      projectIds,
      agentCount: 100,
      simulationSteps: 200
    })

    return {
      prediction: prediction.prediction,
      confidence: prediction.confidence,
      insights: prediction.patterns.map(p => ({
        type: p.type,
        description: p.description,
        confidence: p.confidence
      })),
      affectedProjects: prediction.affectedProjects
    }
  }

  /**
   * Get active swarms
   */
  async getActiveSwarms(): Promise<any[]> {
    const swarms = []

    for (const [query, swarmId] of this.globalSwarms) {
      const cached = await this.cache.get(`swarm:${swarmId}`)
      if (cached) {
        swarms.push({
          query,
          swarmId,
          ...JSON.parse(cached)
        })
      }
    }

    return swarms
  }

  /**
   * Get swarm statistics
   */
  async getSwarmStats(): Promise<any> {
    const totalSimulations = await this.db.swarmSimulation.count()
    const recentSimulations = await this.db.swarmSimulation.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        scenario: true,
        agentCount: true,
        confidence: true,
        createdAt: true
      }
    })

    const avgConfidence = await this.db.swarmSimulation.aggregate({
      _avg: { confidence: true }
    })

    return {
      totalSimulations,
      averageConfidence: avgConfidence._avg.confidence || 0,
      recentSimulations,
      activeSwarms: this.globalSwarms.size
    }
  }

  // Private helper methods

  private async getAllActiveProjectIds(): Promise<string[]> {
    const activeProjectsSet = await this.cache.smembers('realtime:active_projects')
    return activeProjectsSet
  }

  private async buildProjectGraph(projectId: string): Promise<KnowledgeGraph> {
    // Get project data from database
    const project = await this.db.project.findUnique({
      where: { id: projectId },
      include: {
        executions: { take: 50, orderBy: { startedAt: 'desc' } },
        memories: { take: 50, orderBy: { importance: 'desc' } }
      }
    })

    if (!project) {
      return { nodes: [], edges: [], metadata: { createdAt: new Date(), nodeCount: 0, edgeCount: 0, source: 'project' } }
    }

    // Build graph from project history
    const executions = project.executions.map(e => ({
      timestamp: e.startedAt,
      task: e.description,
      success: e.status === 'completed',
      duration: e.durationMs || 0,
      technologies: [],
      patterns: []
    }))

    const historyGraph = await this.graphBuilder.buildFromHistory(executions)

    // Build graph from memories
    const memories = project.memories.map(m => ({
      id: m.id,
      type: m.type,
      content: m.content,
      timestamp: m.createdAt,
      tags: m.tags
    }))

    const memoryGraph = await this.graphBuilder.buildFromMemory(memories)

    // Merge
    return this.graphBuilder.merge([historyGraph, memoryGraph])
  }

  private calculateOptimalDistribution(
    task: GlobalPredictionTask,
    projectCount: number
  ): SwarmDistribution {
    const totalAgents = task.agentCount || Math.min(200, projectCount * 20)

    // Distribute agents across projects
    const perProject = new Map<string, number>()
    const agentsPerProject = Math.floor(totalAgents / projectCount)

    // Role distribution
    const roles = new Map([
      ['developer:senior', Math.floor(totalAgents * 0.3)],
      ['developer:junior', Math.floor(totalAgents * 0.2)],
      ['user:power', Math.floor(totalAgents * 0.15)],
      ['user:casual', Math.floor(totalAgents * 0.15)],
      ['stakeholder:pm', Math.floor(totalAgents * 0.1)],
      ['stakeholder:cto', Math.floor(totalAgents * 0.1)]
    ])

    return {
      totalAgents,
      perProject,
      roles
    }
  }

  private async generateGlobalAgents(
    graph: KnowledgeGraph,
    distribution: SwarmDistribution
  ): Promise<AgentProfile[]> {
    const agents: AgentProfile[] = []

    // Generate diverse set based on global context
    const contexts: Array<'development' | 'user-testing' | 'decision-making'> = [
      'development',
      'user-testing',
      'decision-making'
    ]

    const agentsPerContext = Math.floor(distribution.totalAgents / contexts.length)

    for (const context of contexts) {
      const contextAgents = this.profileGenerator.generateDiverseSet(
        agentsPerContext,
        context
      )
      agents.push(...contextAgents)
    }

    // Fill remaining with mixed types
    while (agents.length < distribution.totalAgents) {
      agents.push(this.profileGenerator.generate('developer:senior'))
    }

    return agents.slice(0, distribution.totalAgents)
  }

  private async identifyRelevantProjects(
    patterns: any[],
    query: string
  ): Promise<string[]> {
    // Analyze patterns to determine which projects are most relevant
    const allProjectIds = await this.getAllActiveProjectIds()

    // For now, return all active projects
    // In production, would analyze pattern content to filter
    return allProjectIds
  }

  private synthesizeGlobalPrediction(patterns: any[], query: string): string {
    if (patterns.length === 0) {
      return 'Unable to form prediction from swarm'
    }

    // Find strongest consensus pattern
    const consensusPatterns = patterns.filter(p => p.type === 'consensus')

    if (consensusPatterns.length > 0) {
      // Use strongest consensus
      const strongest = consensusPatterns.sort((a, b) => b.confidence - a.confidence)[0]
      return strongest.description
    }

    // Use any strong pattern
    const strongPatterns = patterns.filter(p => p.confidence > 0.7)
    if (strongPatterns.length > 0) {
      return strongPatterns[0].description
    }

    // Fall back to most common pattern
    return patterns[0].description
  }

  private generateReasoning(patterns: any[], confidence: number): string {
    const supportingCount = patterns.reduce((sum, p) => sum + p.supportingAgents.length, 0)
    const opposingCount = patterns.reduce((sum, p) => sum + p.opposingAgents.length, 0)

    return `Swarm consensus reached with ${(confidence * 100).toFixed(1)}% confidence. ` +
           `${supportingCount} agents support the prediction, ${opposingCount} express concerns. ` +
           `${patterns.length} distinct patterns emerged from the simulation.`
  }

  private async broadcastInsights(
    projectIds: string[],
    patterns: any[],
    prediction: string
  ): Promise<void> {
    console.log(`   📡 Broadcasting insights to ${projectIds.length} projects`)

    for (const projectId of projectIds) {
      try {
        // Store insight in database
        await this.db.insight.create({
          data: {
            sourceProjectId: null,  // Global insight
            type: 'swarm-prediction',
            description: prediction,
            confidence: patterns[0]?.confidence || 0.5,
            applicableToProjects: projectIds,
            createdAt: new Date()
          }
        })

        // Publish to Redis for real-time delivery
        await this.cache.publish(
          `project:${projectId}:insights`,
          JSON.stringify({
            type: 'swarm-prediction',
            prediction,
            patterns: patterns.map(p => ({
              type: p.type,
              description: p.description,
              confidence: p.confidence
            })),
            timestamp: new Date()
          })
        )
      } catch (error) {
        console.error(`Failed to broadcast to ${projectId}:`, error)
      }
    }
  }

  private async storeSwarmSimulation(
    projectId: string | null,
    simulation: {
      scenario: string
      agentCount: number
      steps: number
      result: any
      patterns: any[]
      confidence: number
    }
  ): Promise<void> {
    try {
      await this.db.swarmSimulation.create({
        data: {
          projectId,
          scenario: simulation.scenario,
          agentCount: simulation.agentCount,
          steps: simulation.steps,
          result: simulation.result,
          patterns: simulation.patterns,
          confidence: simulation.confidence,
          createdAt: new Date()
        }
      })
    } catch (error) {
      console.error('Failed to store swarm simulation:', error)
    }
  }
}
