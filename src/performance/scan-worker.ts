/**
 * Prophet Scan Worker - Worker线程实现
 *
 * 在独立线程中执行项目扫描任务
 *
 * 工作流：
 * 1. 接收主线程的扫描任务
 * 2. 执行文件扫描和问题检测
 * 3. 返回结果给主线程
 */

import { parentPort, workerData } from 'worker_threads'
import { readdirSync, statSync, readFileSync } from 'fs'
import { join, relative } from 'path'

interface ScanTask {
  taskId: string
  projectName: string
  projectPath: string
  scanType: 'full' | 'quick' | 'deep'
}

interface ScanResult {
  taskId: string
  projectName: string
  success: boolean
  files: number
  lines: number
  issues: number
  duration: number
  error?: string
}

// Worker初始化
const workerId = workerData.workerId
console.log(`👷 Worker ${workerId} 已启动`)

// 监听主线程消息
if (parentPort) {
  parentPort.on('message', async (task: ScanTask) => {
    const result = await performScan(task)
    parentPort!.postMessage(result)
  })
}

/**
 * 执行扫描任务
 */
async function performScan(task: ScanTask): Promise<ScanResult> {
  const startTime = Date.now()

  const result: ScanResult = {
    taskId: task.taskId,
    projectName: task.projectName,
    success: false,
    files: 0,
    lines: 0,
    issues: 0,
    duration: 0
  }

  try {
    // 扫描项目
    const scanData = scanProject(task.projectPath)

    result.success = true
    result.files = scanData.files
    result.lines = scanData.lines
    result.issues = scanData.issues.length
    result.duration = Date.now() - startTime

  } catch (error: any) {
    result.error = error.message
    result.duration = Date.now() - startTime
  }

  return result
}

/**
 * 扫描单个项目
 */
function scanProject(projectPath: string) {
  const data = {
    files: 0,
    lines: 0,
    issues: [] as Array<{ type: string; file: string; line?: number; message: string }>
  }

  try {
    // 扫描源代码目录
    const srcDirs = ['src', 'app', 'apps', 'packages', 'lib']

    for (const srcDir of srcDirs) {
      const fullPath = join(projectPath, srcDir)
      try {
        if (statSync(fullPath).isDirectory()) {
          scanDirectory(fullPath, data, projectPath)
        }
      } catch {
        // 目录不存在，跳过
      }
    }
  } catch (error: any) {
    console.error(`👷 Worker ${workerId}: 扫描失败 -`, error.message)
  }

  return data
}

/**
 * 递归扫描目录
 */
function scanDirectory(
  dir: string,
  data: { files: number; lines: number; issues: any[] },
  basePath: string,
  depth: number = 0
) {
  // 限制扫描深度，避免递归太深
  if (depth > 10) return

  try {
    const items = readdirSync(dir)

    for (const item of items) {
      // 跳过常见的非源码目录
      if (item === 'node_modules' || item === 'dist' || item === 'build' ||
          item === '.git' || item === 'coverage' || item === '.next' ||
          item.startsWith('.')) {
        continue
      }

      const fullPath = join(dir, item)

      try {
        const stat = statSync(fullPath)

        if (stat.isDirectory()) {
          scanDirectory(fullPath, data, basePath, depth + 1)
        } else if (stat.isFile()) {
          // 只扫描源代码文件
          if (isSourceFile(item)) {
            data.files++
            scanFile(fullPath, data, basePath)
          }
        }
      } catch {
        // 跳过无法访问的文件
      }
    }
  } catch (error: any) {
    // 目录读取失败，跳过
  }
}

/**
 * 判断是否是源代码文件
 */
function isSourceFile(filename: string): boolean {
  const sourceExts = ['.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.go', '.rs', '.cpp', '.c', '.h']
  return sourceExts.some(ext => filename.endsWith(ext))
}

/**
 * 扫描单个文件
 */
function scanFile(
  filePath: string,
  data: { files: number; lines: number; issues: any[] },
  basePath: string
) {
  try {
    const content = readFileSync(filePath, 'utf-8')
    const lines = content.split('\n')
    data.lines += lines.length

    const relativePath = relative(basePath, filePath)

    // 跳过测试文件和配置文件
    const isTestFile = relativePath.match(/\.(test|spec)\.(ts|js|tsx|jsx)$/)
    const isConfigFile = relativePath.match(/(config|setup)\.(ts|js)$/)

    // 检测问题
    lines.forEach((line, index) => {
      const lineNum = index + 1

      // 检测 TODO/FIXME - 带优先级判断
      if (line.match(/\/\/\s*(TODO|FIXME|XXX|HACK)/i)) {
        const match = line.match(/\/\/\s*(TODO|FIXME|XXX|HACK):?\s*(.+)/i)
        const type = match ? match[1].toUpperCase() : 'TODO'
        const message = match ? match[2].trim() : line.trim()

        // 判断优先级
        const isUrgent = message.match(/(URGENT|紧急|CRITICAL|BUG|ERROR)/i)
        const priority = isUrgent ? 'HIGH' : (type === 'FIXME' ? 'MEDIUM' : 'LOW')

        // 只记录中高优先级，或者FIXME类型
        if (priority !== 'LOW' || type === 'FIXME') {
          data.issues.push({
            type: `${type}_${priority}`,
            file: relativePath,
            line: lineNum,
            message
          })
        }
      }

      // 检测 console.log - 智能过滤
      if ((filePath.endsWith('.ts') || filePath.endsWith('.js') ||
           filePath.endsWith('.tsx') || filePath.endsWith('.jsx')) &&
          line.match(/console\.(log|debug|warn)/)) {

        // 跳过测试文件和配置文件
        if (!isTestFile && !isConfigFile) {
          // 只在生产代码中标记
          const isInSrcOrApp = relativePath.match(/^(src|app|apps|packages)\//)
          if (isInSrcOrApp) {
            data.issues.push({
              type: 'CONSOLE_LOG',
              file: relativePath,
              line: lineNum,
              message: 'Found console.log in production code'
            })
          }
        }
      }
    })

    // 检测超大文件 - 提高阈值
    if (lines.length > 800) {
      data.issues.push({
        type: 'LARGE_FILE',
        file: relativePath,
        message: `File is too large (${lines.length} lines, threshold: 800)`
      })
    }
  } catch (error: any) {
    // 文件读取失败，跳过
  }
}

// 导出（供TypeScript编译）
export {}
