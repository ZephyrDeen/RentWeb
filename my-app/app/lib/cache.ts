import { getRedis } from "./redis";

/**
 * Cache Utility Class
 * 封装常用的缓存操作
 */
export class CacheService {
  /**
   * 获取缓存
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      const redis = await getRedis();
      const data = await redis.get(key);
      
      if (!data) {
        return null;
      }

      return JSON.parse(data) as T;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null; // 缓存失败时返回 null，不影响业务
    }
  }

  /**
   * 设置缓存（带过期时间）
   * @param key 缓存键
   * @param value 缓存值
   * @param ttl 过期时间（秒），默认 5 分钟
   */
  static async set(key: string, value: any, ttl: number = 300): Promise<boolean> {
    try {
      const redis = await getRedis();
      const data = JSON.stringify(value);
      await redis.setEx(key, ttl, data);
      return true;
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * 删除缓存
   */
  static async del(key: string): Promise<boolean> {
    try {
      const redis = await getRedis();
      await redis.del(key);
      return true;
    } catch (error) {
      console.error(`Cache del error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * 删除多个缓存（支持模式匹配）
   * @param pattern 模式，如 "tickets:*"
   */
  static async delPattern(pattern: string): Promise<number> {
    try {
      const redis = await getRedis();
      const keys = await redis.keys(pattern);
      
      if (keys.length === 0) {
        return 0;
      }

      await redis.del(keys);
      return keys.length;
    } catch (error) {
      console.error(`Cache delPattern error for pattern ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * 检查缓存是否存在
   */
  static async exists(key: string): Promise<boolean> {
    try {
      const redis = await getRedis();
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * 设置缓存（如果不存在）
   * @returns true 如果设置成功，false 如果键已存在
   */
  static async setNX(key: string, value: any, ttl: number = 300): Promise<boolean> {
    try {
      const redis = await getRedis();
      const data = JSON.stringify(value);
      const result = await redis.set(key, data, {
        NX: true,
        EX: ttl,
      });
      return result === "OK";
    } catch (error) {
      console.error(`Cache setNX error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * 递增计数器（用于限流）
   * @returns 递增后的值
   */
  static async incr(key: string): Promise<number> {
    try {
      const redis = await getRedis();
      return await redis.incr(key);
    } catch (error) {
      console.error(`Cache incr error for key ${key}:`, error);
      return 0;
    }
  }

  /**
   * 设置过期时间
   */
  static async expire(key: string, ttl: number): Promise<boolean> {
    try {
      const redis = await getRedis();
      const result = await redis.expire(key, ttl);
      return result;
    } catch (error) {
      console.error(`Cache expire error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * 获取或设置缓存（Cache-Aside Pattern）
   * 如果缓存存在，返回缓存；否则执行 fetcher 并缓存结果
   */
  static async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 300
  ): Promise<T | null> {
    // 先查缓存
    const cached = await this.get<T>(key);
    if (cached !== null) {
      console.log(`✅ Cache hit: ${key}`);
      return cached;
    }

    console.log(`❌ Cache miss: ${key}`);

    // 缓存未命中，执行 fetcher
    try {
      const data = await fetcher();
      
      // 将结果存入缓存
      await this.set(key, data, ttl);
      
      return data;
    } catch (error) {
      console.error(`Fetcher error for key ${key}:`, error);
      return null;
    }
  }
}

/**
 * 缓存键生成器
 * 统一管理缓存键的命名规则
 */
export const CacheKeys = {
  // Tickets
  ticketsList: (userId: string, role: string) => `tickets:${role}:${userId}`,
  ticketDetail: (ticketId: string) => `ticket:${ticketId}`,
  ticketReplies: (ticketId: string) => `ticket:${ticketId}:replies`,

  // Properties
  propertiesList: (userId: string, role: string) => `properties:${role}:${userId}`,
  propertyDetail: (propertyId: string) => `property:${propertyId}`,

  // Invoices
  invoicesList: (userId: string, role: string) => `invoices:${role}:${userId}`,
  invoiceDetail: (invoiceId: string) => `invoice:${invoiceId}`,

  // Inspections
  inspectionsList: (userId: string, role: string) => `inspections:${role}:${userId}`,

  // Rate Limiting
  rateLimit: (userId: string, action: string) => `ratelimit:${action}:${userId}`,

  // Session (if needed)
  session: (userId: string) => `session:${userId}`,
};

/**
 * 缓存过期时间常量（秒）
 */
export const CacheTTL = {
  SHORT: 60, // 1 分钟 - 用于频繁变化的数据
  MEDIUM: 300, // 5 分钟 - 用于一般查询结果
  LONG: 3600, // 1 小时 - 用于很少变化的数据
  DAY: 86400, // 24 小时 - 用于极少变化的数据
  RATE_LIMIT: 60, // 1 分钟 - 限流窗口
};
