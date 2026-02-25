import { prisma } from "@/app/lib/prisma";
import { Prisma } from "@/app/generated/prisma";

/**
 * Data Layer - Ticket Repository
 * 职责：封装所有与 Ticket 表的数据库交互
 * 不包含业务逻辑，只负责 CRUD 操作
 */
export class TicketRepository {
  /**
   * 根据条件查找多个 Ticket
   */
  async findMany(where: Prisma.TicketWhereInput, include?: Prisma.TicketInclude, orderBy?: Prisma.TicketOrderByWithRelationInput[]) {
    return await prisma.ticket.findMany({
      where,
      include,
      orderBy,
    });
  }

  /**
   * 根据 ID 查找单个 Ticket
   */
  async findById(id: string, include?: Prisma.TicketInclude) {
    return await prisma.ticket.findUnique({
      where: { id },
      include,
    });
  }

  /**
   * 根据条件查找第一个 Ticket
   */
  async findFirst(where: Prisma.TicketWhereInput, include?: Prisma.TicketInclude) {
    return await prisma.ticket.findFirst({
      where,
      include,
    });
  }

  /**
   * 创建 Ticket
   */
  async create(data: Prisma.TicketCreateInput) {
    return await prisma.ticket.create({
      data,
    });
  }

  /**
   * 更新 Ticket
   */
  async update(id: string, data: Prisma.TicketUpdateInput) {
    return await prisma.ticket.update({
      where: { id },
      data,
    });
  }

  /**
   * 删除 Ticket
   */
  async delete(id: string) {
    return await prisma.ticket.delete({
      where: { id },
    });
  }

  /**
   * 统计 Ticket 数量
   */
  async count(where: Prisma.TicketWhereInput) {
    return await prisma.ticket.count({
      where,
    });
  }

  /**
   * 根据 Property ID 查找所有 Ticket（支持分页）
   */
  async findByPropertyId(propertyId: string, skip: number = 0, take: number = 10) {
    return await prisma.ticket.findMany({
      where: { propertyId },
      include: {
        property: {
          select: { id: true, title: true, address: true },
        },
      },
      orderBy: [{ createdAt: "desc" }],
      skip,
      take,
    });
  }

  /**
   * 统计某个 Property 的 Ticket 数量
   */
  async countByPropertyId(propertyId: string) {
    return await this.count({ propertyId });
  }

  /**
   * 根据 Agent ID 查找所有管理房产的 Ticket（支持分页）
   */
  async findByAgentId(agentId: string, skip: number = 0, take: number = 10) {
    return await prisma.ticket.findMany({
      where: {
        property: {
          agentId,
        },
      },
      include: {
        property: {
          select: { id: true, title: true, address: true },
        },
      },
      orderBy: [
        { isUrgent: "desc" },
        { createdAt: "desc" },
      ],
      skip,
      take,
    });
  }

  /**
   * 统计某个 Agent 管理的所有 Ticket 数量
   */
  async countByAgentId(agentId: string) {
    return await this.count({
      property: {
        agentId,
      },
    });
  }
}

// 导出单例
export const ticketRepository = new TicketRepository();
