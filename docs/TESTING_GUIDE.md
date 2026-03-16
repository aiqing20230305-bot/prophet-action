# Prophet 多项目系统测试指南

## 快速开始

### 1. 启动 Prophet Central

```bash
cd "/Users/zhangjingwei/Desktop/New CC/prophet-central"
npm run dev
```

等待看到：
```
🚀 Prophet Global Orchestrator 已启动
   并发限制: 3
   注册项目数: 0
```

### 2. 手动测试 API

#### 检查健康状态
```bash
curl http://localhost:3001/health
```

#### 查看编排器状态
```bash
curl http://localhost:3001/orchestrator/status
```

#### 注册项目
```bash
curl -X POST http://localhost:3001/orchestrator/projects/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-project",
    "path": "/path/to/project",
    "type": "web-app",
    "priority": "high",
    "monitoringInterval": 300000,
    "autoOptimize": true
  }'
```

#### 列出所有项目
```bash
curl http://localhost:3001/orchestrator/projects
```

#### 触发全局心跳
```bash
curl -X POST http://localhost:3001/orchestrator/heartbeat
```

#### 触发跨项目开发
```bash
curl -X POST http://localhost:3001/orchestrator/develop/cross-project
```

### 3. 使用 CLI 命令

#### 查看编排器状态
```bash
npx tsx src/cli/test-orchestrator.ts status
```

#### 列出项目
```bash
npx tsx src/cli/test-orchestrator.ts projects list
```

#### 注册项目
```bash
npx tsx src/cli/test-orchestrator.ts project add /path/to/project \
  --name "My Project" \
  --type web-app \
  --priority high \
  --auto-optimize
```

### 4. 运行端到端测试

#### 启动 Prophet Central（终端1）
```bash
cd "/Users/zhangjingwei/Desktop/New CC/prophet-central"
npm run dev
```

#### 运行测试（终端2）
```bash
cd "/Users/zhangjingwei/Desktop/New CC/prophet-central"
npx tsx tests/e2e-orchestrator-test.ts
```

预期输出：
```
═══════════════════════════════════════════
🧪 Prophet Global Orchestrator E2E 测试
═══════════════════════════════════════════

📊 测试 1: 健康检查
✅ 服务器健康
   总项目: 0
   活跃项目: 0

📋 测试 2: 注册项目
✅ 项目已注册: test-project-1
   ID: proj-1773552000000-abc123
✅ 项目已注册: test-project-2
   ID: proj-1773552000001-def456
✅ 项目已注册: test-project-3
   ID: proj-1773552000002-ghi789

✅ 总计注册: 3 个项目

🔮 测试 3: 编排器状态
✅ 编排器运行中
   项目数: 3
   活跃项目: 3
   调度器:
     活跃任务: 0
     队列任务: 6
   开发者:
     活跃: 0
     可用槽位: 2

📋 测试 4: 列出项目
✅ 找到 3 个项目

💓 测试 5: 全局心跳
✅ 全局心跳已触发
⏳ 等待扫描完成 (10秒)...

📊 扫描后状态:
   test-project-1: active
     TODOs: 15
     优化机会: 8
     自动优化: 2

🔧 测试 6: 跨项目开发
✅ 跨项目开发已触发
⏳ 等待开发协调 (5秒)...

🧹 清理: 移除测试项目
✅ 项目已移除: proj-1773552000000-abc123
✅ 项目已移除: proj-1773552000001-def456
✅ 项目已移除: proj-1773552000002-ghi789

═══════════════════════════════════════════
✅ 所有测试完成
═══════════════════════════════════════════
```

## 验证功能

### ✅ 核心功能

- [ ] Prophet Central 成功启动
- [ ] GlobalOrchestrator 初始化
- [ ] 项目注册和注销
- [ ] 项目列表查询
- [ ] 全局状态查询

### ✅ 并行监控

- [ ] 多项目并行心跳
- [ ] 时间错开策略（检查日志时间戳）
- [ ] Git 变更检测
- [ ] TODO 和优化机会扫描
- [ ] 自动执行安全优化

### ✅ 跨项目协调

- [ ] 跨项目模式检测
- [ ] 通用需求识别
- [ ] 全局优先级排序
- [ ] 共享模块生成建议

### ✅ 资源管理

- [ ] 并发限制（最多3个任务）
- [ ] CPU 和内存监控
- [ ] 资源耗尽警告

### ⚠️ Agent 通信（需要项目 Agent）

- [ ] Agent 发现
- [ ] WebSocket 连接
- [ ] 消息发送
- [ ] Swarm 协调

## 性能测试

### 并发能力测试

注册 10 个项目，观察资源使用：

```bash
for i in {1..10}; do
  curl -X POST http://localhost:3001/orchestrator/projects/register \
    -H "Content-Type: application/json" \
    -d "{
      \"name\": \"test-project-$i\",
      \"path\": \"/tmp/test-$i\",
      \"type\": \"web-app\",
      \"priority\": \"medium\",
      \"monitoringInterval\": 60000,
      \"autoOptimize\": false
    }"
  sleep 1
done
```

触发全局心跳，观察时间错开：

```bash
curl -X POST http://localhost:3001/orchestrator/heartbeat
```

检查日志中的执行时间戳，应该看到时间间隔 > 1秒。

### 压力测试

快速注册/注销项目，测试稳定性：

```bash
for i in {1..50}; do
  ID=$(curl -s -X POST http://localhost:3001/orchestrator/projects/register \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"stress-$i\",\"path\":\"/tmp/stress-$i\",\"type\":\"web-app\",\"priority\":\"low\",\"monitoringInterval\":3600000,\"autoOptimize\":false}" \
    | jq -r '.id')

  curl -X DELETE http://localhost:3001/orchestrator/projects/$ID

  if [ $((i % 10)) -eq 0 ]; then
    echo "✅ Completed $i iterations"
  fi
done
```

## 故障排查

### 服务器无法启动

**症状：** `Error: listen EADDRINUSE: address already in use :::3001`

**解决：**
```bash
# 查找占用端口的进程
lsof -ti:3001

# 杀死进程
kill -9 $(lsof -ti:3001)

# 重新启动
npm run dev
```

### 资源耗尽警告

**症状：** `⚠️  资源耗尽: CPU 80%, Memory 2048MB`

**解决：**

1. 减少并发限制（修改 `src/index.ts`）:
```typescript
const globalOrchestrator = new GlobalOrchestrator({
  concurrencyLimit: 2,  // 降低到 2
  // ...
})
```

2. 增加资源池限制:
```typescript
const resourcePool = new ResourcePool({
  maxCPUPercent: 90,     // 提高 CPU 限制
  maxMemoryMB: 4096,     // 提高内存限制
})
```

### 项目扫描失败

**症状：** 日志中看到 `scan-error` 事件

**原因：**
- 项目路径不存在
- 没有 git 仓库
- 权限问题

**解决：**
```bash
# 确保路径存在且是 git 仓库
ls -la /path/to/project/.git

# 检查权限
ls -ld /path/to/project
```

### TypeScript 编译错误

**症状：** `npm run build` 失败

**解决：**
```bash
# 清理并重新构建
rm -rf dist
npm run build

# 如果还是失败，检查 Node 版本
node --version  # 应该 >= 20.0.0
```

## 下一步

### 集成到现有项目

在 videoplay 项目中：

```bash
cd /Users/zhangjingwei/Desktop/videoplay

# 注册到 Prophet Central
curl -X POST http://localhost:3001/orchestrator/projects/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "videoplay",
    "path": "/Users/zhangjingwei/Desktop/videoplay",
    "type": "web-app",
    "priority": "critical",
    "monitoringInterval": 300000,
    "autoOptimize": true
  }'
```

### 设置自动启动

创建 PM2 配置 `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'prophet-central',
    script: 'dist/index.js',
    cwd: '/Users/zhangjingwei/Desktop/New CC/prophet-central',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '2G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
}
```

启动：
```bash
npm run build
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 成功指标

### ✅ 基本功能
- [x] 服务器启动成功
- [x] 项目注册/注销工作正常
- [x] API 端点响应正确
- [x] 并发任务限制生效

### ✅ 监控能力
- [ ] 多项目并行扫描
- [ ] Git 变更检测准确
- [ ] TODO 识别正确
- [ ] 自动优化执行成功

### ✅ 跨项目功能
- [ ] 模式检测工作
- [ ] 通用需求识别
- [ ] 优先级排序合理

### ⚠️ 高级功能
- [ ] Agent 通信建立
- [ ] Swarm 协调成功
- [ ] 共享模块生成

## 已知限制

1. **Agent 通信未完全测试** - 需要项目中有 Claude Code Agents 才能测试
2. **资源池限制过低** - 默认 2GB 内存限制在 macOS 上太小
3. **模式检测需要实际数据** - 测试项目可能没有足够的通用模式
4. **共享模块生成是建议性的** - 不会自动创建和部署
