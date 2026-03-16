/**
 * 注册新项目示例
 */

import { createProphetClient } from '../src/sdk/index.js'

async function main() {
  // 创建客户端（无projectId）
  const client = createProphetClient({
    serverUrl: 'http://localhost:3000',
    apiKey: 'temp-key', // 临时密钥，仅用于注册
  })

  // 注册项目
  const { projectId, apiKey } = await client.registerProject({
    name: 'My Awesome Project',
    type: 'web-app',
    path: '/Users/me/projects/my-app',
  })

  console.log('✅ 项目注册成功!')
  console.log(`   Project ID: ${projectId}`)
  console.log(`   API Key: ${apiKey}`)
  console.log('')
  console.log('保存这些信息，用于后续连接:')
  console.log('')
  console.log('const client = createProphetClient({')
  console.log(`  serverUrl: 'http://localhost:3000',`)
  console.log(`  apiKey: '${apiKey}',`)
  console.log(`  projectId: '${projectId}',`)
  console.log('})')
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}
