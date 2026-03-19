/**
 * Prophet Start Command
 * Start Prophet monitoring and evolution
 */

import chalk from 'chalk';
import ora from 'ora';
import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

interface StartOptions {
  daemon?: boolean;
  port?: string;
}

export async function startCommand(options: StartOptions) {
  console.log(chalk.cyan('\n🚀 Starting Prophet...\n'));

  const projectPath = process.cwd();
  const prophetDir = join(projectPath, '.prophet');

  // Check if initialized
  if (!existsSync(prophetDir)) {
    console.log(chalk.red('❌ Prophet not initialized'));
    console.log(chalk.dim('Run'), chalk.cyan('prophet init'), chalk.dim('first'));
    process.exit(1);
  }

  const spinner = ora('Launching Prophet Central...').start();

  try {
    // Start Prophet Central
    const prophetCentral = spawn('npx', [
      'tsx',
      join(__dirname, '../../../src/index.ts')
    ], {
      detached: options.daemon,
      stdio: options.daemon ? 'ignore' : 'inherit',
      env: {
        ...process.env,
        PROPHET_PROJECT_PATH: projectPath,
        PROPHET_PORT: options.port || '3001'
      }
    });

    if (options.daemon) {
      prophetCentral.unref();
      spinner.succeed(`Prophet started in background (PID: ${prophetCentral.pid})`);

      console.log(chalk.green('\n✅ Prophet is now running!\n'));
      console.log(chalk.dim('Dashboard:'), chalk.cyan(`http://localhost:${options.port || '3001'}`));
      console.log(chalk.dim('Check status:'), chalk.cyan('prophet status'));
      console.log(chalk.dim('Stop:'), chalk.cyan('pkill -f prophet'));
      console.log();
    } else {
      spinner.succeed('Prophet started');
      console.log(chalk.green('\n✅ Prophet is monitoring your code...\n'));
      console.log(chalk.dim('Press Ctrl+C to stop'));
      console.log();
    }

  } catch (error: any) {
    spinner.fail('Failed to start Prophet');
    console.error(chalk.red('Error:'), error.message);
    process.exit(1);
  }
}
