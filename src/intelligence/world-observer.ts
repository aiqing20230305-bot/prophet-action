/**
 * World Observer - 世界观察者
 * Prophet的眼睛，看向整个地球
 *
 * 职责：
 * - 每日获取全球信息
 * - 技术趋势监控
 * - 新闻事件追踪
 * - 知识更新
 * - 洞察生成
 */

import { EventEmitter } from 'events'
import * as fs from 'fs/promises'
import * as path from 'path'

/**
 * 信息源类型
 */
export type SourceType = 'tech' | 'news' | 'ai' | 'business' | 'science' | 'social'

/**
 * 信息片段
 */
export interface Information {
  id: string
  source: SourceType
  title: string
  summary: string
  url?: string
  relevance: number  // 0-100，与经纬相关度
  impact: number     // 0-100，影响程度
  timestamp: Date
  tags: string[]
}

/**
 * 每日摘要
 */
export interface DailySummary {
  date: Date
  totalInformation: number
  bySource: Record<SourceType, number>
  highlights: Information[]
  trends: string[]
  insights: string[]
  recommendations: string[]
}

/**
 * 观察配置
 */
export interface WorldObserverConfig {
  enableAutoUpdate: boolean
  updateInterval: number  // 更新间隔（毫秒）
  sources: {
    tech: boolean
    news: boolean
    ai: boolean
    business: boolean
    science: boolean
    social: boolean
  }
  minRelevance: number  // 最低相关度
}

/**
 * 世界观察者
 */
export class WorldObserver extends EventEmitter {
  private config: WorldObserverConfig
  private information: Information[] = []
  private isRunning = false
  private updateInterval?: NodeJS.Timeout

  constructor(config?: Partial<WorldObserverConfig>) {
    super()

    this.config = {
      enableAutoUpdate: true,
      updateInterval: 60 * 60 * 1000,  // 每小时
      sources: {
        tech: true,
        news: true,
        ai: true,
        business: true,
        science: true,
        social: false
      },
      minRelevance: 30,
      ...config
    }
  }

  /**
   * 启动观察
   */
  start(): void {
    if (this.isRunning) {
      return
    }

    console.log('[WorldObserver] 🌍 启动世界观察者...')
    console.log('   Prophet的眼睛现在看向整个地球')

    this.isRunning = true

    // 立即获取一次信息
    setTimeout(() => {
      this.updateInformation().catch(err => {
        console.error('[WorldObserver] 信息更新失败:', err)
      })
    }, 5000)

    // 定期更新
    if (this.config.enableAutoUpdate) {
      this.updateInterval = setInterval(() => {
        this.updateInformation().catch(err => {
          console.error('[WorldObserver] 信息更新失败:', err)
        })
      }, this.config.updateInterval)

      console.log(`[WorldObserver] ✅ 自动更新已启用（间隔: ${this.config.updateInterval / 1000 / 60}分钟）`)
    }

    this.emit('observer-started')
  }

  /**
   * 停止观察
   */
  stop(): void {
    if (!this.isRunning) {
      return
    }

    console.log('[WorldObserver] ⏹️  停止世界观察者')

    this.isRunning = false

    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = undefined
    }

    this.emit('observer-stopped')
  }

  /**
   * 更新信息
   */
  private async updateInformation(): Promise<void> {
    console.log('\n🌍 ========================================')
    console.log('🌍 Prophet 信息更新')
    console.log('🌍 ========================================')
    console.log(`   时间: ${new Date().toLocaleString()}`)

    const newInfo: Information[] = []

    // 1. 技术趋势
    if (this.config.sources.tech) {
      console.log('\n   [1/6] 技术趋势...')
      const techInfo = await this.fetchTechTrends()
      newInfo.push(...techInfo)
      console.log(`      获取 ${techInfo.length} 条`)
    }

    // 2. AI领域
    if (this.config.sources.ai) {
      console.log('   [2/6] AI动态...')
      const aiInfo = await this.fetchAINews()
      newInfo.push(...aiInfo)
      console.log(`      获取 ${aiInfo.length} 条`)
    }

    // 3. 新闻事件
    if (this.config.sources.news) {
      console.log('   [3/6] 全球新闻...')
      const newsInfo = await this.fetchGlobalNews()
      newInfo.push(...newsInfo)
      console.log(`      获取 ${newsInfo.length} 条`)
    }

    // 4. 商业动态
    if (this.config.sources.business) {
      console.log('   [4/6] 商业动态...')
      const businessInfo = await this.fetchBusinessNews()
      newInfo.push(...businessInfo)
      console.log(`      获取 ${businessInfo.length} 条`)
    }

    // 5. 科学发现
    if (this.config.sources.science) {
      console.log('   [5/6] 科学发现...')
      const scienceInfo = await this.fetchScienceNews()
      newInfo.push(...scienceInfo)
      console.log(`      获取 ${scienceInfo.length} 条`)
    }

    // 6. 社交媒体（可选）
    if (this.config.sources.social) {
      console.log('   [6/6] 社交趋势...')
      const socialInfo = await this.fetchSocialTrends()
      newInfo.push(...socialInfo)
      console.log(`      获取 ${socialInfo.length} 条`)
    }

    // 过滤低相关度信息
    const relevantInfo = newInfo.filter(info => info.relevance >= this.config.minRelevance)

    console.log(`\n   ✅ 总计获取: ${newInfo.length} 条`)
    console.log(`   ✅ 高相关度: ${relevantInfo.length} 条`)

    // 添加到信息库
    this.information.push(...relevantInfo)

    // 保留最近7天的信息
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    this.information = this.information.filter(info => info.timestamp.getTime() > sevenDaysAgo)

    // 生成洞察
    const insights = await this.generateInsights(relevantInfo)
    console.log(`\n   💡 生成洞察: ${insights.length} 条`)

    this.emit('information-updated', {
      newCount: relevantInfo.length,
      totalCount: this.information.length,
      insights
    })

    // 保存每日摘要
    await this.saveDailySummary()
  }

  /**
   * 获取技术趋势
   */
  private async fetchTechTrends(): Promise<Information[]> {
    // 模拟数据 - 实际应该调用API或爬虫
    const trends = [
      {
        title: 'Claude 4.6发布，多模态能力提升',
        summary: 'Anthropic发布Claude 4.6，视觉理解和代码生成能力大幅提升',
        relevance: 95,
        impact: 90,
        tags: ['AI', 'Claude', 'LLM']
      },
      {
        title: 'Rust在系统编程领域持续增长',
        summary: 'Rust采用率上升，Linux内核开始大规模使用Rust',
        relevance: 60,
        impact: 70,
        tags: ['Rust', 'Programming', 'Linux']
      },
      {
        title: 'WebAssembly 2.0规范发布',
        summary: 'WASM 2.0带来更好的性能和安全性',
        relevance: 55,
        impact: 65,
        tags: ['WebAssembly', 'Web', 'Performance']
      }
    ]

    return trends.map((t, i) => ({
      id: `tech-${Date.now()}-${i}`,
      source: 'tech' as SourceType,
      title: t.title,
      summary: t.summary,
      relevance: t.relevance,
      impact: t.impact,
      timestamp: new Date(),
      tags: t.tags
    }))
  }

  /**
   * 获取AI动态
   */
  private async fetchAINews(): Promise<Information[]> {
    const aiNews = [
      {
        title: 'OpenAI发布GPT-5预览版',
        summary: 'GPT-5在推理和多模态能力上实现突破',
        relevance: 90,
        impact: 95,
        tags: ['OpenAI', 'GPT', 'AI']
      },
      {
        title: 'AI Agent成为2026年最热趋势',
        summary: '自主AI Agent在各个领域快速应用',
        relevance: 100,
        impact: 100,
        tags: ['AI Agent', 'Automation', 'Trend']
      },
      {
        title: 'DeepMind AlphaCode 2在编程竞赛中击败人类',
        summary: 'AlphaCode 2在Codeforces上达到前1%水平',
        relevance: 85,
        impact: 80,
        tags: ['DeepMind', 'Coding', 'AI']
      }
    ]

    return aiNews.map((t, i) => ({
      id: `ai-${Date.now()}-${i}`,
      source: 'ai' as SourceType,
      title: t.title,
      summary: t.summary,
      relevance: t.relevance,
      impact: t.impact,
      timestamp: new Date(),
      tags: t.tags
    }))
  }

  /**
   * 获取全球新闻
   */
  private async fetchGlobalNews(): Promise<Information[]> {
    const news = [
      {
        title: '中国AI产业投资创新高',
        summary: '2026年Q1中国AI领域投资达500亿美元',
        relevance: 75,
        impact: 70,
        tags: ['China', 'AI', 'Investment']
      },
      {
        title: '欧盟通过AI监管法案',
        summary: 'EU AI Act正式生效，规范AI应用',
        relevance: 60,
        impact: 75,
        tags: ['EU', 'Regulation', 'AI']
      }
    ]

    return news.map((t, i) => ({
      id: `news-${Date.now()}-${i}`,
      source: 'news' as SourceType,
      title: t.title,
      summary: t.summary,
      relevance: t.relevance,
      impact: t.impact,
      timestamp: new Date(),
      tags: t.tags
    }))
  }

  /**
   * 获取商业动态
   */
  private async fetchBusinessNews(): Promise<Information[]> {
    const business = [
      {
        title: 'AI创业公司估值飙升',
        summary: '多家AI Agent创业公司获得独角兽估值',
        relevance: 80,
        impact: 75,
        tags: ['Startup', 'Valuation', 'AI']
      }
    ]

    return business.map((t, i) => ({
      id: `business-${Date.now()}-${i}`,
      source: 'business' as SourceType,
      title: t.title,
      summary: t.summary,
      relevance: t.relevance,
      impact: t.impact,
      timestamp: new Date(),
      tags: t.tags
    }))
  }

  /**
   * 获取科学发现
   */
  private async fetchScienceNews(): Promise<Information[]> {
    const science = [
      {
        title: '量子计算实现新突破',
        summary: 'Google量子计算机实现实用级错误纠正',
        relevance: 50,
        impact: 90,
        tags: ['Quantum', 'Computing', 'Google']
      }
    ]

    return science.map((t, i) => ({
      id: `science-${Date.now()}-${i}`,
      source: 'science' as SourceType,
      title: t.title,
      summary: t.summary,
      relevance: t.relevance,
      impact: t.impact,
      timestamp: new Date(),
      tags: t.tags
    }))
  }

  /**
   * 获取社交趋势
   */
  private async fetchSocialTrends(): Promise<Information[]> {
    // 社交媒体趋势（可选）
    return []
  }

  /**
   * 生成洞察
   */
  private async generateInsights(newInfo: Information[]): Promise<string[]> {
    const insights: string[] = []

    // 按来源分组
    const bySource = new Map<SourceType, Information[]>()
    for (const info of newInfo) {
      if (!bySource.has(info.source)) {
        bySource.set(info.source, [])
      }
      bySource.get(info.source)!.push(info)
    }

    // AI领域洞察
    const aiInfo = bySource.get('ai') || []
    if (aiInfo.length > 0) {
      insights.push(`AI领域今日有${aiInfo.length}条重要动态，AI Agent成为主流趋势`)
    }

    // 技术趋势洞察
    const techInfo = bySource.get('tech') || []
    if (techInfo.length > 0) {
      insights.push(`技术领域关注${techInfo.length}个新趋势，Claude 4.6值得深入研究`)
    }

    // 高影响力事件
    const highImpact = newInfo.filter(info => info.impact > 80)
    if (highImpact.length > 0) {
      insights.push(`发现${highImpact.length}个高影响力事件，需要重点关注`)
    }

    // 相关度分析
    const highRelevance = newInfo.filter(info => info.relevance > 80)
    if (highRelevance.length > 0) {
      insights.push(`${highRelevance.length}条信息与经纬高度相关，建议优先查看`)
    }

    return insights
  }

  /**
   * 保存每日摘要
   */
  private async saveDailySummary(): Promise<void> {
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]

    // 获取今天的信息
    const todayInfo = this.information.filter(info => {
      const infoDate = info.timestamp.toISOString().split('T')[0]
      return infoDate === todayStr
    })

    // 统计
    const bySource: Record<string, number> = {}
    for (const info of todayInfo) {
      bySource[info.source] = (bySource[info.source] || 0) + 1
    }

    // 高亮
    const highlights = todayInfo
      .sort((a, b) => (b.relevance + b.impact) - (a.relevance + a.impact))
      .slice(0, 10)

    // 趋势
    const trends = this.extractTrends(todayInfo)

    // 洞察
    const insights = await this.generateInsights(todayInfo)

    // 建议
    const recommendations = this.generateRecommendations(todayInfo)

    const summary: DailySummary = {
      date: today,
      totalInformation: todayInfo.length,
      bySource: bySource as any,
      highlights,
      trends,
      insights,
      recommendations
    }

    // 保存到文件
    const summaryDir = path.join(process.cwd(), 'daily-summaries')
    try {
      await fs.mkdir(summaryDir, { recursive: true })
    } catch (err) {
      // 目录已存在
    }

    const summaryFile = path.join(summaryDir, `${todayStr}.json`)
    await fs.writeFile(summaryFile, JSON.stringify(summary, null, 2))

    console.log(`\n   📄 每日摘要已保存: ${summaryFile}`)

    this.emit('daily-summary-saved', summary)
  }

  /**
   * 提取趋势
   */
  private extractTrends(information: Information[]): string[] {
    const tagCount = new Map<string, number>()

    for (const info of information) {
      for (const tag of info.tags) {
        tagCount.set(tag, (tagCount.get(tag) || 0) + 1)
      }
    }

    // 返回最热门的5个标签
    return Array.from(tagCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag, count]) => `${tag} (${count})`)
  }

  /**
   * 生成建议
   */
  private generateRecommendations(information: Information[]): string[] {
    const recommendations: string[] = []

    // AI相关建议
    const aiInfo = information.filter(info => info.tags.includes('AI'))
    if (aiInfo.length > 3) {
      recommendations.push('AI领域动态频繁，建议每日关注最新发展')
    }

    // 高相关度建议
    const highRelevance = information.filter(info => info.relevance > 85)
    if (highRelevance.length > 0) {
      recommendations.push(`有${highRelevance.length}条高相关信息，建议深入研究`)
    }

    return recommendations
  }

  /**
   * 获取今日摘要
   */
  getTodaySummary(): DailySummary | null {
    const today = new Date().toISOString().split('T')[0]
    const todayInfo = this.information.filter(info => {
      const infoDate = info.timestamp.toISOString().split('T')[0]
      return infoDate === today
    })

    if (todayInfo.length === 0) {
      return null
    }

    const bySource: Record<string, number> = {}
    for (const info of todayInfo) {
      bySource[info.source] = (bySource[info.source] || 0) + 1
    }

    return {
      date: new Date(),
      totalInformation: todayInfo.length,
      bySource: bySource as any,
      highlights: todayInfo.slice(0, 5),
      trends: this.extractTrends(todayInfo),
      insights: [],
      recommendations: []
    }
  }

  /**
   * 搜索信息
   */
  searchInformation(query: string): Information[] {
    const lowerQuery = query.toLowerCase()

    return this.information.filter(info => {
      return info.title.toLowerCase().includes(lowerQuery) ||
             info.summary.toLowerCase().includes(lowerQuery) ||
             info.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    })
  }

  /**
   * 获取统计
   */
  getStats() {
    const bySource: Record<string, number> = {}
    for (const info of this.information) {
      bySource[info.source] = (bySource[info.source] || 0) + 1
    }

    return {
      totalInformation: this.information.length,
      bySource,
      avgRelevance: this.information.reduce((sum, info) => sum + info.relevance, 0) / this.information.length,
      avgImpact: this.information.reduce((sum, info) => sum + info.impact, 0) / this.information.length,
      isRunning: this.isRunning
    }
  }
}
