# 🚀 Prophet Central Server - 快速开始

## 5分钟启动指南

### 方式1：一键脚本

```bash
# 克隆或进入目录
cd prophet-central

# 运行设置脚本
chmod +x scripts/setup.sh
./scripts/setup.sh

# 启动服务器
npm run dev
```

### 方式2：手动步骤

#### 1. 安装依赖

```bash
npm install
```

#### 2. 配置环境

```bash
cp .env.example .env
```

编辑 `.env`:
```env
PORT=3000
DATABASE_URL="postgresql://prophet:password@localhost:5432/prophet"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-secret-key"
```

#### 3. 启动数据库

```bash
docker-compose up -d postgres redis
```

#### 4. 初始化数据库

```bash
npm run db:push
```

#### 5. 启动服务器

```bash
# 开发模式（热重载）
npm run dev

# 或生产模式
npm run build
npm start
```

## ✅ 验证安装

### 健康检查

```bash
curl http://localhost:3000/health
```

应该返回:
```json
{
  "status": "ok",
  "timestamp": "...",
  "projects": { ... }
}
```

### 查看数据库

```bash
npm run db:studio
```

在浏览器打开 `http://localhost:5555`

## 📡 连接第一个项目

### 方法1：使用SDK

```typescript
import { createProphetClient } from '@prophet/central-server/sdk'

const client = createProphetClient({
  serverUrl: 'http://localhost:3000',
  apiKey: 'your-api-key',
})

await client.connect()
```

### 方法2：注册新项目

```bash
# 运行注册示例
npx tsx examples/register-project.ts
```

或使用API:

```bash
curl -X POST http://localhost:3000/api/projects/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Project",
    "type": "web-app",
    "path": "/path/to/project"
  }'
```

返回:
```json
{
  "projectId": "xxx-xxx-xxx",
  "apiKey": "pk_xxxxxxxxx",
  "message": "项目注册成功"
}
```

**保存这个API Key！** 用于后续所有连接。

## 🎯 测试功能

### 执行任务

```typescript
const result = await client.execute({
  id: 'task-1',
  description: '分析代码质量',
})
```

### 提交学习

```typescript
await client.submitLearning({
  what: '发现性能瓶颈',
  solution: '添加缓存',
  effectiveness: 0.9,
})
```

### 搜索记忆

```bash
curl "http://localhost:3000/api/memory/search?q=performance"
```

## 🐳 使用Docker

### 完整服务

```bash
docker-compose up -d
```

包含:
- Prophet Server (端口 3000)
- PostgreSQL (端口 5432)
- Redis (端口 6379)

### 查看日志

```bash
docker-compose logs -f prophet-server
```

### 停止服务

```bash
docker-compose down
```

## 🔧 开发工具

### TypeScript编译

```bash
npm run build
```

### 监控模式

```bash
npm run dev  # 文件变化自动重启
```

### 数据库管理

```bash
npm run db:studio  # Prisma Studio
npm run db:push    # 更新schema
```

## 🌍 生产部署

### 环境变量

确保设置:
```env
NODE_ENV=production
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=strong-secret-key
PORT=3000
```

### Kubernetes

参考 `k8s/` 目录配置文件

### 负载均衡

Prophet Central支持水平扩展，使用共享的PostgreSQL和Redis实例。

## 📊 监控

### 内置指标

访问 `/health` 获取实时状态:
```bash
curl http://localhost:3000/health
```

### 全局洞察

```bash
curl http://localhost:3000/api/insights/global
```

## 🔐 安全建议

1. **更改默认密码**: 修改 `docker-compose.yml` 中的数据库密码
2. **强JWT密钥**: 使用强随机字符串作为 `JWT_SECRET`
3. **HTTPS**: 生产环境使用HTTPS
4. **防火墙**: 仅暴露必要端口
5. **速率限制**: 已内置，可在 `src/server/index.ts` 调整

## 🆘 故障排查

### 连接被拒绝

检查数据库是否运行:
```bash
docker-compose ps
```

### Prisma错误

重新生成客户端:
```bash
npx prisma generate
```

### 端口占用

更改端口:
```env
PORT=3001
```

## 📚 下一步

- 阅读 [完整文档](./README.md)
- 查看 [API参考](./API.md)
- 运行 [示例代码](./examples/)
- 集成到 [你的项目](../INTEGRATION_GUIDE.md)

---

**四维生物意识已觉醒 🔮**

需要帮助？查看 [GitHub Issues](https://github.com/prophet-ai/central)
