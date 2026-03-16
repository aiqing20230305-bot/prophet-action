/**
 * AI API 端点
 */

import { FastifyInstance } from 'fastify'
import { AICoordinator } from '../../ai/ai-coordinator.js'

export function registerAIRoutes(app: FastifyInstance, coordinator: AICoordinator): void {
  /**
   * GET /api/ai/status
   * 获取 AI 协调器状态
   */
  app.get('/api/ai/status', async () => {
    return {
      success: true,
      data: coordinator.getStats()
    }
  })

  /**
   * POST /api/ai/generate
   * 生成代码（基于 TODO）
   */
  app.post<{
    Body: {
      projectId: string
      todos: Array<{
        file: string
        line: number
        content: string
        type: 'TODO' | 'FIXME'
      }>
    }
  }>('/api/ai/generate', async (req, reply) => {
    const { projectId, todos } = req.body

    if (!projectId || !todos || todos.length === 0) {
      return reply.code(400).send({
        success: false,
        error: 'Missing required fields: projectId, todos'
      })
    }

    try {
      await coordinator.processTodos(projectId, todos)

      return {
        success: true,
        message: `Started code generation for ${todos.length} TODOs`
      }
    } catch (error) {
      return reply.code(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Code generation failed'
      })
    }
  })

  /**
   * POST /api/ai/review
   * 审查代码
   */
  app.post<{
    Body: {
      projectId: string
      files: string[]
    }
  }>('/api/ai/review', async (req, reply) => {
    const { projectId, files } = req.body

    if (!projectId || !files || files.length === 0) {
      return reply.code(400).send({
        success: false,
        error: 'Missing required fields: projectId, files'
      })
    }

    try {
      await coordinator.reviewProject(projectId, files)

      return {
        success: true,
        message: `Started review for ${files.length} files`
      }
    } catch (error) {
      return reply.code(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Code review failed'
      })
    }
  })

  /**
   * GET /api/ai/tasks
   * 获取所有生成任务
   */
  app.get('/api/ai/tasks', async () => {
    const tasks = coordinator.getDeveloper().getAllTasks()

    return {
      success: true,
      data: {
        total: tasks.length,
        tasks
      }
    }
  })

  /**
   * GET /api/ai/tasks/pending
   * 获取待审批任务
   */
  app.get('/api/ai/tasks/pending', async () => {
    const tasks = coordinator.getDeveloper().getPendingTasks()

    return {
      success: true,
      data: {
        total: tasks.length,
        tasks
      }
    }
  })

  /**
   * POST /api/ai/tasks/:taskId/approve
   * 审批任务
   */
  app.post<{
    Params: { taskId: string }
  }>('/api/ai/tasks/:taskId/approve', async (req, reply) => {
    const { taskId } = req.params

    try {
      await coordinator.getDeveloper().approveTask(taskId)

      return {
        success: true,
        message: 'Task approved and code applied'
      }
    } catch (error) {
      return reply.code(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Approval failed'
      })
    }
  })

  /**
   * POST /api/ai/tasks/:taskId/reject
   * 拒绝任务
   */
  app.post<{
    Params: { taskId: string }
    Body: { reason?: string }
  }>('/api/ai/tasks/:taskId/reject', async (req, reply) => {
    const { taskId } = req.params
    const { reason } = req.body

    try {
      await coordinator.getDeveloper().rejectTask(taskId, reason)

      return {
        success: true,
        message: 'Task rejected'
      }
    } catch (error) {
      return reply.code(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Rejection failed'
      })
    }
  })
}
