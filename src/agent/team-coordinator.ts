/**
 * Prophet Team Coordinator
 * 团队协调器 - 管理跨项目 Agent 团队协作
 *
 * @module agent/team-coordinator
 * @prophet-component team-management
 */

import { EventEmitter } from 'events'
import {
  Team,
  TeamMember,
  TeamTask,
  SubTask,
  TeamProgress,
  TaskProgress,
  AgentConnection,
} from '../types/orchestrator'
import { AgentCommunicationHub } from './communication-hub'

/**
 * 团队协调器
 */
export class TeamCoordinator extends EventEmitter {
  private teams: Map<string, Team> = new Map()
  private taskDecomposer: TaskDecomposer

  constructor(private hub: AgentCommunicationHub) {
    super()
    this.taskDecomposer = new TaskDecomposer()
  }

  /**
   * 创建跨项目团队
   */
  async createCrossProjectTeam(
    projectIds: string[],
    goal: string
  ): Promise<Team> {
    const teamId = this.generateTeamId()
    const team: TeamMember[] = []

    this.emit('team-creation-started', projectIds, goal)

    // 从每个项目选择合适的 Agents
    for (const projectId of projectIds) {
      const agents = this.hub.getAgents(projectId)

      if (agents.length === 0) {
        // 先发现 Agents
        await this.hub.discoverAgents(projectId)
        const discoveredAgents = this.hub.getAgents(projectId)
        agents.push(...discoveredAgents)
      }

      // 选择最合适的 Agent
      const suitable = this.selectSuitableAgent(agents, goal)

      if (suitable) {
        team.push({
          agentId: suitable.agentId,
          projectId,
          role: this.assignRole(suitable, goal),
        })
      }
    }

    // 创建团队实例
    const teamInstance: Team = {
      id: teamId,
      members: team,
      goal,
      status: 'active',
      createdAt: new Date(),
    }

    this.teams.set(teamId, teamInstance)

    // 通知所有团队成员
    await this.notifyTeamMembers(teamInstance)

    this.emit('team-created', teamInstance)

    return teamInstance
  }

  /**
   * 选择合适的 Agent
   */
  private selectSuitableAgent(
    agents: AgentConnection[],
    goal: string
  ): AgentConnection | null {
    if (agents.length === 0) {
      return null
    }

    // 简单策略：选择第一个可用的
    // TODO: 实现基于能力匹配的选择
    const available = agents.find((a) => a.status === 'connected' || a.status === 'idle')
    return available || agents[0]
  }

  /**
   * 分配角色
   */
  private assignRole(agent: AgentConnection, goal: string): string {
    // 基于 Agent 能力和目标分配角色
    const goalLower = goal.toLowerCase()

    if (agent.capabilities.includes('testing') || goalLower.includes('test')) {
      return 'tester'
    }
    if (agent.capabilities.includes('deployment') || goalLower.includes('deploy')) {
      return 'deployer'
    }
    if (agent.capabilities.includes('monitoring') || goalLower.includes('monitor')) {
      return 'monitor'
    }

    return 'developer'
  }

  /**
   * 通知团队成员
   */
  private async notifyTeamMembers(team: Team): Promise<void> {
    for (const member of team.members) {
      await this.hub.sendMessage(member.agentId, {
        type: 'team-invitation',
        teamId: team.id,
        goal: team.goal,
        role: member.role,
        teammates: team.members.filter((m) => m.agentId !== member.agentId),
      })
    }
  }

  /**
   * 分配团队任务
   */
  async assignTeamTask(teamId: string, task: TeamTask): Promise<void> {
    const team = this.teams.get(teamId)
    if (!team) {
      throw new Error(`Team ${teamId} not found`)
    }

    this.emit('team-task-assigned', teamId, task)

    // 1. 任务分解
    const subtasks = await this.taskDecomposer.decompose(
      task,
      team.members.length
    )

    // 2. 分配给团队成员
    for (let i = 0; i < team.members.length && i < subtasks.length; i++) {
      const member = team.members[i]
      const subtask = subtasks[i]

      await this.hub.assignTask(member.agentId, {
        id: subtask.id,
        type: 'team-task',
        description: subtask.description,
        priority: 'high',
        subtask: {
          teamId,
          subtask,
          dependencies: subtask.dependencies,
        },
      })

      this.emit('subtask-assigned', member.agentId, subtask)
    }
  }

  /**
   * 监控团队进度
   */
  async monitorTeamProgress(teamId: string): Promise<TeamProgress> {
    const team = this.teams.get(teamId)
    if (!team) {
      throw new Error(`Team ${teamId} not found`)
    }

    const progress: TaskProgress[] = []

    for (const member of team.members) {
      const status = await this.hub.queryAgentStatus(member.agentId)

      progress.push({
        agentId: member.agentId,
        taskStatus: status?.currentTask?.status,
        completionPercent: status?.currentTask?.progress || 0,
      })
    }

    const teamProgress: TeamProgress = {
      teamId,
      overallProgress:
        progress.reduce((sum, p) => sum + p.completionPercent, 0) /
        progress.length,
      memberProgress: progress,
    }

    this.emit('team-progress-updated', teamProgress)

    return teamProgress
  }

  /**
   * 解散团队
   */
  async disbandTeam(teamId: string): Promise<void> {
    const team = this.teams.get(teamId)
    if (!team) {
      return
    }

    // 通知所有成员
    for (const member of team.members) {
      await this.hub.sendMessage(member.agentId, {
        type: 'team-disbanded',
        teamId,
        reason: 'Task completed',
      })
    }

    team.status = 'completed'
    this.teams.delete(teamId)

    this.emit('team-disbanded', teamId)
  }

  /**
   * 获取团队信息
   */
  getTeam(teamId: string): Team | undefined {
    return this.teams.get(teamId)
  }

  /**
   * 获取所有团队
   */
  getAllTeams(): Team[] {
    return Array.from(this.teams.values())
  }

  /**
   * 生成团队 ID
   */
  private generateTeamId(): string {
    return `team-${Date.now()}-${Math.random().toString(36).substring(7)}`
  }
}

/**
 * 任务分解器
 */
class TaskDecomposer {
  /**
   * 将任务分解为子任务
   */
  async decompose(task: TeamTask, memberCount: number): Promise<SubTask[]> {
    const subtasks: SubTask[] = []

    if (task.subtasks && task.subtasks.length > 0) {
      // 任务已经有子任务
      return task.subtasks
    }

    // 简单的任务分解策略
    // TODO: 实现更智能的任务分解
    for (let i = 0; i < memberCount; i++) {
      subtasks.push({
        id: `${task.id}-sub-${i}`,
        description: `${task.description} - Part ${i + 1}/${memberCount}`,
        dependencies: [],
        status: 'pending',
      })
    }

    return subtasks
  }

  /**
   * 分析任务复杂度
   */
  async analyzeComplexity(task: TeamTask): Promise<number> {
    // 基于任务描述长度和关键词估算复杂度
    const descLength = task.description.length
    const complexKeywords = [
      'integrate',
      'refactor',
      'migrate',
      'optimize',
      'complex',
    ]

    let complexity = Math.min(descLength / 100, 5) // 基础分数

    const lower = task.description.toLowerCase()
    for (const keyword of complexKeywords) {
      if (lower.includes(keyword)) {
        complexity += 1
      }
    }

    return Math.min(complexity, 10) // 最高10分
  }
}
