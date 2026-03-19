/**
 * Prophet Smart Cache - 智能缓存系统
 *
 * Phase 2.3: 智能缓存系统（LRU）
 *
 * 目标：减少重复IO，缓存文件内容和分析结果
 * 预期提速：2-3x（减少重复读取）
 *
 * 使用场景：
 * - 文件内容缓存（避免重复readFile）
 * - 扫描结果缓存（避免重复分析）
 * - 依赖分析缓存
 * - Git信息缓存
 *
 * 工作原理：
 * - LRU (Least Recently Used) 淘汰算法
 * - 基于文件修改时间的自动失效
 * - 内存限制保护
 */

import LRU from 'lru-cache'
import { readFileSync, statSync } from 'fs'
import { createHash } from 'crypto'

export interface CacheOptions {
  maxFiles?: number          // 最多缓存文件数
  maxContentSize?: number    // 单个文件最大缓存大小（bytes）
  ttl?: number              // 缓存生存时间（ms）
  enableStats?: boolean     // 启用统计
}

export interface CacheStats {
  hits: number
  misses: number
  evictions: number
  hitRate: number
  cacheSize: number
}

interface CachedFile {
  content: string
  mtime: number  // 修改时间
  size: number
  hash: string
}

export class SmartCache {
  private fileCache: LRU<string, CachedFile>
  private resultCache: LRU<string, any>
  private stats: CacheStats
  private options: Required<CacheOptions>

  constructor(options: CacheOptions = {}) {
    this.options = {
      maxFiles: options.maxFiles || 500,
      maxContentSize: options.maxContentSize || 1024 * 1024, // 1MB
      ttl: options.ttl || 5 * 60 * 1000, // 5分钟
      enableStats: options.enableStats !== undefined ? options.enableStats : true
    }

    // 文件内容缓存
    this.fileCache = new LRU({
      max: this.options.maxFiles,
      ttl: this.options.ttl,
      updateAgeOnGet: true,
      allowStale: false,
      dispose: () => {
        if (this.options.enableStats) {
          this.stats.evictions++
        }
      }
    })

    // 分析结果缓存
    this.resultCache = new LRU({
      max: this.options.maxFiles,
      ttl: this.options.ttl,
      updateAgeOnGet: true
    })

    // 统计信息
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      hitRate: 0,
      cacheSize: 0
    }

    console.log(`💾 [SmartCache] 初始化智能缓存系统`)
    console.log(`   最大缓存: ${this.options.maxFiles} 个文件`)
    console.log(`   TTL: ${this.options.ttl / 1000}秒`)
    console.log(`   单文件限制: ${(this.options.maxContentSize / 1024).toFixed(0)}KB`)
  }

  /**
   * 读取文件（带缓存）
   *
   * 策略：
   * 1. 检查缓存是否存在
   * 2. 检查文件是否被修改（mtime）
   * 3. 如果缓存有效，返回缓存
   * 4. 否则读取文件并更新缓存
   */
  async readFile(filePath: string): Promise<string> {
    try {
      // 获取文件状态
      const stat = statSync(filePath)
      const mtime = stat.mtimeMs

      // 检查缓存
      const cached = this.fileCache.get(filePath)

      if (cached && cached.mtime === mtime) {
        // 缓存命中且文件未修改
        if (this.options.enableStats) {
          this.stats.hits++
          this.updateHitRate()
        }
        return cached.content
      }

      // 缓存未命中或文件已修改
      if (this.options.enableStats) {
        this.stats.misses++
        this.updateHitRate()
      }

      // 检查文件大小
      if (stat.size > this.options.maxContentSize) {
        // 文件太大，不缓存
        return readFileSync(filePath, 'utf-8')
      }

      // 读取文件
      const content = readFileSync(filePath, 'utf-8')

      // 计算hash（用于内容对比）
      const hash = this.hashContent(content)

      // 更新缓存
      this.fileCache.set(filePath, {
        content,
        mtime,
        size: stat.size,
        hash
      })

      return content

    } catch (error: any) {
      throw new Error(`Failed to read file ${filePath}: ${error.message}`)
    }
  }

  /**
   * 缓存分析结果
   *
   * 用于缓存耗时的分析操作结果
   */
  cacheResult(key: string, result: any): void {
    this.resultCache.set(key, result)
  }

  /**
   * 获取缓存的分析结果
   */
  getResult<T>(key: string): T | undefined {
    const result = this.resultCache.get(key)

    if (result !== undefined) {
      if (this.options.enableStats) {
        this.stats.hits++
        this.updateHitRate()
      }
      return result as T
    }

    if (this.options.enableStats) {
      this.stats.misses++
      this.updateHitRate()
    }
    return undefined
  }

  /**
   * 批量预热缓存
   *
   * 提前加载常用文件到缓存
   */
  async warmup(filePaths: string[]): Promise<void> {
    console.log(`🔥 [SmartCache] 预热缓存: ${filePaths.length} 个文件`)

    const startTime = Date.now()
    let warmedUp = 0

    for (const filePath of filePaths) {
      try {
        await this.readFile(filePath)
        warmedUp++
      } catch (error: any) {
        // 忽略错误，继续预热其他文件
      }
    }

    const duration = Date.now() - startTime
    console.log(`   ✓ 预热完成: ${warmedUp}/${filePaths.length} 个文件 (${duration}ms)`)
  }

  /**
   * 智能批量读取
   *
   * 批量读取文件，利用缓存加速
   */
  async readFiles(filePaths: string[]): Promise<Map<string, string>> {
    const results = new Map<string, string>()

    // 并行读取（利用缓存）
    await Promise.all(
      filePaths.map(async (filePath) => {
        try {
          const content = await this.readFile(filePath)
          results.set(filePath, content)
        } catch (error: any) {
          // 忽略错误
        }
      })
    )

    return results
  }

  /**
   * 清除缓存
   */
  clear(): void {
    this.fileCache.clear()
    this.resultCache.clear()

    if (this.options.enableStats) {
      console.log(`🧹 [SmartCache] 缓存已清空`)
      console.log(`   统计信息: ${this.stats.hits} hits, ${this.stats.misses} misses`)
    }

    // 重置统计
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      hitRate: 0,
      cacheSize: 0
    }
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): CacheStats {
    return {
      ...this.stats,
      cacheSize: this.fileCache.size
    }
  }

  /**
   * 打印缓存统计报告
   */
  printStats(): void {
    const stats = this.getStats()

    console.log(`\n📊 [SmartCache] 缓存统计报告`)
    console.log(`   缓存大小: ${stats.cacheSize}/${this.options.maxFiles} 个文件`)
    console.log(`   缓存命中: ${stats.hits} 次`)
    console.log(`   缓存未命中: ${stats.misses} 次`)
    console.log(`   命中率: ${(stats.hitRate * 100).toFixed(1)}%`)
    console.log(`   淘汰次数: ${stats.evictions} 次`)

    if (stats.hitRate > 0.7) {
      console.log(`   ✅ 缓存效果优秀！`)
    } else if (stats.hitRate > 0.5) {
      console.log(`   ⚠️  缓存效果一般，考虑增加缓存大小`)
    } else {
      console.log(`   ⚠️  缓存效果较差，检查缓存策略`)
    }
  }

  /**
   * 计算内容hash
   */
  private hashContent(content: string): string {
    return createHash('md5').update(content).digest('hex')
  }

  /**
   * 更新命中率
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0
  }

  /**
   * 获取缓存大小（估算，bytes）
   */
  getMemoryUsage(): number {
    let totalBytes = 0

    for (const [, value] of this.fileCache.entries()) {
      totalBytes += value.size
    }

    return totalBytes
  }

  /**
   * 打印内存使用情况
   */
  printMemoryUsage(): void {
    const bytes = this.getMemoryUsage()
    const mb = bytes / (1024 * 1024)

    console.log(`\n💾 [SmartCache] 内存使用情况`)
    console.log(`   缓存大小: ${this.fileCache.size} 个文件`)
    console.log(`   内存占用: ${mb.toFixed(2)} MB`)

    if (mb > 100) {
      console.log(`   ⚠️  内存占用较大，考虑降低缓存上限`)
    } else {
      console.log(`   ✓ 内存占用合理`)
    }
  }
}

/**
 * 使用示例：
 *
 * const cache = new SmartCache({
 *   maxFiles: 500,
 *   ttl: 5 * 60 * 1000,  // 5分钟
 *   enableStats: true
 * })
 *
 * // 读取文件（自动缓存）
 * const content1 = await cache.readFile('/path/to/file.ts')
 * const content2 = await cache.readFile('/path/to/file.ts')  // 缓存命中，瞬间返回
 *
 * // 缓存分析结果
 * cache.cacheResult('analysis-key', { result: 'some data' })
 * const result = cache.getResult('analysis-key')
 *
 * // 批量读取
 * const contents = await cache.readFiles(['/file1.ts', '/file2.ts'])
 *
 * // 预热缓存
 * await cache.warmup(['/file1.ts', '/file2.ts', '/file3.ts'])
 *
 * // 查看统计
 * cache.printStats()
 * cache.printMemoryUsage()
 */
