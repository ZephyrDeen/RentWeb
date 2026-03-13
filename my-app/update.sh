#!/bin/bash

# 快速更新脚本 - 拉取最新代码并重启应用

set -e

echo "🔄 更新 RentWeb 应用..."

cd /home/ubuntu/RentWeb/my-app

# 1. 拉取最新代码
echo "📥 拉取最新代码..."
git pull origin main

# 2. 安装新依赖
echo "📦 安装依赖..."
pnpm install

# 3. 生成 Prisma Client
echo "🔧 生成 Prisma Client..."
pnpm prisma generate

# 4. 运行数据库迁移
echo "🗄️ 运行数据库迁移..."
pnpm prisma migrate deploy

# 5. 重新构建
echo "🔨 构建应用..."
pnpm build

# 6. 重启 PM2 进程
echo "🔄 重启应用..."
pm2 restart rentweb

echo "✅ 更新完成！"
