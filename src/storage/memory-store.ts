/**
 * Memory Store - 纯内存存储（快速原型）
 */

export interface Project {
  id: string
  name: string
  type?: string
  path?: string
  apiKey: string
  createdAt: Date
  lastActiveAt?: Date
  metadata?: any
}

export interface Memory {
  id: string
  projectId: string
  type: string
  content: any
  importance: number
  tags: string[]
  createdAt: Date
}

export interface Execution {
  id: string
  projectId: string
  taskId: string
  description: string
  status: string
  result?: any
  startedAt: Date
  completedAt?: Date
  durationMs?: number
}

class MemoryStore {
  private projects: Map<string, Project> = new Map()
  private memories: Map<string, Memory> = new Map()
  private executions: Map<string, Execution> = new Map()
  private insights: Map<string, any> = new Map()

  // Projects
  async createProject(data: Omit<Project, 'id' | 'createdAt'>): Promise<Project> {
    const project: Project = {
      id: `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...data,
      createdAt: new Date(),
    }
    this.projects.set(project.id, project)
    return project
  }

  async findProjectById(id: string): Promise<Project | null> {
    return this.projects.get(id) || null
  }

  async findProjectByApiKey(apiKey: string): Promise<Project | null> {
    for (const project of this.projects.values()) {
      if (project.apiKey === apiKey) return project
    }
    return null
  }

  async getAllProjects(): Promise<Project[]> {
    return Array.from(this.projects.values())
  }

  // Memories
  async createMemory(data: Omit<Memory, 'id' | 'createdAt'>): Promise<Memory> {
    const memory: Memory = {
      id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...data,
      createdAt: new Date(),
    }
    this.memories.set(memory.id, memory)
    return memory
  }

  async searchMemories(query: string, projectId?: string): Promise<Memory[]> {
    const results: Memory[] = []
    for (const memory of this.memories.values()) {
      if (projectId && memory.projectId !== projectId) continue

      const matchTags = memory.tags.some(tag => tag.includes(query.toLowerCase()))
      const matchType = memory.type.toLowerCase().includes(query.toLowerCase())

      if (matchTags || matchType) {
        results.push(memory)
      }
    }
    return results.sort((a, b) => b.importance - a.importance).slice(0, 20)
  }

  // Executions
  async createExecution(data: Omit<Execution, 'id' | 'startedAt'>): Promise<Execution> {
    const execution: Execution = {
      id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...data,
      startedAt: new Date(),
    }
    this.executions.set(execution.id, execution)
    return execution
  }

  async countExecutions(): Promise<number> {
    return this.executions.size
  }

  async countMemories(): Promise<number> {
    return this.memories.size
  }

  // Insights
  async getRecentInsights(limit: number = 10): Promise<any[]> {
    return Array.from(this.insights.values())
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit)
  }

  async getInsightsForProject(projectId: string): Promise<any[]> {
    const results: any[] = []
    for (const insight of this.insights.values()) {
      if (insight.sourceProjectId === projectId ||
          insight.applicableToProjects?.includes(projectId)) {
        results.push(insight)
      }
    }
    return results.sort((a, b) => b.confidence - a.confidence).slice(0, 20)
  }
}

export const memoryStore = new MemoryStore()
