import { invoiceRepository } from "@/app/repositories/invoice.repository";
import { propertyRepository } from "@/app/repositories/property.repository";

/**
 * Service Layer - Invoice Service
 * 职责：处理业务逻辑、权限验证、数据验证
 */
export class InvoiceService {
  /**
   * 获取用户的 Invoice 列表
   * 业务逻辑：Agent 看所有管理房产的账单，Tenant 看自己的账单
   */
  async getInvoicesByUser(userId: string, role: string) {
    if (role === "AGENT") {
      // Agent: 获取所有管理房产的账单
      return await invoiceRepository.findByAgentId(userId);
    } else if (role === "TENANT") {
      // Tenant: 获取自己的账单
      return await invoiceRepository.findByTenantId(userId);
    }

    return [];
  }

  /**
   * 根据 ID 获取单个 Invoice
   */
  async getInvoiceById(invoiceId: string, userId: string, role: string) {
    const invoice = await invoiceRepository.findById(invoiceId, {
      property: {
        include: {
          agent: {
            select: { id: true, name: true, email: true },
          },
        },
      },
      tenant: {
        select: { id: true, name: true, email: true },
      },
    });

    if (!invoice) {
      throw new Error("Invoice not found");
    }

    // 权限检查
    this.checkInvoiceAccess(invoice, userId, role);

    return invoice;
  }

  /**
   * 创建 Invoice（仅 Agent）
   */
  async createInvoice(
    userId: string,
    role: string,
    data: {
      propertyId: string;
      amount: number;
      dueDate: string;
      billingMonth: string;
    }
  ) {
    // 业务规则：只有 Agent 可以创建 Invoice
    if (role !== "AGENT") {
      throw new Error("Only agents can create invoices");
    }

    // 数据验证
    if (!data.propertyId || !data.amount || !data.dueDate || !data.billingMonth) {
      throw new Error("Property, amount, due date, and billing month are required");
    }

    // 检查房产是否存在并属于该 Agent
    const property = await propertyRepository.findById(data.propertyId);

    if (!property) {
      throw new Error("Property not found");
    }

    if (property.agentId !== userId) {
      throw new Error("You don't have access to this property");
    }

    if (!property.tenantId) {
      throw new Error("Property has no tenant assigned");
    }

    // 创建 Invoice
    return await invoiceRepository.create({
      amount: data.amount,
      dueDate: new Date(data.dueDate),
      billingMonth: new Date(data.billingMonth),
      tenant: {
        connect: { id: property.tenantId },
      },
      property: {
        connect: { id: property.id },
      },
    });
  }

  /**
   * 更新 Invoice（标记为已支付等）
   */
  async updateInvoice(
    invoiceId: string,
    userId: string,
    role: string,
    data: { status?: string; stripePaymentId?: string }
  ) {
    // 获取 Invoice 并检查权限
    const invoice = await invoiceRepository.findById(invoiceId, {
      property: true,
    });

    if (!invoice) {
      throw new Error("Invoice not found");
    }

    // 权限检查
    this.checkInvoiceAccess(invoice, userId, role);

    // 验证状态
    if (data.status) {
      const validStatuses = ["PENDING", "PAID", "OVERDUE"];
      if (!validStatuses.includes(data.status)) {
        throw new Error("Invalid status");
      }
    }

    // 构建更新数据
    const updateData: any = {};
    if (data.status) {
      updateData.status = data.status;
      // 如果标记为已支付，记录支付时间
      if (data.status === "PAID") {
        updateData.paidAt = new Date();
      }
    }
    if (data.stripePaymentId) {
      updateData.stripePaymentId = data.stripePaymentId;
    }

    // 更新 Invoice
    return await invoiceRepository.update(invoiceId, updateData);
  }

  /**
   * 删除 Invoice（仅 Agent）
   */
  async deleteInvoice(invoiceId: string, userId: string, role: string) {
    // 业务规则：只有 Agent 可以删除 Invoice
    if (role !== "AGENT") {
      throw new Error("Only agents can delete invoices");
    }

    // 获取 Invoice 并检查权限
    const invoice = await invoiceRepository.findById(invoiceId, {
      property: true,
    });

    if (!invoice) {
      throw new Error("Invoice not found");
    }

    if (invoice.property.agentId !== userId) {
      throw new Error("You don't have access to this invoice");
    }

    // 业务规则：不允许删除已支付的账单
    if (invoice.status === "PAID") {
      throw new Error("Cannot delete a paid invoice");
    }

    // 删除 Invoice
    return await invoiceRepository.delete(invoiceId);
  }

  /**
   * 标记 Invoice 为已支付（通过 Stripe Webhook 调用）
   */
  async markInvoiceAsPaid(invoiceId: string, stripePaymentId: string) {
    return await invoiceRepository.update(invoiceId, {
      status: "PAID",
      paidAt: new Date(),
      stripePaymentId,
    });
  }

  /**
   * 私有方法：检查用户是否有权限访问 Invoice
   */
  private checkInvoiceAccess(invoice: any, userId: string, role: string) {
    if (role === "AGENT" && invoice.property.agentId !== userId) {
      throw new Error("You don't have access to this invoice");
    }

    if (role === "TENANT" && invoice.tenantId !== userId) {
      throw new Error("You don't have access to this invoice");
    }
  }
}

// 导出单例
export const invoiceService = new InvoiceService();
