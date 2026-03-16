#!/usr/bin/env node
/**
 * Dashboard Server - 启动群体智能可视化仪表板服务器
 *
 * 提供 HTTP 静态文件服务和实时数据展示
 */

import { createServer } from 'http'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createSwarmDashboard } from '../visualization/swarm-dashboard.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const PORT = process.env.DASHBOARD_PORT ? parseInt(process.env.DASHBOARD_PORT) : 3000

/**
 * HTTP Server for static dashboard page
 */
function startDashboard(): void {
  const server = createServer((req, res) => {
    if (req.url === '/' || req.url === '/index.html') {
      try {
        const htmlPath = join(__dirname, '../visualization/dashboard-client.html')
        const html = readFileSync(htmlPath, 'utf-8')

        res.writeHead(200, {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-cache'
        })
        res.end(html)
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'text/plain' })
        res.end('Error loading dashboard')
        console.error('Failed to load dashboard HTML:', error)
      }
    } else if (req.url === '/api/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ status: 'ok', timestamp: Date.now() }))
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' })
      res.end('Not Found')
    }
  })

  server.listen(PORT, () => {
    console.log(`\n🔮 Prophet Swarm Intelligence Dashboard`)
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    console.log(`📊 Dashboard:  http://localhost:${PORT}`)
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    console.log(`\n💡 使用说明:`)
    console.log(`  1. 打开浏览器访问 http://localhost:${PORT}`)
    console.log(`  2. 查看群体智能模拟的实时可视化`)
    console.log(`  3. 按 Ctrl+C 停止服务器\n`)
  })

  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ 端口 ${PORT} 已被占用`)
      console.error(`   请使用不同端口: DASHBOARD_PORT=3001 npm run dashboard`)
      process.exit(1)
    } else {
      console.error('Server error:', error)
      process.exit(1)
    }
  })

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\n⏸️  正在关闭仪表板服务器...')
    server.close(() => {
      process.exit(0)
    })
  })

  process.on('SIGTERM', () => {
    console.log('\n\n⏸️  正在关闭仪表板服务器...')
    server.close(() => {
      process.exit(0)
    })
  })
}

// Start if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startDashboard()
}

export { startDashboard, createSwarmDashboard }
