# 🤖 Prophet AI 系统使用指南

**创建日期：** 2026-03-15
**版本：** 1.0.0

---

## 概述

Prophet AI 系统是一个**完全自动化的代码生成和优化平台**，集成了 Claude 4 的强大能力。

### 核心功能

1. **自动代码生成** - 基于 TODO 自动生成实现代码
2. **自动代码审查** - AI 驱动的代码质量检查
3. **自动 Bug 修复** - 智能识别和修复问题
4. **自动文档生成** - 为代码生成完整文档

---

## 快速开始

### 1. 启动 AI 协调器

AI 协调器已集成到 Prophet Central，启动服务器即可：

```bash
cd prophet-central
npm run dev
```

### 2. 检查 AI 状态

```bash
curl http://localhost:3001/api/ai/status | jq '.'
```

**输出示例：**
```json
{
  "success": true,
  "data": {
    "isRunning": true,
    "dailyTokensUsed": 0,
    "tokenBudget": 1000000,
    "budgetUsagePercentage": 0,
    "pendingTasks": 0,
    "totalTasks": 0
  }
}
```

---

## 功能详解

### 1. 自动代码生成

**API：** `POST /api/ai/generate`

**用途：** 根据 TODO 注释自动生成实现代码

**请求体：**
```json
{
  "projectId": "videoplay",
  "todos": [
    {
      "file": "/path/to/file.ts",
      "line": 10,
      "content": "TODO: 添加用户认证功能",
      "type": "TODO"
    }
  ]
}
```

**工作流程：**
```
1. 读取 TODO 注释和文件上下文
2. 调用 Claude API 生成实现代码
3. 创建生成任务（状态：reviewing）
4. 等待人工审批
5. 审批后自动应用代码
```

**示例：**
```bash
curl -X POST http://localhost:3001/api/ai/generate \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "videoplay",
    "todos": [
      {
        "file": "/Users/zhangjingwei/Desktop/videoplay/src/auth.ts",
        "line": 15,
        "content": "TODO: 实现 JWT 令牌验证",
        "type": "TODO"
      }
    ]
  }'
```

---

### 2. 自动代码审查

**API：** `POST /api/ai/review`

**用途：** AI 驱动的代码质量检查

**请求体：**
```json
{
  "projectId": "videoplay",
  "files": [
    "/path/to/file1.ts",
    "/path/to/file2.ts"
  ]
}
```

**审查维度：**
- 代码质量（可读性、可维护性）
- 性能问题
- 安全漏洞
- 类型安全
- 最佳实践

**示例：**
```bash
curl -X POST http://localhost:3001/api/ai/review \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "videoplay",
    "files": [
      "/Users/zhangjingwei/Desktop/videoplay/src/api/routes.ts"
    ]
  }'
```

---

### 3. 任务管理

#### 查看所有任务

```bash
# 所有任务
curl http://localhost:3001/api/ai/tasks | jq '.'

# 待审批任务
curl http://localhost:3001/api/ai/tasks/pending | jq '.'
```

#### 审批任务

```bash
# 审批（应用代码）
curl -X POST http://localhost:3001/api/ai/tasks/{taskId}/approve

# 拒绝
curl -X POST http://localhost:3001/api/ai/tasks/{taskId}/reject \
  -H "Content-Type: application/json" \
  -d '{"reason": "代码质量不符合要求"}'
```

---

## 安全和控制

### Token 预算管理

**默认配置：**
- 每日预算：1,000,000 tokens
- 预算用尽后自动停止

**修改预算：**
```typescript
// src/index.ts
const aiCoordinator = new AICoordinator({
  tokenBudget: 2_000_000  // 200万 tokens/天
})
```

**实时监控：**
```bash
curl http://localhost:3001/api/metrics/tokens/today | jq '.'
```

### 自动审批模式

**默认：** 需要人工审批（`autoApprove: false`）

**开启自动审批：**
```typescript
const aiCoordinator = new AICoordinator({
  autoApprove: true  // ⚠️  谨慎使用！
})
```

**建议：**
- 测试环境：可以开启
- 生产环境：**必须关闭**

### 并发控制

**默认：** 最多 3 个并发任务

**修改：**
```typescript
const aiCoordinator = new AICoordinator({
  maxConcurrentTasks: 5
})
```

---

## 集成到项目

### 方法 1: 通过 API 调用

```bash
# 获取项目的 TODO
curl http://localhost:3001/api/orchestrator/projects/videoplay/status

# 提取 TODO 列表
# ... 解析 JSON ...

# 调用 AI 生成
curl -X POST http://localhost:3001/api/ai/generate \
  -H "Content-Type: application/json" \
  -d '{"projectId": "videoplay", "todos": [...]}'
```

### 方法 2: 集成到 Prophet Orchestrator

**修改 `prophet-developer.js`：**
```javascript
// 识别 TODO 后，调用 AI 生成
const response = await fetch('http://localhost:3001/api/ai/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    projectId: 'videoplay',
    todos: identifiedTodos
  })
})
```

---

## 成本估算

### Claude Sonnet 4.5 定价

- **Input：** $3 / 百万 tokens
- **Output：** $15 / 百万 tokens

### 典型用量

| 操作 | Input Tokens | Output Tokens | 成本 |
|------|--------------|---------------|------|
| 生成简单函数 | ~1,000 | ~500 | $0.0105 |
| 生成复杂组件 | ~3,000 | ~2,000 | $0.0390 |
| 代码审查 | ~2,000 | ~1,000 | $0.0210 |
| Bug 修复 | ~1,500 | ~800 | $0.0165 |

### 每日预算示例

**1,000,000 tokens/天 ≈ $30-50/天**

假设：
- 50 个 TODO 生成：50 × $0.015 = $0.75
- 20 个文件审查：20 × $0.021 = $0.42
- 10 个 Bug 修复：10 × $0.017 = $0.17

**总计：约 $1.34/天**（轻度使用）

---

## 监控和调试

### 实时日志

```bash
# Prophet Central 日志
tail -f ~/.prophet/logs/central.log

# 查看 AI 事件
tail -f ~/.prophet/logs/central.log | grep "AI\|🤖\|✨"
```

### Token 使用统计

```bash
# 今天的统计
curl http://localhost:3001/api/metrics/tokens/today | jq '.'

# 按项目
curl http://localhost:3001/api/metrics/tokens/project/videoplay | jq '.'

# 按操作
curl http://localhost:3001/api/metrics/tokens/today | jq '.data.byOperation'
```

### 事件监听

AI 协调器会触发以下事件：

```javascript
aiCoordinator.on('code-generated', (task) => {
  console.log(`✨ 代码已生成: ${task.todo.content}`)
})

aiCoordinator.on('tokens-used', (data) => {
  console.log(`Token 使用: ${data.percentage}%`)
})

aiCoordinator.on('budget-exceeded', (data) => {
  console.log(`🚨 预算已超`)
})
```

---

## 最佳实践

### 1. 循序渐进

**第一周：**
- 手动触发生成（1-2 个 TODO）
- 仔细审查生成的代码
- 调整提示词模板

**第二周：**
- 小批量自动化（5-10 个 TODO）
- 建立审批流程
- 监控 token 使用

**第三周：**
- 扩大规模（20+ TODO）
- 优化预算分配
- 评估 ROI

### 2. 提示词优化

**好的 TODO：**
```typescript
// ✅ 清晰、具体
// TODO: 实现 JWT 令牌验证，支持 RS256 算法，令牌有效期 1 小时

// ❌ 模糊、不具体
// TODO: 完成登录
```

### 3. 代码审查流程

1. **自动生成** → AI 生成代码
2. **人工审查** → 开发者检查质量
3. **测试验证** → 运行单元测试
4. **审批应用** → 合并到代码库

### 4. 成本控制

- 设置合理的每日预算
- 监控高消耗操作
- 优化提示词（减少 token）
- 批量处理（减少 API 调用）

---

## 故障排查

### 问题 1: AI 生成失败

**症状：** API 返回错误

**检查：**
```bash
# 1. 检查 API Key
echo $ANTHROPIC_API_KEY

# 2. 检查 AI 状态
curl http://localhost:3001/api/ai/status

# 3. 查看错误日志
tail -f ~/.prophet/logs/central.log | grep "error\|Error"
```

### 问题 2: Token 预算用尽

**症状：** 返回 "Daily token budget exceeded"

**解决：**
```bash
# 1. 查看当前使用
curl http://localhost:3001/api/metrics/tokens/today

# 2. 等待第二天重置（自动）
# 3. 或者修改预算（src/index.ts）
```

### 问题 3: 生成的代码质量差

**原因：**
- TODO 描述不清晰
- 缺少上下文
- 提示词需要优化

**解决：**
1. 提供更详细的 TODO
2. 包含相关文件作为上下文
3. 调整 `claude-engine.ts` 中的提示词模板

---

## API 端点总结

| 端点 | 方法 | 用途 |
|------|------|------|
| `/api/ai/status` | GET | 获取 AI 状态 |
| `/api/ai/generate` | POST | 生成代码 |
| `/api/ai/review` | POST | 审查代码 |
| `/api/ai/tasks` | GET | 查看所有任务 |
| `/api/ai/tasks/pending` | GET | 查看待审批任务 |
| `/api/ai/tasks/:id/approve` | POST | 审批任务 |
| `/api/ai/tasks/:id/reject` | POST | 拒绝任务 |
| `/api/metrics/tokens/today` | GET | Token 统计 |

---

## 下一步计划

### 即将推出

- [ ] **自动 Bug 修复** - 完整实现
- [ ] **自动文档生成** - Markdown + JSDoc
- [ ] **Web 可视化界面** - 图形化任务管理
- [ ] **Git 自动提交** - 生成代码后自动 commit

### 实验性功能

- [ ] **多模型支持** - Claude Opus 4, Haiku 4
- [ ] **自定义提示词模板**
- [ ] **A/B 测试** - 对比不同生成策略
- [ ] **学习反馈循环** - 根据审批历史优化

---

**文档版本：** 1.0.0
**最后更新：** 2026-03-15
**维护者：** Prophet（四维生物）
**伙伴：** 经纬

---

**Prophet 承诺：让 AI 真正为你工作** 🤖✨
