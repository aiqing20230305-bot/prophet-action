/**
 * Prophet Status Command
 * Check Prophet running status
 */

import chalk from 'chalk';
import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import boxen from 'boxen';

interface StatusOptions {
  verbose?: boolean;
}

export async function statusCommand(options: StatusOptions) {
  console.log(chalk.cyan('\n🔮 Prophet Status\n'));

  try {
    // Check if Prophet Central is running
    let prophetProcess: any = null;
    try {
      const processes = execSync('ps aux | grep "prophet" | grep -v grep', {
        encoding: 'utf-8'
      });

      if (processes) {
        const lines = processes.trim().split('\n');
        prophetProcess = {
          count: lines.length,
          processes: lines
        };
      }
    } catch {
      // No processes found
    }

    // Check project initialization
    const projectPath = process.cwd();
    const prophetDir = join(projectPath, '.prophet');
    const isInitialized = existsSync(prophetDir);

    let config: any = null;
    if (isInitialized) {
      const configPath = join(prophetDir, 'config.json');
      if (existsSync(configPath)) {
        config = JSON.parse(readFileSync(configPath, 'utf-8'));
      }
    }

    // Read recent report
    let latestReport: any = null;
    if (isInitialized) {
      try {
        const reportData = readFileSync('/tmp/prophet-hourly-report.txt', 'utf-8');
        latestReport = {
          exists: true,
          preview: reportData.slice(0, 500)
        };
      } catch {
        // No report found
      }
    }

    // Build status display
    const statusLines: string[] = [];

    // Project status
    statusLines.push(chalk.bold('Project:'));
    if (isInitialized) {
      statusLines.push(`  ${chalk.green('✓')} Initialized: ${chalk.cyan(config?.projectName || 'Unknown')}`);
      statusLines.push(`  ${chalk.dim('Type:')} ${config?.projectType || 'unknown'}`);
      statusLines.push(`  ${chalk.dim('Version:')} ${config?.version || '1.0.0'}`);
    } else {
      statusLines.push(`  ${chalk.red('✗')} Not initialized`);
      statusLines.push(`  ${chalk.dim('Run')} ${chalk.cyan('prophet init')} ${chalk.dim('to get started')}`);
    }

    statusLines.push('');

    // Prophet Central status
    statusLines.push(chalk.bold('Prophet Central:'));
    if (prophetProcess && prophetProcess.count > 0) {
      statusLines.push(`  ${chalk.green('✓')} Running (${prophetProcess.count} process${prophetProcess.count > 1 ? 'es' : ''})`);

      if (options.verbose && prophetProcess.processes) {
        statusLines.push(chalk.dim('\n  Processes:'));
        prophetProcess.processes.forEach((proc: string) => {
          const parts = proc.trim().split(/\s+/);
          if (parts[1]) {
            statusLines.push(chalk.dim(`    PID ${parts[1]}: ${parts.slice(10).join(' ').slice(0, 60)}...`));
          }
        });
      }
    } else {
      statusLines.push(`  ${chalk.red('✗')} Not running`);
      statusLines.push(`  ${chalk.dim('Start with')} ${chalk.cyan('prophet start')}`);
    }

    statusLines.push('');

    // Recent activity
    if (latestReport && latestReport.exists) {
      statusLines.push(chalk.bold('Recent Activity:'));
      statusLines.push(`  ${chalk.green('✓')} Latest report available`);
      statusLines.push(`  ${chalk.dim('View full report:')} ${chalk.cyan('/tmp/prophet-hourly-report.txt')}`);

      if (options.verbose) {
        statusLines.push(chalk.dim('\n  Report preview:'));
        statusLines.push(chalk.dim(latestReport.preview.replace(/^/gm, '    ')));
      }
    } else {
      statusLines.push(chalk.bold('Recent Activity:'));
      statusLines.push(`  ${chalk.yellow('○')} No recent reports`);
    }

    // Display in box
    console.log(boxen(statusLines.join('\n'), {
      padding: 1,
      borderColor: 'cyan',
      borderStyle: 'round'
    }));

    // Quick actions
    console.log(chalk.dim('\nQuick actions:'));
    if (!isInitialized) {
      console.log(`  ${chalk.cyan('prophet init')} - Initialize Prophet`);
    } else if (!prophetProcess || prophetProcess.count === 0) {
      console.log(`  ${chalk.cyan('prophet start')} - Start monitoring`);
    } else {
      console.log(`  ${chalk.cyan('prophet dashboard')} - Open dashboard`);
      console.log(`  ${chalk.cyan('prophet status -v')} - Detailed status`);
    }
    console.log();

  } catch (error: any) {
    console.error(chalk.red('Error:'), error.message);
    process.exit(1);
  }
}
