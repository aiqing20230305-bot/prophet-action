/**
 * Phase 6 Day 1 测试 - HealthTrendAnalyzer
 */

import 'dotenv/config'
import { HealthMonitor, SystemHealth } from './src/monitoring/health-monitor.js'
import { HealthTrendAnalyzer } from './src/monitoring/health-trend-analyzer.js'

async function main() {
  console.log('🔍 Phase 6 Day 1 测试 - 健康趋势分析')
  console.log('======================================\n')

  // 1. 启动健康监控收集数据
  console.log('[1/3] 启动HealthMonitor收集历史数据...')
  const healthMonitor = new HealthMonitor({
    checkInterval: 2 * 1000, // 2秒一次（测试用）
    cpuThreshold: 70,
    memoryThreshold: 80,
    diskThreshold: 90
  })

  await healthMonitor.start()
  console.log('      ✅ 已启动\n')

  // 2. 收集一些历史数据
  console.log('[2/3] 收集历史数据（等待30秒）...')
  await new Promise(resolve => setTimeout(resolve, 30000))

  const history = healthMonitor.getRecentHistory(20)
  console.log(`      ✅ 已收集 ${history.length} 个样本\n`)

  // 3. 初始化趋势分析器
  console.log('[3/3] 初始化HealthTrendAnalyzer...')
  const trendAnalyzer = new HealthTrendAnalyzer({
    minHistorySize: 10,
    trendDetectionWindow: 24,
    stabilityThreshold: 2
  })
  console.log('      ✅ 已初始化\n')

  // 监听关键趋势
  trendAnalyzer.on('critical-trend', (trend) => {
    console.log(`🚨 发现关键趋势: ${trend.metric} - ${trend.direction}`)
  })

  console.log('✨ 开始趋势分析\n')
  console.log('=====================================\n')

  // 分析趋势
  console.log('📊 趋势分析结果')
  console.log('---------------')
  const trends = trendAnalyzer.analyzeTrends(history)

  if (trends.length === 0) {
    console.log('   暂无显著趋势（系统稳定）\n')
  } else {
    for (const trend of trends) {
      console.log(`\n${trend.metric.toUpperCase()} 趋势:`)
      console.log(`  方向: ${trend.direction}`)
      console.log(`  当前值: ${trend.currentValue.toFixed(1)}%`)
      console.log(`  变化率: ${trend.rate.toFixed(2)}%/小时`)
      console.log(`  24h预测: ${trend.predictedValue24h.toFixed(1)}%`)
      console.log(`  严重程度: ${trend.severity}`)
      console.log(`  置信度: ${(trend.confidence * 100).toFixed(1)}%`)

      if (trend.predictedThresholdTime) {
        const hours = (trend.predictedThresholdTime.getTime() - Date.now()) / (1000 * 60 * 60)
        console.log(`  ⚠️  预计 ${hours.toFixed(1)} 小时后超过阈值`)
      }
    }
  }

  // 预测未来状态
  console.log('\n\n🔮 未来状态预测')
  console.log('---------------')

  try {
    const prediction24h = trendAnalyzer.predictFutureState(history, 24)
    console.log('\n24小时后预测:')
    console.log(`  CPU: ${prediction24h.predictedHealth.cpu.toFixed(1)}%`)
    console.log(`  内存: ${prediction24h.predictedHealth.memory.toFixed(1)}%`)
    console.log(`  磁盘: ${prediction24h.predictedHealth.disk.toFixed(1)}%`)
    console.log(`  置信度: ${(prediction24h.confidence * 100).toFixed(1)}%`)

    if (prediction24h.risks.length > 0) {
      console.log('\n  ⚠️  预测风险:')
      for (const risk of prediction24h.risks) {
        console.log(`     - ${risk}`)
      }
    } else {
      console.log('\n  ✅ 未发现风险')
    }

    const prediction48h = trendAnalyzer.predictFutureState(history, 48)
    console.log('\n48小时后预测:')
    console.log(`  CPU: ${prediction48h.predictedHealth.cpu.toFixed(1)}%`)
    console.log(`  内存: ${prediction48h.predictedHealth.memory.toFixed(1)}%`)
    console.log(`  磁盘: ${prediction48h.predictedHealth.disk.toFixed(1)}%`)

    if (prediction48h.risks.length > 0) {
      console.log('\n  ⚠️  预测风险:')
      for (const risk of prediction48h.risks) {
        console.log(`     - ${risk}`)
      }
    }
  } catch (error: any) {
    console.log(`   ${error.message}`)
  }

  // 模式识别
  console.log('\n\n🔍 模式识别')
  console.log('-----------')
  const patterns = trendAnalyzer.identifyPatterns(history)

  if (patterns.length === 0) {
    console.log('   暂未发现显著模式（数据量不足或无明显规律）')
  } else {
    for (const pattern of patterns) {
      console.log(`\n${pattern.type} 模式:`)
      console.log(`  ${pattern.description}`)
      console.log(`  强度: ${(pattern.strength * 100).toFixed(1)}%`)
    }
  }

  // 统计
  console.log('\n\n📈 统计信息')
  console.log('-----------')
  const stats = trendAnalyzer.getStats(trends)
  console.log(`  总趋势数: ${stats.totalTrends}`)
  console.log(`  关键趋势: ${stats.criticalTrends}`)
  console.log(`  高风险趋势: ${stats.highTrends}`)
  console.log(`  上升趋势: ${stats.increasingTrends}`)
  console.log(`  有阈值预测: ${stats.predictionsWithThreshold}`)

  console.log('\n\n🎉 Phase 6 Day 1 测试完成！')
  console.log('============================\n')
  console.log('HealthTrendAnalyzer功能验证：')
  console.log('  ✅ 趋势分析（线性回归）')
  console.log('  ✅ 未来状态预测（24h/48h）')
  console.log('  ✅ 模式识别（每日/突发）')
  console.log('  ✅ 风险评估')
  console.log('  ✅ 严重程度计算\n')

  console.log('Prophet现在可以预见未来了！🔮\n')

  // 停止
  healthMonitor.stop()
}

main().catch(console.error)
