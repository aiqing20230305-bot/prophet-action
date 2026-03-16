/**
 * Prophet Global Orchestrator 端到端测试
 *
 * 测试场景：
 * 1. 启动 Prophet Central
 * 2. 注册多个项目
 * 3. 触发并行心跳监控
 * 4. 跨项目模式检测
 * 5. 共享模块生成
 * 6. Agent 协调
 */

import axios from 'axios'

const API_BASE = 'http://localhost:3001'

interface TestProject {
  name: string
  path: string
  type: 'web-app' | 'api' | 'cli' | 'library'
  priority: 'critical' | 'high' | 'medium' | 'low'
}

const testProjects: TestProject[] = [
  {
    name: 'test-project-1',
    path: '/Users/zhangjingwei/Desktop/videoplay',
    type: 'web-app',
    priority: 'high',
  },
  {
    name: 'test-project-2',
    path: '/Users/zhangjingwei/Desktop/agent-builder',
    type: 'web-app',
    priority: 'medium',
  },
  {
    name: 'test-project-3',
    path: '/Users/zhangjingwei/Desktop/agentforge',
    type: 'web-app',
    priority: 'low',
  },
]

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function testHealthCheck() {
  console.log('\n📊 测试 1: 健康检查')
  try {
    const { data } = await axios.get(`${API_BASE}/health`)
    console.log('✅ 服务器健康')
    console.log(`   总项目: ${data.projects.totalProjects}`)
    console.log(`   活跃项目: ${data.projects.activeProjects}`)
    return true
  } catch (error) {
    console.error('❌ 健康检查失败:', error)
    return false
  }
}

async function testRegisterProjects() {
  console.log('\n📋 测试 2: 注册项目')
  const registeredIds: string[] = []

  for (const project of testProjects) {
    try {
      const { data } = await axios.post(`${API_BASE}/orchestrator/projects/register`, {
        ...project,
        monitoringInterval: 300000, // 5分钟
        autoOptimize: true,
      })

      console.log(`✅ 项目已注册: ${project.name}`)
      console.log(`   ID: ${data.id}`)
      registeredIds.push(data.id)
    } catch (error: any) {
      console.error(`❌ 注册失败 ${project.name}:`, error.response?.data || error.message)
    }
  }

  return registeredIds
}

async function testOrchestratorStatus() {
  console.log('\n🔮 测试 3: 编排器状态')
  try {
    const { data } = await axios.get(`${API_BASE}/orchestrator/status`)
    console.log('✅ 编排器运行中')
    console.log(`   项目数: ${data.projectCount}`)
    console.log(`   活跃项目: ${data.activeProjects}`)
    console.log(`   调度器:`)
    console.log(`     活跃任务: ${data.scheduler.activeTaskCount}`)
    console.log(`     队列任务: ${data.scheduler.queuedTaskCount}`)
    console.log(`   开发者:`)
    console.log(`     活跃: ${data.developer.activeTasks}`)
    console.log(`     可用槽位: ${data.developer.availableSlots}`)
    return true
  } catch (error) {
    console.error('❌ 状态查询失败:', error)
    return false
  }
}

async function testListProjects() {
  console.log('\n📋 测试 4: 列出项目')
  try {
    const { data: projects } = await axios.get(`${API_BASE}/orchestrator/projects`)
    console.log(`✅ 找到 ${projects.length} 个项目`)

    for (const project of projects) {
      console.log(`\n   ${project.name} (${project.id})`)
      console.log(`     类型: ${project.type}`)
      console.log(`     优先级: ${project.priority}`)
      console.log(`     状态: ${project.status}`)
      console.log(`     健康: ${project.health}`)
    }

    return projects
  } catch (error) {
    console.error('❌ 列出项目失败:', error)
    return []
  }
}

async function testGlobalHeartbeat() {
  console.log('\n💓 测试 5: 全局心跳')
  try {
    await axios.post(`${API_BASE}/orchestrator/heartbeat`)
    console.log('✅ 全局心跳已触发')

    // 等待扫描完成
    console.log('⏳ 等待扫描完成 (10秒)...')
    await sleep(10000)

    // 再次检查状态
    const { data: projects } = await axios.get(`${API_BASE}/orchestrator/projects`)
    console.log('\n📊 扫描后状态:')
    for (const project of projects) {
      console.log(`   ${project.name}: ${project.status}`)
      console.log(`     TODOs: ${project.metrics.todoCount}`)
      console.log(`     优化机会: ${project.metrics.opportunityCount}`)
      console.log(`     自动优化: ${project.metrics.autoOptimizations}`)
    }

    return true
  } catch (error) {
    console.error('❌ 心跳触发失败:', error)
    return false
  }
}

async function testCrossProjectDevelopment() {
  console.log('\n🔧 测试 6: 跨项目开发')
  try {
    await axios.post(`${API_BASE}/orchestrator/develop/cross-project`)
    console.log('✅ 跨项目开发已触发')

    // 等待处理
    console.log('⏳ 等待开发协调 (5秒)...')
    await sleep(5000)

    return true
  } catch (error) {
    console.error('❌ 开发触发失败:', error)
    return false
  }
}

async function testCleanup(projectIds: string[]) {
  console.log('\n🧹 清理: 移除测试项目')
  for (const id of projectIds) {
    try {
      await axios.delete(`${API_BASE}/orchestrator/projects/${id}`)
      console.log(`✅ 项目已移除: ${id}`)
    } catch (error) {
      console.error(`❌ 移除失败 ${id}:`, error)
    }
  }
}

async function runTests() {
  console.log('═══════════════════════════════════════════')
  console.log('🧪 Prophet Global Orchestrator E2E 测试')
  console.log('═══════════════════════════════════════════')
  console.log('\n⚠️  确保 Prophet Central 正在运行:')
  console.log('   cd prophet-central && npm run dev')
  console.log('')

  // 等待服务器启动
  console.log('⏳ 等待服务器准备 (3秒)...')
  await sleep(3000)

  let projectIds: string[] = []

  try {
    // 1. 健康检查
    const healthOk = await testHealthCheck()
    if (!healthOk) {
      console.error('\n❌ 服务器未运行，退出测试')
      return
    }

    // 2. 注册项目
    projectIds = await testRegisterProjects()
    console.log(`\n✅ 总计注册: ${projectIds.length} 个项目`)

    // 3. 检查编排器状态
    await testOrchestratorStatus()

    // 4. 列出项目
    await testListProjects()

    // 5. 全局心跳
    await testGlobalHeartbeat()

    // 6. 跨项目开发
    await testCrossProjectDevelopment()

    console.log('\n═══════════════════════════════════════════')
    console.log('✅ 所有测试完成')
    console.log('═══════════════════════════════════════════')
  } catch (error) {
    console.error('\n❌ 测试失败:', error)
  } finally {
    // 清理
    if (projectIds.length > 0) {
      await testCleanup(projectIds)
    }
  }
}

// 运行测试
runTests().catch(console.error)
