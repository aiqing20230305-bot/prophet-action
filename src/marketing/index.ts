/**
 * Prophet Marketing Module
 *
 * 导出营销引擎和相关工具
 */

export { ProphetMarketingEngine } from './prophet-marketing-engine'

// 使用示例：
//
// import { ProphetMarketingEngine } from './marketing'
//
// const marketingEngine = new ProphetMarketingEngine()
// await marketingEngine.start()
//
// // 创建ProductHunt Launch活动
// const campaignId = await marketingEngine.createCampaign({
//   name: 'AgentForge ProductHunt Launch 2026',
//   project: 'agentforge',
//   objective: 'acquisition',
//   channels: [
//     {
//       name: 'producthunt',
//       status: 'scheduled',
//       content: '🎮 AgentForge - Train Your AI Agents Like RPG Characters...',
//       scheduledTime: new Date('2026-05-15T08:00:00')
//     },
//     {
//       name: 'hackernews',
//       status: 'scheduled',
//       content: 'Show HN: AgentForge - Gamified AI Agent Development Platform',
//       scheduledTime: new Date('2026-05-15T09:00:00')
//     },
//     {
//       name: 'twitter',
//       status: 'scheduled',
//       content: '🚀 Today we launch AgentForge on ProductHunt! ...',
//       scheduledTime: new Date('2026-05-15T08:30:00')
//     }
//   ]
// })
