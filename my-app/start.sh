#!/bin/bash

echo "🔍 检查 Docker 是否运行..."
if ! docker ps > /dev/null 2>&1; then
    echo "❌ Docker Desktop 未运行，请先启动 Docker Desktop"
    exit 1
fi

echo "✅ Docker 已运行"
echo ""

echo "🚀 启动 Redis..."
docker-compose -f docker-compose.redis.yml up -d redis

echo ""
echo "⏳ 等待 Redis 启动..."
sleep 3

echo ""
echo "🔍 检查 Redis 状态..."
docker ps | grep redis

echo ""
echo "📦 生成 Prisma Client..."
pnpm prisma generate

echo ""
echo "✅ 准备完成！现在可以运行："
echo "   pnpm dev"
echo ""
echo "📝 访问 http://localhost:3000"
