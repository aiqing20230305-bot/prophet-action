# Prophet Agent 通信系统指南

## 概述

Prophet Central 的 Agent 通信系统允许多个项目中的 Claude Code Agents 进行协调和协作。这是一个**预留的框架**，为未来的 Agent 协作做好准备。

---

## 当前状态

### ✅ 已实现

1. **AgentCommunicationHub** - Agent 通信枢纽（390行）
   - Agent 连接管理
   - 消息发送/接收框架
   - Swarm 协调基础结构

2. **TeamCoordinator** - 团队协调器（240行）
   - 跨项目团队创建
   - 任务分解和分配
   - 进度追踪

3. **API 端点**
   - `GET /orchestrator/agents` - 获取所有 Agents
   - `GET /orchestrator/agents/:projectId` - 获取项目 Agents
   - `POST /orchestrator/agents/:agentId/message` - 发送消息
   - `POST /orchestrator/agents/coordinate` - 协调 Swarm

4. **类型定义**
   - `AgentConnection` - Agent 连接信息
   - `AgentMessage` - 消息格式
   - `AgentTask` - 任务结构
   - `SwarmTask` - Swarm 任务

### ⚠️ 待完成

1. **WebSocket 服务器端**
   - Agent 连接认证
   - 实时消息路由
   - 连接状态管理

2. **Agent 发现机制**
   - 自动发现项目中的 Claude Code Agents
   - Agent 能力检测
   - Agent 角色识别

3. **实际 Agent 集成**
   - 在项目中部署可通信的 Agents
   - 配置 Agent 连接参数
   - 测试端到端通信

---

## 系统架构

```
┌─────────────────────────────────────────────┐
│        Prophet Central                      │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │  AgentCommunicationHub               │  │
│  │  - 管理所有 Agent 连接                │  │
│  │  - 路由消息                           │  │
│  │  - 协调 Swarm                         │  │
│  └──────────┬────────────────────────────┘  │
│             │                               │
│             │  WebSocket                    │
│             │                               │
└─────────────┼───────────────────────────────┘
              │
    ┌─────────┼─────────────┐
    │         │             │
    ▼         ▼             ▼
┌────────┐ ┌────────┐  ┌────────┐
│Project1│ │Project2│  │Project3│
│        │ │        │  │        │
│ Agent1 │ │ Agent3 │  │ Agent5 │
│ Agent2 │ │ Agent4 │  │ Agent6 │
└────────┘ └────────┘  └────────┘
```

---

## 消息格式

### Agent 连接信息

```typescript
interface AgentConnection {
  projectId: string
  agentId: string
  name: string
  role: string
  capabilities: string[]
  status: 'connected' | 'disconnected' | 'busy'
  socket: Socket | null
}
```

### Agent 消息

```typescript
interface AgentMessage {
  type:
    | 'task-assignment'        // 任务分配
    | 'task-completed'         // 任务完成
    | 'insight-discovered'     // 洞察发现
    | 'help-requested'         // 请求帮助
    | 'swarm-communication'    // Swarm 内部通信
    | 'team-invitation'        // 团队邀请
    | 'team-disbanded'         // 团队解散
    | 'custom-message'         // 自定义消息
  [key: string]: any
}
```

### Agent 任务

```typescript
interface AgentTask {
  id: string
  swarmId?: string
  type: string
  description: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  deadline?: Date
  subtask?: any
}
```

### Swarm 任务

```typescript
interface SwarmTask {
  id: string
  goal: string
  description: string
  subtask: any
  deadline?: Date
}
```

---

## 使用场景

### 场景1：跨项目代码审查

```typescript
// Prophet Central 协调3个项目的 Agents 进行代码审查

const result = await orchestrator.coordinateAgentSwarm(
  ['proj-1', 'proj-2', 'proj-3'],
  {
    description: 'Review authentication implementation across projects',
    goal: 'Identify inconsistencies and security issues'
  }
)

// 每个项目的 Agent 审查本地代码
// 结果汇总到 Prophet Central
// 生成跨项目审查报告
```

### 场景2：共享模块开发

```typescript
// 识别通用需求后，协调 Agents 开发共享模块

const team = await teamCoordinator.createCrossProjectTeam(
  ['proj-1', 'proj-2', 'proj-3'],
  'Implement shared authentication service'
)

await teamCoordinator.assignTeamTask(team.id, {
  description: 'Create @prophet/auth-service',
  requirements: [...],
  deadline: new Date('2026-03-20')
})
```

### 场景3：紧急问题响应

```typescript
// 发现 Critical 问题，协调所有相关 Agents

await agentHub.sendMessage('*', {  // 广播
  type: 'urgent-alert',
  severity: 'critical',
  issue: {
    type: 'security',
    description: 'SQL injection vulnerability found',
    affectedProjects: ['proj-1', 'proj-3']
  },
  action: 'immediate-patch'
})
```

---

## API 使用示例

### 获取所有 Agents

```bash
curl http://localhost:3001/orchestrator/agents
```

响应：
```json
[
  {
    "agentId": "agent-123",
    "name": "researcher",
    "projectId": "proj-1",
    "role": "code-analysis",
    "capabilities": ["ast-parsing", "pattern-detection"],
    "status": "connected"
  },
  {
    "agentId": "agent-456",
    "name": "developer",
    "projectId": "proj-1",
    "role": "code-generation",
    "capabilities": ["typescript", "react"],
    "status": "busy"
  }
]
```

### 发送消息给 Agent

```bash
curl -X POST http://localhost:3001/orchestrator/agents/agent-123/message \
  -H "Content-Type: application/json" \
  -d '{
    "type": "custom-message",
    "content": "Analyze the authentication module"
  }'
```

### 协调 Agent Swarm

```bash
curl -X POST http://localhost:3001/orchestrator/agents/coordinate \
  -H "Content-Type: application/json" \
  -d '{
    "projectIds": ["proj-1", "proj-2", "proj-3"],
    "task": {
      "description": "Implement shared auth service",
      "goal": "Create reusable authentication module"
    }
  }'
```

响应：
```json
{
  "swarmId": "swarm-1773552000000-abc123",
  "agentsCount": 6,
  "projects": ["proj-1", "proj-2", "proj-3"]
}
```

---

## 实现 Agent 的建议

### Agent 客户端结构

```typescript
// agent-client.ts
import { ProphetClient } from '@prophet/central-sdk'

class ProphetAgent {
  private client: ProphetClient
  private agentId: string

  async connect() {
    this.client = new ProphetClient({
      serverUrl: 'http://localhost:3001',
      apiKey: process.env.PROPHET_API_KEY,
      projectId: 'my-project'
    })

    await this.client.connect()

    // 注册为 Agent
    await this.registerAsAgent({
      name: 'my-agent',
      role: 'developer',
      capabilities: ['typescript', 'react', 'testing']
    })

    // 监听任务
    this.client.on('agent:task', async (task) => {
      await this.executeTask(task)
    })

    // 监听消息
    this.client.on('agent:message', async (message) => {
      await this.handleMessage(message)
    })
  }

  async executeTask(task: AgentTask) {
    console.log(`执行任务: ${task.description}`)

    // ... 执行任务逻辑

    // 报告完成
    await this.client.emit('agent:task-completed', {
      taskId: task.id,
      result: { ... }
    })
  }
}
```

### 在项目中部署

1. **安装 SDK**
   ```bash
   npm install @prophet/central-sdk
   ```

2. **创建 Agent 脚本**
   ```javascript
   // .claude/agents/my-agent.js
   const { ProphetAgent } = require('@prophet/central-sdk')

   const agent = new ProphetAgent({
     name: 'my-agent',
     role: 'developer',
     capabilities: ['typescript', 'testing']
   })

   agent.start()
   ```

3. **配置环境变量**
   ```bash
   PROPHET_CENTRAL_URL=http://localhost:3001
   PROPHET_API_KEY=pk_abc123...
   ```

4. **启动 Agent**
   ```bash
   node .claude/agents/my-agent.js
   ```

---

## 测试 Agent 通信

### 运行测试套件

```bash
cd prophet-central
npx tsx tests/agent-communication-test.ts
```

预期输出：
```
═══════════════════════════════════════════
🧪 Prophet Agent Communication 测试
═══════════════════════════════════════════

📊 测试 1: 健康检查
✅ Prophet Central 运行中

📋 测试 2: 注册测试项目
✅ 测试项目已注册: proj-1773552000000-abc123

🔍 测试 Agent 发现 (项目: proj-1773552000000-abc123)
⚠️  Agent 发现端点未实现或项目无 Agents

🤖 测试 4: 创建模拟 Agents
✅ 创建了 2 个模拟 Agents

🔌 测试 5: 连接 Agents（WebSocket）
⚠️  WebSocket 连接失败（预期，需要服务器端支持）

💬 测试发送消息给 Agent (agent-1773552000000-abc123)
❌ 发送消息失败: Request failed with status code 404

🐝 测试 Swarm 协调
   项目: proj-1773552000000-abc123
   任务: Implement shared authentication service
✅ Swarm 已启动
   Swarm ID: swarm-1773552000001-def456
   Agents: 0

═══════════════════════════════════════════
✅ 测试完成
═══════════════════════════════════════════

📝 测试总结:
   • Agent 通信框架已就绪
   • API 端点正常工作
   • WebSocket 需要服务器端完整实现
   • 实际 Agent 通信需要项目中有 Claude Code Agents

📖 下一步:
   1. 在实际项目中部署 Claude Code Agents
   2. 配置 Agent 连接到 Prophet Central
   3. 运行真实的 Agent 协调测试
```

---

## 故障排查

### Agent 无法连接

**症状：** `WebSocket connection failed`

**可能原因：**
1. Prophet Central 未运行
2. WebSocket 服务器未实现
3. 防火墙阻止连接

**解决：**
```bash
# 检查 Prophet Central 状态
curl http://localhost:3001/health

# 检查端口
lsof -i :3001
```

### Agent 未被发现

**症状：** `GET /orchestrator/agents` 返回空数组

**可能原因：**
1. Agent 未连接
2. Agent 未注册
3. Agent 发现机制未实现

**解决：**
- 确保 Agent 已连接并注册
- 检查 Agent 日志
- 等待 Agent 发现服务完整实现

### 消息发送失败

**症状：** `POST /orchestrator/agents/:agentId/message` 返回 404

**可能原因：**
1. Agent ID 不存在
2. Agent 已断开连接
3. 消息路由未实现

**解决：**
- 检查 Agent ID 是否正确
- 使用 `GET /orchestrator/agents` 查看可用 Agents
- 等待消息路由功能完整实现

---

## 未来路线图

### 第一阶段（当前）
- ✅ 基础框架和类型定义
- ✅ API 端点
- ⚠️ 测试套件（部分完成）

### 第二阶段（短期）
- ⬜ WebSocket 服务器端实现
- ⬜ Agent 自动发现
- ⬜ 实时消息路由
- ⬜ 连接状态管理

### 第三阶段（中期）
- ⬜ Agent SDK 发布
- ⬜ 在实际项目中部署 Agents
- ⬜ 端到端通信测试
- ⬜ Swarm 协调完整实现

### 第四阶段（长期）
- ⬜ Agent 能力自动发现
- ⬜ 智能任务分配
- ⬜ 分布式 Agent 协调
- ⬜ Agent 学习和优化

---

## 总结

Prophet Central 的 Agent 通信系统提供了一个**坚实的框架**，为未来的多 Agent 协作做好准备。虽然部分功能尚未完全实现，但核心架构、类型系统、API 端点都已就绪。

随着项目中开始部署可通信的 Claude Code Agents，这个系统将发挥巨大作用，实现真正的跨项目智能协调。

---

**相关文档：**
- [系统架构](./MULTI_PROJECT_SYSTEM.md)
- [测试指南](./TESTING_GUIDE.md)
- [快速开始](./QUICKSTART.md)
