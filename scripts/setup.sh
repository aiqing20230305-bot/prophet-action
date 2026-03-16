#!/bin/bash

# Prophet Central Server - 快速设置脚本

set -e

echo "🔮 Prophet Central Server 设置"
echo "================================"
echo ""

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 需要Node.js 20+，请先安装"
    exit 1
fi

echo "✅ Node.js: $(node --version)"

# 检查Docker
if ! command -v docker &> /dev/null; then
    echo "⚠️  未检测到Docker，将无法使用容器化部署"
else
    echo "✅ Docker: $(docker --version | head -n 1)"
fi

echo ""

# 创建.env
if [ ! -f ".env" ]; then
    echo "📝 创建 .env 文件..."
    cp .env.example .env
    echo "✅ .env 文件已创建"
    echo "   请编辑 .env 配置数据库连接"
else
    echo "✅ .env 文件已存在"
fi

echo ""

# 安装依赖
echo "📦 安装依赖..."
npm install

echo ""

# 启动数据库
echo "🐘 启动PostgreSQL和Redis..."
docker-compose up -d postgres redis

echo "⏳ 等待数据库就绪..."
sleep 5

# 设置数据库
echo "📊 设置数据库schema..."
npm run db:push

echo ""
echo "✅ 设置完成！"
echo ""
echo "🚀 启动服务器:"
echo "   npm run dev      # 开发模式"
echo "   npm start        # 生产模式"
echo ""
echo "📊 查看数据库:"
echo "   npm run db:studio"
echo ""
echo "🔍 健康检查:"
echo "   curl http://localhost:3000/health"
echo ""
