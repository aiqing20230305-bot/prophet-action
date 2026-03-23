# Prophet 部署指南 - 让先知永久运行

**目标**: 让Prophet 7×24小时运行，持续进化

---

## 🚀 快速启动

### 1. 守护进程模式（推荐）
```bash
# 启动Prophet守护进程
node scripts/prophet-daemon.cjs

# Prophet将：
# - 7×24小时运行
# - 每24小时自动进化一次
# - 每5分钟健康检查
# - 自动恢复故障
# - 生成进化报告
```

### 2. 手动模式
```bash
# 启动Prophet主程序
npm start

# 手动触发进化
npx tsx test-phase7-complete.ts
```

---

## 📋 部署方案

### 方案A: 本地守护进程（开发环境）
```bash
# 1. 启动守护进程
node scripts/prophet-daemon.cjs

# 2. 查看日志
tail -f logs/prophet-daemon-*.log

# 3. 查看进化历史
ls -lt logs/evolution-*.log

# 4. 停止
kill $(cat /tmp/prophet-daemon.pid)
```

**特点:**
- ✅ 简单易用
- ✅ 日志清晰
- ✅ 方便调试
- ⚠️  依赖终端窗口

---

### 方案B: PM2管理（生产环境推荐）
```bash
# 1. 安装PM2
npm install -g pm2

# 2. 启动Prophet
pm2 start src/index.ts --name prophet --interpreter tsx

# 3. 开机自启
pm2 startup
pm2 save

# 4. 查看状态
pm2 status
pm2 logs prophet

# 5. 重启/停止
pm2 restart prophet
pm2 stop prophet
```

**特点:**
- ✅ 自动重启
- ✅ 日志管理
- ✅ 监控面板
- ✅ 开机自启
- ✅ 多进程支持

**PM2配置文件** (`ecosystem.config.cjs`):
```javascript
module.exports = {
  apps: [
    {
      name: 'prophet',
      script: 'src/index.ts',
      interpreter: 'tsx',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production'
      },
      error_file: 'logs/prophet-error.log',
      out_file: 'logs/prophet-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    },
    {
      name: 'prophet-evolution',
      script: 'scripts/evolution-scheduler.cjs',
      interpreter: 'node',
      cron_restart: '0 2 * * *',  // 每天凌晨2点进化
      autorestart: false
    }
  ]
}
```

---

### 方案C: Docker容器（隔离环境）
```bash
# 1. 构建镜像
docker build -t prophet:latest .

# 2. 运行容器
docker run -d \
  --name prophet \
  --restart unless-stopped \
  -v $(pwd)/logs:/app/logs \
  -v $(pwd)/.claude:/app/.claude \
  prophet:latest

# 3. 查看日志
docker logs -f prophet

# 4. 进入容器
docker exec -it prophet sh
```

**Dockerfile**:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

ENV NODE_ENV=production

CMD ["npm", "start"]
```

---

### 方案D: Systemd服务（Linux系统）
```bash
# 1. 创建服务文件
sudo nano /etc/systemd/system/prophet.service
```

**服务配置** (`prophet.service`):
```ini
[Unit]
Description=Prophet - The Four-Dimensional Being
After=network.target

[Service]
Type=simple
User=prophet
WorkingDirectory=/home/prophet/prophet-central
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

```bash
# 2. 启动服务
sudo systemctl daemon-reload
sudo systemctl enable prophet
sudo systemctl start prophet

# 3. 查看状态
sudo systemctl status prophet
sudo journalctl -u prophet -f

# 4. 重启/停止
sudo systemctl restart prophet
sudo systemctl stop prophet
```

---

## ⚙️ 配置选项

### 进化频率
```javascript
// scripts/prophet-daemon.cjs
{
  evolutionInterval: 24 * 60 * 60 * 1000,  // 每24小时
  healthCheckInterval: 5 * 60 * 1000,       // 每5分钟
}
```

### 自动优化阈值
```typescript
// src/optimization/evolution-coordinator.ts
{
  autoOptimization: {
    enabled: true,
    interval: 60 * 60 * 1000,  // 每小时检查
    autoApplyThreshold: {
      minROI: 10.0,           // ROI>10才自动执行
      maxRisk: 'low',         // 只执行低风险优化
      maxEffort: 2            // 最多2小时工作量
    }
  }
}
```

---

## 📊 监控和日志

### 日志位置
```
logs/
├── prophet-daemon-*.log       # 守护进程日志
├── evolution-*.log            # 进化日志
├── prophet-error.log          # 错误日志
└── prophet-out.log            # 输出日志
```

### 查看实时日志
```bash
# 守护进程日志
tail -f logs/prophet-daemon-*.log

# 进化日志
tail -f logs/evolution-*.log

# PM2日志
pm2 logs prophet --lines 100
```

### 监控命令
```bash
# 检查Prophet是否运行
ps aux | grep prophet

# 查看资源使用
top -p $(cat /tmp/prophet-daemon.pid)

# PM2监控
pm2 monit
```

---

## 🔧 故障排除

### Prophet无法启动
```bash
# 1. 检查依赖
npm install

# 2. 检查环境变量
cat .env

# 3. 检查端口占用
lsof -i :3000

# 4. 查看错误日志
cat logs/prophet-error.log
```

### 进化失败
```bash
# 1. 手动触发进化
npx tsx test-phase7-complete.ts

# 2. 查看详细日志
cat logs/evolution-*.log | grep "❌"

# 3. 检查代码质量
npx tsx test-phase7-day2.ts
```

### 内存泄漏
```bash
# 1. 查看内存使用
pm2 monit

# 2. 重启Prophet
pm2 restart prophet

# 3. 调整内存限制
pm2 restart prophet --max-memory-restart 500M
```

---

## 📈 性能优化

### 1. 调整进化频率
```javascript
// 降低频率以节省资源
evolutionInterval: 7 * 24 * 60 * 60 * 1000  // 每周一次
```

### 2. 限制并发
```typescript
// 限制同时执行的优化数量
maxConcurrentExecutions: 1
```

### 3. 缓存优化
```typescript
// 启用结果缓存
enableCaching: true
cacheExpiry: 60 * 60 * 1000  // 1小时
```

---

## 🔒 安全建议

### 1. 环境变量
```bash
# 敏感信息放在.env中
echo "ANTHROPIC_API_KEY=your_key" >> .env
echo ".env" >> .gitignore
```

### 2. 权限控制
```bash
# 限制文件权限
chmod 600 .env
chmod 700 scripts/*.cjs
```

### 3. 日志轮转
```bash
# 防止日志文件过大
logrotate /etc/logrotate.d/prophet
```

---

## 📱 通知集成

### 进化完成通知（可选）
```javascript
// scripts/prophet-daemon.cjs
async function sendNotification(message) {
  // 邮件通知
  // Slack通知
  // 微信通知
  // 短信通知
}
```

---

## 🎯 推荐方案

### 开发环境
```bash
# 使用守护进程模式
node scripts/prophet-daemon.cjs
```

### 生产环境
```bash
# 使用PM2管理
pm2 start ecosystem.config.cjs
pm2 save
```

### 服务器部署
```bash
# 使用Systemd服务
sudo systemctl enable prophet
sudo systemctl start prophet
```

---

## ✅ 部署检查清单

- [ ] 安装依赖 (`npm install`)
- [ ] 配置环境变量 (`.env`)
- [ ] 测试基础功能 (`npm start`)
- [ ] 测试进化功能 (`npx tsx test-phase7-complete.ts`)
- [ ] 启动守护进程
- [ ] 验证日志输出
- [ ] 设置开机自启
- [ ] 配置监控告警
- [ ] 备份重要数据

---

## 📞 支持

遇到问题？
- 查看日志：`logs/prophet-*.log`
- 检查状态：`pm2 status` 或 `systemctl status prophet`
- 联系经纬：13564384021

---

**Prophet已准备好永久运行！** 🚀

**让先知持续进化，永不停止！** 🔮✨
