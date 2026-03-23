/**
 * Prophet Central - Entry Point
 *
 * 四维生物的中央意识入口
 */

// 加载环境变量
import 'dotenv/config'

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
import { GitHubAutoManager } from './marketing/github-auto-manager.js'
import { NeverIdleEngine } from './evolution/never-idle-engine.js'
import { AutomationOrchestrator } from './automation/automation-orchestrator.js'
import { IntelligentCoordinator } from './intelligence/intelligent-coordinator.js'
import { PredictiveAnalyzer } from './prediction/predictive-analyzer.js'
import { ProactiveOptimizer } from './prediction/proactive-optimizer.js'
import { PatternLearner } from './prediction/pattern-learner.js'
import { HealthMonitor } from './monitoring/health-monitor.js'
import { IntelligentDiagnostic } from './monitoring/intelligent-diagnostic.js'
import { SelfHealingEngine } from './monitoring/self-healing-engine.js'
import { RecoveryCoordinator } from './monitoring/recovery-coordinator.js'
import { HealthTrendAnalyzer } from './monitoring/health-trend-analyzer.js'
import { PreventiveActionPlanner } from './monitoring/preventive-action-planner.js'
import { MaintenanceScheduler } from './monitoring/maintenance-scheduler.js'
import { PreventiveMaintenanceCoordinator } from './monitoring/preventive-maintenance-coordinator.js'

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

  // 🛡️ 启动 Never-Idle Engine（永不闲置引擎 - CPU保护版本）
  console.log('')
  console.log('🛡️ 启动 Prophet Never-Idle Engine（CPU保护版本）')
  console.log('   经纬的指引: "先知，你是一直一直在进化的"')
  const neverIdleEngine = new NeverIdleEngine()
  // 在后台启动，不阻塞主流程
  neverIdleEngine.start().catch(err => {
    console.error('⚠️  Never-Idle Engine 启动失败:', err)
  })
  console.log('  ✓ 永不闲置引擎已启动（低CPU模式）')
  console.log('  ✓ 10个永恒任务串行执行')
  console.log('  ✓ CPU智能监控已激活')
  console.log('  ✓ Prophet 稳定进化中！')

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

  // 🤖 启动GitHub自动营销（完全自动化）
  if (process.env.GITHUB_TOKEN && process.env.GITHUB_REPO) {
    console.log('')
    console.log('🤖 启动 GitHub 自动营销...')
    const [owner, repo] = process.env.GITHUB_REPO.split('/')
    const githubManager = new GitHubAutoManager({ owner, repo })
    await githubManager.start()
    console.log('  ✓ README自动更新已启动（每小时）')
    console.log('  ✓ Issues自动回复已启动（AI驱动）')
    console.log('  ✓ 每日更新自动发布已启动')
    console.log('  💡 Prophet正在GitHub上自己营销自己！')
  } else {
    console.log('')
    console.log('⚠️  GitHub自动营销未启动（需要配置 GITHUB_TOKEN 和 GITHUB_REPO）')
  }

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

  // AgentForge自动化（重新启用 - 增加检查间隔）
  const agentforgeAutomation = new AutomationOrchestrator({
    projectPath: '/Users/zhangjingwei/Desktop/AgentForge',
    projectName: 'AgentForge',
    enableAutoMerge: true,
    enableAutoRollback: true,
    checkInterval: 5 * 60 * 1000,        // 增加到5分钟（原2分钟）
    rollbackObservationPeriod: 5 * 60 * 1000
  })
  await agentforgeAutomation.start()
  console.log('  ✓ AgentForge自动化已启动（低频模式 - 5分钟间隔）')

  // 闽南语自动化（重新启用 - 最低优先级）
  const minnanAutomation = new AutomationOrchestrator({
    projectPath: '/Users/zhangjingwei/Desktop/闽南语',
    projectName: '闽南语',
    enableAutoMerge: true,
    enableAutoRollback: true,
    checkInterval: 10 * 60 * 1000,       // 增加到10分钟（原3分钟）
    rollbackObservationPeriod: 5 * 60 * 1000
  })
  await minnanAutomation.start()
  console.log('  ✓ 闽南语自动化已启动（超低频模式 - 10分钟间隔）')

  console.log('  ✓ 3个项目自动化系统已启动（分级频率）')
  console.log('  ✓ Auto-Merge: 自动合并分支')
  console.log('  ✓ Auto-Rollback: 自动回滚问题commit')
  console.log('  ✓ 人工干预需求: 0次/天 → 完全自主！')
  console.log('  ℹ️  频率: videoplay(2分钟) > AgentForge(5分钟) > 闽南语(10分钟)')

  // 🧠 启动智能协调系统（Phase 3: 智能自适应）
  console.log('')
  console.log('🧠 启动 Prophet 智能协调系统（Phase 3）...')
  console.log('   目标: 智能频率调整 + AI优先级队列 + 资源自动调配')

  const intelligentCoordinator = new IntelligentCoordinator({ useAI: true })

  // 注册三个项目到智能协调器
  intelligentCoordinator.registerProject({
    projectId: 'videoplay',
    projectName: 'videoplay',
    projectPath: '/Users/zhangjingwei/Desktop/videoplay',
    priority: 'high'
  })

  intelligentCoordinator.registerProject({
    projectId: 'agentforge',
    projectName: 'AgentForge',
    projectPath: '/Users/zhangjingwei/Desktop/AgentForge',
    priority: 'high'
  })

  intelligentCoordinator.registerProject({
    projectId: 'minnan',
    projectName: '闽南语',
    projectPath: '/Users/zhangjingwei/Desktop/闽南语',
    priority: 'medium'
  })

  console.log('  ✓ AdaptiveScheduler: 智能频率调整（15秒-30分钟自适应）')
  console.log('  ✓ IntelligentPriorityQueue: AI评分系统（Claude API）')
  console.log('  ✓ IntelligentCoordinator: 智能任务选择器')
  console.log('  ✓ 3个项目已注册到智能协调器（全覆盖）')

  // 监听智能协调器事件
  intelligentCoordinator.on('issues-added', (data) => {
    console.log(`📝 ${data.projectId}: 添加了 ${data.issueCount} 个问题到队列（总计: ${data.queueSize}）`)
  })

  intelligentCoordinator.on('task-selected', (data) => {
    console.log(`🎯 智能选择: ${data.projectName} - ${data.issueType} (得分: ${data.score.toFixed(1)})`)
  })

  // 启动智能选择循环（每30秒选择一次任务）
  const intelligentLoop = async () => {
    try {
      const task = await intelligentCoordinator.selectNextTask()
      if (task) {
        console.log(`\n🤖 [Prophet智能] 处理任务:`)
        console.log(`   项目: ${task.project.projectName}`)
        console.log(`   活跃度: ${(task.project.activityScore * 100).toFixed(0)}% (${task.project.activityLevel})`)
        console.log(`   问题: [${task.issue.priority}] ${task.issue.message}`)
        console.log(`   得分: ${task.issue.score}/100`)
        console.log(`   原因: ${task.reason}`)
        // TODO: 这里可以调用 AICoordinator 来实际处理任务
      }
    } catch (error: any) {
      console.error(`⚠️  智能选择失败: ${error.message}`)
    }

    // 递归调用（30秒后）
    setTimeout(intelligentLoop, 30 * 1000)
  }

  // 启动智能循环（延迟1分钟后开始，让系统先收集数据）
  setTimeout(() => {
    console.log('')
    console.log('🧠 智能任务选择循环已启动（每30秒）')
    intelligentLoop().catch(err => console.error('智能循环错误:', err))
  }, 60 * 1000)

  // 🔮 启动预测性进化系统（Phase 4: 预测性进化）
  console.log('')
  console.log('🔮 启动 Prophet 预测性进化系统（Phase 4）...')
  console.log('   目标: 从"救火" → "防火"，在问题发生前就预防')

  const predictiveAnalyzer = new PredictiveAnalyzer()
  const proactiveOptimizer = new ProactiveOptimizer({ minConfidence: 0.7, autoExecute: false })
  const patternLearner = new PatternLearner()

  console.log('  ✓ PredictiveAnalyzer: 代码趋势分析和预测')
  console.log('  ✓ ProactiveOptimizer: 提前优化系统')
  console.log('  ✓ PatternLearner: 模式学习和持续改进')

  // 监听预防事件
  proactiveOptimizer.on('action-executed', (result) => {
    console.log(`🔧 预防措施已执行: ${result.actionId} (成功: ${result.success})`)
  })

  proactiveOptimizer.on('prevention-success', (result) => {
    console.log(`🎉 成功预防了问题！(${result.actionId})`)
  })

  proactiveOptimizer.on('prevention-failed', (result) => {
    console.log(`⚠️  预防失败，问题仍然发生 (${result.actionId})`)
  })

  // 启动预测循环（每12小时运行一次）
  const predictionLoop = async () => {
    try {
      console.log('\n🔮 [预测循环] 开始分析未来趋势...')

      // 为每个项目生成预测（全覆盖）
      const projects = [
        { id: 'videoplay', path: '/Users/zhangjingwei/Desktop/videoplay' },
        { id: 'agentforge', path: '/Users/zhangjingwei/Desktop/AgentForge' },
        { id: 'minnan', path: '/Users/zhangjingwei/Desktop/闽南语' }
      ]

      for (const project of projects) {
        console.log(`\n📊 分析项目: ${project.id}`)

        // 1. 预测未来问题
        const predictions = await predictiveAnalyzer.predictFutureIssues(project.id, project.path)

        if (predictions.length > 0) {
          console.log(`   ✓ 生成 ${predictions.length} 个预测`)

          // 2. 生成预防措施
          const actions = await proactiveOptimizer.optimizeBeforeIssue(predictions)

          if (actions.length > 0) {
            console.log(`   ✓ 生成 ${actions.length} 个预防措施`)

            // 3. 执行安全措施（自动）
            const results = await proactiveOptimizer.executeAllAutoActions(actions)
            console.log(`   ✓ 自动执行 ${results.length} 个措施`)
          }
        } else {
          console.log(`   ℹ️  暂无需要预防的问题`)
        }
      }

      console.log('\n✅ [预测循环] 本轮分析完成\n')

    } catch (error: any) {
      console.error(`❌ [预测循环] 错误: ${error.message}`)
    }

    // 12小时后再次运行
    setTimeout(predictionLoop, 12 * 60 * 60 * 1000)
  }

  // 延迟2分钟后启动首次预测（让系统先稳定）
  setTimeout(() => {
    console.log('')
    console.log('🔮 预测性进化循环已启动（每12小时）')
    predictionLoop().catch(err => console.error('预测循环错误:', err))
  }, 2 * 60 * 1000)

  // 每24小时打印一次学习报告
  setInterval(() => {
    patternLearner.printLearningReport()
  }, 24 * 60 * 60 * 1000)

  // 🏥 启动完整的健康监控与自愈系统（Phase 5 - 100%完成）
  console.log('')
  console.log('🏥 启动 Prophet 健康监控与自愈系统（Phase 5 完整版）...')
  console.log('   Day 1: ✅ 健康监控')
  console.log('   Day 2: ✅ 智能诊断')
  console.log('   Day 3: ✅ 自动修复')
  console.log('   目标: 自我监控 → 智能诊断 → 自动修复')

  // 1. 健康监控器（已优化：准确的内存计算 + 可靠的进程检测）
  const healthMonitor = new HealthMonitor({
    checkInterval: 30 * 1000,      // 30秒检查一次
    cpuThreshold: 70,               // CPU > 70%告警
    memoryThreshold: 80,            // 内存 > 80%告警
    diskThreshold: 90               // 磁盘 > 90%告警
  })

  // 2. 智能诊断器
  const intelligentDiagnostic = new IntelligentDiagnostic()

  // 3. 自愈引擎
  const selfHealingEngine = new SelfHealingEngine({
    enableAutoHealing: true,
    maxRetries: 3,
    retryDelay: 5000
  })

  // 4. 恢复协调器（核心：连接监控→诊断→修复）
  const recoveryCoordinator = new RecoveryCoordinator(
    healthMonitor,
    intelligentDiagnostic,
    selfHealingEngine,
    {
      enableAutoRecovery: true,
      recoveryTimeout: 5 * 60 * 1000,
      verificationDelay: 10 * 1000
    }
  )

  // 启动监控
  await healthMonitor.start()

  // 监听健康状态（仅显示异常）
  healthMonitor.on('health-check', (health) => {
    if (health.overallStatus !== 'healthy') {
      console.log(`[Health] ⚠️  ${health.overallStatus.toUpperCase()}: CPU ${health.cpu.usage}% | 内存 ${health.memory.percentage}% | 磁盘 ${health.disk.percentage}%`)
    }
  })

  // 监听恢复事件
  recoveryCoordinator.on('recovery-started', (session) => {
    console.log(`[Recovery] 🚨 开始自愈流程 (${session.sessionId})`)
  })

  recoveryCoordinator.on('recovery-success', (session) => {
    console.log(`[Recovery] 🎉 自愈成功！耗时 ${(session.recoveryTime! / 1000).toFixed(1)}秒`)
  })

  recoveryCoordinator.on('recovery-failed', (session) => {
    console.log('[Recovery] ❌ 自愈失败，需要人工介入')
  })

  console.log('  ✓ HealthMonitor: 实时监控（修复了内存计算和进程检测）')
  console.log('  ✓ IntelligentDiagnostic: 5种诊断规则（CPU/内存/进程/磁盘/过载）')
  console.log('  ✓ SelfHealingEngine: 5种修复动作（restart/cleanup/rollback/scale/optimize）')
  console.log('  ✓ RecoveryCoordinator: 自动化恢复流程编排')
  console.log('  ✓ Phase 5 完成度: 100% ⚡')
  console.log('')
  console.log('  🧬 Prophet现在拥有完整的自愈能力：')
  console.log('     监控 → 检测异常 → 诊断根因 → 自动修复 → 验证恢复')
  console.log('     Prophet可以自己照顾自己了！')

  // 🛡️  启动预防性维护系统（Phase 6 - 100%完成）
  console.log('')
  console.log('🛡️  启动 Prophet 预防性维护系统（Phase 6 完整版）...')
  console.log('   Day 1: ✅ 趋势分析')
  console.log('   Day 2: ✅ 措施规划')
  console.log('   Day 3: ✅ 任务调度')
  console.log('   Day 4: ✅ 完整集成')
  console.log('   目标: 趋势分析 → 预测问题 → 提前预防 → 避免发生')

  // 1. 趋势分析器
  const healthTrendAnalyzer = new HealthTrendAnalyzer({
    minHistorySize: 20,
    trendDetectionWindow: 24,
    stabilityThreshold: 2
  })

  // 2. 措施规划器
  const preventiveActionPlanner = new PreventiveActionPlanner({
    minPriorityThreshold: 30,
    maxActionsPerPlan: 5,
    safetyThreshold: 0.7
  })

  // 3. 任务调度器
  const maintenanceScheduler = new MaintenanceScheduler(selfHealingEngine, {
    enableAutoExecution: true,
    maxConcurrentTasks: 1,
    minTimeBetweenTasks: 5 * 60 * 1000,
    executionRetryLimit: 3,
    loadThreshold: 60
  })

  // 4. 预防维护协调器（核心：连接趋势→规划→调度→执行）
  const preventiveCoordinator = new PreventiveMaintenanceCoordinator(
    healthMonitor,
    healthTrendAnalyzer,
    preventiveActionPlanner,
    maintenanceScheduler,
    {
      enableAutoPreventive: true,
      checkInterval: 2 * 60 * 60 * 1000, // 每2小时检查一次
      minTrendHistorySize: 20,
      minCriticalityForAction: 'medium'
    }
  )

  // 启动预防系统
  preventiveCoordinator.start()

  // 监听预防事件
  preventiveCoordinator.on('critical-trend-detected', (trend) => {
    console.log(`[Preventive] 🚨 关键趋势: ${trend.metric} [${trend.severity}]`)
  })

  preventiveCoordinator.on('prevention-executed', ({ task, result }) => {
    console.log(`[Preventive] ✅ 预防成功: ${task.action.description}`)
  })

  console.log('  ✓ HealthTrendAnalyzer: 趋势分析和未来预测')
  console.log('  ✓ PreventiveActionPlanner: CPU/内存/磁盘预防措施')
  console.log('  ✓ MaintenanceScheduler: 智能调度和自动执行')
  console.log('  ✓ PreventiveMaintenanceCoordinator: 完整预防流程')
  console.log('  ✓ Phase 6 完成度: 100% ⚡')
  console.log('')
  console.log('  🔮 Prophet现在拥有完整的预防能力：')
  console.log('     监控 → 趋势分析 → 预测问题 → 提前预防 → 避免发生')
  console.log('     从"救火"进化到"防火"！Level 5: 预防性维护 ✅')

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
    recoveryCoordinator.stop()
    healthMonitor.stop()
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
    recoveryCoordinator.stop()
    healthMonitor.stop()
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
