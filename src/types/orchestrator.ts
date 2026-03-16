/**
 * Prophet Multi-Project Orchestrator Types
 * 多项目编排系统类型定义
 *
 * @module types/orchestrator
 * @prophet-system multi-project-evolution
 */

/**
 * 项目配置
 */
export interface ProjectConfig {
  /** 项目唯一标识 */
  id: string
  /** 项目名称 */
  name: string
  /** 项目路径（绝对路径） */
  path: string
  /** 项目类型 */
  type: 'web-app' | 'api' | 'cli' | 'library' | 'monorepo'
  /** 优先级 */
  priority: 'critical' | 'high' | 'medium' | 'low'
  /** 心跳监控间隔（毫秒） */
  monitoringInterval: number
  /** 是否启用自动优化 */
  autoOptimize?: boolean
  /** 自定义配置 */
  custom?: Record<string, any>
}

/**
 * 项目状态
 */
export interface ProjectStatus {
  projectId: string
  status: 'active' | 'idle' | 'error' | 'paused'
  lastHeartbeat: Date
  lastChange: Date | null
  health: 'healthy' | 'warning' | 'critical'
  metrics: ProjectMetrics
  issues: Issue[]
}

/**
 * 项目指标
 */
export interface ProjectMetrics {
  /** 文件总数 */
  fileCount: number
  /** 代码行数 */
  lineCount: number
  /** 变更文件数 */
  changedFiles: number
  /** TODO 数量 */
  todoCount: number
  /** 优化机会数 */
  opportunityCount: number
  /** 自动执行的优化数 */
  autoOptimizations: number
  /** 生成的代码行数 */
  generatedLines: number
}

/**
 * 问题/优化机会
 */
export interface Issue {
  id: string
  projectId: string
  type: 'todo' | 'optimization' | 'bug' | 'refactor' | 'security' | 'performance'
  title: string
  description: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  /** 影响的项目列表（跨项目问题） */
  affectedProjects: string[]
  /** 是否可以自动执行 */
  autoExecutable: boolean
  /** 是否安全（无风险） */
  safe: boolean
  /** 预估影响 */
  estimatedImpact: 'high' | 'medium' | 'low'
  /** 创建时间 */
  createdAt: Date
  /** 文件路径 */
  filePath?: string
  /** 行号 */
  lineNumber?: number
}

/**
 * 调度任务
 */
export interface ScheduledTask {
  id: string
  projectId: string
  type: 'heart' | 'developer' | 'analyzer' | 'consolidator'
  priority: number
  nextRun: number
  interval: number
  lastRun?: number
  status: 'pending' | 'running' | 'completed' | 'failed'
}

/**
 * 扫描结果
 */
export interface ScanResult {
  projectId: string
  timestamp: Date
  changes: GitChanges
  opportunities: Issue[]
  optimizations: OptimizationResult[]
  patterns: DetectedPattern[]
}

/**
 * Git 变更
 */
export interface GitChanges {
  modified: string[]
  added: string[]
  deleted: string[]
  untracked: string[]
  hasChanges: boolean
}

/**
 * 优化结果
 */
export interface OptimizationResult {
  issueId: string
  action: string
  success: boolean
  linesAdded: number
  linesModified: number
  filesChanged: string[]
  message: string
}

/**
 * 检测到的模式
 */
export interface DetectedPattern {
  type: 'common-need' | 'duplicate-code' | 'config-pattern' | 'architecture-pattern'
  category: string
  description: string
  frequency: number
  affectedProjects: string[]
  confidence: number
  suggestion: string
  examples: PatternExample[]
}

/**
 * 模式示例
 */
export interface PatternExample {
  projectId: string
  filePath: string
  lineNumber?: number
  code?: string
}

/**
 * 共享模块
 */
export interface SharedModule {
  name: string
  version: string
  description: string
  files: ModuleFile[]
  dependencies: Record<string, string>
  devDependencies?: Record<string, string>
  targetProjects: string[]
  createdAt: Date
}

/**
 * 模块文件
 */
export interface ModuleFile {
  path: string
  content: string
  language: string
}

/**
 * 优先级分数计算结果
 */
export interface PriorityScore {
  issueId: string
  score: number
  breakdown: {
    scope: number
    priority: number
    safety: number
    projectPriority: number
  }
}

/**
 * 缓存的扫描结果
 */
export interface CachedScanResult {
  data: any
  timestamp: number
}

/**
 * 资源池配置
 */
export interface ResourcePoolConfig {
  maxConcurrent: number
  maxMemoryMB: number
  maxCPUPercent: number
}

/**
 * Agent 连接信息
 */
export interface AgentConnection {
  projectId: string
  agentId: string
  name: string
  role: string
  capabilities: string[]
  status: 'connected' | 'disconnected' | 'busy' | 'idle'
  socket: any
}

/**
 * Agent 消息
 */
export interface AgentMessage {
  type: 'task-assignment' | 'task-completed' | 'insight-discovered' | 'help-requested' | 'swarm-communication' | 'team-invitation' | 'team-disbanded' | 'custom-message'
  [key: string]: any
}

/**
 * Agent 任务
 */
export interface AgentTask {
  id: string
  swarmId?: string
  type: string
  description: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  deadline?: Date
  subtask?: any
}

/**
 * Swarm 任务
 */
export interface SwarmTask {
  id: string
  goal: string
  description: string
  subtask: any
  deadline?: Date
}

/**
 * Swarm 结果
 */
export interface SwarmResult {
  swarmId: string
  success: boolean
  output: any
  metrics: {
    duration: number
    agentsParticipated: number
    tasksCompleted: number
  }
}

/**
 * 团队成员
 */
export interface TeamMember {
  agentId: string
  projectId: string
  role: string
}

/**
 * 团队
 */
export interface Team {
  id: string
  members: TeamMember[]
  goal: string
  status: 'active' | 'paused' | 'completed'
  createdAt: Date
}

/**
 * 团队任务
 */
export interface TeamTask {
  id: string
  description: string
  subtasks: SubTask[]
}

/**
 * 子任务
 */
export interface SubTask {
  id: string
  description: string
  assignedTo?: string
  dependencies: string[]
  status: 'pending' | 'in-progress' | 'completed'
}

/**
 * 任务进度
 */
export interface TaskProgress {
  agentId: string
  taskStatus?: string
  completionPercent: number
}

/**
 * 团队进度
 */
export interface TeamProgress {
  teamId: string
  overallProgress: number
  memberProgress: TaskProgress[]
}

/**
 * Agent 信息
 */
export interface AgentInfo {
  id: string
  name: string
  role: string
  capabilities: string[]
}
