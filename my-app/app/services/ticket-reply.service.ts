import { ticketReplyRepository } from "@/app/repositories/ticket-reply.repository";
import { ticketRepository } from "@/app/repositories/ticket.repository";

/**
 * Service Layer - TicketReply Service
 * 职责：处理业务逻辑、权限验证、数据验证
 */
export class TicketReplyService {
  /**
   * 获取 Ticket 的所有回复
   */
  async getRepliesByTicketId(ticketId: string, userId: string, role: string) {
    // 先验证用户是否有权限访问这个 Ticket
    const ticket = await ticketRepository.findById(ticketId, {
      property: true,
    });

    if (!ticket) {
      throw new Error("Ticket not found");
    }

    // 权限检查
    if (role === "AGENT" && ticket.property.agentId !== userId) {
      throw new Error("You don't have access to this ticket");
    }

    if (role === "TENANT" && ticket.property.tenantId !== userId) {
      throw new Error("You don't have access to this ticket");
    }

    // 获取所有回复
    return await ticketReplyRepository.findByTicketId(ticketId);
  }

  /**
   * 创建回复
   */
  async createReply(
    ticketId: string,
    userId: string,
    role: string,
    content: string
  ) {
    // 数据验证
    if (!content || content.trim() === "") {
      throw new Error("Reply content cannot be empty");
    }

    if (content.length > 1000) {
      throw new Error("Reply content is too long (max 1000 characters)");
    }

    // 验证用户是否有权限访问这个 Ticket
    const ticket = await ticketRepository.findById(ticketId, {
      property: true,
    });

    if (!ticket) {
      throw new Error("Ticket not found");
    }

    // 权限检查
    if (role === "AGENT" && ticket.property.agentId !== userId) {
      throw new Error("You don't have access to this ticket");
    }

    if (role === "TENANT" && ticket.property.tenantId !== userId) {
      throw new Error("You don't have access to this ticket");
    }

    // 业务规则：不能回复已关闭的 Ticket
    if (ticket.status === "CLOSED") {
      throw new Error("Cannot reply to a closed ticket");
    }

    // 创建回复
    return await ticketReplyRepository.create({
      content: content.trim(),
      ticket: {
        connect: { id: ticketId },
      },
      user: {
        connect: { id: userId },
      },
    });
  }

  /**
   * 更新回复（仅限回复的作者）
   */
  async updateReply(
    replyId: string,
    userId: string,
    content: string
  ) {
    // 数据验证
    if (!content || content.trim() === "") {
      throw new Error("Reply content cannot be empty");
    }

    if (content.length > 1000) {
      throw new Error("Reply content is too long (max 1000 characters)");
    }

    // 获取回复
    const reply = await ticketReplyRepository.findById(replyId);

    if (!reply) {
      throw new Error("Reply not found");
    }

    // 权限检查：只有作者可以编辑自己的回复
    if (reply.userId !== userId) {
      throw new Error("You can only edit your own replies");
    }

    // 更新回复
    return await ticketReplyRepository.update(replyId, {
      content: content.trim(),
    });
  }

  /**
   * 删除回复（仅限回复的作者）
   */
  async deleteReply(replyId: string, userId: string) {
    // 获取回复
    const reply = await ticketReplyRepository.findById(replyId);

    if (!reply) {
      throw new Error("Reply not found");
    }

    // 权限检查：只有作者可以删除自己的回复
    if (reply.userId !== userId) {
      throw new Error("You can only delete your own replies");
    }

    // 删除回复
    return await ticketReplyRepository.delete(replyId);
  }
}

// 导出单例
export const ticketReplyService = new TicketReplyService();
