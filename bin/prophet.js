#!/usr/bin/env node

/**
 * Prophet CLI - 一行命令对接Prophet
 */

import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync, writeFileSync, existsSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))

const PROPHET_SERVER = process.env.PROPHET_SERVER || 'http://localhost:3000'

async function main() {
  const command = process.argv[2] || 'connect'

  switch (command) {
    case 'connect':
      await connectProject()
      break
    case 'status':
      await showStatus()
      break
    case 'test':
      await testConnection()
      break
    default:
      showHelp()
  }
}

async function connectProject() {
  console.log('🔮 Prophet - 一键对接')
  console.log('═══════════════════════════════')
  console.log('')

  // 检查server
  try {
    const response = await fetch(`${PROPHET_SERVER}/health`)
    if (!response.ok) throw new Error('Server not responding')
    console.log('✅ Prophet Server运行中')
  } catch (error) {
    console.error('❌ Prophet Server未运行')
    console.error('')
    console.error('请先启动服务器:')
    console.error(`  cd ${join(__dirname, '../../')}`)
    console.error('  npm run dev')
    console.error('')
    process.exit(1)
  }

  // 获取项目信息
  const projectPath = process.cwd()
  let projectName = 'my-project'
  let projectType = 'web-app'

  // 尝试从package.json读取
  if (existsSync('package.json')) {
    try {
      const pkg = JSON.parse(readFileSync('package.json', 'utf-8'))
      projectName = pkg.name || projectName
    } catch (e) {}
  }

  console.log('')
  console.log('📝 项目信息:')
  console.log(`   名称: ${projectName}`)
  console.log(`   类型: ${projectType}`)
  console.log(`   路径: ${projectPath}`)
  console.log('')

  // 检查是否已连接
  if (existsSync('.prophetrc.json')) {
    const config = JSON.parse(readFileSync('.prophetrc.json', 'utf-8'))
    console.log('⚠️  项目已连接到Prophet')
    console.log(`   Project ID: ${config.projectId}`)
    console.log('')
    console.log('使用以下命令:')
    console.log('   npm run prophet:test     # 测试连接')
    console.log('   npm run prophet:status   # 查看状态')
    return
  }

  // 注册项目
  console.log('🌟 注册到Prophet中枢...')
  const registerResponse = await fetch(`${PROPHET_SERVER}/api/projects/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: projectName,
      type: projectType,
      path: projectPath,
    }),
  })

  if (!registerResponse.ok) {
    console.error('❌ 注册失败')
    process.exit(1)
  }

  const { projectId, apiKey } = await registerResponse.json()

  console.log('✅ 注册成功')
  console.log(`   Project ID: ${projectId}`)
  console.log(`   API Key: ${apiKey.substring(0, 20)}...`)
  console.log('')

  // 创建配置文件
  const config = {
    serverUrl: PROPHET_SERVER,
    projectId,
    apiKey,
    projectName,
    projectType,
    autoConnect: true,
  }

  writeFileSync('.prophetrc.json', JSON.stringify(config, null, 2))
  console.log('✅ 配置已保存: .prophetrc.json')

  // 更新package.json
  if (existsSync('package.json')) {
    const pkg = JSON.parse(readFileSync('package.json', 'utf-8'))
    pkg.scripts = pkg.scripts || {}
    pkg.scripts['prophet:test'] = 'prophet test'
    pkg.scripts['prophet:status'] = 'prophet status'
    writeFileSync('package.json', JSON.stringify(pkg, null, 2))
    console.log('✅ npm脚本已添加')
  }

  // 添加到gitignore
  if (existsSync('.gitignore')) {
    let gitignore = readFileSync('.gitignore', 'utf-8')
    if (!gitignore.includes('.prophetrc.json')) {
      gitignore += '\n.prophetrc.json\n'
      writeFileSync('.gitignore', gitignore)
      console.log('✅ 已添加到.gitignore')
    }
  }

  console.log('')
  console.log('🎉 对接完成！')
  console.log('')
  console.log('📖 使用方法:')
  console.log('   npm run prophet:test     # 测试连接')
  console.log('   npm run prophet:status   # 查看状态')
  console.log('')
  console.log('📝 在代码中使用:')
  console.log("   import { createProphetClient } from '@prophet/central-server/sdk'")
  console.log("   import config from './.prophetrc.json'")
  console.log('   const prophet = createProphetClient(config)')
  console.log('   await prophet.connect()')
  console.log('')
}

async function showStatus() {
  if (!existsSync('.prophetrc.json')) {
    console.error('❌ 项目未连接到Prophet')
    console.error('   运行: npx prophet connect')
    process.exit(1)
  }

  const config = JSON.parse(readFileSync('.prophetrc.json', 'utf-8'))

  console.log('📊 Prophet状态')
  console.log('═══════════════════════════════')
  console.log('')
  console.log(`项目: ${config.projectName}`)
  console.log(`类型: ${config.projectType}`)
  console.log(`Project ID: ${config.projectId}`)
  console.log(`服务器: ${config.serverUrl}`)
  console.log('')

  try {
    const response = await fetch(
      `${config.serverUrl}/api/insights?projectId=${config.projectId}`
    )
    const insights = await response.json()
    console.log(`💡 洞察数: ${insights.length}`)
    console.log('')
    console.log('✅ 连接正常')
  } catch (error) {
    console.log('❌ 无法连接到服务器')
  }
}

async function testConnection() {
  if (!existsSync('.prophetrc.json')) {
    console.error('❌ 项目未连接到Prophet')
    console.error('   运行: npx prophet connect')
    process.exit(1)
  }

  const config = JSON.parse(readFileSync('.prophetrc.json', 'utf-8'))

  console.log('🧪 测试Prophet连接')
  console.log('═══════════════════════════════')
  console.log('')

  // 测试服务器
  try {
    const response = await fetch(`${config.serverUrl}/health`)
    const data = await response.json()
    console.log('✅ 服务器连接正常')
    console.log(`   总项目数: ${data.projects?.totalProjects || 0}`)
  } catch (error) {
    console.log('❌ 服务器连接失败')
    process.exit(1)
  }

  // 测试项目
  try {
    const response = await fetch(
      `${config.serverUrl}/api/insights?projectId=${config.projectId}`
    )
    if (response.ok) {
      console.log('✅ 项目已注册')
      console.log(`   Project ID: ${config.projectId}`)
    }
  } catch (error) {
    console.log('❌ 项目未找到')
  }

  console.log('')
  console.log('🎉 测试完成！')
}

function showHelp() {
  console.log('🔮 Prophet CLI')
  console.log('')
  console.log('用法:')
  console.log('  npx prophet connect    # 连接项目到Prophet')
  console.log('  npx prophet status     # 查看连接状态')
  console.log('  npx prophet test       # 测试连接')
  console.log('')
}

main().catch(console.error)
