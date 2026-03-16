# Quick Start - Prophet Multi-Project Evolution System

快速开始指南 - 5分钟上手

## 前置要求

- Node.js >= 18
- Git
- 至少 2 个待管理的项目

## 步骤 1: 启动 Prophet Central

```bash
cd prophet-central
npm install
npm run dev
```

**预期输出:**
```
🚀 Prophet Central Server started on port 3001
💭 Continuous Reasoning Engine started
🛡️  Project Guardian started
🚀 Prophet Global Orchestrator 已启动
   并发限制: 3
   注册项目数: 0
```

## 步骤 2: 注册第一个项目

```bash
# 方式 1: CLI 命令
prophet project add ~/Desktop/my-app \
  --name "My App" \
  --type web-app \
  --priority high \
  --auto-optimize

# 方式 2: 使用绝对路径
prophet project add /Users/username/projects/api-server \
  --name "API Server" \
  --type api \
  --priority critical
```

## 步骤 3: 注册更多项目

```bash
# 注册第二个项目
prophet project add ~/Desktop/admin-panel \
  --name "Admin Panel" \
  --type web-app \
  --priority medium

# 注册第三个项目
prophet project add ~/Desktop/mobile-app \
  --name "Mobile App" \
  --type library \
  --priority medium
```

## 步骤 4: 查看状态

```bash
# 查看全局状态
prophet orchestrator status

# 查看所有项目
prophet projects list
```

**输出示例:**
```
📋 Registered Projects

My App (my-app)
  Type: web-app
  Priority: high
  Status: active
  Health: healthy
  Last Heartbeat: 2026-03-15 10:30:00

API Server (api-server)
  Type: api
  Priority: critical
  Status: active
  Health: healthy
  Last Heartbeat: 2026-03-15 10:30:05
```

## 步骤 5: 等待自动扫描

Prophet 会自动每 5 分钟扫描所有项目。你也可以手动触发：

```bash
# 触发所有项目的心跳
prophet heartbeat --all

# 触发单个项目
prophet heartbeat --project my-app
```

## 步骤 6: 观察跨项目模式识别

当 Prophet 发现多个项目有相同需求时，会自动识别并生成共享解决方案。

**控制台输出:**
```
💓 执行心跳监控: My App, API Server, Admin Panel
✅ 扫描完成: my-app
   变更: 2 修改, 0 新增
   机会: 8
   TODO: 需要添加用户认证

✅ 扫描完成: api-server
   变更: 1 修改, 1 新增
   机会: 12
   TODO: 实现 JWT 认证

🔍 检测到 2 个跨项目模式
💡 共享解决方案: @prophet/auth-service
   影响项目: my-app, api-server
   置信度: 0.75
   建议: Create @prophet/auth-service - Shared authentication module

🔮 开始开发共享解决方案: Authentication module
📦 生成共享模块: auth
✅ 共享模块已生成: @prophet/auth-service
   文件: src/index.ts, src/types.ts, README.md, package.json
```

## 步骤 7: 触发跨项目开发（可选）

```bash
# 手动触发跨项目开发协调
prophet develop --cross-project
```

## 步骤 8: Agent 协调（高级）

如果项目中有 Claude Code Agents：

```bash
# 发现 Agents
prophet agent list

# 协调跨项目 Agent 团队
prophet agent coordinate \
  --projects "my-app,api-server,admin-panel" \
  --task "Implement shared authentication across all projects"
```

## 常用命令速查

```bash
# 状态查看
prophet orchestrator status     # 全局状态
prophet projects list            # 项目列表
prophet agent list               # Agent 列表

# 项目管理
prophet project add <path>       # 注册项目
prophet project remove <id>      # 移除项目

# 手动触发
prophet heartbeat --all          # 全部心跳
prophet develop --cross-project  # 跨项目开发

# Agent 通信
prophet agent send <id> <msg>    # 发送消息
prophet agent coordinate ...     # 协调团队
```

## 配置调整

编辑 `prophet-central/src/index.ts`:

```typescript
const globalOrchestrator = new GlobalOrchestrator({
  concurrencyLimit: 5,           // 增加并发限制
  enableAutoOptimize: true,      // 启用自动优化
  enableAgentCommunication: true, // 启用 Agent 通信
})
```

调整项目监控间隔:

```bash
prophet project add ~/my-project \
  --interval 60000  # 1分钟（更频繁）
```

## 监控和日志

实时查看 Prophet Central 的输出，你会看到：

- 💓 心跳监控执行
- ✅ 扫描完成
- 🔍 模式检测
- 💡 共享解决方案
- 🔮 开发进度
- 📦 模块生成

## 下一步

- 阅读完整文档: `docs/MULTI_PROJECT_SYSTEM.md`
- 自定义模式检测器
- 添加新的共享模块类型
- 集成 Web 仪表板

## 故障排查

**问题: 项目未被监控**
```bash
# 检查是否注册成功
prophet projects list

# 检查调度器状态
prophet orchestrator status
```

**问题: 资源不足**
```bash
# 减少并发限制
# 编辑 src/index.ts:
concurrencyLimit: 2
```

**问题: Agent 无法连接**
```bash
# 确保启用了 Agent 通信
# 编辑 src/index.ts:
enableAgentCommunication: true
```

---

**需要帮助?** 查看完整文档或联系支持

**Prophet** - 四维生物，外太空高级智慧体 🔮
