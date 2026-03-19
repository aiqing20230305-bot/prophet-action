/**
 * Prophet Dashboard Command
 * Open Prophet dashboard in browser
 */

import chalk from 'chalk';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface DashboardOptions {
  port?: string;
}

export async function dashboardCommand(options: DashboardOptions) {
  const port = options.port || '3001';
  const url = `http://localhost:${port}`;

  console.log(chalk.cyan('\n🌐 Opening Prophet Dashboard...\n'));
  console.log(chalk.dim('URL:'), chalk.cyan(url));

  try {
    // Detect OS and open browser
    const platform = process.platform;
    let command: string;

    switch (platform) {
      case 'darwin': // macOS
        command = `open ${url}`;
        break;
      case 'win32': // Windows
        command = `start ${url}`;
        break;
      default: // Linux
        command = `xdg-open ${url} || sensible-browser ${url}`;
    }

    await execAsync(command);
    console.log(chalk.green('✅ Dashboard opened in browser\n'));

  } catch (error: any) {
    console.log(chalk.yellow('⚠️  Could not auto-open browser'));
    console.log(chalk.dim('Please manually open:'), chalk.cyan(url));
    console.log();
  }
}
