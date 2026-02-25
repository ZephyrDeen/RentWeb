import { ticketRepository } from "@/app/repositories/ticket.repository";
import { prisma } from "@/app/lib/prisma";
import { CacheService, CacheKeys, CacheTTL } from "@/app/lib/cache";

/**
 * Service Layer - Ticket Service
 * 职责：处理业务逻辑、权限验证、数据验证
 * 集成 Redis 缓存优化性能
 */
export class TicketService {
  /**
   * 获取用户的 Ticket 列表（支持分页 + Redis 缓存）
   * 业务逻辑：Agent 看所有管理房产的 Ticket，Tenant 看自己房产的 Ticket
   */
  async getTicketsByUser(
    userId: string,
    role: string,
    options?: { page?: number; pageSize?: number }
  ) {
    const page = options?.page || 1;
    const pageSize = options?.pageSize || 10;
    const skip = (page - 1) * pageSize;

    // 生成缓存键（包含分页信息）
    const cacheKey = `${CacheKeys.ticketsList(userId, role)}:p${page}:s${pageSize}`;

    // 尝试从缓存获取
    const result = await CacheService.getOrSet(
      cacheKey,
      async () => {
        if (role === "AGENT") {
          // Agent: 获取所有管理房产的工单
          const tickets = await ticketRepository.findByAgentId(userId, skip, pageSize);
          const total = await ticketRepository.countByAgentId(userId);
          
          return {
            data: tickets,
            pagination: {
              page,
              pageSize,
              total,
              totalPages: Math.ceil(total / pageSize),
            },
          };
        } else if (role === "TENANT") {
          // Tenant: 先找到租户的房产，再获取该房产的工单
          const property = await prisma.property.findFirst({
            where: { tenantId: userId },
          });

          if (!property) {
            return {
              data: [],
              pagination: { page, pageSize, total: 0, totalPages: 0 },
            };
          }

          const tickets = await ticketRepository.findByPropertyId(property.id, skip, pageSize);
          const total = await ticketRepository.countByPropertyId(property.id);

          return {
            data: tickets,
            pagination: {
              page,
              pageSize,
              total,
              totalPages: Math.ceil(total / pageSize),
            },
          };
        }

        return {
          data: [],
          pagination: { page, pageSize, total: 0, totalPages: 0 },
        };
      },
      CacheTTL.SHORT // 1 分钟缓存
    );

    return result || { data: [], pagination: { page, pageSize, total: 0, totalPages: 0 } };
  }

  /**
   * 根据 ID 获取单个 Ticket
   */
  async getTicketById(ticketId: string, userId: string, role: string) {
    const ticket = await ticketRepository.findById(ticketId, {
      property: {
        include: {
          agent: {
            select: { id: true, name: true, email: true },
          },
          tenant: {
            select: { id: true, name: true, email: true },
          },
        },
      },
    });

    if (!ticket) {
      throw new Error("Ticket not found");
    }

    // 权限检查
    this.checkTicketAccess(ticket, userId, role);

    return ticket;
  }

  /**
   * 创建 Ticket（仅 Tenant）
   */
  async createTicket(
    userId: string,
    role: string,
    data: { title: string; description: string; isUrgent?: boolean }
  ) {
    // 业务规则：只有 Tenant 可以创建 Ticket
    if (role !== "TENANT") {
      throw new Error("Only tenants can create tickets");
    }

    // 数据验证
    if (!data.title || !data.description) {
      throw new Error("Title and description are required");
    }

    // 获取租户的房产
    const property = await prisma.property.findFirst({
      where: { tenantId: userId },
    });

    if (!property) {
      throw new Error("You don't have a rented property");
    }

    // 创建 Ticket
    const ticket = await ticketRepository.create({
      title: data.title,
      description: data.description,
      isUrgent: data.isUrgent || false,
      photos: [],
      property: {
        connect: { id: property.id },
      },
    });

    // 清除缓存（租户和对应中介的缓存）
    await this.invalidateTicketCache(userId, "TENANT");
    await this.invalidateTicketCache(property.agentId, "AGENT");

    return ticket;
  }

  /**
   * 更新 Ticket 状态（仅 Agent）
   */
  async updateTicketStatus(
    ticketId: string,
    userId: string,
    role: string,
    status: string
  ) {
    // 业务规则：只有 Agent 可以更新状态
    if (role !== "AGENT") {
      throw new Error("Only agents can update tickets");
    }

    // 获取 Ticket 并检查权限
    const ticket = await ticketRepository.findById(ticketId, {
      property: true,
    });

    if (!ticket) {
      throw new Error("Ticket not found");
    }

    if (ticket.property.agentId !== userId) {
      throw new Error("You don't have access to this ticket");
    }

    // 验证状态
    const validStatuses = ["OPEN", "IN_PROGRESS", "DONE", "CLOSED"];
    if (!validStatuses.includes(status)) {
      throw new Error("Invalid status");
    }

    // 更新状态
    const updatedTicket = await ticketRepository.update(ticketId, {
      status: status as any,
    });

    // 清除缓存（租户和对应中介的缓存）
    await this.invalidateTicketCache(userId, role);
    if (ticket.property.tenantId) {
      const otherRole = role === "AGENT" ? "TENANT" : "AGENT";
      const otherId = role === "AGENT" ? ticket.property.tenantId : ticket.property.agentId;
      await this.invalidateTicketCache(otherId, otherRole);
    }

    return updatedTicket;
  }

  /**
   * 删除 Ticket（仅 Agent）
   */
  async deleteTicket(ticketId: string, userId: string, role: string) {
    // 业务规则：只有 Agent 可以删除 Ticket
    if (role !== "AGENT") {
      throw new Error("Only agents can delete tickets");
    }

    // 获取 Ticket 并检查权限
    const ticket = await ticketRepository.findById(ticketId, {
      property: true,
    });

    if (!ticket) {
      throw new Error("Ticket not found");
    }

    if (ticket.property.agentId !== userId) {
      throw new Error("You don't have access to this ticket");
    }

    // 删除 Ticket
    await ticketRepository.delete(ticketId);

    // 清除缓存
    await this.invalidateTicketCache(userId, role);
    if (ticket.property.tenantId) {
      await this.invalidateTicketCache(ticket.property.tenantId, "TENANT");
    }
  }

  /**
   * 私有方法：检查用户是否有权限访问 Ticket
   */
  private checkTicketAccess(ticket: any, userId: string, role: string) {
    if (role === "AGENT" && ticket.property.agentId !== userId) {
      throw new Error("You don't have access to this ticket");
    }

    if (role === "TENANT" && ticket.property.tenantId !== userId) {
      throw new Error("You don't have access to this ticket");
    }
  }

  /**
   * 私有方法：清除用户的 Ticket 缓存
   */
  private async invalidateTicketCache(userId: string, role: string) {
    try {
      // 删除该用户所有分页的缓存
      const pattern = `${CacheKeys.ticketsList(userId, role)}:*`;
      await CacheService.delPattern(pattern);
      console.log(`🗑️  Invalidated ticket cache for ${role} ${userId}`);
    } catch (error) {
      console.error("Failed to invalidate ticket cache:", error);
    }
  }
}

// 导出单例
export const ticketService = new TicketService();
