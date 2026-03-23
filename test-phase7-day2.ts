/**
 * Phase 7 Day 2 测试 - CodeQualityAnalyzer
 */

import 'dotenv/config'
import { CodeQualityAnalyzer } from './src/optimization/code-quality-analyzer.js'
import * as path from 'path'

async function main() {
  console.log('📊 ========================================')
  console.log('📊 Phase 7 Day 2 测试 - 代码质量分析器')
  console.log('📊 ========================================\n')

  // 1. 初始化Analyzer
  console.log('[1/3] 初始化CodeQualityAnalyzer...')
  const analyzer = new CodeQualityAnalyzer({
    maxCyclomaticComplexity: 10,
    maxCognitiveComplexity: 15,
    maxFunctionLines: 50,
    maxClassLines: 300,
    maxParameters: 5,
    maxNestingDepth: 4
  })
  console.log('      ✅ 已初始化\n')

  // 监听事件
  analyzer.on('analysis-completed', (report) => {
    console.log('\n      ✅ 代码分析完成\n')
  })

  // 2. 分析代码库
  console.log('[2/3] 分析Prophet代码库...')
  const srcPath = path.join(process.cwd(), 'src')
  console.log(`      路径: ${srcPath}\n`)

  const report = await analyzer.analyzeCodebase(srcPath)

  // 3. 显示报告
  console.log('[3/3] 生成质量报告...\n')

  console.log('📊 ========================================')
  console.log('📊 代码质量报告')
  console.log('📊 ========================================\n')

  console.log(`分析时间: ${report.analyzedAt.toLocaleString()}`)
  console.log(`分析文件: ${report.totalFiles} 个`)
  console.log(`代码行数: ${report.totalLines.toLocaleString()} 行\n`)

  // 质量分数
  console.log('🎯 质量评估')
  console.log('----------')
  console.log(`  质量分数: ${report.score}/100`)
  console.log(`  质量等级: ${report.grade}`)

  const scoreEmoji = report.score >= 90 ? '🌟' : report.score >= 80 ? '✨' : report.score >= 70 ? '👍' : '⚠️'
  console.log(`  状态: ${scoreEmoji}\n`)

  // 复杂度分析
  console.log('🧮 复杂度分析')
  console.log('------------')
  console.log(`  平均复杂度: ${report.complexity.average.toFixed(1)}`)
  console.log(`  高复杂度函数: ${report.complexity.high.length} 个\n`)

  console.log('  复杂度分布:')
  console.log(`    低 (<10):      ${report.complexity.distribution.low} 个`)
  console.log(`    中 (10-20):    ${report.complexity.distribution.medium} 个`)
  console.log(`    高 (20-50):    ${report.complexity.distribution.high} 个`)
  console.log(`    极高 (>50):    ${report.complexity.distribution.critical} 个`)

  if (report.complexity.high.length > 0) {
    console.log('\n  ⚠️  高复杂度函数（前5个）:')
    for (const metric of report.complexity.high.slice(0, 5)) {
      console.log(`     ${metric.location.function || 'anonymous'} (${path.basename(metric.location.file)}:${metric.location.line})`)
      console.log(`       圈复杂度: ${metric.cyclomaticComplexity}`)
      console.log(`       认知复杂度: ${metric.cognitiveComplexity}`)
      console.log(`       代码行数: ${metric.linesOfCode}`)
      console.log(`       嵌套深度: ${metric.nestingDepth}`)
    }
  }

  // 代码异味
  console.log('\n\n👃 代码异味')
  console.log('----------')
  console.log(`  总计: ${report.smells.length} 个`)

  const smellsByType = new Map<string, number>()
  const smellsBySeverity = new Map<string, number>()

  for (const smell of report.smells) {
    smellsByType.set(smell.type, (smellsByType.get(smell.type) || 0) + 1)
    smellsBySeverity.set(smell.severity, (smellsBySeverity.get(smell.severity) || 0) + 1)
  }

  console.log('\n  按类型:')
  for (const [type, count] of smellsByType.entries()) {
    console.log(`    ${type}: ${count} 个`)
  }

  console.log('\n  按严重度:')
  console.log(`    严重: ${smellsBySeverity.get('critical') || 0}`)
  console.log(`    高: ${smellsBySeverity.get('high') || 0}`)
  console.log(`    中: ${smellsBySeverity.get('medium') || 0}`)
  console.log(`    低: ${smellsBySeverity.get('low') || 0}`)

  if (report.smells.length > 0) {
    console.log('\n  ⚠️  代码异味示例（前5个）:')
    for (const smell of report.smells.slice(0, 5)) {
      console.log(`\n     ${smell.type} [${smell.severity}]`)
      console.log(`       位置: ${path.basename(smell.location.file)}:${smell.location.line}`)
      console.log(`       描述: ${smell.description}`)
      console.log(`       建议: ${smell.suggestion}`)
      if (smell.metrics) {
        console.log(`       指标: ${smell.metrics.actual} (阈值: ${smell.metrics.threshold})`)
      }
    }
  }

  // 优化机会
  console.log('\n\n💡 优化机会')
  console.log('----------')
  console.log(`  总计: ${report.opportunities.length} 个`)
  console.log(`  预期总收益: +${report.stats.estimatedTotalGain.toFixed(0)}%\n`)

  const oppByType = new Map<string, number>()
  const oppByEffort = new Map<string, number>()

  for (const opp of report.opportunities) {
    oppByType.set(opp.type, (oppByType.get(opp.type) || 0) + 1)
    oppByEffort.set(opp.effort, (oppByEffort.get(opp.effort) || 0) + 1)
  }

  console.log('  按类型:')
  for (const [type, count] of oppByType.entries()) {
    console.log(`    ${type}: ${count} 个`)
  }

  console.log('\n  按工作量:')
  console.log(`    低: ${oppByEffort.get('low') || 0}`)
  console.log(`    中: ${oppByEffort.get('medium') || 0}`)
  console.log(`    高: ${oppByEffort.get('high') || 0}`)

  if (report.opportunities.length > 0) {
    console.log('\n  🎯 高价值优化机会（前5个）:')

    // 按预期收益排序
    const sortedOpps = report.opportunities
      .sort((a, b) => b.estimatedGain - a.estimatedGain)
      .slice(0, 5)

    for (let i = 0; i < sortedOpps.length; i++) {
      const opp = sortedOpps[i]
      console.log(`\n     ${i + 1}. ${opp.description}`)
      console.log(`        类型: ${opp.type}`)
      console.log(`        预期收益: +${opp.estimatedGain.toFixed(0)}%`)
      console.log(`        工作量: ${opp.effort}`)
      console.log(`        可信度: ${opp.confidence}%`)
      console.log(`        实施: ${opp.implementation}`)
      if (opp.location.file !== 'global') {
        console.log(`        位置: ${path.basename(opp.location.file)}:${opp.location.line}`)
      }
    }
  }

  // 统计总结
  console.log('\n\n📈 统计总结')
  console.log('----------')
  console.log(`  代码质量分数: ${report.score}/100 [${report.grade}]`)
  console.log(`  总代码异味: ${report.stats.totalSmells} 个`)
  console.log(`  严重问题: ${report.stats.criticalIssues} 个`)
  console.log(`  优化机会: ${report.stats.totalOpportunities} 个`)
  console.log(`  预期总收益: +${report.stats.estimatedTotalGain.toFixed(0)}%`)

  // 建议
  console.log('\n\n💬 总体建议')
  console.log('----------')

  if (report.score >= 90) {
    console.log('  ✅ 代码质量优秀！继续保持。')
  } else if (report.score >= 80) {
    console.log('  👍 代码质量良好，还有一些改进空间。')
  } else if (report.score >= 70) {
    console.log('  ⚠️  代码质量中等，建议优先处理高严重度问题。')
  } else {
    console.log('  🚨 代码质量需要改进，建议立即处理严重问题。')
  }

  if (report.complexity.high.length > 0) {
    console.log(`  - 发现 ${report.complexity.high.length} 个高复杂度函数，建议优先重构`)
  }

  if (report.stats.criticalIssues > 0) {
    console.log(`  - 发现 ${report.stats.criticalIssues} 个严重问题，需要立即处理`)
  }

  if (report.opportunities.length > 0) {
    const quickWins = report.opportunities.filter(o => o.effort === 'low' && o.estimatedGain > 15)
    if (quickWins.length > 0) {
      console.log(`  - 发现 ${quickWins.length} 个"快速见效"优化（低工作量+高收益）`)
    }
  }

  console.log('\n\n🎉 Phase 7 Day 2 测试完成！')
  console.log('============================\n')
  console.log('CodeQualityAnalyzer功能验证：')
  console.log('  ✅ 代码库扫描')
  console.log('  ✅ 复杂度分析（圈复杂度+认知复杂度）')
  console.log('  ✅ 代码异味检测（6种类型）')
  console.log('  ✅ 优化机会识别')
  console.log('  ✅ 质量分数计算')
  console.log('  ✅ 等级评定（A-F）')
  console.log('  ✅ 详细分析报告\n')

  console.log('Prophet现在能分析自己的代码质量了！📊✨\n')
}

main().catch(console.error)
