/**
 * Auto Developer
 *
 * 自动开发系统 - 基于 TODO 自动生成代码
 */

import { ClaudeEngine, AIContext } from './claude-engine.js'
import { readFile, writeFile } from 'fs/promises'
import { EventEmitter } from 'events'

export interface TodoItem {
  file: string
  line: number
  content: string
  type: 'TODO' | 'FIXME'
}

export interface GenerationTask {
  id: string
  projectId: string
  todo: TodoItem
  status: 'pending' | 'generating' | 'reviewing' | 'approved' | 'rejected' | 'applied'
  generatedCode?: string
  tokensUsed?: number
  cost?: number
  createdAt: Date
  completedAt?: Date
}

export class AutoDeveloper extends EventEmitter {
  private engine: ClaudeEngine
  private tasks: Map<string, GenerationTask> = new Map()
  private autoApprove = false  // 默认需要人工审批

  constructor(engine: ClaudeEngine) {
    super()
    this.engine = engine
  }

  /**
   * 设置自动审批模式
   */
  setAutoApprove(enabled: boolean): void {
    this.autoApprove = enabled
  }

  /**
   * 处理 TODO 列表，生成代码
   */
  async processTodos(projectId: string, todos: TodoItem[]): Promise<GenerationTask[]> {
    const tasks: GenerationTask[] = []

    console.log(`🤖 Auto Developer: 开始处理 ${todos.length} 个 TODO...`)

    for (const todo of todos) {
      try {
        const task = await this.generateCodeForTodo(projectId, todo)
        tasks.push(task)
      } catch (error) {
        console.error(`处理 TODO 失败: ${todo.content}`, error)
      }
    }

    return tasks
  }

  /**
   * 为单个 TODO 生成代码
   */
  async generateCodeForTodo(projectId: string, todo: TodoItem): Promise<GenerationTask> {
    const taskId = `gen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const task: GenerationTask = {
      id: taskId,
      projectId,
      todo,
      status: 'pending',
      createdAt: new Date()
    }

    this.tasks.set(taskId, task)

    try {
      // 更新状态
      task.status = 'generating'
      this.emit('task-status', task)

      console.log(`  📝 生成代码: ${todo.content}`)

      // 读取文件内容
      const fileContent = await readFile(todo.file, 'utf-8').catch(() => undefined)

      // 构建上下文
      const context: AIContext = {
        filePath: todo.file,
        fileContent,
        todoItem: {
          line: todo.line,
          content: todo.content,
          type: todo.type
        },
        projectType: 'web-app',
        language: this.detectLanguage(todo.file)
      }

      // 调用 Claude 生成代码
      const response = await this.engine.generateCode({
        projectId,
        operation: 'generate',
        context,
        requireApproval: !this.autoApprove
      })

      // 更新任务
      task.generatedCode = response.generatedCode
      task.tokensUsed = response.tokensUsed.total
      task.cost = response.estimatedCost
      task.status = this.autoApprove ? 'approved' : 'reviewing'

      console.log(`     ✓ 代码已生成 (${response.tokensUsed.total} tokens, $${response.estimatedCost.toFixed(4)})`)

      this.emit('code-generated', task)

      // 如果自动审批，直接应用
      if (this.autoApprove && task.generatedCode) {
        await this.applyCode(taskId)
      }

      return task
    } catch (error) {
      task.status = 'rejected'
      task.completedAt = new Date()
      this.emit('task-error', { task, error })

      throw error
    }
  }

  /**
   * 审批代码生成任务
   */
  async approveTask(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId)
    if (!task) {
      throw new Error(`Task not found: ${taskId}`)
    }

    if (task.status !== 'reviewing') {
      throw new Error(`Task cannot be approved in status: ${task.status}`)
    }

    task.status = 'approved'
    this.emit('task-approved', task)

    // 应用代码
    await this.applyCode(taskId)
  }

  /**
   * 拒绝代码生成任务
   */
  async rejectTask(taskId: string, reason?: string): Promise<void> {
    const task = this.tasks.get(taskId)
    if (!task) {
      throw new Error(`Task not found: ${taskId}`)
    }

    task.status = 'rejected'
    task.completedAt = new Date()

    this.emit('task-rejected', { task, reason })
  }

  /**
   * 应用生成的代码
   */
  private async applyCode(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId)
    if (!task || !task.generatedCode) {
      throw new Error('No code to apply')
    }

    try {
      // 写入文件
      await writeFile(task.todo.file, task.generatedCode, 'utf-8')

      task.status = 'applied'
      task.completedAt = new Date()

      console.log(`     ✅ 代码已应用: ${task.todo.file}`)

      this.emit('code-applied', task)
    } catch (error) {
      this.emit('apply-error', { task, error })
      throw error
    }
  }

  /**
   * 获取任务
   */
  getTask(taskId: string): GenerationTask | undefined {
    return this.tasks.get(taskId)
  }

  /**
   * 获取所有任务
   */
  getAllTasks(): GenerationTask[] {
    return Array.from(this.tasks.values())
  }

  /**
   * 获取待审批任务
   */
  getPendingTasks(): GenerationTask[] {
    return Array.from(this.tasks.values()).filter(t => t.status === 'reviewing')
  }

  /**
   * 检测语言
   */
  private detectLanguage(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase()

    const langMap: Record<string, string> = {
      ts: 'typescript',
      tsx: 'typescript',
      js: 'javascript',
      jsx: 'javascript',
      py: 'python',
      rs: 'rust',
      go: 'go',
      java: 'java'
    }

    return langMap[ext || ''] || 'typescript'
  }
}
