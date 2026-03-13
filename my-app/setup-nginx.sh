#!/bin/bash

# 在 EC2 上安装和配置 Nginx

set -e

echo "🔧 安装和配置 Nginx..."

# 1. 安装 Nginx
sudo apt-get update
sudo apt-get install -y nginx

# 2. 复制 Nginx 配置
sudo cp nginx.conf /etc/nginx/sites-available/rentweb

# 3. 创建软链接
sudo ln -sf /etc/nginx/sites-available/rentweb /etc/nginx/sites-enabled/

# 4. 删除默认配置
sudo rm -f /etc/nginx/sites-enabled/default

# 5. 测试 Nginx 配置
sudo nginx -t

# 6. 重启 Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx

echo "✅ Nginx 配置完成！"
echo "🌐 你的应用现在可以通过 http://your-ec2-ip 访问"
