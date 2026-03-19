/**
 * Prophet Init Command
 * Initialize Prophet in a project
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

interface InitOptions {
  path?: string;
}

export async function initCommand(options: InitOptions) {
  console.log(chalk.cyan('\n🔮 Initializing Prophet...\n'));

  const projectPath = options.path || process.cwd();

  // Check if already initialized
  const prophetDir = join(projectPath, '.prophet');
  if (existsSync(prophetDir)) {
    console.log(chalk.yellow('⚠️  Prophet is already initialized in this project'));

    const { overwrite } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'overwrite',
        message: 'Overwrite existing configuration?',
        default: false
      }
    ]);

    if (!overwrite) {
      console.log(chalk.dim('Cancelled.'));
      return;
    }
  }

  // Interactive configuration
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'projectName',
      message: 'Project name:',
      default: require('path').basename(projectPath)
    },
    {
      type: 'list',
      name: 'projectType',
      message: 'Project type:',
      choices: [
        { name: 'Web App (React/Vue/Next.js)', value: 'web-app' },
        { name: 'Node.js API', value: 'api' },
        { name: 'Full Stack', value: 'fullstack' },
        { name: 'Library/Package', value: 'library' },
        { name: 'Other', value: 'other' }
      ]
    },
    {
      type: 'checkbox',
      name: 'features',
      message: 'Enable features:',
      choices: [
        { name: 'Auto-fix TODOs and FIXMEs', value: 'auto-todo', checked: true },
        { name: 'Code refactoring', value: 'refactoring', checked: true },
        { name: 'Performance optimization', value: 'performance', checked: true },
        { name: 'Test generation', value: 'testing', checked: false },
        { name: 'Documentation generation', value: 'docs', checked: false }
      ]
    },
    {
      type: 'list',
      name: 'scanInterval',
      message: 'Code scan interval:',
      choices: [
        { name: 'Every minute (aggressive)', value: 60000 },
        { name: 'Every 3 minutes (recommended)', value: 180000 },
        { name: 'Every 5 minutes (conservative)', value: 300000 },
        { name: 'Every 10 minutes (relaxed)', value: 600000 }
      ],
      default: 180000
    }
  ]);

  // Create Prophet directory structure
  const spinner = ora('Creating Prophet configuration...').start();

  try {
    // Create .prophet directory
    if (!existsSync(prophetDir)) {
      mkdirSync(prophetDir, { recursive: true });
    }

    // Create subdirectories
    mkdirSync(join(prophetDir, 'history'), { recursive: true });
    mkdirSync(join(prophetDir, 'reports'), { recursive: true });
    mkdirSync(join(prophetDir, 'cache'), { recursive: true });

    // Write config file
    const config = {
      projectName: answers.projectName,
      projectType: answers.projectType,
      features: answers.features,
      scanInterval: answers.scanInterval,
      createdAt: new Date().toISOString(),
      version: '1.0.0'
    };

    writeFileSync(
      join(prophetDir, 'config.json'),
      JSON.stringify(config, null, 2)
    );

    // Write .gitignore
    writeFileSync(
      join(prophetDir, '.gitignore'),
      `cache/
*.log
*.tmp
reports/
`
    );

    spinner.succeed('Prophet initialized successfully!');

    // Success message
    console.log(chalk.green('\n✅ Setup complete!\n'));
    console.log(chalk.dim('Next steps:'));
    console.log(chalk.cyan('  1.') + ' Run ' + chalk.bold('prophet start') + ' to begin monitoring');
    console.log(chalk.cyan('  2.') + ' Run ' + chalk.bold('prophet dashboard') + ' to view real-time stats');
    console.log(chalk.cyan('  3.') + ' Check ' + chalk.bold('.prophet/reports/') + ' for evolution reports');
    console.log();

  } catch (error: any) {
    spinner.fail('Initialization failed');
    console.error(chalk.red('Error:'), error.message);
    process.exit(1);
  }
}
