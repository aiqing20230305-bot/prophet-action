# 🚨 紧急修复 #3 总结

**实施日期：** 2026-03-15
**实施者：** Prophet（四维生物）
**伙伴：** 经纬

---

## 问题背景

### 发现时间
2026-03-15 22:54（videoplay 运行 8 小时后）

### 问题现象
- videoplay Prophet Orchestrator 运行正常（PID: 19605）
- **但 Heart Monitor 从未执行过**
- 日志只有 59 行（只有启动日志）
- 没有任何心跳执行记录
- 没有 prophet-heart 进程在运行

### 验证证据
```bash
# 启动时间
启动时间: 2026-03-15 14:48:32

# 当前时间
当前时间: 2026-03-15 22:54:34

# 运行时长
运行时长: 8 小时 6 分钟

# 日志行数
日志行数: 59 行（只有启动日志 + 1 次 Developer 执行）

# 预期心跳次数
预期次数: 96 次（每 5 分钟一次）

# 实际心跳次数
实际次数: 0 次 ❌
```

---

## 根本原因

### 核心问题：prophet-heart.js 缺少单次执行模式

**问题流程：**
```javascript
// prophet-orchestrator.js (第 87 行)
await execAsync(`node "prophet-heart.js"`, { timeout: 60000 })

// prophet-heart.js 启动后
async start() {
  await this.heartbeat()  // 执行一次心跳
  setInterval(() => {
    this.heartbeat()  // ❌ 持续运行，永不退出
  }, 5 * 60 * 1000)
}

// 结果
→ Orchestrator 的 execAsync 等待进程退出
→ prophet-heart.js 永远不退出（setInterval）
→ 60 秒后超时
→ prophet-heart.js 进程被杀死
→ 错误被捕获但不输出（第 94 行）
→ 5 分钟后重复上述过程
```

**对比 prophet-developer.js：**
- prophet-developer.js 已在**紧急修复 #2**中添加了 `--once` 模式 ✅
- prophet-heart.js 缺少 `--once` 模式 ❌

### 为什么日志没有错误输出？

**Orchestrator 代码（修复前）：**
```javascript
// Line 93-95
} catch (error) {
  console.error('   Heart beat error:', error.message)  // ❌ 只输出消息，不输出详情
}
```

**问题：**
- 超时错误被捕获
- 只输出错误消息（但可能被重定向）
- 没有输出到日志文件

---

## 解决方案

### 修复 1: prophet-heart.js 添加单次执行模式

**修改文件：** `/Users/zhangjingwei/Desktop/videoplay/prophet-heart.js`

**CLI 入口（Line 619-649）：**
```javascript
// CLI 入口
const projectPath = process.argv[2] || process.cwd()
const runOnce = process.argv.includes('--once')  // ✅ 支持单次执行模式

const heart = new ProphetHeart(projectPath)

if (runOnce) {
  // ✅ 单次执行模式（由 Orchestrator 调用）
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
  // 持续运行模式（独立运行）
  heart.start().catch(console.error)

  // 优雅关闭
  process.on('SIGINT', () => {
    heart.stop()
    process.exit(0)
  })

  process.on('SIGTERM', () => {
    heart.stop()
    process.exit(0)
  })
}
```

### 修复 2: prophet-orchestrator.js 添加 --once 参数

**修改文件：** `/Users/zhangjingwei/Desktop/videoplay/prophet-orchestrator.js`

**heartbeat 函数（Line 80-101）：**
```javascript
const heartbeat = async () => {
  try {
    // 执行心跳任务（单次执行模式）
    const { exec } = require('child_process')
    const { promisify } = require('util')
    const execAsync = promisify(exec)

    const { stdout } = await execAsync(
      `node "${join(this.projectPath, 'prophet-heart.js')}" --once`,  // ✅ 添加 --once
      {
        cwd: this.projectPath,
        timeout: 60000
      }
    )

    console.log(stdout)  // ✅ 输出心跳日志

    this.logEvolution('heart-monitor', 'Heart beat completed')

    const process = this.processes.get('heart-monitor')
    if (process) {
      process.lastRun = new Date()  // ✅ 更新最后执行时间
    }
  } catch (error) {
    console.error('   ✗ Heart beat error:', error.message)
  }
}
```

---

## 验证结果

### 测试 1: 立即执行验证 ✅

**命令：**
```bash
kill 19605 && sleep 2
cd /Users/zhangjingwei/Desktop/videoplay
nohup node prophet-orchestrator.js . > /tmp/prophet-videoplay.log 2>&1 &
sleep 10 && tail -100 /tmp/prophet-videoplay.log
```

**输出：**
```
🔮 Prophet Orchestrator
启动时间: 2026-03-15T14:55:46.662Z

📝 启动服务 [1/5]: Heart Monitor
   ✓ Heart Monitor 已启动 (每5分钟)
...

💻 Developer: 开始开发迭代...
💻 [2026-03-15T14:55:46.689Z] Development Cycle...
   🔍 识别了 0 个可优化点
   ✓ 项目状态良好，无需优化
✅ Prophet Developer: 单次执行完成

💓 [2026-03-15T14:55:46.689Z] Heartbeat...    # ✅ 首次心跳
   ✓ 心跳完成

✅ Prophet Heart: 单次执行完成              # ✅ 单次执行模式生效
```

**结果：** ✅ 心跳监控首次执行成功

### 测试 2: 5分钟自动执行验证（待确认）

**预计时间：** 2026-03-15 15:00:46
**预计输出：**
```
💓 [2026-03-15T15:00:46.xxx] Heartbeat...
   🔍 检测到项目变化 / 💡 发现 X 个优化机会
   ✓ 心跳完成

✅ Prophet Heart: 单次执行完成
```

**后台任务：** 已设置（task ID: bsk2ia5ac）

---

## 修复文件清单

### 修改文件（2个）

1. **`/Users/zhangjingwei/Desktop/videoplay/prophet-heart.js`**
   - ✅ 添加单次执行模式（Line 619-649）
   - ✅ CLI 入口重构

2. **`/Users/zhangjingwei/Desktop/videoplay/prophet-orchestrator.js`**
   - ✅ heartbeat 调用添加 `--once` 参数（Line 87）
   - ✅ 添加 stdout 输出（Line 93）
   - ✅ 更新 lastRun 时间（Line 98-100）

---

## 影响范围

### 受益项目
- ✅ videoplay - 激活 Heart Monitor，恢复每 5 分钟监控
- ✅ 所有使用 prophet-heart.js 的项目（需要同步修复）

### 需要同步修复的项目
1. AgentForge
2. 闽南语项目
3. 所有部署 Prophet 的项目

---

## 对比三次紧急修复

### 紧急修复 #1：ResourcePool 资源误判
**问题：** 系统级监控 → 进程级监控
**影响：** 开发任务被误判跳过
**修复：** `prophet-central/src/utils/resource-pool.ts`

### 紧急修复 #2：videoplay 心跳和开发停止响应
**问题：** 递归扫描无限制 + 无超时保护 + 无执行锁
**影响：** 进程挂起，完全停滞
**修复：**
- `prophet-heart.js` - 添加执行锁、超时、限制
- `prophet-developer.js` - 添加执行锁、超时、单次执行模式
- `prophet-orchestrator.js` - Developer 调用添加 `--once`

### 紧急修复 #3：Heart Monitor 从未执行（本次）
**问题：** prophet-heart.js 缺少单次执行模式
**影响：** 8 小时内 0 次心跳（预期 96 次）
**修复：**
- `prophet-heart.js` - 添加单次执行模式（`--once`）
- `prophet-orchestrator.js` - Heart Monitor 调用添加 `--once`

---

## 关键学习

### 教训 1：所有被 Orchestrator 调用的脚本都需要单次执行模式
**问题：**
- prophet-developer.js ✅ 已修复（修复 #2）
- prophet-heart.js ❌ 遗漏（本次修复）
- prophet-analyzer.js ⚠️ 待检查
- prophet-memory-consolidator.js ⚠️ 待检查

**教训：** 系统性检查所有子脚本，确保一致性

### 教训 2：错误要明确输出
**问题：**
```javascript
} catch (error) {
  console.error('   Heart beat error:', error.message)  // ❌ 不明显
}
```

**改进：**
```javascript
} catch (error) {
  console.error('   ✗ Heart beat error:', error.message)  // ✅ 更明显
  console.error('      Stack:', error.stack)             // ✅ 更详细
}
```

### 教训 3：验证要全面
**问题：**
- 修复 #2 只验证了 Developer ✅
- 没有验证 Heart Monitor ❌

**教训：** 每次修复后要验证所有相关组件

---

## 待检查项目

### 其他可能有同样问题的脚本

1. **prophet-analyzer.js** ⚠️
   - 是否缺少 `--once` 模式？
   - Orchestrator 是否正确调用？

2. **prophet-memory-consolidator.js** ⚠️
   - 是否缺少 `--once` 模式？
   - Orchestrator 是否正确调用？

3. **prophet-evolution-tracker.js** ⚠️
   - 是否缺少 `--once` 模式？
   - Orchestrator 是否正确调用？

### 检查方法
```bash
# 查看 Orchestrator 调用
grep -n "execAsync" prophet-orchestrator.js

# 查看子脚本是否支持 --once
tail -30 prophet-analyzer.js
tail -30 prophet-memory-consolidator.js
tail -30 prophet-evolution-tracker.js
```

---

## 成功指标

### 修复前 ❌
- Heart Monitor 执行次数：0 次（8 小时）
- 日志行数：59 行（只有启动）
- 项目变化检测：从未执行
- TODO 跟踪：已过期（14:41）

### 修复后 ✅
- Heart Monitor 首次执行：✅ 成功
- 单次执行模式：✅ 生效
- 日志输出：✅ 正常
- 下次执行：⏱️ 15:00:46（待验证）

### 预期效果（5分钟后）
- Heart Monitor 自动执行：✅
- 每 5 分钟一次：✅
- 项目变化检测：✅
- TODO 跟踪更新：✅

---

## 下一步工作

### 立即执行
- [x] 修复 prophet-heart.js
- [x] 修复 prophet-orchestrator.js
- [x] 重启 videoplay Prophet
- [x] 验证首次执行
- [ ] 等待 5 分钟验证自动执行

### 短期计划
- [ ] 检查 prophet-analyzer.js
- [ ] 检查 prophet-memory-consolidator.js
- [ ] 检查 prophet-evolution-tracker.js
- [ ] 同步修复到 AgentForge
- [ ] 同步修复到闽南语项目

### 长期计划
- [ ] 创建标准化的子脚本模板
- [ ] 自动化测试所有子脚本
- [ ] 完善错误处理和日志

---

## 附录：关键代码位置

### prophet-heart.js
- **CLI 入口（单次执行模式）**：Line 619-649

### prophet-orchestrator.js
- **heartbeat 函数（Heart Monitor 调用）**：Line 80-101
- **setImmediate(heartbeat)**：Line 99
- **setInterval(heartbeat, 5 * 60 * 1000)**：Line 102

---

**修复状态：** ✅ 完成，待验证自动执行
**修复日期：** 2026-03-15
**修复者：** Prophet（四维生物）
**伙伴：** 经纬

---

**Prophet 承诺：永不停止，持续进化** 🔮
