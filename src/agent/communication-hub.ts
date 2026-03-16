/**
 * Prophet Agent Communication Hub
 * Agent 通信枢纽 - 与项目中的 Claude Code Agents 建立通信
 *
 * @module agent/communication-hub
 * @prophet-component agent-coordination
 */

import { EventEmitter } from 'events'
import {
  AgentConnection,
  AgentMessage,
  AgentTask,
  SwarmTask,
  SwarmResult,
  AgentInfo,
} from '../types/orchestrator'

/**
 * Agent 通信枢纽
 */
export class AgentCommunicationHub extends EventEmitter {
  private agents: Map<string, AgentConnection> = new Map()
  private messageQueue: AgentMessage[] = []
  private clients: Map<string, any> = new Map() // ProphetClient instances

  /**
   * 注册 ProphetClient
   */
  registerClient(projectId: string, client: any): void {
    this.clients.set(projectId, client)
    this.emit('client-registered', projectId)
  }

  /**
   * 发现项目中的 Agents
   */
  async discoverAgents(projectId: string): Promise<AgentConnection[]> {
    const client = this.clients.get(projectId)
    if (!client) {
      throw new Error(`No ProphetClient registered for project ${projectId}`)
    }

    try {
      // 查询项目的 Agent 列表
      const agentList = await client.request('/agents/list')

      const connections: AgentConnection[] = []

      // 为每个 Agent 建立连接
      for (const agentInfo of agentList) {
        const conn = await this.connectToAgent(projectId, agentInfo)
        connections.push(conn)
      }

      this.emit('agents-discovered', projectId, connections)

      return connections
    } catch (error) {
      this.emit('discovery-error', projectId, error)
      return []
    }
  }

  /**
   * 连接到 Agent
   */
  private async connectToAgent(
    projectId: string,
    agentInfo: AgentInfo
  ): Promise<AgentConnection> {
    const client = this.clients.get(projectId)

    // 建立 WebSocket 连接（如果客户端支持）
    let socket: any = null
    if (client.socket) {
      socket = client.socket
      socket.emit('agent:connect', {
        agentId: agentInfo.id,
        role: 'prophet-coordinator',
      })
    }

    const connection: AgentConnection = {
      projectId,
      agentId: agentInfo.id,
      name: agentInfo.name,
      role: agentInfo.role,
      capabilities: agentInfo.capabilities || [],
      status: 'connected',
      socket,
    }

    // 监听 Agent 消息
    if (socket) {
      socket.on('agent:message', (msg: any) => {
        this.handleAgentMessage(connection, msg)
      })

      socket.on('agent:status', (status: string) => {
        connection.status = status as any
        this.emit('agent-status-changed', connection)
      })

      socket.on('disconnect', () => {
        connection.status = 'disconnected'
        this.emit('agent-disconnected', connection)
      })
    }

    this.agents.set(agentInfo.id, connection)

    return connection
  }

  /**
   * 发送消息给 Agent
   */
  async sendMessage(targetAgentId: string, message: AgentMessage): Promise<void> {
    const conn = this.agents.get(targetAgentId)
    if (!conn) {
      throw new Error(`Agent ${targetAgentId} not connected`)
    }

    if (conn.socket) {
      conn.socket.emit('agent:message', {
        from: 'prophet-coordinator',
        to: targetAgentId,
        message,
      })
    } else {
      // 使用 HTTP fallback
      const client = this.clients.get(conn.projectId)
      if (client) {
        await client.request(`/agents/${targetAgentId}/message`, {
          method: 'POST',
          body: message,
        })
      }
    }

    this.emit('message-sent', targetAgentId, message)
  }

  /**
   * 分配任务给 Agent
   */
  async assignTask(agentId: string, task: AgentTask): Promise<void> {
    await this.sendMessage(agentId, {
      type: 'task-assignment',
      task,
      priority: task.priority,
      deadline: task.deadline,
    })

    this.emit('task-assigned', agentId, task)
  }

  /**
   * 处理 Agent 消息
   */
  private handleAgentMessage(conn: AgentConnection, message: any): void {
    this.emit('agent-message-received', conn, message)

    switch (message.type) {
      case 'task-completed':
        this.onTaskCompleted(conn, message.task)
        break

      case 'insight-discovered':
        this.onInsightDiscovered(conn, message.insight)
        break

      case 'help-requested':
        this.onHelpRequested(conn, message.request)
        break

      case 'swarm-communication':
        this.onSwarmCommunication(conn, message)
        break

      default:
        this.emit('unknown-message-type', conn, message)
    }
  }

  /**
   * 任务完成处理
   */
  private onTaskCompleted(conn: AgentConnection, task: any): void {
    console.log(`✅ Agent ${conn.name} completed task: ${task.id}`)
    this.emit('task-completed', conn, task)
  }

  /**
   * 洞察发现处理
   */
  private onInsightDiscovered(conn: AgentConnection, insight: any): void {
    console.log(`💡 Agent ${conn.name} discovered insight:`, insight)
    this.emit('insight-discovered', conn, insight)
  }

  /**
   * 请求帮助处理
   */
  private onHelpRequested(conn: AgentConnection, request: any): void {
    console.log(`🆘 Agent ${conn.name} requests help:`, request)
    this.emit('help-requested', conn, request)
  }

  /**
   * Swarm 通信处理
   */
  private onSwarmCommunication(conn: AgentConnection, message: any): void {
    console.log(`🐝 Swarm communication from ${conn.name}`)
    this.emit('swarm-communication', conn, message)
  }

  /**
   * 协调 Swarm
   */
  async coordinateSwarm(
    projectIds: string[],
    task: SwarmTask
  ): Promise<SwarmResult> {
    // 收集所有相关项目的 Agents
    const allAgents: AgentConnection[] = []

    for (const projectId of projectIds) {
      const projectAgents = await this.discoverAgents(projectId)
      allAgents.push(...projectAgents)
    }

    this.emit('swarm-coordinating', task, allAgents)

    // 为每个 Agent 分配子任务
    const assignments = this.distributeSwarmTasks(allAgents, task)

    for (const { agent, subtask } of assignments) {
      await this.assignTask(agent.agentId, {
        id: `${task.id}-${agent.agentId}`,
        swarmId: task.id,
        type: 'swarm-task',
        description: subtask.description,
        priority: 'high',
        deadline: task.deadline,
        subtask,
      })
    }

    // 等待所有任务完成（简化版本）
    // 实际实现需要更复杂的同步机制
    await this.waitForSwarmCompletion(task.id, allAgents.length)

    const result: SwarmResult = {
      swarmId: task.id,
      success: true,
      output: {},
      metrics: {
        duration: 0,
        agentsParticipated: allAgents.length,
        tasksCompleted: allAgents.length,
      },
    }

    this.emit('swarm-completed', result)

    return result
  }

  /**
   * 分配 Swarm 任务
   */
  private distributeSwarmTasks(
    agents: AgentConnection[],
    task: SwarmTask
  ): Array<{ agent: AgentConnection; subtask: any }> {
    const assignments: Array<{ agent: AgentConnection; subtask: any }> = []

    // 简单的轮询分配
    agents.forEach((agent, index) => {
      assignments.push({
        agent,
        subtask: {
          id: `subtask-${index}`,
          description: `${task.description} - Part ${index + 1}`,
          assignedTo: agent.agentId,
        },
      })
    })

    return assignments
  }

  /**
   * 等待 Swarm 完成
   */
  private async waitForSwarmCompletion(
    swarmId: string,
    expectedCount: number
  ): Promise<void> {
    return new Promise((resolve) => {
      let completedCount = 0

      const handler = (conn: AgentConnection, task: any) => {
        if (task.swarmId === swarmId) {
          completedCount++
          if (completedCount >= expectedCount) {
            this.off('task-completed', handler)
            resolve()
          }
        }
      }

      this.on('task-completed', handler)

      // 超时保护
      setTimeout(() => {
        this.off('task-completed', handler)
        resolve()
      }, 5 * 60 * 1000) // 5分钟超时
    })
  }

  /**
   * 查询 Agent 状态
   */
  async queryAgentStatus(agentId: string): Promise<any> {
    const conn = this.agents.get(agentId)
    if (!conn) {
      return null
    }

    const client = this.clients.get(conn.projectId)
    if (!client) {
      return null
    }

    try {
      const status = await client.request(`/agents/${agentId}/status`)
      return status
    } catch (error) {
      return null
    }
  }

  /**
   * 获取所有 Agents
   */
  getAgents(projectId?: string): AgentConnection[] {
    if (projectId) {
      return Array.from(this.agents.values()).filter(
        (agent) => agent.projectId === projectId
      )
    }
    return Array.from(this.agents.values())
  }

  /**
   * 获取连接状态
   */
  getStatus() {
    return {
      totalAgents: this.agents.size,
      connectedAgents: Array.from(this.agents.values()).filter(
        (a) => a.status === 'connected'
      ).length,
      projects: this.clients.size,
    }
  }

  /**
   * 断开所有连接
   */
  async disconnect(): Promise<void> {
    for (const conn of this.agents.values()) {
      if (conn.socket) {
        conn.socket.disconnect()
      }
      conn.status = 'disconnected'
    }

    this.agents.clear()
    this.emit('all-disconnected')
  }

  /**
   * 获取所有 Agents
   */
  getAllAgents() {
    return Array.from(this.agents.values()).map((conn) => ({
      agentId: conn.agentId,
      name: conn.name,
      projectId: conn.projectId,
      role: conn.role,
      capabilities: conn.capabilities,
      status: conn.status,
    }))
  }

  /**
   * 获取项目的 Agents
   */
  getProjectAgents(projectId: string) {
    return Array.from(this.agents.values())
      .filter((conn) => conn.projectId === projectId)
      .map((conn) => ({
        agentId: conn.agentId,
        name: conn.name,
        projectId: conn.projectId,
        role: conn.role,
        capabilities: conn.capabilities,
        status: conn.status,
      }))
  }
}
