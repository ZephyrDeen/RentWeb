#!/bin/bash

# AWS EC2 部署脚本
# 在 EC2 实例上运行此脚本以部署 RentWeb 应用

set -e

echo "🚀 开始部署 RentWeb 到 AWS EC2..."

# 1. 更新系统
echo "📦 更新系统包..."
sudo apt-get update
sudo apt-get upgrade -y

# 2. 安装 Node.js 20
echo "📦 安装 Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. 安装 pnpm
echo "📦 安装 pnpm..."
sudo npm install -g pnpm

# 4. 安装 Docker
echo "🐳 安装 Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
fi

# 5. 安装 Docker Compose
echo "🐳 安装 Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# 6. 克隆项目（如果还没有）
if [ ! -d "/home/ubuntu/RentWeb" ]; then
    echo "📥 克隆项目..."
    cd /home/ubuntu
    git clone https://github.com/ZephyrDeen/RentWeb.git
fi

cd /home/ubuntu/RentWeb/my-app

# 7. 拉取最新代码
echo "📥 拉取最新代码..."
git pull origin main

# 8. 安装依赖
echo "📦 安装依赖..."
pnpm install --frozen-lockfile

# 9. 生成 Prisma Client
echo "🔧 生成 Prisma Client..."
pnpm prisma generate

# 10. 运行数据库迁移
echo "🗄️ 运行数据库迁移..."
pnpm prisma migrate deploy

# 11. 构建应用
echo "🔨 构建应用..."
pnpm build

# 12. 启动 Docker 服务（Redis）
echo "🐳 启动 Redis..."
docker-compose -f docker-compose.redis.yml up -d redis

# 13. 使用 PM2 启动应用
echo "🚀 启动应用..."
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
fi

pm2 delete rentweb || true
pm2 start pnpm --name rentweb -- start
pm2 save
pm2 startup

echo "✅ 部署完成！"
echo "🌐 应用运行在: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):3000"
