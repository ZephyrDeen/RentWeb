# 🚀 AWS EC2 部署指南

## 📋 部署架构

```
用户请求
    ↓
Nginx (80/443) → 反向代理
    ↓
Next.js App (PM2 管理, 端口 3000)
    ↓
├─ Redis (Docker, 端口 6379)
└─ PostgreSQL RDS (AWS 托管)
```

## 🛠️ 前置准备

### 1. 创建 EC2 实例

- **实例类型**: t3.small 或更高（推荐 t3.medium）
- **操作系统**: Ubuntu 22.04 LTS
- **存储**: 最少 20GB
- **安全组规则**:
  - SSH (22) - 你的 IP
  - HTTP (80) - 0.0.0.0/0
  - HTTPS (443) - 0.0.0.0/0
  - Custom TCP (3000) - 你的 IP（用于调试）

### 2. 创建 RDS PostgreSQL 数据库

- **引擎**: PostgreSQL 16
- **实例类型**: db.t3.micro（免费套餐）或 db.t3.small
- **存储**: 20GB
- **公共访问**: 是（或配置 VPC）
- **安全组**: 允许 EC2 安全组访问 5432 端口

### 3. 配置环境变量

SSH 到 EC2，创建 `.env` 文件：

```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
cd /home/ubuntu/RentWeb/my-app
nano .env
```

填入你的配置（参考 `.env.production`）

## 📦 部署步骤

### 方法 1: 自动部署（推荐）

```bash
# 1. SSH 到 EC2
ssh -i your-key.pem ubuntu@your-ec2-ip

# 2. 下载并运行部署脚本
curl -o deploy.sh https://raw.githubusercontent.com/ZephyrDeen/RentWeb/main/my-app/deploy-ec2.sh
chmod +x deploy.sh
./deploy.sh
```

### 方法 2: 手动部署

```bash
# 1. SSH 到 EC2
ssh -i your-key.pem ubuntu@your-ec2-ip

# 2. 克隆项目
git clone https://github.com/ZephyrDeen/RentWeb.git
cd RentWeb/my-app

# 3. 运行部署脚本
chmod +x deploy-ec2.sh
./deploy-ec2.sh
```

## 🔧 配置 Nginx（可选但推荐）

```bash
cd /home/ubuntu/RentWeb/my-app

# 运行 Nginx 安装脚本
chmod +x setup-nginx.sh
./setup-nginx.sh
```

配置完成后，你的应用可以通过 `http://your-ec2-ip` 访问（不需要端口 3000）

## 🔄 更新应用

每次代码更新后，运行：

```bash
cd /home/ubuntu/RentWeb/my-app
./update.sh
```

## 📊 管理 PM2 进程

```bash
# 查看应用状态
pm2 status

# 查看日志
pm2 logs rentweb

# 重启应用
pm2 restart rentweb

# 停止应用
pm2 stop rentweb

# 监控
pm2 monit
```

## 🐳 管理 Redis

```bash
# 查看 Redis 状态
docker ps | grep redis

# 重启 Redis
docker-compose -f docker-compose.redis.yml restart redis

# 查看 Redis 日志
docker logs rentweb-redis

# 进入 Redis CLI
docker exec -it rentweb-redis redis-cli
```

## 🔐 SSL 证书（可选）

使用 Let's Encrypt 免费 SSL：

```bash
# 1. 安装 Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# 2. 获取证书（替换为你的域名）
sudo certbot --nginx -d your-domain.com

# 3. 自动续期
sudo certbot renew --dry-run
```

## 📝 环境变量说明

| 变量 | 说明 | 示例 |
|------|------|------|
| `DATABASE_URL` | PostgreSQL 连接字符串 | `postgresql://user:pass@rds-endpoint:5432/db` |
| `REDIS_URL` | Redis 连接字符串 | `redis://localhost:6379` |
| `AUTH_SECRET` | NextAuth 密钥（32+ 字符） | 随机生成的长字符串 |
| `NEXT_PUBLIC_APP_URL` | 应用公开 URL | `http://your-ec2-ip` 或域名 |
| `STRIPE_SECRET_KEY` | Stripe 密钥 | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe Webhook 密钥 | `whsec_...` |

## 🧪 验证部署

```bash
# 1. 检查应用是否运行
curl http://localhost:3000

# 2. 检查 Nginx
curl http://your-ec2-ip

# 3. 检查数据库连接
cd /home/ubuntu/RentWeb/my-app
pnpm prisma db push

# 4. 查看应用日志
pm2 logs rentweb --lines 50
```

## 🔍 故障排查

### 应用无法启动

```bash
# 查看 PM2 日志
pm2 logs rentweb

# 检查环境变量
cat /home/ubuntu/RentWeb/my-app/.env

# 检查端口占用
sudo netstat -tlnp | grep 3000
```

### 数据库连接失败

```bash
# 测试数据库连接
psql "postgresql://user:pass@rds-endpoint:5432/db"

# 检查 RDS 安全组
# 确保允许 EC2 实例的安全组访问 5432 端口
```

### Redis 连接失败

```bash
# 检查 Redis 容器
docker ps | grep redis

# 重启 Redis
docker-compose -f docker-compose.redis.yml restart redis

# 测试 Redis 连接
docker exec -it rentweb-redis redis-cli ping
```

## 💰 成本估算（每月）

| 服务 | 配置 | 价格 |
|------|------|------|
| EC2 t3.small | 2 vCPU, 2GB RAM | ~$15 |
| RDS db.t3.micro | 免费套餐 | $0（第一年）|
| 数据传输 | 1GB 出站 | 免费套餐 |
| **总计** | | **~$15/月** |

## 📚 相关文档

- [EC2 用户指南](https://docs.aws.amazon.com/ec2/)
- [RDS 用户指南](https://docs.aws.amazon.com/rds/)
- [PM2 文档](https://pm2.keymetrics.io/)
- [Nginx 文档](https://nginx.org/en/docs/)

## 🎉 完成！

你的应用现在运行在:
- **HTTP**: `http://your-ec2-ip`
- **HTTPS**: `https://your-domain.com`（如果配置了 SSL）

监控和日志:
- **PM2 监控**: `pm2 monit`
- **应用日志**: `/home/ubuntu/RentWeb/my-app/logs/`
