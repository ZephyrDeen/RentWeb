import { NextResponse } from "next/server";
import { CacheService, CacheKeys, CacheTTL } from "./cache";

/**
 * Rate Limiter
 * 基于 Redis 的 API 限流器
 */
export class RateLimiter {
  /**
   * 检查是否超过限流
   * @param userId 用户ID
   * @param action 操作类型 (如 "createTicket", "postReply")
   * @param maxRequests 最大请求数
   * @param windowSeconds 时间窗口（秒）
   * @returns { allowed: boolean, remaining: number, resetAt: number }
   */
  static async check(
    userId: string,
    action: string,
    maxRequests: number = 5,
    windowSeconds: number = 60
  ): Promise<{
    allowed: boolean;
    remaining: number;
    resetAt: number;
    current: number;
  }> {
    try {
      const key = CacheKeys.rateLimit(userId, action);
      
      // 递增计数
      const count = await CacheService.incr(key);

      // 如果是第一次请求，设置过期时间
      if (count === 1) {
        await CacheService.expire(key, windowSeconds);
      }

      const remaining = Math.max(0, maxRequests - count);
      const resetAt = Date.now() + windowSeconds * 1000;

      return {
        allowed: count <= maxRequests,
        remaining,
        resetAt,
        current: count,
      };
    } catch (error) {
      console.error("Rate limiter error:", error);
      // Redis 失败时，默认允许请求（优雅降级）
      return {
        allowed: true,
        remaining: maxRequests,
        resetAt: Date.now() + windowSeconds * 1000,
        current: 0,
      };
    }
  }

  /**
   * 中间件：限流检查
   * 使用方式：在 API Route 开头调用
   */
  static async middleware(
    userId: string,
    action: string,
    maxRequests: number = 5,
    windowSeconds: number = 60
  ): Promise<NextResponse | null> {
    const result = await this.check(userId, action, maxRequests, windowSeconds);

    if (!result.allowed) {
      const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
      
      return NextResponse.json(
        {
          error: "Too many requests. Please try again later.",
          details: {
            limit: maxRequests,
            remaining: 0,
            resetAt: result.resetAt,
            retryAfter,
          },
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": maxRequests.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": result.resetAt.toString(),
            "Retry-After": retryAfter.toString(),
          },
        }
      );
    }

    // 允许请求，返回 null
    return null;
  }
}

/**
 * 限流配置
 * 根据不同操作设置不同的限流策略
 */
export const RateLimitConfig = {
  // Ticket 相关
  createTicket: { max: 5, window: 60 }, // 1 分钟内最多创建 5 个工单
  updateTicket: { max: 10, window: 60 }, // 1 分钟内最多更新 10 次
  postReply: { max: 10, window: 60 }, // 1 分钟内最多回复 10 次
  
  // Property 相关
  createProperty: { max: 3, window: 60 }, // 1 分钟内最多创建 3 个房产
  
  // Invoice 相关
  createInvoice: { max: 5, window: 60 }, // 1 分钟内最多创建 5 个账单
  
  // Inspection 相关
  createInspection: { max: 3, window: 60 }, // 1 分钟内最多创建 3 个查房
  
  // 通用
  default: { max: 20, window: 60 }, // 1 分钟内最多 20 个请求
};

/**
 * 便捷函数：应用限流
 */
export async function applyRateLimit(
  userId: string,
  action: keyof typeof RateLimitConfig
): Promise<NextResponse | null> {
  const config = RateLimitConfig[action] || RateLimitConfig.default;
  return RateLimiter.middleware(userId, action, config.max, config.window);
}
