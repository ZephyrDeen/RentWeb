# 🚀 AWS 部署快速指南

## 📦 已创建的文件

| 文件 | 用途 |
|------|------|
| `deploy-ec2.sh` | 自动部署脚本（在 EC2 上运行） |
| `update.sh` | 快速更新脚本 |
| `ecosystem.config.js` | PM2 进程管理配置 |
| `nginx.conf` | Nginx 反向代理配置 |
| `setup-nginx.sh` | Nginx 安装脚本 |
| `.github/workflows/deploy-ec2.yml` | GitHub Actions 自动部署 |
| `DEPLOY_AWS.md` | 完整部署文档 |

## ⚡ 快速部署（3 步）

### 1️⃣ 创建 AWS 资源

```bash
# EC2 实例
- 类型: t3.small (Ubuntu 22.04)
- 安全组: 开放 22, 80, 443 端口

# RDS PostgreSQL（可选，也可用 Supabase）
- 引擎: PostgreSQL 16
- 类型: db.t3.micro
```

### 2️⃣ SSH 到 EC2 并部署

```bash
# 连接到 EC2
ssh -i your-key.pem ubuntu@your-ec2-ip

# 运行自动部署
curl -o deploy.sh https://raw.githubusercontent.com/ZephyrDeen/RentWeb/main/my-app/deploy-ec2.sh
chmod +x deploy.sh
./deploy.sh
```

### 3️⃣ 配置环境变量

```bash
cd /home/ubuntu/RentWeb/my-app
nano .env

# 填入:
DATABASE_URL="postgresql://user:pass@rds-endpoint:5432/db"
REDIS_URL="redis://localhost:6379"
AUTH_SECRET="your-32-char-secret"
NEXT_PUBLIC_APP_URL="http://your-ec2-ip"
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

重启应用：
```bash
pm2 restart rentweb
```

## 🌐 访问应用

- **直接访问**: `http://your-ec2-ip:3000`
- **Nginx 反向代理**: `http://your-ec2-ip`（需要先运行 `./setup-nginx.sh`）

## 🔄 更新代码

本地提交代码后：

```bash
# 方法 1: 手动更新
ssh ubuntu@your-ec2-ip
cd /home/ubuntu/RentWeb/my-app
./update.sh

# 方法 2: GitHub Actions 自动部署
# 配置 GitHub Secrets:
# - EC2_HOST: 你的 EC2 公网 IP
# - EC2_SSH_KEY: 你的私钥内容
# 推送到 main 分支即自动部署
```

## 📊 常用命令

```bash
# 查看应用状态
pm2 status

# 查看日志
pm2 logs rentweb

# 重启应用
pm2 restart rentweb

# 查看 Redis
docker ps | grep redis
```

## 💡 Tips

1. **使用 Nginx** - 运行 `./setup-nginx.sh` 配置反向代理
2. **配置 SSL** - 使用 `certbot` 获取免费 HTTPS 证书
3. **监控** - 使用 `pm2 monit` 实时监控资源使用
4. **日志** - 日志文件在 `logs/` 目录

## 📚 详细文档

查看 [DEPLOY_AWS.md](./DEPLOY_AWS.md) 获取完整部署文档。

---

🎉 **部署完成后，你的应用就运行在 AWS EC2 上了！**
