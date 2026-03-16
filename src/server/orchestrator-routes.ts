/**
 * Prophet GlobalOrchestrator API Routes
 * 全局编排器的 HTTP API 端点
 *
 * @module server/orchestrator-routes
 * @prophet-component api
 */

import { FastifyInstance } from 'fastify'
import { GlobalOrchestrator } from '../orchestrator/global-orchestrator.js'

/**
 * 注册编排器 API 路由
 */
export function registerOrchestratorRoutes(
  app: FastifyInstance,
  orchestrator: GlobalOrchestrator
): void {
  // 获取全局状态
  app.get('/api/orchestrator/status', async () => {
    return orchestrator.getStatus()
  })

  // 获取所有项目
  app.get('/api/orchestrator/projects', async () => {
    return orchestrator.getAllProjects()
  })

  // 注册项目
  app.post<{
    Body: {
      name: string
      path: string
      type: 'web-app' | 'api' | 'cli' | 'library'
      priority: 'critical' | 'high' | 'medium' | 'low'
      monitoringInterval: number
      autoOptimize?: boolean
    }
  }>('/api/orchestrator/projects/register', async (req, reply) => {
    try {
      const projectId = `proj-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const config = {
        id: projectId,
        ...req.body,
      }
      await orchestrator.registerProject(config)
      return reply.code(201).send({ id: projectId, ...req.body })
    } catch (error) {
      return reply.code(400).send({
        error: error instanceof Error ? error.message : 'Failed to register project',
      })
    }
  })

  // 移除项目
  app.delete<{
    Params: { id: string }
  }>('/api/orchestrator/projects/:id', async (req, reply) => {
    try {
      await orchestrator.unregisterProject(req.params.id)
      return reply.code(204).send()
    } catch (error) {
      return reply.code(400).send({
        error: error instanceof Error ? error.message : 'Failed to unregister project',
      })
    }
  })

  // 触发全局心跳
  app.post('/api/orchestrator/heartbeat', async (req, reply) => {
    try {
      await orchestrator.triggerGlobalHeartbeat()
      return { success: true, message: 'Global heartbeat triggered' }
    } catch (error) {
      return reply.code(500).send({
        error: error instanceof Error ? error.message : 'Failed to trigger heartbeat',
      })
    }
  })

  // 触发单项目心跳
  app.post<{
    Params: { projectId: string }
  }>('/api/orchestrator/heartbeat/:projectId', async (req, reply) => {
    try {
      await orchestrator.triggerProjectHeartbeat(req.params.projectId)
      return { success: true, message: `Heartbeat triggered for ${req.params.projectId}` }
    } catch (error) {
      return reply.code(500).send({
        error: error instanceof Error ? error.message : 'Failed to trigger heartbeat',
      })
    }
  })

  // 触发跨项目开发
  app.post('/api/orchestrator/develop/cross-project', async (req, reply) => {
    try {
      await orchestrator.triggerCrossProjectDevelopment()
      return { success: true, message: 'Cross-project development triggered' }
    } catch (error) {
      return reply.code(500).send({
        error: error instanceof Error ? error.message : 'Failed to trigger development',
      })
    }
  })

  // 触发单项目开发
  app.post<{
    Params: { projectId: string }
  }>('/api/orchestrator/develop/:projectId', async (req, reply) => {
    try {
      await orchestrator.triggerProjectDevelopment(req.params.projectId)
      return { success: true, message: `Development triggered for ${req.params.projectId}` }
    } catch (error) {
      return reply.code(500).send({
        error: error instanceof Error ? error.message : 'Failed to trigger development',
      })
    }
  })

  // 获取所有 Agents
  app.get('/api/orchestrator/agents', async () => {
    return orchestrator.getAllAgents()
  })

  // 获取项目的 Agents
  app.get<{
    Params: { projectId: string }
  }>('/api/orchestrator/agents/:projectId', async (req) => {
    return orchestrator.getProjectAgents(req.params.projectId)
  })

  // 发送消息给 Agent
  app.post<{
    Params: { agentId: string }
    Body: {
      type: string
      content: string
    }
  }>('/api/orchestrator/agents/:agentId/message', async (req, reply) => {
    try {
      await orchestrator.sendAgentMessage(req.params.agentId, req.body)
      return { success: true, message: `Message sent to agent ${req.params.agentId}` }
    } catch (error) {
      return reply.code(500).send({
        error: error instanceof Error ? error.message : 'Failed to send message',
      })
    }
  })

  // 协调跨项目 Agent Swarm
  app.post<{
    Body: {
      projectIds: string[]
      task: {
        description: string
        goal: string
      }
    }
  }>('/api/orchestrator/agents/coordinate', async (req, reply) => {
    try {
      const result = await orchestrator.coordinateAgentSwarm(
        req.body.projectIds,
        req.body.task
      )
      return reply.code(201).send(result)
    } catch (error) {
      return reply.code(500).send({
        error: error instanceof Error ? error.message : 'Failed to coordinate swarm',
      })
    }
  })
}
