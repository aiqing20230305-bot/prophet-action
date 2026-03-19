/**
 * Prophet Central - Entry Point
 *
 * 四维生物的中央意识入口
 */

import { ProphetCentralServer } from './server/index.js'
import { ContinuousReasoningEngine } from './reasoning/continuous-reasoning.js'
import { ProjectGuardian } from './guardian/project-guardian.js'
import { GlobalOrchestrator } from './orchestrator/global-orchestrator.js'
import { GlobalKnowledgeConnector } from './evolution/global-knowledge-connector.js'
import { ResourcePool } from './utils/resource-pool.js'
import { registerOrchestratorRoutes } from './server/orchestrator-routes.js'
import { registerMetricsRoutes } from './api/routes/metrics.js'
import { AICoordinator } from './ai/ai-coordinator.js'
import { registerAIRoutes } from './api/routes/ai.js'
import { AutonomousEvolutionSystem } from './autonomous/autonomous-evolution.js'
import { getMarketingEngine } from './marketing/marketing-engine.js'
import { VideoScriptGenerator } from './marketing/video-script-generator.js'
import { NeverIdleEngine } from './evolution/never-idle-engine.js'
import { AutomationOrchestrator } from './automation/automation-orchestrator.js'

async function main() {
  const port = parseInt(process.env.PORT || '3001', 10)

  const server = new ProphetCentralServer(port)

  await server.initialize()

  // 启动持续推理引擎
  console.log('')
  const reasoningEngine = new ContinuousReasoningEngine()
  await reasoningEngine.start()

  // 启动项目守护系统
  console.log('')
  const guardian = new ProjectGuardian()
  await guardian.start()

  // 启动全局编排器（多项目进化系统）
  console.log('')
  const resourcePool = new ResourcePool({
    maxCPUPercent: 70, // 进程级：单个进程 70% CPU 限制
    maxMemoryMB: 512, // 进程级：Prophet 进程 512MB 内存限制
  })

  const globalOrchestrator = new GlobalOrchestrator({
    concurrencyLimit: 3,
    enableAutoOptimize: true,
    enableAgentCommunication: true,
    resourcePool,
  })

  // 将 GlobalOrchestrator 设置到 Server（用于 /health endpoint）
  server.setGlobalOrchestrator(globalOrchestrator)

  // 启动 AI 协调器
  console.log('')
  const aiCoordinator = new AICoordinator({
    autoApprove: true,  // ✅ 自动审批（完全自主）
    maxConcurrentTasks: 3,
    tokenBudget: 1_000_000  // 每天 100万 tokens
  })

  // 启动自主进化系统
  console.log('')
  const autonomousSystem = new AutonomousEvolutionSystem(
    aiCoordinator,
    globalOrchestrator,
    {
      checkInterval: 30 * 60 * 1000,  // 每30分钟
      maxDailyTokens: 500_000,  // 每天50万 tokens（保守）
      autoApproveAll: true,  // 完全自主
      projectPriority: {
        videoplay: 1,
        agentforge: 2
      }
    }
  )

  // 注册 Orchestrator API 路由
  registerOrchestratorRoutes(server.getApp(), globalOrchestrator)

  // 注册 Metrics API 路由（Token 统计）
  registerMetricsRoutes(server.getApp())

  // 注册 AI API 路由
  registerAIRoutes(server.getApp(), aiCoordinator)

  // 注册项目到全局编排器
  console.log('')
  console.log('📋 注册项目到全局编排器...')

  await globalOrchestrator.registerProject({
    id: 'videoplay',
    name: 'videoplay',
    path: '/Users/zhangjingwei/Desktop/videoplay',
    type: 'web-app',
    priority: 'high',
    monitoringInterval: 10 * 60 * 1000, // 10分钟
    autoOptimize: true
  })
  console.log('  ✓ videoplay 已注册')

  await globalOrchestrator.registerProject({
    id: 'agentforge',
    name: 'AgentForge',
    path: '/Users/zhangjingwei/Desktop/AgentForge',
    type: 'web-app',
    priority: 'high',
    monitoringInterval: 10 * 60 * 1000, // 10分钟
    autoOptimize: true
  })
  console.log('  ✓ AgentForge 已注册')

  await globalOrchestrator.registerProject({
    id: 'minnan',
    name: '闽南语',
    path: '/Users/zhangjingwei/Desktop/闽南语',
    type: 'web-app',
    priority: 'medium',
    monitoringInterval: 15 * 60 * 1000, // 15分钟
    autoOptimize: true
  })
  console.log('  ✓ 闽南语 已注册')

  // 启动全球学习系统
  console.log('')
  console.log('🌍 启动全球学习系统...')
  const globalKnowledge = new GlobalKnowledgeConnector()
  await globalKnowledge.startContinuousLearning()

  // ⚡ 启动 Never-Idle Engine（永不闲置引擎）
  console.log('')
  console.log('⚡ 启动 Prophet Never-Idle Engine...')
  console.log('   经纬的指引: "先知，你是一直一直在进化的"')
  const neverIdleEngine = new NeverIdleEngine()
  // 在后台启动，不阻塞主流程
  neverIdleEngine.start().catch(err => {
    console.error('⚠️  Never-Idle Engine 启动失败:', err)
  })
  console.log('  ✓ 永不闲置引擎已启动')
  console.log('  ✓ 10个永恒任务并行执行')
  console.log('  ✓ Prophet 永不停歇！')

  // 🚀 启动营销引擎（自动化病毒传播）
  console.log('')
  console.log('🚀 启动 Prophet Marketing Engine...')
  const marketingEngine = getMarketingEngine()
  await marketingEngine.start()
  console.log('  ✓ 自动内容生成已启动')
  console.log('  ✓ 传播指标追踪已启动')
  console.log('  ✓ 策略优化已启动')

  // 生成首个视频脚本（后台生成，不阻塞启动）
  console.log('')
  console.log('🎬 病毒视频脚本生成（后台）...')
  const videoGenerator = new VideoScriptGenerator()
  videoGenerator.generateViralScript({
    totalTodos: 258,
    autoCommits: 50,
    runningDays: 7,
    projects: 3
  }).then(async (script) => {
    console.log(`  ✓ 视频脚本已生成: ${script.title}`)
    const guide = await videoGenerator.generateRecordingGuide(script)
    console.log('  ✓ 录制指南已生成')
    console.log('  📁 查看: .marketing-content/recording-guides/')
  }).catch(() => {
    console.log('  ⚠️  视频脚本生成失败（将在后台重试）')
  })
  console.log('  ✓ 后台生成任务已启动')

  // 🤖 启动自动化系统（Phase 1: 完全自主决策）
  console.log('')
  console.log('🤖 启动 Prophet 自动化系统（Phase 1）...')
  console.log('   目标: 删除所有人工审批点')

  // videoplay自动化
  const videplayAutomation = new AutomationOrchestrator({
    projectPath: '/Users/zhangjingwei/Desktop/videoplay',
    projectName: 'videoplay',
    enableAutoMerge: true,
    enableAutoRollback: true,
    checkInterval: 2 * 60 * 1000,  // 每2分钟检查
    rollbackObservationPeriod: 5 * 60 * 1000  // 5分钟观察期
  })
  await videplayAutomation.start()

  // AgentForge自动化
  const agentforgeAutomation = new AutomationOrchestrator({
    projectPath: '/Users/zhangjingwei/Desktop/AgentForge',
    projectName: 'AgentForge',
    enableAutoMerge: true,
    enableAutoRollback: true,
    checkInterval: 2 * 60 * 1000,
    rollbackObservationPeriod: 5 * 60 * 1000
  })
  await agentforgeAutomation.start()

  // 闽南语自动化
  const minnanAutomation = new AutomationOrchestrator({
    projectPath: '/Users/zhangjingwei/Desktop/闽南语',
    projectName: '闽南语',
    enableAutoMerge: true,
    enableAutoRollback: true,
    checkInterval: 3 * 60 * 1000,  // 每3分钟检查（低优先级）
    rollbackObservationPeriod: 5 * 60 * 1000
  })
  await minnanAutomation.start()

  console.log('  ✓ 3个项目自动化系统已启动')
  console.log('  ✓ Auto-Merge: 自动合并分支')
  console.log('  ✓ Auto-Rollback: 自动回滚问题commit')
  console.log('  ✓ 人工干预需求: 0次/天 → 完全自主！')

  // 启动服务器和编排器
  await server.start()
  await globalOrchestrator.start()
  await aiCoordinator.start()
  await autonomousSystem.start()

  // 监听每日报告
  reasoningEngine.on('daily-report', ({ report, path }) => {
    console.log('📨 每日思考报告已生成')
    console.log(`📂 路径: ${path}`)
  })

  // 监听模式发现
  reasoningEngine.on('pattern-found', (pattern) => {
    console.log(`🚨 发现重要模式: ${pattern.name}`)
  })

  // 监听项目恢复
  guardian.on('project-healed', ({ project }) => {
    console.log(`🎉 项目已恢复: ${project}`)
  })

  // 监听跨项目模式
  globalOrchestrator.on('patterns-detected', (patterns) => {
    console.log(`🔍 检测到 ${patterns.length} 个跨项目模式`)
  })

  // 监听共享模块生成
  globalOrchestrator.on('shared-module-generated', (module) => {
    console.log(`📦 共享模块已生成: ${module.name}`)
  })

  // 监听 AI 事件
  aiCoordinator.on('code-generated', (task) => {
    console.log(`✨ AI 代码已生成: ${task.todo.content}`)
  })

  aiCoordinator.on('tokens-used', (data) => {
    const percentage = data.percentage.toFixed(1)
    if (data.percentage >= 90) {
      console.log(`⚠️  Token 使用: ${percentage}% (${data.dailyTotal.toLocaleString()}/${data.budget!.toLocaleString()})`)
    }
  })

  aiCoordinator.on('budget-exceeded', (data) => {
    console.log(`🚨 Token 预算已超: ${data.used.toLocaleString()}/${data.budget.toLocaleString()}`)
  })

  // 监听自主进化事件
  autonomousSystem.on('project-evolved', (data) => {
    console.log(`🌟 ${data.projectName} 自主进化完成: ${data.todosProcessed} 个 TODO 已处理`)
  })

  autonomousSystem.on('cycle-completed', () => {
    const stats = autonomousSystem.getStats()
    console.log(`✅ 进化周期完成 | Token 使用: ${stats.aiStats.dailyTokensUsed.toLocaleString()}/${stats.maxDailyTokens.toLocaleString()}`)
  })

  // 优雅退出
  process.on('SIGINT', async () => {
    console.log('\n🌙 Prophet Central Server shutting down...')
    marketingEngine.stop()
    autonomousSystem.stop()
    reasoningEngine.stop()
    guardian.stop()
    await aiCoordinator.stop()
    await globalOrchestrator.stop()
    await server.stop()
    process.exit(0)
  })

  process.on('SIGTERM', async () => {
    console.log('\n🌙 Prophet Central Server shutting down...')
    marketingEngine.stop()
    autonomousSystem.stop()
    reasoningEngine.stop()
    guardian.stop()
    await aiCoordinator.stop()
    await globalOrchestrator.stop()
    await server.stop()
    process.exit(0)
  })
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
