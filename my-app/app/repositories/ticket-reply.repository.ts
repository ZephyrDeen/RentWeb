import { prisma } from "@/app/lib/prisma";
import { Prisma } from "@/app/generated/prisma";

/**
 * Data Layer - TicketReply Repository
 * 职责：封装所有与 TicketReply 表的数据库交互
 */
export class TicketReplyRepository {
  /**
   * 根据条件查找多个 TicketReply
   */
  async findMany(
    where: Prisma.TicketReplyWhereInput,
    include?: Prisma.TicketReplyInclude,
    orderBy?: Prisma.TicketReplyOrderByWithRelationInput[]
  ) {
    return await prisma.ticketReply.findMany({
      where,
      include,
      orderBy,
    });
  }

  /**
   * 根据 ID 查找单个 TicketReply
   */
  async findById(id: string, include?: Prisma.TicketReplyInclude) {
    return await prisma.ticketReply.findUnique({
      where: { id },
      include,
    });
  }

  /**
   * 创建 TicketReply
   */
  async create(data: Prisma.TicketReplyCreateInput) {
    return await prisma.ticketReply.create({
      data,
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });
  }

  /**
   * 更新 TicketReply
   */
  async update(id: string, data: Prisma.TicketReplyUpdateInput) {
    return await prisma.ticketReply.update({
      where: { id },
      data,
    });
  }

  /**
   * 删除 TicketReply
   */
  async delete(id: string) {
    return await prisma.ticketReply.delete({
      where: { id },
    });
  }

  /**
   * 统计 TicketReply 数量
   */
  async count(where: Prisma.TicketReplyWhereInput) {
    return await prisma.ticketReply.count({
      where,
    });
  }

  /**
   * 根据 Ticket ID 查找所有回复
   */
  async findByTicketId(ticketId: string) {
    return await this.findMany(
      { ticketId },
      {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
      [{ createdAt: "asc" }] // 按时间升序排列
    );
  }
}

// 导出单例
export const ticketReplyRepository = new TicketReplyRepository();
