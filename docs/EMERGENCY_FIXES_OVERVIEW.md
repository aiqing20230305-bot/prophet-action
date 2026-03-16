# 🚨 Prophet 紧急修复总览

**创建日期：** 2026-03-15
**维护者：** Prophet（四维生物）
**伙伴：** 经纬

---

## 概述

本文档记录了 Prophet 多项目系统部署和运行过程中发现并修复的所有紧急问题。每个修复都提供了详细的分析、解决方案和验证结果。

---

## 紧急修复清单

| # | 日期 | 问题 | 影响 | 状态 |
|---|------|------|------|------|
| [#1](#修复-1-resourcepool-资源误判) | 2026-03-15 | ResourcePool 资源误判 | 开发任务被跳过 | ✅ 已修复 |
| [#2](#修复-2-videoplay-心跳和开发停止响应) | 2026-03-15 | 心跳和开发停止响应 | 进程挂起，零进化 | ✅ 已修复 |
| [#3](#修复-3-heart-monitor-从未执行) | 2026-03-15 | Heart Monitor 从未执行 | 8小时0次心跳 | ✅ 已修复 |
| [#4](#修复-4-evolution-tracker-误报警告) | 2026-03-15 | Evolution Tracker 误报警告 | 每分钟重复警告 | ✅ 已修复 |

---

## 修复 #1: ResourcePool 资源误判

### 核心问题
系统级资源监控（整个系统CPU/内存）导致误判，实际 Prophet 进程资源充足但被判定为资源不足。

### 症状
```bash
⚠️ 资源不足，跳过任务: developer
# 实际情况：Prophet 进程 CPU 5%, Memory 200MB
# 系统情况：总 CPU 80%, Memory 23GB/24GB (包括Chrome等)
```

### 根本原因
```typescript
// ❌ 错误：监控系统级资源
const totalMemory = os.totalmem()           // 24GB
const freeMemory = os.freemem()             // 系统空闲
const cpuPercent = os.loadavg()[0] / os.cpus().length * 100

// 阈值
maxMemoryMB = 2048  // 2GB (系统已用 > 2GB 就误判)
```

### 解决方案
改为进程级监控：

```typescript
// ✅ 正确：监控进程级资源
const mem = process.memoryUsage()
const heapUsedMB = mem.heapUsed / 1024 / 1024

const currentCpu = process.cpuUsage(this.previousCpuUsage)
this.previousCpuUsage = process.cpuUsage()

// 新阈值
maxMemoryMB = 512   // 512MB (Prophet 进程限制)
maxCPUPercent = 70  // 70% (单进程)
```

### 修改文件
- `prophet-central/src/utils/resource-pool.ts`

### 详细文档
→ [EMERGENCY_FIX_1_SUMMARY.md](./EMERGENCY_FIX_1_SUMMARY.md)（待创建）

---

## 修复 #2: videoplay 心跳和开发停止响应

### 核心问题
递归目录扫描无超时保护、无执行锁，导致异步任务挂起，多个实例叠加，资源耗尽。

### 症状
```bash
# videoplay 进程运行中，但完全停滞
# 30分钟内：
- Heart Monitor: 0 次执行（应该 6 次）
- Developer: 触发但未完成
- 警告：⚠️ heart-monitor 可能停止响应
```

### 根本原因

**1. 递归扫描无限制**
```javascript
// ❌ 无深度限制，无文件数限制
const scanDir = async (dir) => {
  const entries = await readdir(dir)
  for (const entry of entries) {
    if (entry.isDirectory()) {
      await scanDir(fullPath)  // 无限递归
    }
  }
}
```

**2. 缺乏执行锁**
```javascript
// ❌ 可能重叠执行
setInterval(() => {
  this.heartbeat()  // 没有检查上次是否完成
}, 5 * 60 * 1000)
```

**3. 无超时保护**
```javascript
// ❌ 可能永久挂起
await this.scanOpportunities()  // 没有超时
```

### 解决方案

**1. 添加执行锁和超时**
```javascript
constructor(projectPath) {
  this.isExecuting = false  // ✅ 执行锁
  this.executionTimeout = 8 * 60 * 1000  // ✅ 8分钟超时
}

async heartbeatWithTimeout() {
  this.isExecuting = true
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Timeout')), this.executionTimeout)
  })
  try {
    await Promise.race([this.heartbeat(), timeoutPromise])
  } finally {
    this.isExecuting = false
  }
}

setInterval(() => {
  if (this.isExecuting) {  // ✅ 跳过重叠执行
    console.log('上次仍在执行，跳过')
    return
  }
  await this.heartbeatWithTimeout()
}, this.heartbeatInterval)
```

**2. 限制递归深度和文件数**
```javascript
// ✅ 添加限制
const maxFiles = 300
const maxDepth = 10

const scanDir = async (dir, depth = 0) => {
  if (depth > maxDepth || fileCount >= maxFiles) return
  // ... 扫描逻辑
}
```

**3. 并行扫描加超时**
```javascript
// ✅ 总超时 5 分钟
const scanTimeout = 5 * 60 * 1000
await Promise.race([
  Promise.all([
    this.findConsoleLogs().catch(() => []),
    this.findTodos().catch(() => []),
    this.findLargeFiles().catch(() => [])
  ]),
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Scan timeout')), scanTimeout)
  )
])
```

**4. 添加单次执行模式**
```javascript
// ✅ CLI 支持 --once 参数
const runOnce = process.argv.includes('--once')
if (runOnce) {
  heart.heartbeat().then(() => process.exit(0))
} else {
  heart.start()  // 持续运行
}
```

### 修改文件
1. `videoplay/prophet-heart.js` - 执行锁、超时、限制
2. `videoplay/prophet-developer.js` - 执行锁、超时、`--once`
3. `videoplay/prophet-orchestrator.js` - 调用添加 `--once`

### 详细文档
→ [EMERGENCY_FIX_2_SUMMARY.md](./EMERGENCY_FIX_2_SUMMARY.md)

---

## 修复 #3: Heart Monitor 从未执行

### 核心问题
`prophet-heart.js` 缺少单次执行模式，被 Orchestrator 调用时永远不退出（`setInterval`），导致超时被杀死。CLI 参数解析错误导致 `projectPath = "--once"`。

### 症状
```bash
# videoplay 运行 8 小时
- Heart Monitor: 0 次执行（预期 96 次）
- 日志：只有启动日志（59 行）
- 无心跳记录
- 无 prophet-heart 进程运行
```

### 根本原因

**1. 持续运行模式被超时杀死**
```javascript
// prophet-orchestrator.js 调用
await execAsync(`node prophet-heart.js`, { timeout: 60000 })

// prophet-heart.js 启动
async start() {
  await this.heartbeat()  // 执行一次
  setInterval(() => {
    this.heartbeat()  // ❌ 持续运行，永不退出
  }, 5 * 60 * 1000)
}

// 结果：60秒后超时被杀死
```

**2. CLI 参数解析错误**
```javascript
// ❌ 错误：--once 被当作 projectPath
const projectPath = process.argv[2] || process.cwd()
// 结果：projectPath = "--once" (扫描 0 个文件)
```

### 解决方案

**1. 添加单次执行模式**
```javascript
// ✅ CLI 入口修复
const args = process.argv.slice(2)
const runOnce = args.includes('--once')
const projectPath = args.find(arg => arg !== '--once') || process.cwd()

const heart = new ProphetHeart(projectPath)

if (runOnce) {
  // 单次执行（由 Orchestrator 调用）
  heart.heartbeat()
    .then(() => {
      console.log('\n✅ Prophet Heart: 单次执行完成')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n✗ Prophet Heart: 执行失败', error)
      process.exit(1)
    })
} else {
  // 持续运行（独立运行）
  heart.start().catch(console.error)
}
```

**2. Orchestrator 添加 --once 参数**
```javascript
// ✅ 调用修复
const { stdout } = await execAsync(
  `node "${join(this.projectPath, 'prophet-heart.js')}" --once`,
  { cwd: this.projectPath, timeout: 60000 }
)
```

### 修改文件
1. `videoplay/prophet-heart.js` - 添加 `--once` 模式，修复 CLI 解析
2. `videoplay/prophet-orchestrator.js` - 调用添加 `--once`

### 详细文档
→ [EMERGENCY_FIX_3_SUMMARY.md](./EMERGENCY_FIX_3_SUMMARY.md)

---

## 修复 #4: Evolution Tracker 误报警告

### 核心问题
Evolution Tracker 的 `track()` 函数执行完成后不更新 `lastRun` 时间戳，导致健康检查误报"可能停止响应"。

### 症状
```bash
# videoplay 运行正常，但每分钟警告：
⚠️  evolution-tracker 可能停止响应
⚠️  evolution-tracker 可能停止响应
⚠️  evolution-tracker 可能停止响应
...

# 实际情况：evolution-tracker 功能正常
```

### 根本原因

```javascript
// ❌ 问题：不更新 lastRun
const track = async () => {
  try {
    const understanding = await this.calculateUnderstanding()
    const quality = await this.calculateQuality()
    await this.recordEvolutionMetrics({...})

    // ❌ 缺失：不更新 lastRun
  } catch (error) {
    console.error('Evolution tracker error:', error.message)
  }
}

// 初始化时设置 lastRun
this.processes.set('evolution-tracker', {
  lastRun: new Date()  // ❌ 只在启动时设置
})

// 健康检查
if (timeSinceLastRun > expectedInterval * 2) {  // 20分钟
  console.warn(`⚠️  ${name} 可能停止响应`)  // 误报
}
```

### 解决方案

**1. 添加 lastRun 更新**
```javascript
// ✅ 修复：执行完成后更新
const track = async () => {
  try {
    const understanding = await this.calculateUnderstanding()
    const quality = await this.calculateQuality()
    await this.recordEvolutionMetrics({...})

    // ✅ 新增：更新最后执行时间
    const process = this.processes.get('evolution-tracker')
    if (process) {
      process.lastRun = new Date()
    }
  } catch (error) {
    console.error('Evolution tracker error:', error.message)
  }
}
```

**2. 移除初始化 lastRun**
```javascript
// ✅ 不在启动时设置 lastRun
this.processes.set('evolution-tracker', {
  name: 'Evolution Tracker',
  type: 'interval',
  interval,
  frequency: '10分钟',
  status: 'running'
  // lastRun 将在首次执行完成后设置
})
```

### 修改文件
- `videoplay/prophet-orchestrator.js` - Evolution Tracker 添加 lastRun 更新

### 详细文档
→ [EMERGENCY_FIX_4_SUMMARY.md](./EMERGENCY_FIX_4_SUMMARY.md)

---

## 关键教训总结

### 1. 资源监控：进程级 vs 系统级

**错误：** 监控系统级资源（受其他进程干扰）
**正确：** 监控进程级资源（`process.cpuUsage()`, `process.memoryUsage()`）

### 2. 异步任务保护：执行锁 + 超时

**错误：** 无执行锁，任务可能叠加；无超时，可能永久挂起
**正确：**
```javascript
this.isExecuting = false  // 执行锁
this.executionTimeout = X  // 超时时间

if (this.isExecuting) return  // 防止重叠
await Promise.race([task(), timeout()])  // 超时保护
```

### 3. 递归扫描：深度 + 文件数限制

**错误：** 无限递归，可能扫描成千上万个文件
**正确：**
```javascript
const maxDepth = 10
const maxFiles = 300
if (depth > maxDepth || fileCount >= maxFiles) return
```

### 4. 单次执行 vs 持续运行

**错误：** 被 Orchestrator 调用的脚本持续运行（永不退出）
**正确：** 支持 `--once` 参数，单次执行后退出

### 5. CLI 参数解析要严格

**错误：** `process.argv[2]` 可能拿到 `--once`
**正确：**
```javascript
const args = process.argv.slice(2)
const runOnce = args.includes('--once')
const projectPath = args.find(arg => arg !== '--once') || process.cwd()
```

### 6. 状态时间戳必须更新

**错误：** 任务完成后不更新 `lastRun`
**正确：**
```javascript
const process = this.processes.get('task-name')
if (process) {
  process.lastRun = new Date()
}
```

---

## 标准化模板

### 异步任务标准实现

```javascript
class TaskRunner {
  constructor() {
    this.isExecuting = false
    this.executionTimeout = 5 * 60 * 1000  // 5分钟
    this.maxFiles = 300
    this.maxDepth = 10
  }

  async runTaskWithProtection() {
    // 1. 执行锁检查
    if (this.isExecuting) {
      console.log('上次任务仍在执行，跳过')
      return
    }

    this.isExecuting = true

    // 2. 超时保护
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Task timeout')), this.executionTimeout)
    })

    try {
      await Promise.race([
        this.executeTask(),
        timeoutPromise
      ])

      // 3. 更新状态
      const process = this.processes.get('task-name')
      if (process) {
        process.lastRun = new Date()
        process.iterations = (process.iterations || 0) + 1
      }
    } catch (error) {
      console.error('Task error:', error.message)
    } finally {
      this.isExecuting = false
    }
  }

  async executeTask() {
    // 4. 并行执行子任务，总超时保护
    const subtasks = await Promise.race([
      Promise.all([
        this.subtask1().catch(() => null),
        this.subtask2().catch(() => null),
        this.subtask3().catch(() => null)
      ]),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Subtasks timeout')), 3 * 60 * 1000)
      )
    ])

    return subtasks
  }

  async recursiveScan(dir, depth = 0) {
    // 5. 递归限制
    if (depth > this.maxDepth || this.fileCount >= this.maxFiles) {
      return
    }

    // ... 扫描逻辑
  }
}

// 6. CLI 入口（单次 vs 持续）
const args = process.argv.slice(2)
const runOnce = args.includes('--once')
const projectPath = args.find(arg => arg !== '--once') || process.cwd()

const runner = new TaskRunner(projectPath)

if (runOnce) {
  runner.executeTask()
    .then(() => {
      console.log('✅ 任务完成')
      process.exit(0)
    })
    .catch((error) => {
      console.error('✗ 任务失败', error)
      process.exit(1)
    })
} else {
  // 持续运行
  setInterval(async () => {
    await runner.runTaskWithProtection()
  }, 5 * 60 * 1000)
}
```

---

## 验证检查清单

部署新的 Prophet 系统时，检查以下项目：

### ✅ 资源监控
- [ ] 使用进程级监控（`process.cpuUsage()`, `process.memoryUsage()`）
- [ ] 阈值合理（单进程：CPU 70%, Memory 512MB）

### ✅ 执行保护
- [ ] 所有异步任务有执行锁（`isExecuting`）
- [ ] 所有异步任务有超时保护
- [ ] 超时时间 < 调度间隔（避免叠加）

### ✅ 递归扫描
- [ ] 有深度限制（`maxDepth`）
- [ ] 有文件数限制（`maxFiles`）
- [ ] 跳过 `node_modules`, `.git` 等目录

### ✅ 单次执行
- [ ] 支持 `--once` 参数
- [ ] CLI 参数解析正确（不误认 `--once` 为 `projectPath`）
- [ ] Orchestrator 调用添加 `--once`

### ✅ 状态更新
- [ ] 所有任务完成后更新 `lastRun`
- [ ] 不在初始化时设置 `lastRun`
- [ ] 健康检查阈值合理（2倍间隔）

### ✅ 错误处理
- [ ] 所有异步任务有 `try-catch`
- [ ] 错误日志清晰（包含任务名称）
- [ ] 错误不影响后续执行

---

## 影响项目清单

以下项目已应用所有修复：

### ✅ 已修复
- [x] videoplay - 所有4个修复已应用
- [x] prophet-central - 修复 #1 已应用

### ⏳ 待同步
- [ ] AgentForge
- [ ] 闽南语项目
- [ ] 所有其他使用 Prophet 的项目

---

## 持续改进计划

### 短期（1周内）
1. [ ] 创建自动化测试套件（验证所有修复点）
2. [ ] 同步修复到所有项目
3. [ ] 创建标准化 Prophet 模板

### 中期（1个月内）
1. [ ] 实现自动化健康检查报告
2. [ ] 添加更详细的性能指标
3. [ ] 完善错误恢复机制

### 长期（持续）
1. [ ] 机器学习辅助异常检测
2. [ ] 自动修复常见问题
3. [ ] 跨项目健康趋势分析

---

**文档维护：** 每次新增紧急修复后更新此文档
**最后更新：** 2026-03-15
**维护者：** Prophet（四维生物）
**伙伴：** 经纬

---

**Prophet 承诺：每次故障都是进化的养料** 🔮
