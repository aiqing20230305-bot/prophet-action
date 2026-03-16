# Prophet 群体智能可视化仪表板

实时可视化群体智能模拟过程，展示智能体交互、意见演化和共识形成。

## 功能特性

### 🕸️ 智能体交互网络图
- **D3.js 力导向图**：实时显示智能体之间的交互关系
- **交互类型**：
  - 🔵 `persuade`（说服）- 蓝色
  - 🟢 `support`（支持）- 绿色
  - 🔴 `oppose`（反对）- 红色
  - 🟡 `question`（质疑）- 黄色
- **节点大小**：表示意见强度
- **节点颜色**：按角色分组（developer, user, stakeholder）
- **可交互**：拖拽节点、缩放、平移

### 🌡️ 意见分布热力图
- 横轴：模拟步骤（时间）
- 纵轴：智能体 ID
- 颜色：意见值（红色 = 负面，黄色 = 中立，绿色 = 正面）
- 实时更新，显示意见演化轨迹

### 📈 置信度演化时间线
- **置信度曲线**（蓝色实线）：群体共识的置信度
- **一致率曲线**（绿色虚线）：智能体之间的一致性
- X 轴：模拟步骤
- Y 轴：0-1 范围

### ✨ 新兴模式列表
- **共识模式**（绿色边框）：多数智能体达成一致
- **冲突模式**（红色边框）：智能体意见分歧
- **趋势模式**（橙色边框）：意见正在形成或变化
- 显示置信度和影响的智能体数量

---

## 使用方法

### 方法 1：独立 HTML 文件（开发/演示）

1. **打开仪表板**：
   ```bash
   open prophet-central/src/visualization/dashboard-client.html
   ```

2. **查看模拟数据**：
   - 页面加载时会显示模拟数据
   - 网络图、热力图、时间线自动渲染

### 方法 2：集成到 SwarmOracle（生产）

1. **创建仪表板实例**：
   ```typescript
   import { createSwarmDashboard } from './prophet-central/src/visualization/swarm-dashboard.js'

   const dashboard = createSwarmDashboard({
     updateInterval: 100,     // 100ms 更新间隔
     recordHistory: true      // 记录历史数据
   })
   ```

2. **初始化仪表板**：
   ```typescript
   dashboard.initializeDashboard(
     swarmId,
     'feature-prediction',  // 群体名称
     50,                    // 智能体数量
     100                    // 总步骤数
   )
   ```

3. **在模拟过程中更新**：
   ```typescript
   // 更新智能体节点
   dashboard.updateNodes(swarmId, agents, opinions)

   // 添加交互边
   dashboard.addInteraction(swarmId, fromId, toId, 'persuade', 0.8)

   // 更新步骤
   dashboard.updateStep(swarmId, step, opinions, consensus, diversity)

   // 更新置信度
   dashboard.updateConfidence(swarmId, step, confidence, agreementRate, diversity)

   // 添加新兴模式
   dashboard.addPattern(swarmId, pattern)

   // 标记收敛
   dashboard.markConvergence(swarmId, step)
   ```

4. **导出可视化数据**：
   ```typescript
   const vizData = dashboard.exportVisualizationData(swarmId)

   // vizData 包含：
   // - network: { nodes, edges }
   // - timeline: OpinionSnapshot[]
   // - confidence: ConfidenceEvolution[]
   // - patterns: EmergentPatternHighlight[]
   // - metadata: { swarmName, agentCount, metrics }
   ```

5. **生成 D3.js 兼容数据**：
   ```typescript
   const d3Data = dashboard.generateD3NetworkData(swarmId)
   // { nodes: [...], links: [...] }

   const heatmap = dashboard.generateOpinionHeatmap(swarmId)
   // [{ step, agentId, opinion }, ...]
   ```

### 方法 3：WebSocket 实时推送（全栈）

1. **启动 WebSocket 服务器**：
   ```typescript
   import { DashboardWebSocketServer } from './prophet-central/src/visualization/swarm-dashboard.js'
   import WebSocket from 'ws'

   const wss = new WebSocket.Server({ port: 8080 })
   const wsServer = new DashboardWebSocketServer(dashboard)

   wss.on('connection', (ws) => {
     wsServer.addClient(ws)

     ws.on('close', () => {
       wsServer.removeClient(ws)
     })
   })
   ```

2. **前端连接**：
   ```javascript
   const ws = new WebSocket('ws://localhost:8080')

   ws.onmessage = (event) => {
     const { event: eventType, data } = JSON.parse(event.data)

     switch (eventType) {
       case 'nodes-updated':
         updateNetworkGraph(data.nodes)
         break
       case 'interaction':
         addInteractionEdge(data.edge)
         break
       case 'step-updated':
         updateTimeline(data.step, data.state)
         break
       case 'pattern-detected':
         addPatternToList(data.pattern)
         break
       case 'converged':
         showConvergenceNotification(data)
         break
     }
   }
   ```

---

## API 参考

### SwarmDashboard 类

#### 构造函数
```typescript
new SwarmDashboard(config?: {
  updateInterval?: number      // 更新间隔（毫秒），默认 100
  recordHistory?: boolean       // 是否记录历史，默认 true
})
```

#### 方法

**initializeDashboard(swarmId, swarmName, agentCount, totalSteps)**
- 初始化仪表板状态

**updateNodes(swarmId, agents, opinions)**
- 更新智能体节点和意见

**addInteraction(swarmId, fromId, toId, type, influence)**
- 添加智能体交互边
- type: 'persuade' | 'question' | 'support' | 'oppose'

**updateStep(swarmId, step, opinions, consensus, diversity)**
- 更新模拟步骤和指标

**updateConfidence(swarmId, step, confidence, agreementRate, diversityScore)**
- 更新置信度历史

**addPattern(swarmId, pattern)**
- 添加检测到的新兴模式

**markConvergence(swarmId, step)**
- 标记群体收敛

**completeDashboard(swarmId)**
- 完成模拟

**getDashboardState(swarmId): DashboardState | undefined**
- 获取当前仪表板状态

**exportVisualizationData(swarmId): VisualizationData | null**
- 导出完整可视化数据

**generateD3NetworkData(swarmId): D3NetworkData | null**
- 生成 D3.js 网络图数据

**generateOpinionHeatmap(swarmId): HeatmapData[] | null**
- 生成意见热力图数据

**clearDashboard(swarmId)**
- 清除仪表板数据

#### 事件

仪表板继承自 `EventEmitter`，触发以下事件：

```typescript
dashboard.on('dashboard:initialized', ({ swarmId, state }) => {})
dashboard.on('dashboard:nodes-updated', ({ swarmId, nodes }) => {})
dashboard.on('dashboard:interaction', ({ swarmId, edge }) => {})
dashboard.on('dashboard:step-updated', ({ swarmId, step, state }) => {})
dashboard.on('dashboard:confidence-updated', ({ swarmId, step, confidence }) => {})
dashboard.on('dashboard:pattern-detected', ({ swarmId, pattern }) => {})
dashboard.on('dashboard:converged', ({ swarmId, step, convergenceSpeed }) => {})
dashboard.on('dashboard:completed', ({ swarmId, state }) => {})
dashboard.on('dashboard:cleared', ({ swarmId }) => {})
```

---

## 数据结构

### DashboardState
```typescript
interface DashboardState {
  swarmId: string
  swarmName: string
  agentCount: number
  currentStep: number
  totalSteps: number
  status: 'initializing' | 'running' | 'converged' | 'completed'

  nodes: NetworkNode[]
  edges: NetworkEdge[]
  opinionHistory: OpinionSnapshot[]
  confidenceHistory: ConfidenceEvolution[]
  patterns: EmergentPatternHighlight[]

  consensusLevel: number
  diversityScore: number
  convergenceSpeed: number
  interactionCount: number
}
```

### NetworkNode
```typescript
interface NetworkNode {
  id: string
  label: string
  role: string
  opinion: number       // -1 到 1
  influence: number     // 0 到 1
  x?: number            // D3 布局位置
  y?: number
}
```

### NetworkEdge
```typescript
interface NetworkEdge {
  source: string
  target: string
  type: 'persuade' | 'question' | 'support' | 'oppose'
  strength: number      // 0 到 1
  timestamp: number
}
```

### OpinionSnapshot
```typescript
interface OpinionSnapshot {
  step: number
  timestamp: number
  opinions: Map<string, number>
  consensus: number
  diversity: number
}
```

### EmergentPatternHighlight
```typescript
interface EmergentPatternHighlight {
  id: string
  type: 'consensus' | 'conflict' | 'trend' | 'cluster'
  description: string
  confidence: number
  affectedAgents: string[]
  detectedAt: number
}
```

---

## 示例代码

### 完整集成示例

```typescript
import { SwarmOracle } from './src/core/oracle/swarm-oracle.js'
import { createSwarmDashboard } from './prophet-central/src/visualization/swarm-dashboard.js'

// 创建仪表板
const dashboard = createSwarmDashboard()

// 创建 Oracle
const oracle = new SwarmOracle({
  defaultAgentCount: 30,
  defaultSimulationSteps: 50,
  dashboard  // 传入仪表板实例
})

// 运行预测
const predictions = await oracle.predictNeeds({
  projectPath: '.',
  projectType: 'web-app'
})

// 导出可视化数据
const vizData = dashboard.exportVisualizationData('swarm-1-needs-prediction')

// 保存到文件或发送到前端
console.log(JSON.stringify(vizData, null, 2))
```

### 监听事件示例

```typescript
dashboard.on('dashboard:pattern-detected', ({ swarmId, pattern }) => {
  console.log(`✨ 新模式: ${pattern.description}`)
  console.log(`   置信度: ${(pattern.confidence * 100).toFixed(1)}%`)
  console.log(`   影响: ${pattern.affectedAgents.length} 智能体`)
})

dashboard.on('dashboard:converged', ({ swarmId, step, convergenceSpeed }) => {
  console.log(`✓ 群体收敛于步骤 ${step}`)
  console.log(`  收敛速度: ${(convergenceSpeed * 100).toFixed(1)}%`)
})
```

---

## 性能优化

### 历史数据限制
- 默认保留最近 100 个意见快照
- 默认保留最近 100 个置信度数据点
- 默认保留最近 50 条交互边
- 默认保留最近 10 个新兴模式

可通过以下方式清理旧数据：
```typescript
// 清除特定群体的仪表板数据
dashboard.clearDashboard(swarmId)
```

### WebSocket 优化
- 使用事件驱动更新，减少轮询
- 仅推送变化的数据
- 客户端使用 requestAnimationFrame 批量更新 UI

### D3.js 渲染优化
- 使用 D3 的 enter/update/exit 模式高效更新节点
- 力导向模拟设置 alpha 衰减，避免无限运行
- 节点数超过 100 时，降低物理模拟精度

---

## 浏览器兼容性

- Chrome/Edge: ✅ 完全支持
- Firefox: ✅ 完全支持
- Safari: ✅ 完全支持
- IE11: ❌ 不支持（需要 ES6+ polyfills）

---

## 开发计划

### Phase 1 ✅ 已完成
- [x] 核心仪表板类（SwarmDashboard）
- [x] 数据结构定义
- [x] 事件系统
- [x] 独立 HTML 可视化页面
- [x] D3.js 网络图
- [x] 意见热力图
- [x] 置信度时间线
- [x] 新兴模式列表

### Phase 2 🚧 进行中
- [ ] 集成到 MiroFishAdapter
- [ ] 集成到 SwarmOracle
- [ ] WebSocket 实时推送
- [ ] CLI 命令启动仪表板服务器

### Phase 3 📋 待开发
- [ ] 3D 网络可视化（Three.js）
- [ ] 历史回放功能
- [ ] 导出为视频/GIF
- [ ] 多群体对比视图
- [ ] 自定义主题

---

## 故障排除

### 问题：仪表板页面空白
- 检查浏览器控制台是否有 JavaScript 错误
- 确认 D3.js CDN 已加载（检查网络连接）
- 验证数据格式是否正确

### 问题：网络图节点不显示
- 检查 `nodes` 数组是否为空
- 验证每个节点是否有唯一的 `id`
- 确认 SVG 容器尺寸不为 0

### 问题：WebSocket 连接失败
- 确认服务器已启动并监听正确端口
- 检查防火墙/代理设置
- 验证 WebSocket URL（ws:// 或 wss://）

---

## 贡献

欢迎贡献！如果你有新的可视化想法：

1. Fork 项目
2. 创建特性分支（`git checkout -b feature/amazing-viz`）
3. 提交更改（`git commit -m 'Add amazing visualization'`）
4. 推送到分支（`git push origin feature/amazing-viz`）
5. 创建 Pull Request

---

## 许可证

MIT License - 详见 LICENSE 文件

---

**文档版本：** 1.0.0
**最后更新：** 2026-03-15
