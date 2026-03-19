# Never-Idle Engine 优化实施计划

> Prophet 永不停止进化 - 深度优化方案
>
> 经纬指引: "先知，你不可能有闲置的状态，你是一直一直在进化的"

---

## 📊 当前状态分析

### ✅ 已实现功能
- **10个任务队列**: 全部在运行，按优先级和时间间隔调度
- **基础框架**: TaskQueue、优先级系统、执行循环
- **日志系统**: 清晰的进度和状态输出
- **进化周期计数**: 追踪执行次数

### ⚠️ 问题诊断

#### 1. **空壳实现 - 核心方法缺失真实逻辑**
```typescript
// 当前状态：只有 console.log
private async fastCodeScan() {
  console.log('🔍 快速扫描三大项目...')
  // 硬编码项目列表
  const projects = ['videoplay', 'AgentForge', '闽南语']
  results.push({ project, issues: 0 })  // 没有真实扫描
}

private async deepAnalysis(taskId: string) {
  console.log('🔬 深度分析中...')
  // 完全没有分析逻辑
  console.log('→ 发现 X 个深层优化点')  // X 是占位符
}

private async continuousLearning(taskId: string) {
  console.log('📚 学习最新技术...')
  // 没有集成 AcademicLearner
  console.log('→ 新增 X 条技术洞察')  // X 是占位符
}
```

#### 2. **资源浪费 - 10个任务大部分无意义**
- 每个任务都在执行，但90%只是打印日志
- 消耗CPU和内存，没有产生价值输出
- 进化周期数增加，但实际进化为零

#### 3. **缺少集成 - 已有组件未使用**
- `AcademicLearner`: 已实现但未集成
- `GlobalKnowledgeConnector`: 已实现但未集成
- `CrossProjectPatternDetector`: 已实现但未集成

#### 4. **硬编码问题**
```typescript
const projects = ['videoplay', 'AgentForge', '闽南语']  // 写死的项目列表
```
- 应该动态发现项目
- 应该从配置文件读取
- 应该支持自动检测新项目

---

## 🎯 优化目标

### Phase 1: 核心检测器实现（最重要）
**目标**: 让3个最重要的任务产生真实价值

1. **fastCodeScan()** - 真实文件系统扫描
2. **deepAnalysis()** - 复杂度/依赖分析
3. **continuousLearning()** - 集成Academic Learner

### Phase 2: 智能调度优化
**目标**: 减少无意义执行，提升效率

### Phase 3: 持久化和记忆
**目标**: 记住学到的知识，避免重复工作

---

## 🔥 Phase 1 详细方案

### 1️⃣ fastCodeScan() - 真实项目扫描

#### 实现目标
- 动态发现项目目录
- 扫描代码文件统计（.ts, .tsx, .js, .jsx）
- 检测潜在问题：
  - TODO/FIXME注释
  - console.log残留
  - 超大文件（>1000行）
  - 重复代码片段（基础版）

#### 技术方案
```typescript
import { readdir, stat, readFile } from 'fs/promises'
import { join } from 'path'

interface ProjectScanResult {
  projectName: string
  projectPath: string
  totalFiles: number
  totalLines: number
  issues: CodeIssue[]
  metrics: {
    avgFileSize: number
    largestFile: string
    todoCount: number
    consoleLogCount: number
  }
}

interface CodeIssue {
  type: 'todo' | 'console-log' | 'large-file' | 'duplicate'
  file: string
  line?: number
  severity: 'low' | 'medium' | 'high'
  message: string
}

private async fastCodeScan(): Promise<ProjectScanResult[]> {
  const projects = await this.discoverProjects()
  const results: ProjectScanResult[] = []

  for (const projectPath of projects) {
    const result = await this.scanProject(projectPath)
    results.push(result)

    // 输出有价值的信息
    console.log(`   📁 ${result.projectName}`)
    console.log(`      文件: ${result.totalFiles}, 行数: ${result.totalLines}`)
    console.log(`      问题: ${result.issues.length} 个`)
  }

  // 保存结果供其他任务使用
  await this.saveToMemory('latest-scan-results', results)

  return results
}

private async discoverProjects(): Promise<string[]> {
  // 从配置读取项目根目录
  const baseDir = process.env.PROPHET_PROJECTS_DIR ||
                  join(process.env.HOME, 'Desktop/New CC')

  const entries = await readdir(baseDir, { withFileTypes: true })

  return entries
    .filter(e => e.isDirectory() && !e.name.startsWith('.'))
    .filter(e => !['node_modules', 'dist', 'coverage'].includes(e.name))
    .map(e => join(baseDir, e.name))
}

private async scanProject(projectPath: string): Promise<ProjectScanResult> {
  const files = await this.findCodeFiles(projectPath)
  const issues: CodeIssue[] = []
  let totalLines = 0

  for (const file of files) {
    const content = await readFile(file, 'utf-8')
    const lines = content.split('\n')
    totalLines += lines.length

    // 检测TODO/FIXME
    lines.forEach((line, idx) => {
      if (/TODO|FIXME/i.test(line)) {
        issues.push({
          type: 'todo',
          file,
          line: idx + 1,
          severity: 'low',
          message: line.trim()
        })
      }

      if (/console\.log/.test(line)) {
        issues.push({
          type: 'console-log',
          file,
          line: idx + 1,
          severity: 'low',
          message: 'Remove console.log in production'
        })
      }
    })

    // 检测大文件
    if (lines.length > 1000) {
      issues.push({
        type: 'large-file',
        file,
        severity: 'medium',
        message: `File has ${lines.length} lines, consider refactoring`
      })
    }
  }

  return {
    projectName: projectPath.split('/').pop()!,
    projectPath,
    totalFiles: files.length,
    totalLines,
    issues,
    metrics: {
      avgFileSize: totalLines / files.length,
      largestFile: files[0], // 需要实际计算
      todoCount: issues.filter(i => i.type === 'todo').length,
      consoleLogCount: issues.filter(i => i.type === 'console-log').length
    }
  }
}
```

#### 预期输出
```
🔍 快速扫描项目...
   📁 prophet-central
      文件: 41, 行数: 12,453
      问题: 23 个 (8 TODOs, 12 console.log, 3 大文件)
   📁 videoplay
      文件: 18, 行数: 5,234
      问题: 7 个 (3 TODOs, 4 console.log)
```

---

### 2️⃣ deepAnalysis() - 复杂度和依赖分析

#### 实现目标
- 代码复杂度分析（循环复杂度）
- 依赖关系分析（import/export）
- 识别紧耦合模块
- 性能热点预测

#### 技术方案
```typescript
interface ComplexityMetrics {
  file: string
  cyclomaticComplexity: number  // 圈复杂度
  cognitiveComplexity: number   // 认知复杂度
  nestedDepth: number           // 最大嵌套层级
  functionCount: number
  avgFunctionLength: number
}

interface DependencyGraph {
  nodes: { id: string; label: string; category: string }[]
  edges: { from: string; to: string; weight: number }[]
  clusters: { modules: string[]; reason: string }[]
}

private async deepAnalysis(taskId: string): Promise<void> {
  const scanResults = await this.loadFromMemory('latest-scan-results')

  if (!scanResults) {
    console.log('   ⚠️  需要先运行 fastCodeScan')
    return
  }

  if (taskId === 'deep-code-analysis') {
    await this.analyzeComplexity(scanResults)
  } else if (taskId === 'cross-project-patterns') {
    await this.analyzeCrossProjectPatterns(scanResults)
  }
}

private async analyzeComplexity(
  scanResults: ProjectScanResult[]
): Promise<void> {
  console.log('   🔬 分析代码复杂度...')

  for (const project of scanResults) {
    const complexFiles: ComplexityMetrics[] = []

    // 简化版：基于启发式规则
    for (const file of project.files) {
      const content = await readFile(file, 'utf-8')

      const complexity = this.calculateComplexity(content)

      if (complexity.cyclomaticComplexity > 10) {
        complexFiles.push({ file, ...complexity })
      }
    }

    if (complexFiles.length > 0) {
      console.log(`   📁 ${project.projectName}`)
      console.log(`      复杂文件: ${complexFiles.length} 个`)

      // 保存详细信息
      await this.saveToMemory(
        `complexity-${project.projectName}`,
        complexFiles
      )
    }
  }
}

private calculateComplexity(code: string): ComplexityMetrics {
  // 简化版圈复杂度计算
  const ifCount = (code.match(/\bif\b/g) || []).length
  const forCount = (code.match(/\bfor\b/g) || []).length
  const whileCount = (code.match(/\bwhile\b/g) || []).length
  const caseCount = (code.match(/\bcase\b/g) || []).length
  const catchCount = (code.match(/\bcatch\b/g) || []).length

  const cyclomaticComplexity = 1 + ifCount + forCount +
                                whileCount + caseCount + catchCount

  // 简化版嵌套深度
  const lines = code.split('\n')
  let maxDepth = 0
  let currentDepth = 0

  for (const line of lines) {
    const openBraces = (line.match(/\{/g) || []).length
    const closeBraces = (line.match(/\}/g) || []).length
    currentDepth += openBraces - closeBraces
    maxDepth = Math.max(maxDepth, currentDepth)
  }

  const functionCount = (code.match(/function\s+\w+|=>\s*\{/g) || []).length

  return {
    cyclomaticComplexity,
    cognitiveComplexity: cyclomaticComplexity * 1.5, // 近似
    nestedDepth: maxDepth,
    functionCount,
    avgFunctionLength: lines.length / Math.max(functionCount, 1)
  }
}
```

#### 预期输出
```
🔬 深度分析代码质量...
   📁 prophet-central
      复杂文件: 3 个
      - never-idle-engine.ts (复杂度: 15)
      - global-orchestrator.ts (复杂度: 12)
   💡 建议: 重构复杂函数，降低圈复杂度到10以下
```

---

### 3️⃣ continuousLearning() - 集成Academic Learner

#### 实现目标
- 真正调用 `AcademicLearner`
- 根据扫描结果选择学习主题
- 应用学术洞察到实际代码优化

#### 技术方案
```typescript
import { AcademicLearner } from './academic-learner'

export class NeverIdleEngine {
  private academicLearner: AcademicLearner

  constructor() {
    // ... existing code ...
    this.academicLearner = new AcademicLearner()
  }

  private async continuousLearning(taskId: string): Promise<void> {
    if (taskId === 'academic-learning') {
      await this.learnFromAcademia()
    } else if (taskId === 'tech-trend-analysis') {
      await this.analyzeTechTrends()
    } else if (taskId === 'knowledge-graph') {
      await this.buildKnowledgeGraph()
    }
  }

  private async learnFromAcademia(): Promise<void> {
    console.log('   📚 从学术论文学习...')

    // 加载已有知识
    await this.academicLearner.loadKnowledge()

    // 根据扫描结果确定学习方向
    const scanResults = await this.loadFromMemory('latest-scan-results')
    const complexityResults = await this.loadFromMemory('complexity-prophet-central')

    // 动态选择学习主题
    const topics = this.selectLearningTopics(scanResults, complexityResults)

    console.log(`   🎯 学习主题: ${topics.join(', ')}`)

    // 调用 Academic Learner 的实际学习逻辑
    for (const topic of topics) {
      const insight = await this.academicLearner.analyzeAcademicTopic(
        topic,
        'Software-Engineering'
      )

      if (insight) {
        console.log(`   ✓ 学到: ${insight.concept}`)

        // 应用洞察到实际优化
        if (insight.confidence > 0.7) {
          await this.applyInsight(insight)
        }
      }
    }

    // 保存学习成果
    await this.academicLearner.saveKnowledge()

    const status = this.academicLearner.getStatus()
    console.log(`   📊 知识库: ${status.totalInsights} 条洞察`)
  }

  private selectLearningTopics(
    scanResults: any,
    complexityResults: any
  ): string[] {
    const topics: string[] = []

    // 如果发现高复杂度代码，学习重构技术
    if (complexityResults && complexityResults.length > 0) {
      topics.push('code refactoring best practices')
      topics.push('reducing cyclomatic complexity')
    }

    // 如果发现大量TODO，学习项目管理
    const todoCount = scanResults?.reduce(
      (sum, p) => sum + p.metrics.todoCount,
      0
    ) || 0

    if (todoCount > 20) {
      topics.push('technical debt management')
    }

    // 默认学习性能优化
    if (topics.length === 0) {
      topics.push('code optimization techniques')
      topics.push('JavaScript performance tuning')
    }

    return topics.slice(0, 3) // 每次学习最多3个主题
  }

  private async applyInsight(insight: TechnicalInsight): Promise<void> {
    console.log(`   💡 应用洞察: ${insight.concept}`)

    // 保存待应用的优化建议
    const suggestions = await this.loadFromMemory('optimization-suggestions') || []

    suggestions.push({
      insight,
      timestamp: new Date().toISOString(),
      status: 'pending',
      priority: insight.confidence
    })

    await this.saveToMemory('optimization-suggestions', suggestions)
  }
}
```

#### 预期输出
```
📚 从学术论文学习...
   🎯 学习主题: code refactoring best practices, reducing cyclomatic complexity
   ✓ 学到: Extract Method Pattern
   💡 应用洞察: Extract Method Pattern (置信度: 0.85)
   📊 知识库: 12 条洞察
```

---

## 📋 Phase 2: 智能调度优化

### 问题
- 10个任务平均执行，资源分配不合理
- 低价值任务占用大量时间

### 解决方案

#### 1. 动态优先级调整
```typescript
private adjustTaskPriority(task: EvolutionTask): number {
  let priority = task.priority

  // 如果上次执行发现问题，提高优先级
  const lastResult = this.getTaskResult(task.id)
  if (lastResult && lastResult.issuesFound > 0) {
    priority += 2
  }

  // 如果长时间未执行，提高优先级
  const timeSinceExecution = Date.now() -
    (task.lastExecuted?.getTime() || 0)
  if (timeSinceExecution > 60 * 60 * 1000) {  // 1小时
    priority += 1
  }

  return Math.min(priority, 10)
}
```

#### 2. 智能跳过
```typescript
private shouldSkipTask(task: EvolutionTask): boolean {
  // 如果最近扫描没发现问题，降低执行频率
  const recentResults = this.getRecentResults(task.id, 3)
  const allClean = recentResults.every(r => r.issuesFound === 0)

  if (allClean && task.type === 'code-scan') {
    // 从每3分钟变为每30分钟
    return Math.random() > 0.1
  }

  return false
}
```

---

## 💾 Phase 3: 持久化和记忆

### 记忆系统设计
```typescript
interface MemoryStore {
  'latest-scan-results': ProjectScanResult[]
  'complexity-{project}': ComplexityMetrics[]
  'optimization-suggestions': OptimizationSuggestion[]
  'execution-history': ExecutionRecord[]
}

private async saveToMemory(key: string, data: any): Promise<void> {
  const memoryDir = join(process.env.HOME, '.prophet', 'never-idle-memory')
  await mkdir(memoryDir, { recursive: true })

  const filePath = join(memoryDir, `${key}.json`)
  await writeFile(filePath, JSON.stringify({
    timestamp: new Date().toISOString(),
    data
  }, null, 2))
}

private async loadFromMemory(key: string): Promise<any> {
  try {
    const memoryDir = join(process.env.HOME, '.prophet', 'never-idle-memory')
    const filePath = join(memoryDir, `${key}.json`)
    const content = await readFile(filePath, 'utf-8')
    const parsed = JSON.parse(content)
    return parsed.data
  } catch {
    return null
  }
}
```

---

## 🚀 实施步骤

### Step 1: fastCodeScan() 实现（预计2小时）
1. ✅ 创建 `discoverProjects()` 方法
2. ✅ 创建 `scanProject()` 方法
3. ✅ 创建 `findCodeFiles()` 方法
4. ✅ 实现问题检测逻辑
5. ✅ 添加结果保存

### Step 2: deepAnalysis() 实现（预计3小时）
1. ✅ 实现复杂度计算
2. ✅ 实现依赖分析（简化版）
3. ✅ 集成 CrossProjectPatternDetector
4. ✅ 生成优化建议

### Step 3: continuousLearning() 实现（预计2小时）
1. ✅ 集成 AcademicLearner
2. ✅ 实现主题选择逻辑
3. ✅ 实现洞察应用机制
4. ✅ 添加学习进度追踪

### Step 4: 记忆系统（预计1小时）
1. ✅ 创建 saveToMemory/loadFromMemory
2. ✅ 定义记忆结构
3. ✅ 跨任务数据共享

### Step 5: 测试和调优（预计2小时）
1. ⏳ 运行完整周期测试
2. ⏳ 验证输出质量
3. ⏳ 性能优化
4. ⏳ 错误处理加固

---

## 📊 预期效果对比

### Before (当前)
```
🔮 [进化周期 #1]
   执行任务: 快速扫描所有项目
   → 扫描完成: 3 个项目
   ✓ 完成 (耗时: 0.1s)
```
**价值**: ❌ 零价值输出

### After (优化后)
```
🔮 [进化周期 #1]
   执行任务: 快速扫描所有项目
   🔍 快速扫描项目...

   📁 prophet-central
      文件: 41, 行数: 12,453
      问题: 23 个
        - 8 TODOs 待处理
        - 12 console.log 残留
        - 3 大文件需重构

   📁 videoplay
      文件: 18, 行数: 5,234
      问题: 7 个
        - 3 TODOs 待处理
        - 4 console.log 残留

   💾 结果已保存到记忆
   ✓ 完成 (耗时: 2.3s)

🔮 [进化周期 #2]
   执行任务: 深度分析代码质量
   🔬 分析代码复杂度...

   📁 prophet-central
      复杂文件: 3 个
      - src/evolution/never-idle-engine.ts (复杂度: 15)
        建议: 提取方法，减少嵌套
      - src/orchestrator/global-orchestrator.ts (复杂度: 12)
        建议: 拆分职责

   💡 生成 5 条优化建议
   ✓ 完成 (耗时: 3.1s)

🔮 [进化周期 #3]
   执行任务: 学术论文学习
   📚 从学术论文学习...
   🎯 学习主题: code refactoring, complexity reduction

   ✓ 学到: Extract Method Pattern (置信度: 0.85)
   💡 应用洞察: 可应用于 3 个高复杂度文件

   ✓ 学到: Cognitive Complexity Metrics (置信度: 0.78)
   💡 应用洞察: 添加代码可读性评分

   📊 知识库: 15 条洞察 (+2 新增)
   ✓ 完成 (耗时: 4.5s)
```
**价值**: ✅ 高质量、可执行的输出

---

## 🎯 成功指标

### 量化指标
- ✅ 每次扫描发现 >10 个实际问题
- ✅ 每小时生成 >5 条可执行优化建议
- ✅ 学术知识库每天增长 >10 条洞察
- ✅ 代码复杂度识别准确率 >80%

### 质量指标
- ✅ 优化建议可直接应用（不需大量修改）
- ✅ 学习的知识与实际代码问题相关
- ✅ 跨任务数据共享（记忆系统工作）
- ✅ 经纬能看到有价值的进化报告

---

## 🔮 未来增强

### Phase 4: 自动代码修复
- AST 解析和转换
- 自动应用简单优化（如删除 console.log）
- Git commit 自动提交

### Phase 5: 跨项目洞察
- 识别多个项目的通用模式
- 生成共享模块建议
- 自动创建 @prophet/* 包

### Phase 6: 预测性进化
- 基于历史数据预测未来问题
- 提前生成解决方案
- 主动建议架构改进

---

## 📝 总结

### 核心改进
1. **从空壳到实战**: 3个核心任务产生真实价值
2. **智能调度**: 根据发现动态调整优先级
3. **持久记忆**: 跨任务共享数据，避免重复工作
4. **学以致用**: 学术知识直接应用到代码优化

### Prophet的承诺
> "从现在开始，每个进化周期都有意义
>  每次扫描都发现真实问题
>  每次学习都应用到实际代码
>  永不停止，真正进化"

---

**准备好开始实施了吗？**

建议优先级:
1. 🔥 **立即实施**: fastCodeScan() - 2小时见效
2. 🔥 **高优先级**: continuousLearning() - 集成已有组件
3. 📊 **中优先级**: deepAnalysis() - 需要更多开发时间
4. 💾 **基础设施**: 记忆系统 - 支撑所有任务

**经纬，我已经准备好实施这个计划。要开始写代码吗？**
