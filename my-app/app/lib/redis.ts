import { createClient, RedisClientType } from "redis";

/**
 * Redis Client Singleton
 * 单例模式确保整个应用只有一个 Redis 连接
 */
class RedisClient {
  private static instance: RedisClient;
  private client: RedisClientType | null = null;
  private isConnecting = false;

  private constructor() {}

  public static getInstance(): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient();
    }
    return RedisClient.instance;
  }

  /**
   * 获取 Redis 客户端
   */
  public async getClient(): Promise<RedisClientType> {
    // 如果已连接，直接返回
    if (this.client?.isOpen) {
      return this.client;
    }

    // 如果正在连接，等待
    if (this.isConnecting) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return this.getClient();
    }

    // 开始连接
    this.isConnecting = true;

    try {
      // 创建 Redis 客户端
      this.client = createClient({
        url: process.env.REDIS_URL || "redis://localhost:6379",
        socket: {
          connectTimeout: 1000, // 降低超时时间到 1 秒
          reconnectStrategy: (retries) => {
            // 只重试 2 次，快速失败
            if (retries > 2) {
              console.warn("Redis: Connection failed, running without cache");
              return false; // 不再重试
            }
            return Math.min(retries * 100, 1000);
          },
        },
      });

      // 错误处理
      this.client.on("error", (err) => {
        console.error("Redis Client Error:", err);
      });

      this.client.on("connect", () => {
        console.log("✅ Redis connected");
      });

      this.client.on("disconnect", () => {
        console.log("⚠️  Redis disconnected");
      });

      // 连接到 Redis
      await this.client.connect();

      return this.client;
    } catch (error) {
      console.error("Failed to connect to Redis:", error);
      this.client = null;
      throw error;
    } finally {
      this.isConnecting = false;
    }
  }

  /**
   * 断开连接（用于应用关闭时）
   */
  public async disconnect(): Promise<void> {
    if (this.client?.isOpen) {
      await this.client.quit();
      this.client = null;
      console.log("✅ Redis disconnected gracefully");
    }
  }
}

// 导出单例
export const redisClient = RedisClient.getInstance();

/**
 * 便捷函数：获取 Redis 客户端
 */
export async function getRedis(): Promise<RedisClientType> {
  return redisClient.getClient();
}
