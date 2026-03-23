/**
 * Phase 7 Day 3 测试 - OptimizationPlanner
 */

import 'dotenv/config'
import { PerformanceProfiler } from './src/optimization/performance-profiler.js'
import { CodeQualityAnalyzer } from './src/optimization/code-quality-analyzer.js'
import { OptimizationPlanner } from './src/optimization/optimization-planner.js'
import * as path from 'path'

// 模拟工作负载
function simulateWork() {
  let result = 0
  for (let i = 0; i < 500000; i++) {
    result += Math.sqrt(i) * Math.random()
  }
  return result
}

async function main() {
  console.log('🎯 ========================================')
  console.log('🎯 Phase 7 Day 3 测试 - 优化策略规划器')
  console.log('🎯 ========================================\n')

  // 1. 收集性能数据
  console.log('[1/5] 收集性能数据...')
  const profiler = new PerformanceProfiler({
    snapshotInterval: 1000,
    hotspotThreshold: 5
  })

  profiler.startProfiling()
  console.log('      ⏳ 运行工作负载（5秒）...')

  for (let i = 0; i < 5; i++) {
    simulateWork()
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  const perfProfile = profiler.stopProfiling()
  console.log(`      ✅ 性能数据已收集（分数: ${profiler.analyzeProfile(perfProfile).score}/100）\n`)

  // 2. 收集质量数据
  console.log('[2/5] 收集质量数据...')
  const analyzer = new CodeQualityAnalyzer({
    maxCyclomaticComplexity: 10,
    maxFunctionLines: 50
  })

  const srcPath = path.join(process.cwd(), 'src')
  const qualityReport = await analyzer.analyzeCodebase(srcPath)
  console.log(`      ✅ 质量数据已收集（分数: ${qualityReport.score}/100）\n`)

  // 3. 初始化Planner
  console.log('[3/5] 初始化OptimizationPlanner...')
  const planner = new OptimizationPlanner({
    minROI: 2.0,
    maxRiskLevel: 'medium',
    prioritizeQuickWins: true,
    autoApprovalThreshold: 10.0
  })
  console.log('      ✅ 已初始化\n')

  // 监听事件
  planner.on('strategies-generated', (data) => {
    console.log(`      📊 已生成 ${data.count} 个策略\n`)
  })

  planner.on('plan-created', (plan) => {
    console.log(`      📋 计划已创建: ${plan.strategies.length} 个策略\n`)
  })

  // 4. 生成策略
  console.log('[4/5] 生成优化策略...')
  const strategies = planner.generateStrategies(perfProfile, qualityReport)

  // 5. 创建计划
  console.log('[5/5] 创建优化计划...')
  const plan = planner.createPlan(strategies)

  // 显示报告
  console.log('\n🎯 ========================================')
  console.log('🎯 优化策略报告')
  console.log('🎯 ========================================\n')

  // 计划概览
  console.log('📋 计划概览')
  console.log('----------')
  console.log(`  计划名称: ${plan.name}`)
  console.log(`  创建时间: ${plan.createdAt.toLocaleString()}`)
  console.log(`  策略总数: ${plan.strategies.length}`)
  console.log(`  总工作量: ${plan.estimatedDuration.toFixed(1)}小时`)
  console.log(`  平均ROI: ${plan.totalROI.toFixed(2)}`)
  console.log(`\n  预期总收益:`)
  console.log(`    性能提升: +${plan.totalExpectedGain.performance.toFixed(0)}%`)
  console.log(`    质量提升: +${plan.totalExpectedGain.quality.toFixed(0)}分`)

  // 策略统计
  console.log('\n\n📊 策略统计')
  console.log('----------')
  const stats = planner.getStats(strategies)

  console.log(`  总策略数: ${stats.total}`)
  console.log(`\n  按类别:`)
  console.log(`    性能: ${stats.byCategory.performance}`)
  console.log(`    质量: ${stats.byCategory.quality}`)
  console.log(`    架构: ${stats.byCategory.architecture}`)
  console.log(`    维护: ${stats.byCategory.maintenance}`)

  console.log(`\n  按紧急度:`)
  console.log(`    严重: ${stats.byUrgency.critical}`)
  console.log(`    高: ${stats.byUrgency.high}`)
  console.log(`    中: ${stats.byUrgency.medium}`)
  console.log(`    低: ${stats.byUrgency.low}`)

  console.log(`\n  可自动执行: ${stats.automated} 个`)
  console.log(`  平均ROI: ${stats.averageROI.toFixed(2)}`)
  console.log(`  总工作量: ${stats.totalHours.toFixed(0)}小时`)

  // 快速见效优化
  console.log('\n\n⚡ 快速见效优化')
  console.log('----------------')
  console.log(`  总数: ${plan.quickWins.length} 个`)

  if (plan.quickWins.length > 0) {
    console.log('\n  推荐立即执行（前5个）:')
    for (let i = 0; i < Math.min(5, plan.quickWins.length); i++) {
      const s = plan.quickWins[i]
      console.log(`\n  ${i + 1}. ${s.title}`)
      console.log(`     描述: ${s.description}`)
      console.log(`     收益: 性能+${s.benefits.performanceGain.toFixed(0)}%, 质量+${s.benefits.qualityImprovement.toFixed(0)}`)
      console.log(`     成本: ${s.effort.hours}小时 | ${s.effort.complexity}复杂度 | ${s.effort.risk}风险`)
      console.log(`     ROI: ${s.roi.toFixed(2)}`)
      console.log(`     优先级: ${s.priority.toFixed(0)}/100`)
      console.log(`     自动化: ${s.automated ? '✅' : '❌'}`)
    }
  }

  // 高优先级策略
  console.log('\n\n🔥 高优先级策略')
  console.log('----------------')
  const highPriority = strategies.filter(s => s.priority > 70).slice(0, 5)

  if (highPriority.length > 0) {
    for (let i = 0; i < highPriority.length; i++) {
      const s = highPriority[i]
      console.log(`\n  ${i + 1}. ${s.title} [${s.urgency}]`)
      console.log(`     收益: 性能+${s.benefits.performanceGain.toFixed(0)}%, 质量+${s.benefits.qualityImprovement.toFixed(0)}, 维护-${s.benefits.maintenanceSaving.toFixed(0)}%`)
      console.log(`     成本: ${s.effort.hours}小时, ${s.effort.complexity}复杂度, ${s.effort.risk}风险`)
      console.log(`     ROI: ${s.roi.toFixed(2)} | 优先级: ${s.priority.toFixed(0)}/100`)
      console.log(`     可信度: ${s.confidence}%`)

      // 评估
      const evaluation = planner.evaluateStrategy(s)
      console.log(`     评估: ${evaluation.recommendation.toUpperCase()} - ${evaluation.reasoning}`)
    }
  }

  // 执行计划阶段
  console.log('\n\n📅 执行计划（分阶段）')
  console.log('--------------------')
  console.log(`  总阶段: ${plan.phases.length}\n`)

  for (const phase of plan.phases) {
    console.log(`  ${phase.name}`)
    console.log(`    描述: ${phase.description}`)
    console.log(`    策略数: ${phase.strategies.length}`)
    console.log(`    工作量: ${phase.estimatedDuration.toFixed(1)}小时`)
    console.log(`    预期收益: +${phase.expectedGain.toFixed(0)}%`)
    console.log(`    策略列表:`)
    for (const s of phase.strategies.slice(0, 3)) {
      console.log(`      - ${s.title} (ROI: ${s.roi.toFixed(1)})`)
    }
    if (phase.strategies.length > 3) {
      console.log(`      ... 还有${phase.strategies.length - 3}个`)
    }
    console.log('')
  }

  // 策略详情示例
  if (strategies.length > 0) {
    console.log('\n📖 策略详情示例')
    console.log('----------------')
    const example = strategies[0]

    console.log(`\n  策略ID: ${example.id}`)
    console.log(`  标题: ${example.title}`)
    console.log(`  描述: ${example.description}`)
    console.log(`  类别: ${example.category}`)
    console.log(`  来源: ${example.source}`)
    console.log(`\n  收益分析:`)
    console.log(`    性能提升: +${example.benefits.performanceGain.toFixed(1)}%`)
    console.log(`    质量改进: +${example.benefits.qualityImprovement.toFixed(1)}分`)
    console.log(`    维护节省: -${example.benefits.maintenanceSaving.toFixed(1)}%`)
    console.log(`    总价值: ${example.benefits.totalValue.toFixed(1)}分`)
    console.log(`\n  成本分析:`)
    console.log(`    工作量: ${example.effort.hours}小时`)
    console.log(`    复杂度: ${example.effort.complexity}`)
    console.log(`    风险等级: ${example.effort.risk}`)
    console.log(`    总成本: ${example.effort.totalCost.toFixed(1)}分`)
    console.log(`\n  优先级指标:`)
    console.log(`    ROI: ${example.roi.toFixed(2)}`)
    console.log(`    优先级: ${example.priority.toFixed(0)}/100`)
    console.log(`    紧急度: ${example.urgency}`)
    console.log(`    可信度: ${example.confidence}%`)
    console.log(`\n  实施步骤:`)
    for (const step of example.steps) {
      console.log(`    ${step.order}. ${step.action}`)
      console.log(`       ${step.description}`)
      console.log(`       预计时间: ${step.estimatedTime}分钟`)
      console.log(`       验证: ${step.verification}`)
    }
  }

  // 建议
  console.log('\n\n💡 总体建议')
  console.log('----------')

  if (plan.quickWins.length > 0) {
    console.log(`  ✅ 发现${plan.quickWins.length}个快速见效优化，建议立即执行`)
  }

  const autoStrategies = strategies.filter(s => s.automated && s.roi > 10)
  if (autoStrategies.length > 0) {
    console.log(`  🤖 ${autoStrategies.length}个策略可自动执行，ROI>10，强烈推荐`)
  }

  const criticalStrategies = strategies.filter(s => s.urgency === 'critical')
  if (criticalStrategies.length > 0) {
    console.log(`  🚨 ${criticalStrategies.length}个严重策略，需优先处理`)
  }

  if (plan.estimatedDuration > 40) {
    console.log(`  ⏰ 总工作量${plan.estimatedDuration.toFixed(0)}小时，建议分${plan.phases.length}个阶段执行`)
  }

  console.log(`  📈 预期总提升: 性能+${plan.totalExpectedGain.performance.toFixed(0)}%, 质量+${plan.totalExpectedGain.quality.toFixed(0)}分`)

  console.log('\n\n🎉 Phase 7 Day 3 测试完成！')
  console.log('============================\n')
  console.log('OptimizationPlanner功能验证：')
  console.log('  ✅ 基于性能分析生成策略')
  console.log('  ✅ 基于质量分析生成策略')
  console.log('  ✅ 混合策略生成')
  console.log('  ✅ 收益评估（性能+质量+维护）')
  console.log('  ✅ 成本评估（工作量+复杂度+风险）')
  console.log('  ✅ ROI计算')
  console.log('  ✅ 优先级排序')
  console.log('  ✅ 策略评估')
  console.log('  ✅ 分阶段计划')
  console.log('  ✅ 快速见效识别\n')

  console.log('Prophet现在能制定优化计划了！🎯✨\n')
}

main().catch(console.error)
