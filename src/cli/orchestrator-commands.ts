/**
 * Prophet Orchestrator CLI Commands
 * 全局编排器命令行工具
 *
 * @module cli/orchestrator-commands
 * @prophet-component cli
 */

import { Command } from 'commander'
import axios from 'axios'

/**
 * 创建 HTTP 客户端
 */
function createClient(baseURL: string = 'http://localhost:3001') {
  return axios.create({ baseURL, timeout: 10000 })
}

/**
 * 注册编排器命令
 */
export function registerOrchestratorCommands(program: Command): void {
  const orchestrator = program
    .command('orchestrator')
    .alias('orch')
    .description('Manage Prophet Global Orchestrator')

  // 状态命令
  orchestrator
    .command('status')
    .description('Show global orchestrator status')
    .action(async () => {
      const client = createClient()
      try {
        const { data: status } = await client.get('/orchestrator/status')
        console.log('\n🔮 Prophet Global Orchestrator Status\n')
        console.log(`Running: ${status.isRunning ? '✅' : '❌'}`)
        console.log(`Projects: ${status.projectCount} (${status.activeProjects} active)`)
        console.log(`\nScheduler:`)
        console.log(`  Active Tasks: ${status.scheduler.activeTaskCount}`)
        console.log(`  Queued Tasks: ${status.scheduler.queuedTaskCount}`)
        console.log(`  Concurrency Limit: ${status.scheduler.concurrencyLimit}`)
        console.log(`\nDeveloper:`)
        console.log(`  Active: ${status.developer.activeTasks}`)
        console.log(`  Available Slots: ${status.developer.availableSlots}`)

        if (status.agentHub) {
          console.log(`\nAgent Hub:`)
          console.log(`  Total Agents: ${status.agentHub.totalAgents}`)
          console.log(`  Connected: ${status.agentHub.connectedAgents}`)
          console.log(`  Projects: ${status.agentHub.projects}`)
        }
      } catch (error) {
        console.error('Error:', error instanceof Error ? error.message : error)
      }
    })

  // 项目命令
  const projects = program
    .command('projects')
    .alias('proj')
    .description('Manage projects')

  projects
    .command('list')
    .description('List all registered projects')
    .action(async () => {
      const client = createClient()
      try {
        const { data: projects } = await client.get('/orchestrator/projects')
        console.log('\n📋 Registered Projects\n')

        for (const project of projects) {
          console.log(`${project.name} (${project.id})`)
          console.log(`  Type: ${project.type}`)
          console.log(`  Priority: ${project.priority}`)
          console.log(`  Status: ${project.status}`)
          console.log(`  Health: ${project.health}`)
          console.log(`  Last Heartbeat: ${new Date(project.lastHeartbeat).toLocaleString()}`)
          console.log('')
        }
      } catch (error) {
        console.error('Error:', error instanceof Error ? error.message : error)
      }
    })

  // 项目注册命令
  const projectCommand = program
    .command('project')
    .description('Project management')

  projectCommand
    .command('add <path>')
    .description('Register a new project')
    .option('-n, --name <name>', 'Project name')
    .option('-t, --type <type>', 'Project type (web-app, api, cli, library)', 'web-app')
    .option('-p, --priority <priority>', 'Priority (critical, high, medium, low)', 'medium')
    .option('--interval <ms>', 'Monitoring interval in milliseconds', '300000')
    .option('--auto-optimize', 'Enable auto optimization', false)
    .action(async (path: string, options: any) => {
      const client = createClient()

      const projectName = options.name || path.split('/').pop()

      try {
        const { data: result } = await client.post('/orchestrator/projects/register', {
          name: projectName,
          path,
          type: options.type,
          priority: options.priority,
          monitoringInterval: parseInt(options.interval),
          autoOptimize: options.autoOptimize,
        })

        console.log(`✅ Project registered: ${projectName}`)
        console.log(`   ID: ${result.id}`)
      } catch (error) {
        console.error('Error:', error instanceof Error ? error.message : error)
      }
    })

  projectCommand
    .command('remove <id>')
    .description('Unregister a project')
    .action(async (id: string) => {
      const client = createClient()
      try {
        await client.delete(`/orchestrator/projects/${id}`)
        console.log(`✅ Project unregistered: ${id}`)
      } catch (error) {
        console.error('Error:', error instanceof Error ? error.message : error)
      }
    })

  // 心跳命令
  program
    .command('heartbeat')
    .description('Trigger heartbeat for projects')
    .option('--all', 'Trigger for all projects', false)
    .option('--project <id>', 'Trigger for specific project')
    .action(async (options: any) => {
      const client = createClient()
      try {
        if (options.all) {
          await client.post('/orchestrator/heartbeat')
          console.log('✅ Heartbeat triggered for all projects')
        } else if (options.project) {
          await client.post(`/orchestrator/heartbeat/${options.project}`)
          console.log(`✅ Heartbeat triggered for project: ${options.project}`)
        } else {
          console.error('Please specify --all or --project <id>')
        }
      } catch (error) {
        console.error('Error:', error instanceof Error ? error.message : error)
      }
    })

  // 开发命令
  program
    .command('develop')
    .description('Trigger development coordination')
    .option('--cross-project', 'Enable cross-project development', false)
    .option('--project <id>', 'Develop for specific project')
    .action(async (options: any) => {
      const client = createClient()
      try {
        if (options.crossProject) {
          await client.post('/orchestrator/develop/cross-project')
          console.log('✅ Cross-project development triggered')
        } else if (options.project) {
          await client.post(`/orchestrator/develop/${options.project}`)
          console.log(`✅ Development triggered for project: ${options.project}`)
        } else {
          console.error('Please specify --cross-project or --project <id>')
        }
      } catch (error) {
        console.error('Error:', error instanceof Error ? error.message : error)
      }
    })

  // Agent 命令
  const agent = program
    .command('agent')
    .description('Agent communication')

  agent
    .command('list')
    .option('--project <id>', 'List agents for specific project')
    .description('List discovered agents')
    .action(async (options: any) => {
      const client = createClient()
      try {
        const endpoint = options.project
          ? `/orchestrator/agents/${options.project}`
          : '/orchestrator/agents'

        const { data: agents } = await client.get(endpoint)

        console.log('\n🤖 Discovered Agents\n')

        for (const agent of agents) {
          console.log(`${agent.name} (${agent.agentId})`)
          console.log(`  Project: ${agent.projectId}`)
          console.log(`  Role: ${agent.role}`)
          console.log(`  Status: ${agent.status}`)
          console.log(`  Capabilities: ${agent.capabilities.join(', ')}`)
          console.log('')
        }
      } catch (error) {
        console.error('Error:', error instanceof Error ? error.message : error)
      }
    })

  agent
    .command('send <agentId> <message>')
    .description('Send message to agent')
    .action(async (agentId: string, message: string) => {
      const client = createClient()
      try {
        await client.post(`/orchestrator/agents/${agentId}/message`, {
          type: 'custom-message',
          content: message,
        })
        console.log(`✅ Message sent to agent: ${agentId}`)
      } catch (error) {
        console.error('Error:', error instanceof Error ? error.message : error)
      }
    })

  agent
    .command('coordinate')
    .description('Coordinate cross-project agent swarm')
    .requiredOption('--projects <ids>', 'Comma-separated project IDs')
    .requiredOption('--task <description>', 'Task description')
    .action(async (options: any) => {
      const client = createClient()
      try {
        const projectIds = options.projects.split(',').map((id: string) => id.trim())

        const { data: result } = await client.post('/orchestrator/agents/coordinate', {
          projectIds,
          task: {
            description: options.task,
            goal: options.task,
          },
        })

        console.log(`✅ Swarm coordination started`)
        console.log(`   Swarm ID: ${result.swarmId}`)
        console.log(`   Agents: ${result.agentsCount}`)
      } catch (error) {
        console.error('Error:', error instanceof Error ? error.message : error)
      }
    })
}
