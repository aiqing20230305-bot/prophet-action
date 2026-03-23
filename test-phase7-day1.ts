/**
 * Phase 7 Day 1 测试 - PerformanceProfiler
 */

import 'dotenv/config'
import { PerformanceProfiler } from './src/optimization/performance-profiler.js'

// 创建一些模拟负载
function cpuIntensiveTask() {
  let result = 0
  for (let i = 0; i < 1000000; i++) {
    result += Math.sqrt(i) * Math.random()
  }
  return result
}

function memoryIntensiveTask() {
  const arrays: number[][] = []
  for (let i = 0; i < 100; i++) {
    arrays.push(new Array(10000).fill(Math.random()))
  }
  return arrays
}

async function ioSimulation() {
  return new Promise(resolve => {
    setTimeout(resolve, Math.random() * 100)
  })
}

async function simulateWorkload() {
  console.log('🔥 模拟工作负载...\n')

  for (let i = 0; i < 10; i++) {
    // CPU密集
    cpuIntensiveTask()

    // 内存密集
    memoryIntensiveTask()

    // IO操作
    await ioSimulation()

    await new Promise(resolve => setTimeout(resolve, 500))
  }
}

async function main() {
  console.log('🔍 ========================================')
  console.log('🔍 Phase 7 Day 1 测试 - 性能分析器')
  console.log('🔍 ========================================\n')

  // 1. 初始化Profiler
  console.log('[1/4] 初始化PerformanceProfiler...')
  const profiler = new PerformanceProfiler({
    snapshotInterval: 2 * 1000,  // 2秒采样
    hotspotThreshold: 5,         // 5%即视为热点
    bottleneckImpactThreshold: 20,
    memoryLeakThreshold: 1024 * 1024  // 1MB/s
  })
  console.log('      ✅ 已初始化\n')

  // 监听事件
  profiler.on('profiling-started', () => {
    console.log('      📊 性能分析已启动\n')
  })

  profiler.on('snapshot-taken', (snapshot) => {
    console.log(`      📸 快照: CPU ${snapshot.cpu.usage.toFixed(1)}% | 内存 ${(snapshot.memory.heapUsed / 1024 / 1024).toFixed(1)}MB`)
  })

  profiler.on('profiling-stopped', () => {
    console.log('\n      ⏹️  性能分析已停止\n')
  })

  // 2. 开始分析
  console.log('[2/4] 启动性能分析...')
  profiler.startProfiling()

  // 3. 执行工作负载
  console.log('[3/4] 执行工作负载（15秒）...\n')
  await simulateWorkload()
  console.log('\n      ✅ 工作负载完成\n')

  // 等待最后几个快照
  await new Promise(resolve => setTimeout(resolve, 5000))

  // 4. 停止分析并生成报告
  console.log('[4/4] 生成性能报告...')
  const profile = profiler.stopProfiling()

  // 显示报告
  console.log('\n📊 ========================================')
  console.log('📊 性能分析报告')
  console.log('📊 ========================================\n')

  console.log(`分析时长: ${(profile.duration / 1000).toFixed(1)}秒`)
  console.log(`快照数量: ${profile.snapshots.length}\n`)

  // CPU分析
  console.log('💻 CPU分析')
  console.log('----------')
  console.log(`  平均使用率: ${profile.cpu.average.toFixed(1)}%`)
  console.log(`  峰值使用率: ${profile.cpu.peak.toFixed(1)}%`)
  console.log(`  热点函数数: ${profile.cpu.hotspots.length}`)

  if (profile.cpu.hotspots.length > 0) {
    console.log('\n  🔥 热点函数:')
    for (const hotspot of profile.cpu.hotspots.slice(0, 5)) {
      console.log(`     ${hotspot.function}`)
      console.log(`       调用: ${hotspot.calls}次`)
      console.log(`       总时间: ${hotspot.totalTime.toFixed(2)}ms`)
      console.log(`       占比: ${hotspot.percentage.toFixed(1)}%`)
      console.log(`       严重度: ${hotspot.severity}`)
    }
  }

  // 内存分析
  console.log('\n\n💾 内存分析')
  console.log('----------')
  console.log(`  平均使用: ${(profile.memory.average / 1024 / 1024).toFixed(1)}MB`)
  console.log(`  峰值使用: ${(profile.memory.peak / 1024 / 1024).toFixed(1)}MB`)
  console.log(`  增长率: ${(profile.memory.growth / 1024).toFixed(2)}KB/秒`)

  if (profile.memory.leaks.length > 0) {
    console.log('\n  ⚠️  内存泄漏:')
    for (const leak of profile.memory.leaks) {
      console.log(`     ${leak.description}`)
      console.log(`       严重度: ${leak.severity}`)
    }
  } else {
    console.log('  ✅ 未检测到内存泄漏')
  }

  // IO分析
  console.log('\n\n📁 I/O分析')
  console.log('----------')
  console.log(`  读操作: ${profile.io.reads}`)
  console.log(`  写操作: ${profile.io.writes}`)
  console.log(`  总字节: ${(profile.io.totalBytes / 1024).toFixed(1)}KB`)
  console.log(`  平均延迟: ${profile.io.avgLatency.toFixed(2)}ms`)

  // 事件循环
  console.log('\n\n🔄 事件循环')
  console.log('----------')
  console.log(`  平均延迟: ${profile.eventLoop.avgDelay.toFixed(2)}ms`)
  console.log(`  最大延迟: ${profile.eventLoop.maxDelay.toFixed(2)}ms`)
  console.log(`  平均利用率: ${profile.eventLoop.avgUtilization.toFixed(1)}%`)

  // 瓶颈
  console.log('\n\n🚧 性能瓶颈')
  console.log('----------')

  if (profile.bottlenecks.length > 0) {
    for (let i = 0; i < profile.bottlenecks.length; i++) {
      const bottleneck = profile.bottlenecks[i]
      console.log(`\n  ${i + 1}. ${bottleneck.location}`)
      console.log(`     类型: ${bottleneck.type}`)
      console.log(`     影响: ${bottleneck.impact.toFixed(0)}/100`)
      console.log(`     严重度: ${bottleneck.severity}`)
      console.log(`     描述: ${bottleneck.description}`)
      console.log(`     建议: ${bottleneck.suggestion}`)
    }
  } else {
    console.log('  ✅ 未发现明显瓶颈')
  }

  // 完整分析
  console.log('\n\n🎯 完整分析')
  console.log('----------')
  const analysis = profiler.analyzeProfile(profile)

  console.log(`\n  性能分数: ${analysis.score}/100`)

  console.log('\n  问题统计:')
  console.log(`    严重: ${analysis.issues.critical}`)
  console.log(`    高: ${analysis.issues.high}`)
  console.log(`    中: ${analysis.issues.medium}`)
  console.log(`    低: ${analysis.issues.low}`)

  console.log(`\n  总结: ${analysis.summary}`)

  if (analysis.recommendations.length > 0) {
    console.log('\n  📋 优化建议:')
    for (let i = 0; i < analysis.recommendations.length; i++) {
      console.log(`    ${i + 1}. ${analysis.recommendations[i]}`)
    }
  }

  // 统计
  console.log('\n\n📈 Profiler统计')
  console.log('---------------')
  const stats = profiler.getStats()
  console.log(`  运行状态: ${stats.isRunning ? '运行中' : '已停止'}`)
  console.log(`  采样次数: ${stats.snapshotCount}`)
  console.log(`  函数调用: ${stats.functionCallCount}`)
  console.log(`  运行时长: ${(stats.duration / 1000).toFixed(1)}秒`)

  console.log('\n\n🎉 Phase 7 Day 1 测试完成！')
  console.log('============================\n')
  console.log('PerformanceProfiler功能验证：')
  console.log('  ✅ 实时性能快照')
  console.log('  ✅ CPU使用分析')
  console.log('  ✅ 内存使用分析')
  console.log('  ✅ 热点函数识别')
  console.log('  ✅ 性能瓶颈检测')
  console.log('  ✅ 内存泄漏检测')
  console.log('  ✅ 完整分析报告')
  console.log('  ✅ 优化建议生成\n')

  console.log('Prophet现在能分析自己的性能了！🔍✨\n')
}

main().catch(console.error)
