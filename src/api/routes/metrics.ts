/**
 * Token 使用统计 API 端点（Fastify 版本）
 */

import { FastifyInstance } from 'fastify'
import { getGlobalTokenTracker } from '../../monitoring/token-tracker.js'

/**
 * 注册 Token 统计 API 路由
 */
export function registerMetricsRoutes(app: FastifyInstance): void {
  /**
   * GET /api/metrics/tokens
   * 获取今天的总体 token 使用统计
   */
  app.get('/api/metrics/tokens', async () => {
    const tracker = getGlobalTokenTracker()
    const stats = tracker.getTodayStats()

    return {
      success: true,
      data: stats
    }
  })

  /**
   * GET /api/metrics/tokens/today
   * 获取今天的详细统计（别名）
   */
  app.get('/api/metrics/tokens/today', async () => {
    const tracker = getGlobalTokenTracker()
    const stats = tracker.getTodayStats()

    return {
      success: true,
      data: stats
    }
  })

  /**
   * GET /api/metrics/tokens/project/:projectId
   * 获取指定项目的 token 使用统计
   */
  app.get<{
    Params: { projectId: string }
    Querystring: { date?: string }
  }>('/api/metrics/tokens/project/:projectId', async (req, reply) => {
    const { projectId } = req.params
    const { date } = req.query

    const tracker = getGlobalTokenTracker()
    const stats = tracker.getProjectStats(projectId, date)

    if (!stats) {
      return reply.code(404).send({
        success: false,
        error: `No token usage found for project: ${projectId}`
      })
    }

    return {
      success: true,
      data: stats
    }
  })

  /**
   * GET /api/metrics/tokens/range?start=YYYY-MM-DD&end=YYYY-MM-DD
   * 获取日期范围的统计
   */
  app.get<{
    Querystring: { start: string; end: string }
  }>('/api/metrics/tokens/range', async (req, reply) => {
    const { start, end } = req.query

    if (!start || !end) {
      return reply.code(400).send({
        success: false,
        error: 'Missing required query parameters: start, end'
      })
    }

    const tracker = getGlobalTokenTracker()
    const stats = tracker.getStatsForRange(start, end)

    return {
      success: true,
      data: stats
    }
  })

  /**
   * GET /api/metrics/tokens/date/:date
   * 获取指定日期的统计
   */
  app.get<{
    Params: { date: string }
  }>('/api/metrics/tokens/date/:date', async (req) => {
    const { date } = req.params

    const tracker = getGlobalTokenTracker()
    const stats = tracker.getStatsForDate(date)

    return {
      success: true,
      data: stats
    }
  })

  /**
   * GET /api/metrics/tokens/records
   * 获取所有原始记录（调试用）
   */
  app.get<{
    Querystring: { limit?: string }
  }>('/api/metrics/tokens/records', async (req) => {
    const { limit = '100' } = req.query

    const tracker = getGlobalTokenTracker()
    const allRecords = tracker.getAllRecords()

    // 限制返回数量
    const limitNum = parseInt(limit, 10)
    const records = allRecords.slice(-limitNum)

    return {
      success: true,
      data: {
        total: allRecords.length,
        returned: records.length,
        records
      }
    }
  })

  /**
   * POST /api/metrics/tokens/record
   * 手动记录一次 token 使用（测试用）
   */
  app.post<{
    Body: {
      projectId: string
      operation: string
      inputTokens: number
      outputTokens: number
      model?: string
    }
  }>('/api/metrics/tokens/record', async (req, reply) => {
    const { projectId, operation, inputTokens, outputTokens, model } = req.body

    if (!projectId || !operation || inputTokens === undefined || outputTokens === undefined) {
      return reply.code(400).send({
        success: false,
        error: 'Missing required fields: projectId, operation, inputTokens, outputTokens'
      })
    }

    const tracker = getGlobalTokenTracker()
    await tracker.recordUsage({
      projectId,
      operation,
      inputTokens,
      outputTokens,
      model: model || 'claude-sonnet-4.5'
    })

    return {
      success: true,
      message: 'Token usage recorded'
    }
  })
}
