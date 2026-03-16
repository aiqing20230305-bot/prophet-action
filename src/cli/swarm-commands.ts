/**
 * Swarm CLI Commands
 *
 * Command-line interface for swarm intelligence predictions
 */

import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import type { PrismaClient } from '@prisma/client'
import type { Redis } from 'ioredis'
import { GlobalConsciousness } from '../consciousness/global-consciousness.js'

/**
 * Register swarm commands with CLI
 */
export function registerSwarmCommands(
  program: Command,
  db: PrismaClient,
  cache: Redis
): void {
  const consciousness = new GlobalConsciousness(db, cache)

  /**
   * prophet predict <query>
   *
   * Run swarm prediction
   */
  program
    .command('predict <query>')
    .description('Run swarm intelligence prediction')
    .option('-a, --agents <count>', 'Number of agents to spawn', '50')
    .option('-s, --steps <count>', 'Simulation steps', '100')
    .option('-p, --projects <ids>', 'Comma-separated project IDs')
    .action(async (query: string, options: any) => {
      const spinner = ora('Initializing swarm prediction...').start()

      try {
        const projectIds = options.projects?.split(',')
        const agentCount = parseInt(options.agents)
        const simulationSteps = parseInt(options.steps)

        spinner.text = `Spawning ${agentCount} agents...`

        const result = await consciousness.swarmPredict({
          query,
          projectIds,
          agentCount,
          simulationSteps
        })

        spinner.succeed('Swarm prediction complete!')

        // Display results
        console.log('\n' + chalk.cyan.bold('🔮 Prediction Results'))
        console.log(chalk.gray('─'.repeat(60)))
        console.log(chalk.white.bold('\nQuery: ') + query)
        console.log(chalk.white.bold('Prediction: ') + chalk.green(result.prediction))
        console.log(chalk.white.bold('Confidence: ') + chalk.yellow(`${(result.confidence * 100).toFixed(1)}%`))
        console.log(chalk.white.bold('Reasoning: ') + result.reasoning)

        if (result.patterns.length > 0) {
          console.log('\n' + chalk.cyan.bold('📊 Emergent Patterns:'))
          result.patterns.slice(0, 5).forEach((pattern: any, i: number) => {
            console.log(chalk.gray(`${i + 1}. `) + pattern.description)
            console.log(chalk.gray(`   Type: ${pattern.type}, Confidence: ${(pattern.confidence * 100).toFixed(1)}%`))
          })
        }

        if (result.affectedProjects.length > 0) {
          console.log('\n' + chalk.cyan.bold('🎯 Affected Projects:'))
          console.log(chalk.gray(`   ${result.affectedProjects.join(', ')}`))
        }

        console.log('\n')

      } catch (error: any) {
        spinner.fail('Prediction failed')
        console.error(chalk.red('\nError:'), error.message)
        process.exit(1)
      }
    })

  /**
   * prophet simulate-risk
   *
   * Run risk assessment simulation
   */
  program
    .command('simulate-risk')
    .description('Simulate risks with adversarial agents')
    .option('--scenario <name>', 'Risk scenario name', 'general-risk')
    .option('--adversarial', 'Use adversarial agents')
    .option('-s, --steps <count>', 'Simulation steps', '200')
    .action(async (options: any) => {
      const spinner = ora('Launching adversarial swarm...').start()

      try {
        spinner.text = 'Running risk simulation...'

        // Use swarm coordinator for risk assessment
        const result = await consciousness.swarmPredict({
          query: `Risk assessment for scenario: ${options.scenario}`,
          agentCount: options.adversarial ? 100 : 50,
          simulationSteps: parseInt(options.steps)
        })

        spinner.succeed('Risk simulation complete!')

        console.log('\n' + chalk.red.bold('⚠️  Risk Assessment Results'))
        console.log(chalk.gray('─'.repeat(60)))
        console.log(chalk.white.bold('Scenario: ') + options.scenario)
        console.log(chalk.white.bold('Risk Level: ') +
          (result.confidence > 0.7 ? chalk.green('LOW') :
           result.confidence > 0.4 ? chalk.yellow('MEDIUM') :
           chalk.red('HIGH')))

        if (result.patterns.length > 0) {
          console.log('\n' + chalk.red.bold('🚨 Identified Risks:'))
          result.patterns.forEach((pattern: any, i: number) => {
            if (pattern.type === 'conflict' || pattern.opposingAgents.length > 3) {
              console.log(chalk.gray(`${i + 1}. `) + chalk.red(pattern.description))
              console.log(chalk.gray(`   Severity: ${((1 - pattern.confidence) * 100).toFixed(1)}%`))
            }
          })
        }

        console.log('\n' + chalk.yellow.bold('💡 Recommendations:'))
        console.log(chalk.gray('   ') + result.prediction)
        console.log('\n')

      } catch (error: any) {
        spinner.fail('Risk simulation failed')
        console.error(chalk.red('\nError:'), error.message)
        process.exit(1)
      }
    })

  /**
   * prophet decide-tech <options>
   *
   * Multi-agent tech stack decision
   */
  program
    .command('decide-tech <options>')
    .description('Run multi-agent debate for tech decision')
    .option('--stakeholders <count>', 'Number of stakeholders', '10')
    .option('-s, --steps <count>', 'Debate rounds', '50')
    .action(async (options: string, cmdOptions: any) => {
      const spinner = ora('Assembling stakeholder panel...').start()

      try {
        spinner.text = 'Running tech decision debate...'

        const result = await consciousness.swarmPredict({
          query: `Technology decision: ${options}`,
          agentCount: parseInt(cmdOptions.stakeholders),
          simulationSteps: parseInt(cmdOptions.steps)
        })

        spinner.succeed('Decision reached!')

        console.log('\n' + chalk.blue.bold('🎯 Tech Stack Decision'))
        console.log(chalk.gray('─'.repeat(60)))
        console.log(chalk.white.bold('Options: ') + options)
        console.log(chalk.white.bold('Decision: ') + chalk.green(result.prediction))
        console.log(chalk.white.bold('Consensus Strength: ') +
          chalk.yellow(`${(result.confidence * 100).toFixed(1)}%`))

        if (result.patterns.length > 0) {
          console.log('\n' + chalk.blue.bold('💬 Debate Summary:'))

          const consensus = result.patterns.filter((p: any) => p.type === 'consensus')
          const conflicts = result.patterns.filter((p: any) => p.type === 'conflict')

          if (consensus.length > 0) {
            console.log(chalk.green('\n  ✓ Points of Agreement:'))
            consensus.forEach((p: any) => {
              console.log(chalk.gray(`    • ${p.description}`))
            })
          }

          if (conflicts.length > 0) {
            console.log(chalk.yellow('\n  ⚠ Points of Contention:'))
            conflicts.forEach((p: any) => {
              console.log(chalk.gray(`    • ${p.description}`))
            })
          }
        }

        console.log('\n' + chalk.cyan.bold('🎓 Reasoning:'))
        console.log(chalk.gray('   ') + result.reasoning)
        console.log('\n')

      } catch (error: any) {
        spinner.fail('Decision process failed')
        console.error(chalk.red('\nError:'), error.message)
        process.exit(1)
      }
    })

  /**
   * prophet predict-global <query>
   *
   * Cross-project global prediction
   */
  program
    .command('predict-global <query>')
    .description('Run global cross-project prediction')
    .option('-a, --agents <count>', 'Number of agents', '200')
    .action(async (query: string, options: any) => {
      const spinner = ora('Initiating global swarm...').start()

      try {
        spinner.text = 'Gathering knowledge from all projects...'

        const result = await consciousness.swarmPredict({
          query,
          agentCount: parseInt(options.agents),
          simulationSteps: 500  // More steps for global analysis
        })

        spinner.succeed('Global prediction complete!')

        console.log('\n' + chalk.magenta.bold('🌍 Global Prediction'))
        console.log(chalk.gray('─'.repeat(60)))
        console.log(chalk.white.bold('Query: ') + query)
        console.log(chalk.white.bold('Global Consensus: ') + chalk.green(result.prediction))
        console.log(chalk.white.bold('Confidence: ') + chalk.yellow(`${(result.confidence * 100).toFixed(1)}%`))

        if (result.affectedProjects.length > 0) {
          console.log('\n' + chalk.magenta.bold('📍 Affected Projects:'))
          console.log(chalk.gray(`   ${result.affectedProjects.length} projects will receive insights`))
        }

        console.log('\n' + chalk.cyan.bold('🧠 Global Analysis:'))
        console.log(chalk.gray('   ') + result.reasoning)

        if (result.patterns.length > 0) {
          console.log('\n' + chalk.cyan.bold('🌐 Cross-Project Patterns:'))
          result.patterns.slice(0, 5).forEach((pattern: any, i: number) => {
            console.log(chalk.gray(`${i + 1}. `) + pattern.description)
            console.log(chalk.gray(`   Confidence: ${(pattern.confidence * 100).toFixed(1)}%`))
          })
        }

        console.log('\n')

      } catch (error: any) {
        spinner.fail('Global prediction failed')
        console.error(chalk.red('\nError:'), error.message)
        process.exit(1)
      }
    })

  /**
   * prophet swarm-history
   *
   * View swarm simulation history
   */
  program
    .command('swarm-history')
    .description('View swarm simulation history')
    .option('--filter <criteria>', 'Filter by confidence threshold (e.g., ">0.8")')
    .option('-n, --limit <count>', 'Number of results', '10')
    .action(async (options: any) => {
      const spinner = ora('Loading swarm history...').start()

      try {
        const stats = await consciousness.swarmCoordinator.getSwarmStats()

        spinner.succeed('History loaded!')

        console.log('\n' + chalk.cyan.bold('📊 Swarm Simulation History'))
        console.log(chalk.gray('─'.repeat(60)))
        console.log(chalk.white.bold('Total Simulations: ') + stats.totalSimulations)
        console.log(chalk.white.bold('Average Confidence: ') +
          chalk.yellow(`${(stats.averageConfidence * 100).toFixed(1)}%`))
        console.log(chalk.white.bold('Active Swarms: ') + stats.activeSwarms)

        if (stats.recentSimulations.length > 0) {
          console.log('\n' + chalk.cyan.bold('Recent Simulations:'))

          const limit = parseInt(options.limit)
          const sims = stats.recentSimulations.slice(0, limit)

          sims.forEach((sim: any, i: number) => {
            // Apply filter if specified
            if (options.filter) {
              const threshold = parseFloat(options.filter.replace(/[><]/g, ''))
              const operator = options.filter[0]

              if (operator === '>' && sim.confidence <= threshold) return
              if (operator === '<' && sim.confidence >= threshold) return
            }

            console.log(chalk.gray(`\n${i + 1}. `) + chalk.white(sim.scenario))
            console.log(chalk.gray(`   Agents: ${sim.agentCount}, Confidence: ${(sim.confidence * 100).toFixed(1)}%`))
            console.log(chalk.gray(`   Date: ${new Date(sim.createdAt).toLocaleString()}`))
          })
        }

        console.log('\n')

      } catch (error: any) {
        spinner.fail('Failed to load history')
        console.error(chalk.red('\nError:'), error.message)
        process.exit(1)
      }
    })

  /**
   * prophet swarm-status
   *
   * View active swarms
   */
  program
    .command('swarm-status')
    .description('View active swarms status')
    .action(async () => {
      const spinner = ora('Checking active swarms...').start()

      try {
        const activeSwarms = await consciousness.getActiveSwarms()

        spinner.succeed(`Found ${activeSwarms.length} active swarms`)

        if (activeSwarms.length === 0) {
          console.log(chalk.gray('\nNo active swarms\n'))
          return
        }

        console.log('\n' + chalk.cyan.bold('🐝 Active Swarms'))
        console.log(chalk.gray('─'.repeat(60)))

        activeSwarms.forEach((swarm: any, i: number) => {
          console.log(chalk.white(`\n${i + 1}. `) + chalk.cyan(swarm.query))
          console.log(chalk.gray(`   Swarm ID: ${swarm.swarmId}`))
          console.log(chalk.gray(`   Agents: ${swarm.agentCount}`))
          console.log(chalk.gray(`   Projects: ${swarm.projectIds?.length || 0}`))
          console.log(chalk.gray(`   Created: ${new Date(swarm.createdAt).toLocaleString()}`))
        })

        console.log('\n')

      } catch (error: any) {
        spinner.fail('Failed to get swarm status')
        console.error(chalk.red('\nError:'), error.message)
        process.exit(1)
      }
    })
}

export default registerSwarmCommands
