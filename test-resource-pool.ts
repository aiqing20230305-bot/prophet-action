/**
 * 测试 ResourcePool 进程级监控修复
 */

import { ResourcePool } from './src/utils/resource-pool.js'

async function testResourcePool() {
  console.log('🧪 测试 ResourcePool 进程级监控修复\n')

  // 创建进程级阈值的 ResourcePool
  const resourcePool = new ResourcePool({
    maxCPUPercent: 70, // 进程级：70% CPU
    maxMemoryMB: 512, // 进程级：512MB 内存
  })

  console.log('📋 配置:')
  console.log(resourcePool.getConfig())
  console.log('')

  // 获取系统信息（对比）
  console.log('💻 系统信息（对比）:')
  console.log(resourcePool.getSystemInfo())
  console.log('')

  // 测试资源使用情况
  console.log('🔍 测试 1: 获取当前资源使用（进程级）')
  const usage1 = await resourcePool.getResourceUsage()
  console.log('结果:', {
    cpu: `${usage1.cpu.toFixed(2)}%`,
    memory: `${usage1.memory.toFixed(2)}MB`,
    memoryPercent: `${usage1.memoryPercent.toFixed(2)}%`,
    available: usage1.available ? '✅ 可用' : '❌ 不可用',
    details: usage1.details,
  })
  console.log('')

  // 测试 canExecuteTask
  console.log('🔍 测试 2: 检查是否可以执行任务')
  const canExecute = await resourcePool.canExecuteTask()
  console.log(`结果: ${canExecute ? '✅ 可以执行' : '❌ 不能执行'}`)
  console.log('')

  // 启动监控并等待几次采样
  console.log('🔍 测试 3: 启动监控并采样 3 次')
  resourcePool.startMonitoring()

  let sampleCount = 0
  resourcePool.on('resource-exhausted', (usage) => {
    console.log(`⚠️ 资源耗尽警告:`, {
      cpu: `${usage.cpu.toFixed(2)}%`,
      memory: `${usage.memory.toFixed(2)}MB`,
    })
  })

  // 等待 3 次采样（每次 5 秒）
  await new Promise((resolve) => {
    const interval = setInterval(async () => {
      sampleCount++
      const usage = await resourcePool.getResourceUsage()
      console.log(
        `样本 ${sampleCount}:`,
        `CPU ${usage.cpu.toFixed(2)}%`,
        `内存 ${usage.memory.toFixed(2)}MB`,
        usage.available ? '✅ 可用' : '❌ 不可用'
      )

      if (sampleCount >= 3) {
        clearInterval(interval)
        resolve(null)
      }
    }, 2000) // 每 2 秒采样一次
  })
  console.log('')

  resourcePool.stopMonitoring()

  // 验证阈值
  console.log('✅ 测试完成！')
  console.log('')
  console.log('📊 总结:')
  console.log(
    `   进程级监控: ${usage1.memory < 512 && usage1.cpu < 70 ? '✅ 正常' : '❌ 异常'}`
  )
  console.log(
    `   任务可执行: ${canExecute ? '✅ 是' : '❌ 否（这可能是误判！）'}`
  )
  console.log(`   内存使用: ${usage1.memory.toFixed(2)}MB / 512MB`)
  console.log(`   CPU 使用: ${usage1.cpu.toFixed(2)}% / 70%`)
  console.log('')
  console.log(
    '💡 如果任务可执行显示"是"，说明修复成功！'
  )
  console.log('💡 如果显示"否"，可能需要进一步调查。')
}

testResourcePool().catch((error) => {
  console.error('❌ 测试失败:', error)
  process.exit(1)
})
