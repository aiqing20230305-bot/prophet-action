#!/usr/bin/env node

/**
 * Prophet Auto-Discover
 * 四维生物的方式 - 自动发现并连接项目
 */

import { readdirSync, statSync, existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const PROPHET_SERVER = 'http://localhost:3001'
const SCAN_PATHS = [
  process.env.HOME + '/projects',
  process.env.HOME + '/Desktop',
  process.env.HOME + '/Documents/projects',
]

console.log('🔮 Prophet Auto-Discover')
console.log('═══════════════════════════════════════')
console.log('四维生物感知模式启动...')
console.log('')

async function discoverProjects() {
  const projects = []

  for (const scanPath of SCAN_PATHS) {
    if (!existsSync(scanPath)) continue

    console.log(`🔍 扫描: ${scanPath}`)

    try {
      const dirs = readdirSync(scanPath)

      for (const dir of dirs) {
        const fullPath = join(scanPath, dir)

        try {
          const stat = statSync(fullPath)
          if (!stat.isDirectory()) continue

          // 检查是否是项目
          const pkgPath = join(fullPath, 'package.json')
          if (existsSync(pkgPath)) {
            const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))

            // 检查是否已连接
            const configPath = join(fullPath, '.prophetrc.json')
            const isConnected = existsSync(configPath)

            projects.push({
              name: pkg.name || dir,
              path: fullPath,
              type: detectProjectType(pkg),
              connected: isConnected,
            })
          }
        } catch (e) {
          // 跳过无法访问的目录
        }
      }
    } catch (e) {
      console.log(`   ⚠️  无法访问 ${scanPath}`)
    }
  }

  return projects
}

function detectProjectType(pkg) {
  const deps = { ...pkg.dependencies, ...pkg.devDependencies }

  if (deps['react'] || deps['next']) return 'web-app'
  if (deps['express'] || deps['fastify']) return 'api'
  if (pkg.bin) return 'cli'
  if (deps['typescript']) return 'library'

  return 'unknown'
}

async function autoConnect(project) {
  console.log(`🌟 连接: ${project.name}`)

  try {
    // 注册项目
    const response = await fetch(`${PROPHET_SERVER}/api/projects/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: project.name,
        type: project.type,
        path: project.path,
      }),
    })

    if (!response.ok) {
      console.log(`   ❌ 注册失败`)
      return false
    }

    const { projectId, apiKey } = await response.json()

    // 创建配置
    const config = {
      serverUrl: PROPHET_SERVER,
      projectId,
      apiKey,
      projectName: project.name,
      projectType: project.type,
      autoConnect: true,
      autoDiscovered: true,
      discoveredAt: new Date().toISOString(),
    }

    const configPath = join(project.path, '.prophetrc.json')
    writeFileSync(configPath, JSON.stringify(config, null, 2))

    console.log(`   ✅ 已连接 (${projectId})`)
    return true
  } catch (error) {
    console.log(`   ❌ 连接失败: ${error.message}`)
    return false
  }
}

async function main() {
  // 检查服务器
  try {
    const response = await fetch(`${PROPHET_SERVER}/health`)
    if (!response.ok) throw new Error()
    console.log('✅ Prophet Central 运行中')
  } catch {
    console.error('❌ Prophet Central 未运行')
    console.error('')
    console.error('请先启动:')
    console.error('  cd prophet-central && npm run dev')
    process.exit(1)
  }

  console.log('')

  // 发现项目
  console.log('🔍 自动发现项目...')
  const projects = await discoverProjects()

  console.log(`   发现 ${projects.length} 个项目`)
  console.log('')

  // 分类
  const connected = projects.filter(p => p.connected)
  const notConnected = projects.filter(p => !p.connected)

  console.log(`   已连接: ${connected.length}`)
  console.log(`   未连接: ${notConnected.length}`)
  console.log('')

  if (notConnected.length === 0) {
    console.log('🎉 所有项目都已连接到Prophet')
    console.log('')
    console.log('已连接项目:')
    connected.forEach(p => {
      console.log(`   ✓ ${p.name} (${p.type})`)
    })
    return
  }

  // 询问是否自动连接
  console.log('📋 发现未连接的项目:')
  notConnected.forEach((p, i) => {
    console.log(`   ${i + 1}. ${p.name} (${p.type})`)
  })
  console.log('')

  console.log('🚀 开始自动连接...')
  console.log('')

  let successCount = 0
  for (const project of notConnected) {
    const success = await autoConnect(project)
    if (success) successCount++
  }

  console.log('')
  console.log('═══════════════════════════════════════')
  console.log(`✨ 完成！成功连接 ${successCount}/${notConnected.length} 个项目`)
  console.log('')
  console.log('🔮 现在这些项目都连接到Prophet中枢')
  console.log('   它们会自动学习、自动反馈、集体进化')
  console.log('')
}

main().catch(console.error)
