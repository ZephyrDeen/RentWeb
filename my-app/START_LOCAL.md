# 🚀 本地启动指南

## 快速启动步骤

### 1. 启动 Docker Desktop
打开 **Docker Desktop** 应用（必须）

验证 Docker 是否运行：
```bash
docker ps
```

### 2. 启动 Redis
```bash
cd /Users/zetphy/Desktop/RentWeb/my-app
docker-compose -f docker-compose.redis.yml up -d redis
```

验证 Redis 是否启动：
```bash
docker ps | grep redis
```

### 3. 生成 Prisma Client（如果是第一次启动）
```bash
pnpm prisma generate
```

### 4. 运行数据库迁移（如果是第一次启动）
```bash
pnpm prisma migrate dev
```

### 5. 启动开发服务器
```bash
pnpm dev
```

### 6. 访问应用
打开浏览器访问：http://localhost:3000

---

## 📝 常见问题

### Q: Redis 连接失败？
**A:** 确保 Docker Desktop 已启动，并运行：
```bash
docker-compose -f docker-compose.redis.yml up -d redis
```

### Q: 数据库连接失败？
**A:** 检查 `.env` 文件中的 `DATABASE_URL` 是否正确

### Q: 端口 3000 被占用？
**A:** 修改端口或停止占用进程：
```bash
lsof -ti:3000 | xargs kill -9
```

### Q: 查看 Redis 数据？
**A:** 使用 Redis CLI：
```bash
docker exec -it rentweb-redis redis-cli
```

---

## 🛠️ 开发工具

### Prisma Studio（数据库可视化）
```bash
pnpm prisma studio
```
访问：http://localhost:5555

### React Query DevTools
开发环境自动启用，浏览器左下角可见

### 查看日志
```bash
# 查看 Next.js 日志
pnpm dev

# 查看 Redis 日志
docker logs rentweb-redis -f
```

---

## 🔄 重启服务

### 重启 Next.js
```bash
# Ctrl+C 停止当前进程，然后重新启动
pnpm dev
```

### 重启 Redis
```bash
docker-compose -f docker-compose.redis.yml restart redis
```

### 停止所有服务
```bash
# 停止 Next.js: Ctrl+C

# 停止 Redis
docker-compose -f docker-compose.redis.yml down
```

---

## 🧹 清理与重置

### 清理 Redis 数据
```bash
docker-compose -f docker-compose.redis.yml down -v
docker-compose -f docker-compose.redis.yml up -d redis
```

### 重置数据库
```bash
pnpm prisma migrate reset
```

### 重新安装依赖
```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

---

## 📚 项目信息

- **技术栈**: Next.js 16, React 19, Prisma, Redis, PostgreSQL
- **端口**: 
  - Next.js: 3000
  - Redis: 6379
  - Prisma Studio: 5555
- **架构**: 三层架构 (Controller-Service-Repository)
- **缓存**: React Query (前端) + Redis (后端)
