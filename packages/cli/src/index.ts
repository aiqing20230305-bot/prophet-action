#!/usr/bin/env node

/**
 * Prophet CLI - AI-powered code evolution system
 *
 * Usage:
 *   prophet init      - Initialize Prophet in your project
 *   prophet start     - Start Prophet monitoring
 *   prophet status    - Check Prophet status
 *   prophet dashboard - Open Prophet dashboard
 */

import { program } from 'commander';
import chalk from 'chalk';
import { initCommand } from './commands/init.js';
import { startCommand } from './commands/start.js';
import { statusCommand } from './commands/status.js';
import { dashboardCommand } from './commands/dashboard.js';

// ASCII Art Banner
const banner = `
${chalk.cyan('╔═══════════════════════════════════════════════════════════╗')}
${chalk.cyan('║')}  ${chalk.bold.white('Prophet')} ${chalk.dim('- AI-Powered Code Evolution System')}        ${chalk.cyan('║')}
${chalk.cyan('║')}  ${chalk.dim('让AI 24/7自动优化你的代码')}                        ${chalk.cyan('║')}
${chalk.cyan('╚═══════════════════════════════════════════════════════════╝')}
`;

program
  .name('prophet')
  .description('Prophet - AI-powered code evolution system')
  .version('1.0.0')
  .addHelpText('beforeAll', banner);

// Commands
program
  .command('init')
  .description('Initialize Prophet in your project')
  .option('-p, --path <path>', 'Project path', process.cwd())
  .action(initCommand);

program
  .command('start')
  .description('Start Prophet monitoring and evolution')
  .option('-d, --daemon', 'Run as daemon in background')
  .option('-p, --port <port>', 'Dashboard port', '3001')
  .action(startCommand);

program
  .command('status')
  .description('Check Prophet running status')
  .option('-v, --verbose', 'Show detailed status')
  .action(statusCommand);

program
  .command('dashboard')
  .description('Open Prophet dashboard in browser')
  .option('-p, --port <port>', 'Dashboard port', '3001')
  .action(dashboardCommand);

// Parse command line arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
