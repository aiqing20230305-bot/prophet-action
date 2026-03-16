# Prophet Multi-Project Evolution System

Prophet 多项目观察与自动进化系统 - 完整实现文档

**状态：** ✅ 核心系统已完成并运行中
**最后更新：** 2026-03-15 18:32
**紧急修复：** ✅ ResourcePool 资源误判问题已修复（详见 [RESOURCE_POOL_FIX.md](./RESOURCE_POOL_FIX.md)）

---

## 系统概述

Prophet Multi-Project Evolution System 是一个智能化的多项目管理和自动进化平台，能够：

- **并行监控**多个项目的状态和变化
- **跨项目分析**识别通用需求和模式
- **自动生成**共享解决方案和可重用模块
- **Agent 协调**与项目中的 Claude Code Agents 实时通信
- **智能调度**避免资源竞争，最大化并发效率

## 核心组件

### 1. GlobalOrchestrator（全局编排器）

**职责：** 管理所有项目的编排实例，协调全局资源

**功能：**
- 项目注册和管理
- 全局任务调度
- 资源分配和监控
- 跨项目协调

**API：**
```typescript
const orchestrator = new GlobalOrchestrator({
  concurrencyLimit: 3,
  enableAutoOptimize: true,
  enableAgentCommunication: true,
})

await orchestrator.start()

// 注册项目
await orchestrator.registerProject({
  id: 'my-project',
  name: 'My Project',
  path: '/path/to/project',
  type: 'web-app',
  priority: 'high',
  monitoringInterval: 300000, // 5分钟
  autoOptimize: true,
})
```

### 2. GlobalScheduler（全局调度器）

**职责：** 智能调度任务，避免所有项目同时执行

**特性：**
- ✅ 时间错开策略（基于项目 ID 哈希）
- ✅ 优先级队列
- ✅ 并发限制（最多 N 个任务同时执行）
- ✅ 自适应调度

**时间错开示例：**
```
项目1: Heart 在 00:04 执行
项目2: Heart 在 00:08 执行
项目3: Heart 在 00:12 执行
项目4: Heart 在 00:16 执行
```

### 3. ParallelHeartMonitor（并行心跳监控）

**职责：** 并行监控多个项目，共享缓存和资源

**功能：**
- Git 变更检测
- TODO 扫描
- 代码质量分析
- 性能问题检测
- 自动优化执行（可选）

**缓存策略：**
- 1分钟缓存避免频繁 git 调用
- 跨项目共享扫描结果
- 智能缓存失效

### 4. CrossProjectPatternDetector（跨项目模式检测）

**职责：** 识别多个项目间的通用需求和模式

**检测类型：**
- **Common Need** - 通用功能需求（出现在2+个项目）
- **Duplicate Code** - 代码重复
- **Config Pattern** - 配置模式
- **Architecture Pattern** - 架构模式

**示例输出：**
```
🔍 检测到跨项目模式:
  类别: auth
  描述: Multiple projects need auth functionality
  影响项目: project1, project2, project3
  置信度: 0.85
  建议: Create @prophet/auth-service - Shared authentication module
```

### 5. CrossProjectDeveloper（跨项目开发协调）

**职责：** 全局问题分析，智能开发任务分配

**优先级计算：**
```typescript
score = affectedProjects.length * 50    // 影响范围
      + priorityScore                    // 问题优先级
      + (autoExecutable && safe) * 30    // 安全性
      + criticalProjects * 20            // 项目优先级
```

**开发策略：**
- 跨项目问题 → 生成共享解决方案
- 单项目问题 → 生成特定解决方案
- 最多同时开发 2 个任务

### 6. SharedModuleGenerator（共享模块生成）

**职责：** 根据通用需求生成可重用模块

**支持模块类型：**
- `@prophet/auth-service` - 认证服务
- `@prophet/payment-service` - 支付服务
- `@prophet/monitoring` - 监控工具

**生成内容：**
- TypeScript 源代码
- 类型定义
- 单元测试（可选）
- README 文档
- package.json

### 7. AgentCommunicationHub（Agent 通信枢纽）

**职责：** 与项目中的 Claude Code Agents 建立通信

**功能：**
- 自动发现项目中的 Agents
- WebSocket 实时通信
- 任务分配和追踪
- Swarm 协调

**通信协议：**
```typescript
// 任务分配
hub.assignTask(agentId, {
  id: 'task-1',
  type: 'development',
  description: 'Implement feature X',
  priority: 'high',
})

// 接收消息
hub.on('task-completed', (conn, task) => {
  console.log(`Agent ${conn.name} completed: ${task.id}`)
})
```

### 8. TeamCoordinator（团队协调器）

**职责：** 管理跨项目 Agent 团队协作

**功能：**
- 创建跨项目团队
- 任务分解和分配
- 进度追踪
- 团队解散

**使用示例：**
```typescript
const team = await coordinator.createCrossProjectTeam(
  ['project1', 'project2', 'project3'],
  'Implement shared authentication'
)

await coordinator.assignTeamTask(team.id, {
  id: 'task-1',
  description: 'Build auth module',
  subtasks: [],
})

const progress = await coordinator.monitorTeamProgress(team.id)
console.log(`Overall progress: ${progress.overallProgress}%`)
```

## 使用指南

### 启动 Prophet Central

```bash
cd prophet-central
npm run dev
```

**输出：**
```
🚀 Prophet Central Server started on port 3001
💭 Continuous Reasoning Engine started
🛡️  Project Guardian started
🚀 Prophet Global Orchestrator 已启动
   并发限制: 3
   注册项目数: 0
```

### 注册项目

**方式 1: CLI 命令**
```bash
prophet project add /path/to/my-project \
  --name "My Project" \
  --type web-app \
  --priority high \
  --interval 300000 \
  --auto-optimize
```

**方式 2: API**
```typescript
const client = new ProphetClient('http://localhost:3001')

await client.request('/orchestrator/projects/register', {
  method: 'POST',
  body: {
    name: 'My Project',
    path: '/path/to/my-project',
    type: 'web-app',
    priority: 'high',
    monitoringInterval: 300000,
    autoOptimize: true,
  },
})
```

**方式 3: 自动发现（推荐）**
```typescript
// Prophet Central 会自动扫描并注册运行中的项目
// 如果项目已部署 ProphetClient 并连接到 Central
```

### 查看状态

```bash
# 全局状态
prophet orchestrator status

# 项目列表
prophet projects list

# Agent 列表
prophet agent list
prophet agent list --project my-project
```

### 触发操作

```bash
# 心跳监控
prophet heartbeat --all
prophet heartbeat --project my-project

# 开发协调
prophet develop --cross-project
prophet develop --project my-project

# Agent 通信
prophet agent send agent-id "Start working on task X"
prophet agent coordinate \
  --projects "project1,project2,project3" \
  --task "Implement shared auth module"
```

## 配置项目

在项目中创建 `.prophet/config.json`：

```json
{
  "name": "My Project",
  "type": "web-app",
  "priority": "high",
  "monitoring": {
    "interval": 300000,
    "autoOptimize": true
  },
  "features": {
    "agentCommunication": true,
    "crossProjectLearning": true
  }
}
```

## 工作流程

### 1. 心跳监控循环

```
每 5 分钟（可配置）:
  1. 检测 git 变更
  2. 扫描 TODO 和优化机会
  3. 执行安全优化（如果启用）
  4. 更新项目状态
  5. 跨项目模式分析（如果有2+个项目）
```

### 2. 跨项目模式检测

```
当检测到模式时:
  1. 分析所有项目的扫描结果
  2. 识别通用需求（出现在2+个项目）
  3. 计算置信度
  4. 生成共享解决方案建议
  5. 触发共享模块生成
```

### 3. 共享模块生成

```
当识别到共享需求时:
  1. 分析需求类别（auth, payment, monitoring...）
  2. 生成模块代码和文档
  3. 创建独立仓库（可选）
  4. 推荐给所有相关项目
  5. 自动集成到第一个项目（验证）
```

### 4. Agent 协调

```
当需要跨项目协作时:
  1. 发现各项目的 Agents
  2. 创建跨项目团队
  3. 分解任务
  4. 分配给团队成员
  5. 监控进度
  6. 收集结果
```

## 事件系统

订阅全局事件：

```typescript
globalOrchestrator.on('project-registered', (config) => {
  console.log(`项目已注册: ${config.name}`)
})

globalOrchestrator.on('patterns-detected', (patterns) => {
  console.log(`检测到 ${patterns.length} 个跨项目模式`)
})

globalOrchestrator.on('shared-module-generated', (module) => {
  console.log(`共享模块已生成: ${module.name}`)
})

globalOrchestrator.on('resource-warning', (usage) => {
  console.warn(`资源警告: CPU ${usage.cpu}%, Memory ${usage.memory}MB`)
})
```

## 性能优化

### 资源管理

- **并发限制:** 最多 3 个任务同时执行
- **内存限制:** 最多 2GB
- **CPU 限制:** 最多 80%
- **缓存策略:** 1分钟缓存，避免频繁 I/O

### 时间错开

```typescript
// 自动计算时间偏移，避免同时执行
const hash = simpleHash(projectId)
const offset = (hash % baseInterval) * 1000

// 结果：项目在不同时间点执行
```

### 智能调度

```typescript
// 优先级计算
score = taskPriority
      + typeWeight
      + delayPenalty

// Critical 项目优先
// 延迟任务提高优先级
```

## 监控和日志

### 日志输出

```
💓 执行心跳监控: Project1, Project2
✅ 扫描完成: project1
   变更: 3 修改, 1 新增
   机会: 15
   优化: 2

🔍 检测到 2 个跨项目模式
💡 共享解决方案: @prophet/auth-service
🔮 开始开发共享解决方案: Authentication module
📦 生成共享模块: auth
✅ 共享模块已生成: @prophet/auth-service
```

### Metrics 收集

```typescript
const status = globalOrchestrator.getStatus()

console.log(`项目数: ${status.projectCount}`)
console.log(`活跃项目: ${status.activeProjects}`)
console.log(`活跃任务: ${status.scheduler.activeTaskCount}`)
console.log(`队列任务: ${status.scheduler.queuedTaskCount}`)
```

## 故障排查

### 常见问题

**1. 项目未自动注册**
- 检查项目是否运行 ProphetClient
- 检查是否连接到 Central (localhost:3001)
- 手动注册项目

**2. 心跳未执行**
- 检查调度器状态: `prophet orchestrator status`
- 检查资源使用: CPU/内存是否超限
- 查看日志输出

**3. Agent 无法连接**
- 确保 enableAgentCommunication: true
- 检查项目中是否有 Claude Code Agents
- 查看 WebSocket 连接状态

**4. 共享模块未生成**
- 至少需要 2 个项目有相同需求
- 检查置信度是否 >= 0.6
- 查看开发者槽位是否已满

## 最佳实践

### 1. 项目配置

- ✅ 为重要项目设置 `priority: 'critical'`
- ✅ 根据项目活跃度调整 `monitoringInterval`
- ✅ 谨慎使用 `autoOptimize`（确保有测试覆盖）

### 2. 资源管理

- ✅ 不要同时注册过多项目（建议 < 10 个）
- ✅ 监控系统资源使用情况
- ✅ 调整并发限制适应硬件配置

### 3. Agent 协调

- ✅ 明确定义跨项目任务
- ✅ 合理分解任务
- ✅ 设置任务超时和重试机制

### 4. 共享模块

- ✅ 生成的模块需要人工审查
- ✅ 添加单元测试
- ✅ 创建独立仓库方便维护

## API 端点

```
GET    /orchestrator/status              全局状态
GET    /orchestrator/projects             项目列表
POST   /orchestrator/projects/register    注册项目
DELETE /orchestrator/projects/:id         取消注册

POST   /orchestrator/heartbeat            全部心跳
POST   /orchestrator/heartbeat/:id        单个心跳

POST   /orchestrator/develop/cross-project  跨项目开发
POST   /orchestrator/develop/:id            单个开发

GET    /orchestrator/agents               所有 Agents
GET    /orchestrator/agents/:projectId    项目 Agents
POST   /orchestrator/agents/:id/message   发送消息
POST   /orchestrator/agents/coordinate    协调 Swarm
```

## 扩展开发

### 添加新的模式检测器

```typescript
class CustomPatternDetector {
  async analyze(scanResults: ScanResult[]): Promise<DetectedPattern[]> {
    // 自定义模式检测逻辑
  }
}

// 注册到 CrossProjectPatternDetector
```

### 添加新的共享模块类型

```typescript
class SharedModuleGenerator {
  async generateCustomModule(requirements: any): Promise<SharedModule> {
    return {
      name: '@prophet/custom-module',
      version: '1.0.0',
      files: [
        {
          path: 'src/index.ts',
          content: this.generateCustomCode(requirements),
          language: 'typescript',
        },
      ],
      dependencies: {},
      targetProjects: requirements.affectedProjects,
      createdAt: new Date(),
    }
  }
}
```

### 自定义调度策略

```typescript
class CustomScheduler extends GlobalScheduler {
  protected calculatePriorityScore(task: ScheduledTask): number {
    // 自定义优先级计算
    return super.calculatePriorityScore(task) + customLogic(task)
  }
}
```

## 未来路线图

- [ ] 机器学习模式识别
- [ ] 自动测试生成
- [ ] 代码重复检测（AST 级别）
- [ ] 更智能的任务分解
- [ ] 分布式部署支持
- [ ] Web 可视化仪表板
- [ ] Git 自动提交和 PR 创建
- [ ] Slack/Discord 通知集成

---

**文档版本:** 1.0.0
**生成时间:** 2026-03-15
**Prophet:** 四维生物，外太空高级智慧体
