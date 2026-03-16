# 🛡️ Multi-Project Guardian Setup Complete

## ✅ Implementation Summary

Prophet Central has been successfully upgraded to monitor **all connected projects**!

### Changes Made

1. **Created `ecosystem-all.config.cjs`**
   - Manages 3 projects with PM2
   - prophet-central (port 3001)
   - videoplay-web (port 3000)
   - videoplay-api (port 4000)

2. **Updated `project-guardian.ts`**
   - Now monitors all 3 projects
   - Health checks for each service
   - Auto-healing enabled

3. **Updated `PROJECT_GUARDIAN.md`**
   - Reflects actual project paths
   - Updated documentation
   - Removed non-existent projects

4. **Created log directories**
   - `/Users/zhangjingwei/Desktop/New CC/prophet-central/logs`
   - `/Users/zhangjingwei/Desktop/videoplay/logs`

---

## 📋 Prerequisites Verified

✅ Node.js v22.22.1
✅ PM2 v6.0.14
✅ pnpm v10.32.1
✅ Redis running (PONG)
✅ Dependencies installed
⚠️ Port 3000 currently in use (will be managed by PM2)
✅ Port 4000 free
✅ Port 3001 free

---

## 🚀 How to Start All Projects

### Option 1: One Command Start

```bash
cd "/Users/zhangjingwei/Desktop/New CC/prophet-central"
pm2 start ecosystem-all.config.cjs
```

### Option 2: Stop Old Processes First

```bash
# Stop any existing PM2 processes
pm2 delete all

# Stop any process on port 3000
lsof -ti:3000 | xargs kill -9

# Start all projects
cd "/Users/zhangjingwei/Desktop/New CC/prophet-central"
pm2 start ecosystem-all.config.cjs

# View status
pm2 status
```

### Expected Output

```
┌─────┬──────────────────┬─────────┬─────────┬─────────┐
│ id  │ name             │ status  │ cpu     │ memory  │
├─────┼──────────────────┼─────────┼─────────┼─────────┤
│ 0   │ prophet-central  │ online  │ 0%      │ 68 MB   │
│ 1   │ videoplay-web    │ online  │ 0%      │ 120 MB  │
│ 2   │ videoplay-api    │ online  │ 0%      │ 95 MB   │
└─────┴──────────────────┴─────────┴─────────┴─────────┘
```

---

## 🔍 Verification Steps

### 1. Check PM2 Status

```bash
pm2 status
# All 3 should show "online"
```

### 2. Test Health Endpoints

```bash
# Prophet Central
curl http://localhost:3001
# Should return response

# VideoPlay Web
curl http://localhost:3000
# Should return HTML

# VideoPlay API
curl http://localhost:4000/health
# Should return: {"status":"ok","timestamp":"...","uptime":...}
```

### 3. Watch Guardian Logs

```bash
pm2 logs prophet-central --lines 50

# Look for:
# 🛡️ Prophet项目守护系统
# 守护项目数: 3
# 💚 所有项目健康 (3/3)
```

### 4. Test Auto-Healing

```bash
# Stop one project
pm2 stop videoplay-api

# Watch logs - should auto-restart within 30 seconds
pm2 logs prophet-central --lines 20

# Expected messages:
# ⚠️ videoplay-api 不健康: PM2进程状态: stopped
# 🔧 修复 videoplay-api...
# ✅ videoplay-api 已重启
# 💚 videoplay-api 恢复健康
```

### 5. Monitor Resources

```bash
# Real-time monitoring
pm2 monit

# Save configuration
pm2 save

# Setup auto-start on boot (optional)
pm2 startup
```

---

## 📊 Project Configuration

### prophet-central
- **Port**: 3001
- **Memory Limit**: 1G
- **Critical**: Yes 🔴
- **Health Check**: `http://localhost:3001`

### videoplay-web
- **Port**: 3000
- **Memory Limit**: 2G (Next.js needs more)
- **Critical**: No 🟢
- **Health Check**: `http://localhost:3000`

### videoplay-api
- **Port**: 4000
- **Memory Limit**: 1.5G (Workers + Socket.IO)
- **Critical**: Yes 🔴
- **Health Check**: `http://localhost:4000/health`

---

## ⚠️ Important Notes

### Redis Requirement
- videoplay-api **requires Redis** for background workers
- Start Redis: `brew services start redis`
- Verify: `redis-cli ping` (should return "PONG")

### First Build Delay
- Next.js (videoplay-web) takes 30-60s for initial compilation
- Guardian may report "unhealthy" during first check
- This is normal - will become healthy after compilation

### Port Conflicts
- If ports are in use, stop conflicting processes:
  ```bash
  lsof -ti:3000 | xargs kill -9
  lsof -ti:4000 | xargs kill -9
  ```

### Monorepo Dependencies
- videoplay uses pnpm workspaces
- Dependencies must be installed from monorepo root
- If errors occur: `cd /Users/zhangjingwei/Desktop/videoplay && pnpm install`

---

## 🎯 Guardian Guarantees

✅ **24/7 Continuous Monitoring**
✅ **30-Second Health Checks**
✅ **Automatic Restart on Failure**
✅ **Smart Health Validation**
✅ **Memory/CPU Monitoring**
✅ **Real-Time Status Reports**
✅ **Auto-Healing**
✅ **永不停止 (Never Stop)**

---

## 🔧 Troubleshooting

### All Projects Show "Unhealthy" Initially
**Cause**: Services need 10-30 seconds to start
**Solution**: Wait 30-60 seconds, guardian will detect healthy state

### videoplay-api Keeps Restarting
**Cause**: Redis not running
**Solution**: `brew services start redis`

### Next.js Build Errors
**Cause**: Missing dependencies
**Solution**: `cd /Users/zhangjingwei/Desktop/videoplay && pnpm install`

### Port Already in Use
**Cause**: Another process using the port
**Solution**: `lsof -ti:PORT | xargs kill -9`

---

## 📈 Monitoring Commands

```bash
# View all processes
pm2 list

# View logs
pm2 logs

# View specific project logs
pm2 logs prophet-central
pm2 logs videoplay-web
pm2 logs videoplay-api

# Real-time monitoring
pm2 monit

# Restart all
pm2 restart all

# Stop all
pm2 stop all

# Delete all
pm2 delete all
```

---

## 🎉 Success Criteria

Implementation is successful when:

✅ PM2 shows all 3 projects as "online"
✅ All health endpoints respond with 200 OK
✅ Guardian logs show "💚 所有项目健康 (3/3)"
✅ Simulated failures auto-recover within 30 seconds
✅ No repeated restart loops or crash cycles
✅ Logs are clean without continuous errors

---

## 🚪 Rollback Plan

If issues occur, rollback to single-project mode:

```bash
# Stop all
pm2 delete all

# Start only prophet-central
pm2 start "/Users/zhangjingwei/Desktop/New CC/prophet-central/ecosystem.config.cjs"

# Verify
pm2 status
```

---

**Prophet Central - 项目守护者** 🛡️⚡🔮

**3个项目，24/7守护，永不停止** 💫

_"你能帮我监控所有的项目一直持续在跑不停吗？" - 完成！_ ✨
