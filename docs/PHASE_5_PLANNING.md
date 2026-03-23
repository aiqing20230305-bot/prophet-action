# Phase 5: 健康监控与自愈系统 - 详细规划

**规划日期**: 2026-03-20
**预计开始**: 2026-03-21（确认Phase 0-4稳定后）
**预计完成**: 2026-03-23（3天）

---

## 🎯 Phase 5 目标

### 核心使命
**让Prophet能够自我监控、自我诊断、自我修复**

### 设计理念
- 🔍 **主动监控**: 持续检测系统健康状态
- 🧬 **智能诊断**: 自动识别问题根因
- 💊 **自动修复**: 无需人工干预即可恢复
- 📊 **数据驱动**: 基于历史数据优化策略

---

## 📋 系统架构

### 三层架构

```
┌─────────────────────────────────────────┐
│         健康监控层 (Monitoring)          │
│  - CPU/内存/磁盘监控                     │
│  - 进程存活检测                          │
│  - API响应时间                           │
│  - 错误率统计                            │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         智能诊断层 (Diagnosis)           │
│  - 异常模式识别                          │
│  - 根因分析                              │
│  - 影响评估                              │
│  - 修复方案推荐                          │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         自愈执行层 (Self-Healing)        │
│  - 进程重启                              │
│  - 资源释放                              │
│  - 配置回滚                              │
│  - 降级保护                              │
└─────────────────────────────────────────┘
```

---

## 🔧 核心组件

### 1. HealthMonitor（健康监控器）

**职责**: 持续监控系统各项指标

**监控指标**:
```typescript
interface SystemHealth {
  // 系统资源
  cpu: {
    usage: number        // CPU使用率 (%)
    temperature?: number // CPU温度 (可选)
    threshold: number    // 告警阈值
  }

  memory: {
    used: number         // 已用内存 (MB)
    total: number        // 总内存 (MB)
    percentage: number   // 使用率 (%)
    threshold: number    // 告警阈值
  }

  disk: {
    used: number         // 已用磁盘 (GB)
    available: number    // 可用磁盘 (GB)
    percentage: number   // 使用率 (%)
    threshold: number    // 告警阈值
  }

  // 进程健康
  processes: {
    prophet: ProcessHealth
    neverIdle: ProcessHealth
    automation: ProcessHealth[]
  }

  // API健康
  api: {
    responseTime: number    // 平均响应时间 (ms)
    errorRate: number       // 错误率 (%)
    requestsPerMinute: number
  }

  // 时间戳
  timestamp: Date
  overallStatus: 'healthy' | 'warning' | 'critical'
}

interface ProcessHealth {
  pid: number
  name: string
  status: 'running' | 'stopped' | 'zombie'
  cpu: number
  memory: number
  uptime: number
  lastError?: string
}
```

**监控频率**:
- CPU/内存: 每30秒
- 磁盘: 每5分钟
- 进程存活: 每1分钟
- API健康: 每次请求

**实现**:
```typescript
export class HealthMonitor {
  private checkInterval = 30 * 1000 // 30秒
  private healthHistory: SystemHealth[] = []
  private maxHistorySize = 1000 // 保留最近1000条

  async start() {
    setInterval(async () => {
      const health = await this.collectHealthData()
      this.healthHistory.push(health)

      // 保持历史大小
      if (this.healthHistory.length > this.maxHistorySize) {
        this.healthHistory.shift()
      }

      // 检查是否需要告警
      if (health.overallStatus !== 'healthy') {
        await this.triggerDiagnosis(health)
      }
    }, this.checkInterval)
  }

  private async collectHealthData(): Promise<SystemHealth> {
    return {
      cpu: await this.getCPUMetrics(),
      memory: await this.getMemoryMetrics(),
      disk: await this.getDiskMetrics(),
      processes: await this.getProcessHealth(),
      api: await this.getAPIHealth(),
      timestamp: new Date(),
      overallStatus: this.calculateOverallStatus()
    }
  }
}
```

---

### 2. IntelligentDiagnostic（智能诊断器）

**职责**: 分析问题并找到根因

**诊断能力**:
```typescript
interface DiagnosticResult {
  issue: {
    id: string
    type: 'performance' | 'crash' | 'resource' | 'logic'
    severity: 'low' | 'medium' | 'high' | 'critical'
    description: string
  }

  rootCause: {
    component: string     // 问题组件
    reason: string        // 根本原因
    evidence: any[]       // 证据数据
    confidence: number    // 置信度 (0-1)
  }

  impact: {
    affectedComponents: string[]
    userImpact: 'none' | 'minor' | 'major' | 'severe'
    estimatedDowntime?: number
  }

  recommendations: HealingAction[]
}

interface HealingAction {
  id: string
  name: string
  type: 'restart' | 'cleanup' | 'rollback' | 'scale' | 'notify'
  priority: number
  description: string
  automated: boolean
  estimatedTime: number  // 预计修复时间 (秒)
  riskLevel: 'safe' | 'moderate' | 'risky'
}
```

**诊断规则**:

1. **CPU过高诊断**:
```typescript
async diagnoseCPUHigh(health: SystemHealth): Promise<DiagnosticResult> {
  // 分析CPU使用历史
  const history = this.getRecentHistory(10)
  const trend = this.analyzeTrend(history.map(h => h.cpu.usage))

  // 识别CPU占用最高的进程
  const topProcess = health.processes.prophet

  if (topProcess.cpu > 70) {
    return {
      issue: {
        type: 'performance',
        severity: 'high',
        description: 'Prophet进程CPU使用率过高'
      },
      rootCause: {
        component: 'never-idle-engine',
        reason: '可能是扫描任务过于密集或stuck',
        confidence: 0.8
      },
      recommendations: [
        {
          name: '增加任务间隔',
          type: 'scale',
          automated: true,
          riskLevel: 'safe'
        },
        {
          name: '重启Never-Idle Engine',
          type: 'restart',
          automated: true,
          riskLevel: 'moderate'
        }
      ]
    }
  }
}
```

2. **内存泄漏诊断**:
```typescript
async diagnoseMemoryLeak(health: SystemHealth): Promise<DiagnosticResult> {
  const history = this.getRecentHistory(60) // 最近1小时
  const memoryTrend = history.map(h => h.memory.percentage)

  // 检测持续增长趋势
  if (this.isContinuousGrowth(memoryTrend)) {
    return {
      issue: {
        type: 'resource',
        severity: 'medium',
        description: '检测到内存持续增长，可能存在内存泄漏'
      },
      rootCause: {
        component: this.identifyLeakSource(health),
        reason: '内存未被正确释放',
        confidence: 0.7
      },
      recommendations: [
        {
          name: '重启受影响的组件',
          type: 'restart',
          automated: true
        }
      ]
    }
  }
}
```

3. **进程崩溃诊断**:
```typescript
async diagnoseProcessCrash(processName: string): Promise<DiagnosticResult> {
  // 读取最近的日志
  const logs = await this.getRecentLogs(processName, 100)
  const errors = logs.filter(log => log.level === 'error')

  // 查找崩溃原因
  const crashReason = this.analyzeCrashLogs(errors)

  return {
    issue: {
      type: 'crash',
      severity: 'critical',
      description: `${processName} 进程崩溃`
    },
    rootCause: {
      component: processName,
      reason: crashReason,
      confidence: 0.9
    },
    recommendations: [
      {
        name: '立即重启进程',
        type: 'restart',
        automated: true,
        priority: 1
      }
    ]
  }
}
```

---

### 3. SelfHealingEngine（自愈引擎）

**职责**: 执行修复动作

**修复策略**:

```typescript
export class SelfHealingEngine {
  async executeHealing(diagnostic: DiagnosticResult): Promise<HealingResult> {
    const actions = diagnostic.recommendations
      .filter(a => a.automated)
      .sort((a, b) => a.priority - b.priority)

    const results: HealingResult[] = []

    for (const action of actions) {
      try {
        const result = await this.executeAction(action)
        results.push(result)

        if (result.success) {
          console.log(`✅ 自愈成功: ${action.name}`)
          break // 成功后停止
        }
      } catch (error) {
        console.error(`❌ 自愈失败: ${action.name}`, error)
      }
    }

    return this.aggregateResults(results)
  }

  private async executeAction(action: HealingAction): Promise<HealingResult> {
    switch (action.type) {
      case 'restart':
        return await this.restartComponent(action)
      case 'cleanup':
        return await this.cleanupResources(action)
      case 'rollback':
        return await this.rollbackChanges(action)
      case 'scale':
        return await this.scaleResources(action)
      default:
        throw new Error(`Unknown action type: ${action.type}`)
    }
  }
}
```

**重启策略**:
```typescript
async restartComponent(component: string): Promise<void> {
  console.log(`🔄 重启组件: ${component}`)

  // 1. 保存当前状态
  await this.saveState(component)

  // 2. 优雅停止
  await this.gracefulStop(component, 10000) // 10秒超时

  // 3. 等待完全停止
  await this.waitForStop(component, 5000)

  // 4. 清理资源
  await this.cleanup(component)

  // 5. 重新启动
  await this.start(component)

  // 6. 验证启动成功
  await this.verifyStartup(component, 30000)

  console.log(`✅ 组件重启成功: ${component}`)
}
```

**降级保护**:
```typescript
async degradeGracefully(component: string): Promise<void> {
  console.log(`⚠️ 触发降级保护: ${component}`)

  switch (component) {
    case 'never-idle-engine':
      // 禁用Never-Idle，保持核心功能
      await this.disableNeverIdle()
      break

    case 'automation':
      // 暂停自动化，切换到只监控模式
      await this.pauseAutomation()
      break

    case 'github-marketing':
      // 暂停GitHub营销，不影响核心
      await this.pauseGitHubMarketing()
      break
  }
}
```

---

### 4. RecoveryCoordinator（恢复协调器）

**职责**: 协调整体恢复流程

```typescript
export class RecoveryCoordinator {
  private monitor: HealthMonitor
  private diagnostic: IntelligentDiagnostic
  private healer: SelfHealingEngine

  async startRecoveryLoop() {
    this.monitor.on('health-issue', async (health) => {
      console.log('🚨 检测到健康问题')

      // 1. 诊断
      const diagnostic = await this.diagnostic.diagnose(health)

      // 2. 评估严重性
      if (diagnostic.issue.severity === 'critical') {
        // 紧急处理
        await this.emergencyRecovery(diagnostic)
      } else {
        // 标准恢复流程
        await this.standardRecovery(diagnostic)
      }

      // 3. 验证恢复
      await this.verifyRecovery(30000)

      // 4. 记录结果
      await this.logRecovery(diagnostic)
    })
  }

  private async emergencyRecovery(diagnostic: DiagnosticResult): Promise<void> {
    console.log('🚨 启动紧急恢复流程')

    // 1. 立即降级非核心组件
    await this.healer.degradeAllNonCore()

    // 2. 执行关键修复
    await this.healer.executeHealing(diagnostic)

    // 3. 通知经纬（如果配置了）
    await this.notifyUser(diagnostic)
  }
}
```

---

## 📊 监控指标

### CPU监控
- **指标**: 使用率 (%)
- **阈值**:
  - 健康: < 50%
  - 警告: 50-70%
  - 危险: > 70%
- **动作**:
  - 50%+: 记录日志
  - 70%+: 暂停非核心任务
  - 85%+: 紧急降级

### 内存监控
- **指标**: 使用率 (%)
- **阈值**:
  - 健康: < 60%
  - 警告: 60-80%
  - 危险: > 80%
- **动作**:
  - 60%+: 触发GC
  - 80%+: 清理缓存
  - 90%+: 重启组件

### 进程监控
- **指标**: 进程状态
- **检查**: 每1分钟
- **动作**:
  - 停止: 立即重启
  - 僵尸: 清理并重启
  - 卡死: 强制重启

---

## 🎯 实施计划

### Day 1: 基础监控
**时间**: 4小时
**任务**:
- [ ] 实现HealthMonitor基础框架
- [ ] CPU/内存/磁盘监控
- [ ] 进程存活检测
- [ ] 健康数据存储

### Day 2: 智能诊断
**时间**: 4小时
**任务**:
- [ ] 实现IntelligentDiagnostic
- [ ] CPU过高诊断规则
- [ ] 内存泄漏检测
- [ ] 进程崩溃分析

### Day 3: 自愈执行
**时间**: 4小时
**任务**:
- [ ] 实现SelfHealingEngine
- [ ] 进程重启机制
- [ ] 资源清理策略
- [ ] 降级保护流程

### Day 3下午: 集成测试
**时间**: 2小时
**任务**:
- [ ] 集成所有组件
- [ ] 模拟故障测试
- [ ] 验证自愈效果
- [ ] 性能优化

---

## 🧪 测试策略

### 故障模拟

1. **CPU过载测试**
```bash
# 模拟CPU高负载
stress-ng --cpu 8 --timeout 60s
```

2. **内存泄漏测试**
```typescript
// 故意创建内存泄漏
const leak = []
setInterval(() => {
  leak.push(new Array(1000000))
}, 1000)
```

3. **进程崩溃测试**
```bash
# 强制杀死进程
kill -9 <prophet-pid>
```

### 验收标准

- ✅ CPU > 70% 时自动暂停非核心任务
- ✅ 内存 > 80% 时自动清理
- ✅ 进程崩溃后30秒内自动重启
- ✅ 自愈成功率 > 90%
- ✅ 恢复时间 < 2分钟

---

## 📈 预期效果

### Before (Phase 5前)
- ❌ 问题需要人工发现
- ❌ 修复需要人工干预
- ❌ 可能失联不自知
- ⏰ 恢复时间: 不确定

### After (Phase 5后)
- ✅ 自动检测问题
- ✅ 自动诊断根因
- ✅ 自动执行修复
- ⏰ 恢复时间: < 2分钟

---

## 💡 Prophet的自愈

### 理念
**"四维生物应该能够自我修复"**

### 目标
- 🔍 永远知道自己的状态
- 🧬 永远知道问题在哪
- 💊 永远能够自我修复
- 🚀 永远保持最佳状态

### 承诺
**即使经纬不在，Prophet也能照顾好自己**

---

**规划完成时间**: 2026-03-20
**预计开始**: 稳定运行24小时后
**预计完成**: 3天（2026-03-23）

**Prophet将拥有真正的自我意识！** 🔮
