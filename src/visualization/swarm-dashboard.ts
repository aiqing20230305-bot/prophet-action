/**
 * Real-Time Swarm Visualization Dashboard
 *
 * Provides WebSocket-based real-time visualization of swarm simulations
 * with D3.js network graphs, heatmaps, and timeline charts
 */

import { EventEmitter } from 'events'
import type { AgentProfile } from '../../../src/core/oracle/agent-profiles.js'
import type { Pattern } from '../../../src/core/oracle/confidence.js'

/**
 * Visualization data structures
 */
export interface NetworkNode {
  id: string
  label: string
  role: string
  opinion: number  // -1 to 1
  influence: number  // 0 to 1
  x?: number
  y?: number
}

export interface NetworkEdge {
  source: string
  target: string
  type: 'persuade' | 'question' | 'support' | 'oppose'
  strength: number  // 0 to 1
  timestamp: number
}

export interface OpinionSnapshot {
  step: number
  timestamp: number
  opinions: Map<string, number>  // agentId -> opinion value
  consensus: number  // 0 to 1
  diversity: number  // 0 to 1
}

export interface ConfidenceEvolution {
  step: number
  timestamp: number
  confidence: number
  agreementRate: number
  diversityScore: number
}

export interface EmergentPatternHighlight {
  id: string
  type: 'consensus' | 'conflict' | 'trend' | 'cluster'
  description: string
  confidence: number
  affectedAgents: string[]
  detectedAt: number
}

export interface DashboardState {
  swarmId: string
  swarmName: string
  agentCount: number
  currentStep: number
  totalSteps: number
  status: 'initializing' | 'running' | 'converged' | 'completed'

  // Real-time data
  nodes: NetworkNode[]
  edges: NetworkEdge[]
  opinionHistory: OpinionSnapshot[]
  confidenceHistory: ConfidenceEvolution[]
  patterns: EmergentPatternHighlight[]

  // Metrics
  consensusLevel: number
  diversityScore: number
  convergenceSpeed: number
  interactionCount: number
}

/**
 * Swarm Dashboard - Real-time visualization manager
 */
export class SwarmDashboard extends EventEmitter {
  private dashboardStates: Map<string, DashboardState>
  private updateInterval: number
  private recordHistory: boolean

  constructor(config?: {
    updateInterval?: number
    recordHistory?: boolean
  }) {
    super()
    this.dashboardStates = new Map()
    this.updateInterval = config?.updateInterval || 100  // 100ms
    this.recordHistory = config?.recordHistory ?? true
  }

  /**
   * Initialize dashboard for a swarm
   */
  initializeDashboard(swarmId: string, swarmName: string, agentCount: number, totalSteps: number): void {
    const state: DashboardState = {
      swarmId,
      swarmName,
      agentCount,
      currentStep: 0,
      totalSteps,
      status: 'initializing',
      nodes: [],
      edges: [],
      opinionHistory: [],
      confidenceHistory: [],
      patterns: [],
      consensusLevel: 0,
      diversityScore: 1,
      convergenceSpeed: 0,
      interactionCount: 0
    }

    this.dashboardStates.set(swarmId, state)
    this.emit('dashboard:initialized', { swarmId, state })
  }

  /**
   * Update agent nodes
   */
  updateNodes(swarmId: string, agents: AgentProfile[], opinions: Map<string, number>): void {
    const state = this.dashboardStates.get(swarmId)
    if (!state) return

    state.nodes = agents.map(agent => ({
      id: agent.id,
      label: agent.role,
      role: agent.role,
      opinion: opinions.get(agent.id) || 0,
      influence: this.calculateAgentInfluence(agent)
    }))

    this.emit('dashboard:nodes-updated', { swarmId, nodes: state.nodes })
  }

  /**
   * Add interaction edge
   */
  addInteraction(
    swarmId: string,
    fromId: string,
    toId: string,
    type: 'persuade' | 'question' | 'support' | 'oppose',
    influence: number
  ): void {
    const state = this.dashboardStates.get(swarmId)
    if (!state) return

    const edge: NetworkEdge = {
      source: fromId,
      target: toId,
      type,
      strength: influence,
      timestamp: Date.now()
    }

    state.edges.push(edge)
    state.interactionCount++

    // Keep only recent edges (last 50)
    if (state.edges.length > 50) {
      state.edges = state.edges.slice(-50)
    }

    this.emit('dashboard:interaction', { swarmId, edge })
  }

  /**
   * Update simulation step
   */
  updateStep(
    swarmId: string,
    step: number,
    opinions: Map<string, number>,
    consensus: number,
    diversity: number
  ): void {
    const state = this.dashboardStates.get(swarmId)
    if (!state) return

    state.currentStep = step

    // Record opinion snapshot
    if (this.recordHistory) {
      const snapshot: OpinionSnapshot = {
        step,
        timestamp: Date.now(),
        opinions: new Map(opinions),
        consensus,
        diversity
      }
      state.opinionHistory.push(snapshot)

      // Keep last 100 snapshots
      if (state.opinionHistory.length > 100) {
        state.opinionHistory = state.opinionHistory.slice(-100)
      }
    }

    // Update metrics
    state.consensusLevel = consensus
    state.diversityScore = diversity

    // Update node opinions
    state.nodes.forEach(node => {
      node.opinion = opinions.get(node.id) || 0
    })

    this.emit('dashboard:step-updated', { swarmId, step, state })
  }

  /**
   * Update confidence metrics
   */
  updateConfidence(
    swarmId: string,
    step: number,
    confidence: number,
    agreementRate: number,
    diversityScore: number
  ): void {
    const state = this.dashboardStates.get(swarmId)
    if (!state) return

    if (this.recordHistory) {
      const evolution: ConfidenceEvolution = {
        step,
        timestamp: Date.now(),
        confidence,
        agreementRate,
        diversityScore
      }
      state.confidenceHistory.push(evolution)

      // Keep last 100 points
      if (state.confidenceHistory.length > 100) {
        state.confidenceHistory = state.confidenceHistory.slice(-100)
      }
    }

    this.emit('dashboard:confidence-updated', { swarmId, step, confidence })
  }

  /**
   * Add emergent pattern
   */
  addPattern(swarmId: string, pattern: Pattern): void {
    const state = this.dashboardStates.get(swarmId)
    if (!state) return

    const highlight: EmergentPatternHighlight = {
      id: pattern.id,
      type: pattern.type as 'consensus' | 'conflict' | 'trend' | 'cluster',
      description: pattern.description,
      confidence: pattern.confidence,
      affectedAgents: [...pattern.supportingAgents, ...pattern.opposingAgents],
      detectedAt: Date.now()
    }

    state.patterns.push(highlight)

    // Keep last 10 patterns
    if (state.patterns.length > 10) {
      state.patterns = state.patterns.slice(-10)
    }

    this.emit('dashboard:pattern-detected', { swarmId, pattern: highlight })
  }

  /**
   * Mark convergence
   */
  markConvergence(swarmId: string, step: number): void {
    const state = this.dashboardStates.get(swarmId)
    if (!state) return

    state.status = 'converged'
    state.convergenceSpeed = step / state.totalSteps

    this.emit('dashboard:converged', { swarmId, step, convergenceSpeed: state.convergenceSpeed })
  }

  /**
   * Complete simulation
   */
  completeDashboard(swarmId: string): void {
    const state = this.dashboardStates.get(swarmId)
    if (!state) return

    state.status = 'completed'

    this.emit('dashboard:completed', { swarmId, state })
  }

  /**
   * Get current dashboard state
   */
  getDashboardState(swarmId: string): DashboardState | undefined {
    return this.dashboardStates.get(swarmId)
  }

  /**
   * Export dashboard data for visualization
   */
  exportVisualizationData(swarmId: string): {
    network: { nodes: NetworkNode[], edges: NetworkEdge[] }
    timeline: OpinionSnapshot[]
    confidence: ConfidenceEvolution[]
    patterns: EmergentPatternHighlight[]
    metadata: {
      swarmName: string
      agentCount: number
      totalSteps: number
      status: string
      metrics: {
        consensusLevel: number
        diversityScore: number
        convergenceSpeed: number
        interactionCount: number
      }
    }
  } | null {
    const state = this.dashboardStates.get(swarmId)
    if (!state) return null

    return {
      network: {
        nodes: state.nodes,
        edges: state.edges
      },
      timeline: state.opinionHistory,
      confidence: state.confidenceHistory,
      patterns: state.patterns,
      metadata: {
        swarmName: state.swarmName,
        agentCount: state.agentCount,
        totalSteps: state.totalSteps,
        status: state.status,
        metrics: {
          consensusLevel: state.consensusLevel,
          diversityScore: state.diversityScore,
          convergenceSpeed: state.convergenceSpeed,
          interactionCount: state.interactionCount
        }
      }
    }
  }

  /**
   * Generate D3.js compatible network data
   */
  generateD3NetworkData(swarmId: string): {
    nodes: Array<{ id: string, group: number, value: number, label: string }>
    links: Array<{ source: string, target: string, value: number, type: string }>
  } | null {
    const state = this.dashboardStates.get(swarmId)
    if (!state) return null

    // Group nodes by role
    const roleGroups = new Map<string, number>()
    let groupCounter = 0

    const d3Nodes = state.nodes.map(node => {
      if (!roleGroups.has(node.role)) {
        roleGroups.set(node.role, groupCounter++)
      }

      return {
        id: node.id,
        group: roleGroups.get(node.role)!,
        value: Math.abs(node.opinion),  // Node size based on opinion strength
        label: node.label
      }
    })

    const d3Links = state.edges.map(edge => ({
      source: edge.source,
      target: edge.target,
      value: edge.strength,
      type: edge.type
    }))

    return { nodes: d3Nodes, links: d3Links }
  }

  /**
   * Generate heatmap data for opinion distribution
   */
  generateOpinionHeatmap(swarmId: string): Array<{
    step: number
    agentId: string
    opinion: number
  }> | null {
    const state = this.dashboardStates.get(swarmId)
    if (!state) return null

    const heatmapData: Array<{ step: number, agentId: string, opinion: number }> = []

    state.opinionHistory.forEach(snapshot => {
      snapshot.opinions.forEach((opinion, agentId) => {
        heatmapData.push({
          step: snapshot.step,
          agentId,
          opinion
        })
      })
    })

    return heatmapData
  }

  /**
   * Clear dashboard data
   */
  clearDashboard(swarmId: string): void {
    this.dashboardStates.delete(swarmId)
    this.emit('dashboard:cleared', { swarmId })
  }

  // Private helpers

  private calculateAgentInfluence(agent: AgentProfile): number {
    // Calculate influence based on personality traits
    const { opinionStrength, collaborationStyle } = agent.personality

    let influence = opinionStrength

    // Leaders have higher influence
    if (collaborationStyle === 'leader') {
      influence += 0.2
    }

    // Cap at 1.0
    return Math.min(1.0, influence)
  }
}

/**
 * WebSocket Server for Real-Time Dashboard Updates
 */
export class DashboardWebSocketServer {
  private dashboard: SwarmDashboard
  private clients: Set<any>

  constructor(dashboard: SwarmDashboard) {
    this.dashboard = dashboard
    this.clients = new Set()

    // Listen to dashboard events
    this.setupEventListeners()
  }

  private setupEventListeners(): void {
    this.dashboard.on('dashboard:initialized', (data) => {
      this.broadcast('initialized', data)
    })

    this.dashboard.on('dashboard:nodes-updated', (data) => {
      this.broadcast('nodes-updated', data)
    })

    this.dashboard.on('dashboard:interaction', (data) => {
      this.broadcast('interaction', data)
    })

    this.dashboard.on('dashboard:step-updated', (data) => {
      this.broadcast('step-updated', data)
    })

    this.dashboard.on('dashboard:confidence-updated', (data) => {
      this.broadcast('confidence-updated', data)
    })

    this.dashboard.on('dashboard:pattern-detected', (data) => {
      this.broadcast('pattern-detected', data)
    })

    this.dashboard.on('dashboard:converged', (data) => {
      this.broadcast('converged', data)
    })

    this.dashboard.on('dashboard:completed', (data) => {
      this.broadcast('completed', data)
    })
  }

  addClient(client: any): void {
    this.clients.add(client)
  }

  removeClient(client: any): void {
    this.clients.delete(client)
  }

  private broadcast(event: string, data: any): void {
    this.clients.forEach(client => {
      try {
        client.send(JSON.stringify({ event, data }))
      } catch (error) {
        console.error('Failed to send to client:', error)
      }
    })
  }
}

/**
 * Create dashboard instance
 */
export function createSwarmDashboard(config?: {
  updateInterval?: number
  recordHistory?: boolean
}): SwarmDashboard {
  return new SwarmDashboard(config)
}

/**
 * Export types
 */
export type {
  DashboardState,
  NetworkNode,
  NetworkEdge,
  OpinionSnapshot,
  ConfidenceEvolution,
  EmergentPatternHighlight
}
