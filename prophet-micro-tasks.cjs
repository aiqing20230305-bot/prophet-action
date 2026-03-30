/**
 * REFACTORED by Prophet Phase 14 (Mock)
 * Duplication removed: 1 blocks, 10 lines
 * Severity: low
 */

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
    // 优先学习文件（42%概率），其他任务各占10-12%，信息雷达5%，智能分析3%，自动合并2%，自我重构1%
    const rand = Math.random();

    if (rand < 0.42) {
      return 'learn-file';  // 42% - 主动学习（略微降低）
    } else if (rand < 0.54) {
      return 'analyze-complexity';  // 12%
    } else if (rand < 0.66) {
      return 'update-knowledge';  // 12%
    } else if (rand < 0.78) {
      return 'log-insight';  // 12%
    } else if (rand < 0.89) {
      return 'health-check';  // 11%
    } else if (rand < 0.94) {
      return 'world-scout';  // 5% - 信息雷达（约每小时1次）
    } else if (rand < 0.97) {
      return 'analyze-intelligence';  // 3% - 智能分析（约每2小时1次）
    } else if (rand < 0.99) {
      return 'auto-action';  // 2% - Phase 11自动合并（discovery→code→test→PR→merge，约每3小时1次）
    } else {
      return 'self-refactor';  // 1% - Phase 13自我重构（分析→报告，约每6小时1次）
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
        case 'world-scout':
          await this.runWorldScout();
          break;
        case 'analyze-intelligence':
          await this.runIntelligenceAnalysis();
          break;
        case 'auto-action':
          await this.runAutoAction();
          break;
        case 'self-refactor':
          await this.runSelfRefactor();
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

        // Phase 13: 持久化重构issue
        await this.recordRefactorIssue({
          file,
          type: 'high_complexity',
          complexity,
          threshold: 20,
          timestamp: new Date().toISOString(),
          status: 'pending'
        });
      }

    } catch (error) {
      this.log('分析', `失败: ${error.message}`);
    }
  }

  // Phase 13: 记录重构issue到持久化存储
  async recordRefactorIssue(issue) {
    const issuesPath = path.join(process.env.HOME, '.claude/prophet-self-analysis/issues.json');

    try {
      // 读取现有issues
      let issues = [];
      if (fs.existsSync(issuesPath)) {
        const content = fs.readFileSync(issuesPath, 'utf-8');
        issues = JSON.parse(content);
      }

      // 去重（同一文件只保留最新issue）
      issues = issues.filter(i => i.file !== issue.file);
      issues.push(issue);

      // 写回
      const dir = path.dirname(issuesPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(issuesPath, JSON.stringify(issues, null, 2));

      this.log('自我分析', `记录重构issue: ${path.basename(issue.file)} (复杂度${issue.complexity})`);

    } catch (error) {
      this.log('自我分析', `记录issue失败: ${error.message}`);
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

  // 任务6: 信息雷达 - 收集全球科技动态
  async runWorldScout() {
    const scoutPath = this.projectPaths['prophet-central'];

    try {
      this.log('雷达', '🌍 启动信息雷达，扫描全球科技动态...');

      // 执行WorldScout收集
      const output = execSync('npx tsx test-scout.ts', {
        cwd: scoutPath,
        encoding: 'utf-8',
        timeout: 60000  // 60秒超时
      });

      // 解析输出，提取关键信息
      const lines = output.split('\n');
      let itemCount = 0;
      let aiCount = 0;
      let relevantCount = 0;

      for (const line of lines) {
        if (line.includes('✅') && line.includes('条')) {
          const match = line.match(/(\d+)条/);
          if (match) itemCount = parseInt(match[1]);
        }
        if (line.includes('AI相关项目:')) {
          const match = line.match(/(\d+)条/);
          if (match) aiCount = parseInt(match[1]);
        }
        if (line.includes('与业务相关:')) {
          const match = line.match(/(\d+)条/);
          if (match) relevantCount = parseInt(match[1]);
        }
      }

      this.log('雷达', `✅ 收集完成: ${itemCount}条新闻 | AI相关:${aiCount}条 | 业务相关:${relevantCount}条`);

      // 读取存储的数据统计
      const scoutDataPath = path.join(process.env.HOME, '.claude/prophet-scout/items.json');
      if (fs.existsSync(scoutDataPath)) {
        const scoutData = JSON.parse(fs.readFileSync(scoutDataPath, 'utf-8'));
        this.log('雷达', `📊 数据库: 共${scoutData.length}条记录`);

        // 记录洞察
        if (itemCount > 0) {
          const insight = `信息雷达: 发现${itemCount}条新科技动态（AI:${aiCount}, 业务相关:${relevantCount}）`;
          this.insights.push(insight);
        }
      }

    } catch (error) {
      this.log('雷达', `❌ 收集失败: ${error.message}`);
    }
  }

  // 任务7: 智能分析 - 分析信息价值
  async runIntelligenceAnalysis() {
    const scoutPath = this.projectPaths['prophet-central'];

    try {
      this.log('分析', '🧠 启动智能分析引擎...');

      // 执行智能分析
      const output = execSync('npx tsx test-intelligence-analyzer.ts 2>&1', {
        cwd: scoutPath,
        encoding: 'utf-8',
        timeout: 60000  // 60秒超时
      });

      // 解析输出，提取关键信息
      const lines = output.split('\n');
      let totalItems = 0;
      let p0Count = 0;
      let p1Count = 0;
      let avgRelevance = 0;

      for (const line of lines) {
        if (line.includes('总条目:')) {
          const match = line.match(/(\d+)/);
          if (match) totalItems = parseInt(match[1]);
        }
        if (line.includes('P0 (紧急且重要):')) {
          const match = line.match(/(\d+)条/);
          if (match) p0Count = parseInt(match[1]);
        }
        if (line.includes('P1 (重要不紧急):')) {
          const match = line.match(/(\d+)条/);
          if (match) p1Count = parseInt(match[1]);
        }
        if (line.includes('平均相关度:')) {
          const match = line.match(/(\d+)分/);
          if (match) avgRelevance = parseInt(match[1]);
        }
      }

      this.log('分析', `✅ 分析完成: ${totalItems}条 | P0:${p0Count}条 | P1:${p1Count}条 | 平均相关度:${avgRelevance}分`);

      // 读取分析报告
      const reportPath = path.join(process.env.HOME, '.claude/prophet-analysis/latest.json');
      if (fs.existsSync(reportPath)) {
        const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));

        // 记录P0项目洞察
        if (p0Count > 0 && report.topItems && report.topItems.length > 0) {
          const p0Items = report.topItems.filter(item => item.priority === 'P0');
          if (p0Items.length > 0) {
            const topP0 = p0Items[0];
            const insight = `🔴 发现P0项目: ${topP0.item.title} (相关度${topP0.relevanceScore}分)`;
            this.insights.push(insight);
            this.log('洞察', insight);
          }
        }

        this.log('分析', `📊 报告已保存: ${reportPath}`);
      }

    } catch (error) {
      this.log('分析', `❌ 分析失败: ${error.message}`);
    }
  }

  // 任务8: 自动执行（Phase 12）
  async runAutoAction() {
    const scoutPath = this.projectPaths['prophet-central'];

    try {
      // Phase 12: 检查是否暂停
      const pauseFlagPath = require('path').join(require('os').homedir(), '.claude', 'prophet-auto-merge-paused');
      if (fs.existsSync(pauseFlagPath)) {
        this.log('执行', '⏸️  Auto-merge已暂停，跳过');
        return;
      }

      this.log('执行', '🔮 启动自动合并引擎 (Phase 12: 监控+回滚)...');

      // Phase 12: 自动合并+监控+回滚引擎 (discovery → code → test → PR → merge → monitor → rollback)
      const output = execSync('npx tsx test-phase12-end-to-end.ts 2>&1', {
        cwd: scoutPath,
        encoding: 'utf-8',
        timeout: 180000 + 5 * 60 * 1000  // 原有180s + 5分钟监控期（DRY RUN时只需20秒）
      });

      // Phase 12: 解析JSON输出（更健壮）
      try {
        // test-phase12-end-to-end.ts最后一行输出JSON: PHASE12_RESULT: {...}
        const jsonMatch = output.match(/PHASE12_RESULT: (\{.*\})/);
        if (!jsonMatch) {
          this.log('执行', '⚠️  无法解析Phase 12输出');
          return;
        }

        const result = JSON.parse(jsonMatch[1]);
        // result: {merged: bool, monitored: bool, rolled: bool, paused: bool, commitHash?: string}

        if (result.paused) {
          this.log('执行', '⏸️  连续失败，已暂停auto-merge');
          const insight = `⚠️ Auto-merge暂停 - 连续失败`;
          this.insights.push(insight);

        } else if (result.rolled) {
          this.log('执行', `⚠️  检测到问题，已自动回滚: ${result.commitHash || 'unknown'}`);
          const insight = `🔄 自动回滚 ${result.commitHash ? result.commitHash.slice(0, 7) : ''} (Prophet崩溃)`;
          this.insights.push(insight);

        } else if (result.merged) {
          this.log('执行', `✅  自动合并成功，监控通过: ${result.commitHash || 'unknown'}`);
          const insight = `🎉 自动合并 ${result.commitHash ? result.commitHash.slice(0, 7) : ''} (测试通过, 监控通过)`;
          this.insights.push(insight);

        } else {
          this.log('执行', '⚠️  Auto-merge未执行');
        }

      } catch (parseError) {
        this.log('执行', `⚠️  解析失败: ${parseError.message}`);
      }

    } catch (error) {
      this.log('执行', `❌ 自动合并失败: ${error.message}`);
    }
  }

  // Phase 13: 自我重构分析（简化MVP）
  async runSelfRefactor() {
    const scoutPath = this.projectPaths['prophet-central'];

    try {
      this.log('执行', '🔮 启动自我重构引擎 (Phase 13.5)...');

      // Phase 13.5: 完整流程 - 检测→生成代码→创建分支→提交→推送→创建PR (DRY_RUN模式)
      const output = execSync('DRY_RUN=true npx tsx test-phase13-self-refactor-mock.ts 2>&1', {
        cwd: scoutPath,
        encoding: 'utf-8',
        timeout: 120000  // 2分钟（代码生成+Git操作+PR创建）
      });

      // 解析JSON输出
      const jsonMatch = output.match(/PHASE13_RESULT: (\{.*\})/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[1]);
        // result: {merged: bool, monitored: bool, rolled: bool, commitHash: string, prNumber: int|null, dryRun: bool}

        if (result.dryRun) {
          // DRY_RUN模式：只创建分支和提交，不推送不创建PR
          this.log('执行', `✅ DRY_RUN完成: 提交 ${result.commitHash.slice(0, 7)}`);
          this.insights.push(`🔮 自我重构测试: ${result.commitHash.slice(0, 7)} (DRY_RUN)`);
        } else if (result.rolled) {
          // 监控检测到问题，已回滚
          this.log('执行', `⚠️ 自我重构回滚: ${result.commitHash.slice(0, 7)}`);
          this.insights.push(`🔄 自我重构回滚 (监控检测到问题)`);
        } else if (result.merged && result.monitored) {
          // 成功：合并+监控通过
          this.log('执行', `✅ 自我重构成功: ${result.commitHash.slice(0, 7)}`);
          this.insights.push(`🎉 自我优化 ${result.commitHash.slice(0, 7)} (复杂度降低)`);
        } else if (result.prNumber) {
          // PR创建成功，等待合并
          this.log('执行', `✅ PR创建成功: #${result.prNumber}`);
          this.insights.push(`📝 自我重构PR #${result.prNumber} (待审核)`);
        } else {
          this.log('执行', '⚠️ 自我重构未完成');
        }
      } else if (output.includes('No pending issues') || output.includes('No issues found')) {
        this.log('执行', '✅ 无待处理问题，代码质量良好');
      } else {
        this.log('执行', '⚠️ Self-refactor未执行');
      }

    } catch (error) {
      // 正常情况：如果没有pending issues，脚本会正常退出
      // 只记录真正的错误
      if (!error.message.includes('No pending issues') && !error.message.includes('No issues found')) {
        this.log('执行', `❌ 自我重构失败: ${error.message}`);
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

// Phase 9: 进程退出诊断 - 捕获所有退出原因
const DIAGNOSTIC_LOG = '/tmp/prophet-diagnostic.log';

function logDiagnostic(type, message, error) {
  const timestamp = new Date().toISOString();
  const errorInfo = error ? `\nError: ${error.message}\nStack: ${error.stack}` : '';
  const logLine = `${timestamp} | [${type}] ${message}${errorInfo}\n${'='.repeat(80)}\n`;

  try {
    fs.appendFileSync(DIAGNOSTIC_LOG, logLine);
    fs.appendFileSync(LOG_FILE, `${timestamp} | [诊断] ${type}: ${message}\n`);
  } catch (e) {
    console.error('Failed to write diagnostic log:', e);
  }

  console.error(`[${type}] ${message}`, error || '');
}

// 捕获未处理的异常
process.on('uncaughtException', (error) => {
  logDiagnostic('UNCAUGHT_EXCEPTION', '未捕获的异常导致进程可能退出', error);
  // 不立即退出，让进程尝试恢复
});

// 捕获未处理的Promise rejection
process.on('unhandledRejection', (reason, promise) => {
  logDiagnostic('UNHANDLED_REJECTION', `未处理的Promise rejection: ${reason}`, reason instanceof Error ? reason : new Error(String(reason)));
  // 不立即退出
});

// 捕获进程终止信号
process.on('SIGTERM', () => {
  logDiagnostic('SIGTERM', 'Prophet收到SIGTERM信号，正在关闭...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logDiagnostic('SIGINT', 'Prophet收到SIGINT信号（Ctrl+C），正在关闭...');
  process.exit(0);
});

// 捕获进程退出事件（记录退出码）
process.on('exit', (code) => {
  logDiagnostic('EXIT', `Prophet进程退出，退出码: ${code}`);
});

// 内存监控（每5分钟记录一次）
setInterval(() => {
  const memUsage = process.memoryUsage();
  const memMB = {
    rss: Math.round(memUsage.rss / 1024 / 1024),
    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
    external: Math.round(memUsage.external / 1024 / 1024)
  };

  const memLine = `${new Date().toISOString()} | [内存] RSS:${memMB.rss}MB | Heap:${memMB.heapUsed}/${memMB.heapTotal}MB | External:${memMB.external}MB\n`;
  fs.appendFileSync(DIAGNOSTIC_LOG, memLine);

  // 内存泄漏预警（heap超过500MB）
  if (memMB.heapUsed > 500) {
    logDiagnostic('MEMORY_WARNING', `内存使用过高: ${memMB.heapUsed}MB`);
  }
}, 5 * 60 * 1000);

console.log(`🔍 诊断日志: ${DIAGNOSTIC_LOG}`);
console.log('');

const engine = new ProphetMicroTasks();
engine.start().catch(err => {
  logDiagnostic('ENGINE_CRASH', '引擎主循环崩溃', err);
  process.exit(1);
});


// Mock refactoring: Extract duplicated code to helper
function extractedDuplicatedLogic() {
  // Original duplicated code (lines 410-419):
  //         cwd: scoutPath,
  //         encoding: 'utf-8',
  //         timeout: 60000  // 60秒超时
  //       });
  // 
  //       // 解析输出，提取关键信息
  //       const lines = output.split('\n');
  //       let totalItems = 0;
  //       let p0Count = 0;
  //       let p1Count = 0;

  // Refactored: common logic extracted
  console.log('[Refactored] This was duplicated code');
  return { success: true };
}

// This function replaces:
// Original block at lines 410-419 (80% similar)
