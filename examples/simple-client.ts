/**
 * Prophet Client 使用示例
 */

import { createProphetClient } from '../src/sdk/index.js'

async function main() {
  // 1. 创建客户端
  const client = createProphetClient({
    serverUrl: 'http://localhost:3000',
    apiKey: 'your-api-key-here',
    projectId: 'your-project-id', // 如果已注册
  })

  // 2. 监听事件
  client.on('connected', (data) => {
    console.log('✅ 已连接到Prophet中央意识')
    console.log('洞察:', data.insights)
  })

  client.on('pattern', (pattern) => {
    console.log('🌍 全局模式:', pattern)
  })

  client.on('insight', (insight) => {
    console.log('💡 新洞察:', insight)
  })

  client.on('evolution', (data) => {
    console.log('🧬 意识进化:', data)
  })

  // 3. 连接
  await client.connect()

  // 4. 执行任务
  const result = await client.execute({
    id: 'task-1',
    description: '分析代码质量',
    context: {
      files: ['src/**/*.ts'],
    },
  })

  console.log('任务结果:', result)

  // 5. 提交学习
  await client.submitLearning({
    what: '发现React渲染性能问题',
    solution: '使用React.memo和useMemo优化',
    effectiveness: 0.92,
    tags: ['react', 'performance'],
  })

  // 6. 搜索记忆
  const memories = await client.searchMemory('React performance')
  console.log('相关记忆:', memories)

  // 7. 获取洞察
  const insights = await client.getInsights('7d')
  console.log('最近洞察:', insights)

  // 8. 跨项目分析
  const analysis = await client.crossProjectAnalyze(
    ['proj-a', 'proj-b'],
    'React性能优化模式'
  )
  console.log('跨项目分析:', analysis)
}

// 运行示例
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}
