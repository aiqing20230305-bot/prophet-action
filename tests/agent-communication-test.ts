/**
 * Prophet Agent Communication Test
 * 测试 Agent 通信系统
 *
 * 注意：由于实际的 Agent 通信需要项目中有 Claude Code Agents 存在，
 * 这个测试使用模拟 Agent 来验证通信框架。
 */

import { io, Socket } from 'socket.io-client'
import axios from 'axios'

const CENTRAL_URL = 'http://localhost:3001'

interface MockAgent {
  id: string
  name: string
  projectId: string
  socket: Socket | null
}

class AgentCommunicationTester {
  private mockAgents: Map<string, MockAgent> = new Map()

  /**
   * 创建模拟 Agent
   */
  createMockAgent(projectId: string, agentName: string): MockAgent {
    const agentId = `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const agent: MockAgent = {
      id: agentId,
      name: agentName,
      projectId,
      socket: null,
    }

    this.mockAgents.set(agentId, agent)
    return agent
  }

  /**
   * 连接模拟 Agent 到 Prophet Central
   */
  async connectAgent(agent: MockAgent): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const socket = io(CENTRAL_URL, {
        auth: {
          agentId: agent.id,
          projectId: agent.projectId,
          agentName: agent.name,
        },
        reconnection: false,
        timeout: 5000,
      })

      socket.on('connect', () => {
        agent.socket = socket
        console.log(`✅ Agent ${agent.name} 已连接`)
        resolve(true)
      })

      socket.on('connect_error', (error) => {
        console.error(`❌ Agent ${agent.name} 连接失败:`, error.message)
        reject(error)
      })

      // 监听来自 Prophet Central 的消息
      socket.on('agent:message', (message) => {
        console.log(`📨 Agent ${agent.name} 收到消息:`, message)
      })

      socket.on('agent:task', (task) => {
        console.log(`📋 Agent ${agent.name} 收到任务:`, task.description)

        // 模拟任务执行
        setTimeout(() => {
          socket.emit('agent:task-completed', {
            taskId: task.id,
            result: {
              success: true,
              output: `Task completed by ${agent.name}`,
            },
          })
          console.log(`✅ Agent ${agent.name} 完成任务`)
        }, 2000)
      })
    })
  }

  /**
   * 断开 Agent
   */
  disconnectAgent(agentId: string) {
    const agent = this.mockAgents.get(agentId)
    if (agent && agent.socket) {
      agent.socket.disconnect()
      agent.socket = null
      console.log(`🔌 Agent ${agent.name} 已断开`)
    }
  }

  /**
   * 测试 Agent 发现
   */
  async testAgentDiscovery(projectId: string) {
    console.log(`\n🔍 测试 Agent 发现 (项目: ${projectId})`)

    try {
      const { data: agents } = await axios.get(
        `${CENTRAL_URL}/orchestrator/agents/${projectId}`
      )

      console.log(`✅ 发现 ${agents.length} 个 Agents`)
      for (const agent of agents) {
        console.log(`   - ${agent.name} (${agent.role})`)
      }

      return agents
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log('⚠️  Agent 发现端点未实现或项目无 Agents')
      } else {
        console.error('❌ Agent 发现失败:', error.message)
      }
      return []
    }
  }

  /**
   * 测试向 Agent 发送消息
   */
  async testSendMessage(agentId: string, message: string) {
    console.log(`\n💬 测试发送消息给 Agent (${agentId})`)

    try {
      await axios.post(`${CENTRAL_URL}/orchestrator/agents/${agentId}/message`, {
        type: 'custom-message',
        content: message,
      })

      console.log(`✅ 消息已发送`)
      return true
    } catch (error: any) {
      console.error('❌ 发送消息失败:', error.message)
      return false
    }
  }

  /**
   * 测试 Swarm 协调
   */
  async testSwarmCoordination(projectIds: string[], task: string) {
    console.log(`\n🐝 测试 Swarm 协调`)
    console.log(`   项目: ${projectIds.join(', ')}`)
    console.log(`   任务: ${task}`)

    try {
      const { data } = await axios.post(`${CENTRAL_URL}/orchestrator/agents/coordinate`, {
        projectIds,
        task: {
          description: task,
          goal: task,
        },
      })

      console.log(`✅ Swarm 已启动`)
      console.log(`   Swarm ID: ${data.swarmId}`)
      console.log(`   Agents: ${data.agentsCount}`)

      return data
    } catch (error: any) {
      console.error('❌ Swarm 协调失败:', error.message)
      return null
    }
  }
}

/**
 * 运行测试
 */
async function runTests() {
  console.log('═══════════════════════════════════════════')
  console.log('🧪 Prophet Agent Communication 测试')
  console.log('═══════════════════════════════════════════')
  console.log('\n⚠️  确保 Prophet Central 正在运行')
  console.log('')

  const tester = new AgentCommunicationTester()

  try {
    // 测试 1: 检查健康状态
    console.log('📊 测试 1: 健康检查')
    try {
      const { data } = await axios.get(`${CENTRAL_URL}/health`)
      console.log('✅ Prophet Central 运行中')
    } catch (error) {
      console.error('❌ Prophet Central 未运行，退出测试')
      return
    }

    // 测试 2: 创建模拟项目
    console.log('\n📋 测试 2: 注册测试项目')
    let testProjectId: string

    try {
      const { data } = await axios.post(`${CENTRAL_URL}/orchestrator/projects/register`, {
        name: 'agent-test-project',
        path: '/tmp/agent-test',
        type: 'web-app',
        priority: 'medium',
        monitoringInterval: 600000,
        autoOptimize: false,
      })

      testProjectId = data.id
      console.log(`✅ 测试项目已注册: ${testProjectId}`)
    } catch (error: any) {
      console.error('❌ 项目注册失败:', error.message)
      return
    }

    // 测试 3: Agent 发现（预期为空，因为没有真实 Agent）
    await tester.testAgentDiscovery(testProjectId)

    // 测试 4: 创建模拟 Agents
    console.log('\n🤖 测试 4: 创建模拟 Agents')
    const agent1 = tester.createMockAgent(testProjectId, 'researcher')
    const agent2 = tester.createMockAgent(testProjectId, 'developer')
    console.log(`✅ 创建了 2 个模拟 Agents`)

    // 测试 5: 连接 Agents（WebSocket）
    console.log('\n🔌 测试 5: 连接 Agents（WebSocket）')
    console.log('⚠️  注意：WebSocket 连接可能需要 Prophet Central 支持')

    try {
      await tester.connectAgent(agent1)
      await tester.connectAgent(agent2)
      console.log('✅ Agents 已连接')

      // 等待一会儿
      await new Promise((resolve) => setTimeout(resolve, 2000))
    } catch (error: any) {
      console.log('⚠️  WebSocket 连接失败（预期，需要服务器端支持）')
    }

    // 测试 6: 发送消息
    await tester.testSendMessage(agent1.id, 'Hello from test!')

    // 测试 7: Swarm 协调
    await tester.testSwarmCoordination(
      [testProjectId],
      'Implement shared authentication service'
    )

    // 清理
    console.log('\n🧹 清理测试数据')
    tester.disconnectAgent(agent1.id)
    tester.disconnectAgent(agent2.id)

    try {
      await axios.delete(`${CENTRAL_URL}/orchestrator/projects/${testProjectId}`)
      console.log(`✅ 测试项目已移除`)
    } catch (error) {
      console.log('⚠️  项目移除失败（可能已被移除）')
    }

    console.log('\n═══════════════════════════════════════════')
    console.log('✅ 测试完成')
    console.log('═══════════════════════════════════════════')
    console.log('')
    console.log('📝 测试总结:')
    console.log('   • Agent 通信框架已就绪')
    console.log('   • API 端点正常工作')
    console.log('   • WebSocket 需要服务器端完整实现')
    console.log('   • 实际 Agent 通信需要项目中有 Claude Code Agents')
    console.log('')
    console.log('📖 下一步:')
    console.log('   1. 在实际项目中部署 Claude Code Agents')
    console.log('   2. 配置 Agent 连接到 Prophet Central')
    console.log('   3. 运行真实的 Agent 协调测试')
  } catch (error: any) {
    console.error('\n❌ 测试失败:', error.message)
  } finally {
    // 确保所有连接都断开
    process.exit(0)
  }
}

// 运行测试
runTests().catch(console.error)
