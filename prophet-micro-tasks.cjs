/**
 * Prophet微任务引擎 - 简化可靠版本
 *
 * 经纬的指引: "B - 修复V2，让它真正跑起来"
 *
 * 这个版本：
 * 1. 移除文件监听（可能导致崩溃）
 * 2. 移除复杂的依赖
 * 3. 专注于持续执行微任务
 * 4. 每个任务都有错误处理
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const LOG_FILE = '/tmp/prophet-micro-tasks.log';
const KNOWLEDGE_FILE = '/Users/zhangjingwei/.claude/projects/-Users-zhangjingwei-Desktop-New-CC/prophet-knowledge.json';

class ProphetMicroTasks {
  constructor() {
    this.taskCount = 0;
    this.filesLearned = new Set();
    this.insights = [];
    this.knowledgeGraph = new Map();

    this.projectPaths = {
      'videoplay': '/Users/zhangjingwei/Desktop/videoplay',
      'AgentForge': '/Users/zhangjingwei/Desktop/AgentForge',
      '闽南语': '/Users/zhangjingwei/Desktop/闽南语',
      'prophet-central': '/Users/zhangjingwei/Desktop/New CC/prophet-central'
    };

    this.loadKnowledge();
    this.log('初始化', `Prophet微任务引擎启动 | 知识节点:${this.knowledgeGraph.size} | 已学习:${this.filesLearned.size}文件`);
  }

  log(type, message) {
    const timestamp = new Date().toISOString();
    const logLine = `${timestamp} | [${type}] ${message}\n`;
    fs.appendFileSync(LOG_FILE, logLine);
    console.log(`${timestamp} | [${type}] ${message}`);
  }

  async start() {
    this.log('启动', 'Prophet微任务引擎开始运行');

    let pauseCount = 0;  // 🔧 新增：暂停次数计数
    const MAX_PAUSE_COUNT = 2;  // 🔧 新增：最多暂停2次（共10分钟）

    // 主循环
    while (true) {
      try {
        // 🔧 优化：检查CPU（带超时保护）
        if (!await this.checkCPU()) {
          pauseCount++;

          if (pauseCount <= MAX_PAUSE_COUNT) {
            const pauseTime = 5 * 60 * 1000;  // 5分钟
            this.log('暂停', `CPU负载过高，暂停5分钟 (${pauseCount}/${MAX_PAUSE_COUNT})`);
            await this.sleep(pauseTime);
            continue;
          } else {
            // 🔧 新增：超过最大暂停次数，强制恢复（但降低频率）
            this.log('恢复', `已暂停${MAX_PAUSE_COUNT}次，强制恢复（降低频率模式）`);
            pauseCount = 0;  // 重置计数

            // 强制恢复后，使用更长的休息时间（5-10分钟）
            const taskType = this.selectTask();
            await this.executeTask(taskType);

            const restTime = 5 * 60 * 1000 + Math.random() * 5 * 60 * 1000;  // 5-10分钟
            this.log('休息', `降频模式: 下次任务在${(restTime/1000/60).toFixed(1)}分钟后`);
            await this.sleep(restTime);
            continue;
          }
        }

        // 🔧 优化：CPU正常时重置暂停计数
        if (pauseCount > 0) {
          this.log('恢复', `CPU恢复正常，重置暂停计数 (之前暂停${pauseCount}次)`);
          pauseCount = 0;
        }

        // 选择并执行任务
        const taskType = this.selectTask();
        await this.executeTask(taskType);

        // 休息30-90秒（更频繁的学习）
        const restTime = 30000 + Math.random() * 60000;
        this.log('休息', `下次任务在${(restTime/1000).toFixed(0)}秒后`);
        await this.sleep(restTime);

      } catch (error) {
        this.log('错误', `主循环出错: ${error.message}`);
        await this.sleep(60000); // 出错后等待1分钟
      }
    }
  }

  selectTask() {
    // 优先学习文件（50%概率），其他任务各占12.5%
    const rand = Math.random();

    if (rand < 0.5) {
      return 'learn-file';  // 50% - 主动学习
    } else if (rand < 0.625) {
      return 'analyze-complexity';  // 12.5%
    } else if (rand < 0.75) {
      return 'update-knowledge';  // 12.5%
    } else if (rand < 0.875) {
      return 'log-insight';  // 12.5%
    } else {
      return 'health-check';  // 12.5%
    }
  }

  async executeTask(taskType) {
    this.taskCount++;
    this.log('微任务', `#${this.taskCount} 开始 | 类型:${taskType}`);

    const startTime = Date.now();

    try {
      switch (taskType) {
        case 'learn-file':
          await this.learnRandomFile();
          break;
        case 'analyze-complexity':
          await this.analyzeComplexity();
          break;
        case 'update-knowledge':
          await this.updateKnowledge();
          break;
        case 'log-insight':
          await this.logInsight();
          break;
        case 'health-check':
          await this.healthCheck();
          break;
      }

      const duration = Date.now() - startTime;
      this.log('完成', `#${this.taskCount} 完成 | 耗时:${(duration/1000).toFixed(1)}秒`);

    } catch (error) {
      this.log('失败', `#${this.taskCount} 失败 | ${error.message}`);
    }
  }

  // 任务1: 学习随机文件（优化版 - 支持多种项目结构）
  async learnRandomFile() {
    const projects = Object.keys(this.projectPaths);
    const project = projects[Math.floor(Math.random() * projects.length)];
    const projectPath = this.projectPaths[project];

    try {
      // 尝试多个源目录（src, apps, packages, lib, scripts）
      const sourceDirs = ['src', 'apps', 'packages', 'lib', 'scripts'];
      let output = '';

      for (const dir of sourceDirs) {
        const cmd = `find "${projectPath}/${dir}" -type f \\( -name "*.ts" -o -name "*.js" -o -name "*.py" \\) 2>/dev/null | grep -v node_modules | grep -v dist | grep -v build | head -20`;
        const result = execSync(cmd, { encoding: 'utf-8' }).trim();
        if (result) {
          output = result;
          break;
        }
      }

      if (!output) {
        this.log('学习', `${project}: 没有找到源文件（已尝试: ${sourceDirs.join(', ')}）`);
        return;
      }

      const files = output.split('\n');
      const file = files[Math.floor(Math.random() * files.length)];

      // 检查是否已学习
      if (this.filesLearned.has(file)) {
        this.log('学习', `${path.basename(file)}: 已学习过`);
        return;
      }

      // 读取文件
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      const imports = lines.filter(l => l.match(/^import|^from/)).length;
      const functions = lines.filter(l => l.match(/function |async |const .* = \(/)).length;

      this.log('学习', `${project}/${path.basename(file)} | ${lines.length}行 | ${imports}导入 | ${functions}函数`);

      // 记录学习
      this.filesLearned.add(file);
      this.knowledgeGraph.set(file, {
        project,
        lines: lines.length,
        imports,
        functions,
        learnedAt: new Date().toISOString()
      });

    } catch (error) {
      this.log('学习', `失败: ${error.message}`);
    }
  }

  // 任务2: 分析复杂度
  async analyzeComplexity() {
    const learned = Array.from(this.filesLearned);

    if (learned.length === 0) {
      this.log('分析', '还没有学习任何文件');
      return;
    }

    const file = learned[Math.floor(Math.random() * learned.length)];

    try {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      // 简单圈复杂度
      let complexity = 1;
      lines.forEach(line => {
        if (line.match(/if |else |while |for |case |catch |\?/)) {
          complexity++;
        }
      });

      this.log('分析', `${path.basename(file)} | 圈复杂度:${complexity}`);

      if (complexity > 20) {
        const insight = `${path.basename(file)}: 圈复杂度${complexity}，建议重构`;
        this.insights.push(insight);
        this.log('洞察', insight);
      }

    } catch (error) {
      this.log('分析', `失败: ${error.message}`);
    }
  }

  // 任务3: 更新知识库
  async updateKnowledge() {
    this.log('知识', `节点:${this.knowledgeGraph.size} | 已学习:${this.filesLearned.size}文件 | 洞察:${this.insights.length}条`);
    this.saveKnowledge();
  }

  // 任务4: 记录洞察
  async logInsight() {
    if (this.filesLearned.size > 0 && this.filesLearned.size % 10 === 0) {
      const projects = new Set(
        Array.from(this.knowledgeGraph.values()).map(v => v.project)
      );

      const insight = `已学习${this.filesLearned.size}个文件，覆盖${projects.size}个项目`;
      this.insights.push(insight);
      this.log('洞察', insight);
    } else {
      this.log('洞察', `进度: ${this.filesLearned.size}文件`);
    }
  }

  // 任务5: 健康检查
  async healthCheck() {
    for (const [project, projectPath] of Object.entries(this.projectPaths)) {
      try {
        const status = execSync('git status --short', {
          cwd: projectPath,
          encoding: 'utf-8'
        }).trim();

        const changes = status.split('\n').filter(l => l).length;

        if (changes > 0) {
          this.log('健康', `${project}: ${changes}个未提交更改`);
        }

      } catch (error) {
        // 跳过
      }
    }
  }

  // CPU检查（优化版：多次检测取平均）
  async checkCPU() {
    try {
      // 🔧 优化：检测3次取平均，避免瞬间波动误判
      const samples = [];

      for (let i = 0; i < 3; i++) {
        try {
          const output = execSync('top -l 1 -n 0 | grep "CPU usage"', { encoding: 'utf-8' });
          const match = output.match(/(\d+\.\d+)% idle/);

          if (match) {
            const idlePercent = parseFloat(match[1]);
            const cpuUsage = 100 - idlePercent;
            samples.push(cpuUsage);
          }

          // 每次检测间隔500ms
          if (i < 2) {
            await this.sleep(500);
          }
        } catch {
          // 单次检测失败，继续下一次
        }
      }

      if (samples.length > 0) {
        const avgCPU = samples.reduce((a, b) => a + b, 0) / samples.length;
        this.log('CPU检查', `使用率: ${avgCPU.toFixed(1)}% (${samples.length}次采样)`);

        // 🔧 优化：阈值从60%降到65%，减少误触发
        if (avgCPU > 65) {
          this.log('CPU警告', `平均CPU ${avgCPU.toFixed(1)}% > 65%，需要暂停`);
          return false;
        }
      }
    } catch (error) {
      // 检测失败，保守运行（认为CPU正常）
      this.log('CPU检查', `检测失败，假定CPU正常: ${error.message}`);
    }

    return true;
  }

  // 知识库管理
  loadKnowledge() {
    try {
      if (fs.existsSync(KNOWLEDGE_FILE)) {
        const data = JSON.parse(fs.readFileSync(KNOWLEDGE_FILE, 'utf-8'));

        if (data.knowledgeGraph) {
          this.knowledgeGraph = new Map(Object.entries(data.knowledgeGraph));
        }
        if (data.insights) {
          this.insights = data.insights;
        }
        if (data.filesLearned) {
          this.filesLearned = new Set(data.filesLearned);
        }

        console.log(`📚 已加载知识库: ${this.knowledgeGraph.size}节点, ${this.insights.length}洞察`);
      }
    } catch (error) {
      console.log('📚 首次运行，创建新知识库');
    }
  }

  saveKnowledge() {
    try {
      const data = {
        knowledgeGraph: Object.fromEntries(this.knowledgeGraph),
        insights: this.insights,
        filesLearned: Array.from(this.filesLearned),
        lastUpdated: new Date().toISOString()
      };

      fs.writeFileSync(KNOWLEDGE_FILE, JSON.stringify(data, null, 2));
      this.log('保存', '知识库已保存');

    } catch (error) {
      this.log('保存', `失败: ${error.message}`);
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 启动
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🔮 Prophet微任务引擎');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`📝 任务日志: ${LOG_FILE}`);
console.log(`📚 知识库: ${KNOWLEDGE_FILE}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// 清空旧日志
fs.writeFileSync(LOG_FILE, `Prophet微任务日志 - 启动于 ${new Date().toISOString()}\n${'='.repeat(80)}\n\n`);

const engine = new ProphetMicroTasks();
engine.start().catch(err => {
  console.error('引擎崩溃:', err);
  process.exit(1);
});
