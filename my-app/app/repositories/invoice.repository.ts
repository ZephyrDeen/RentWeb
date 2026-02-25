import { prisma } from "@/app/lib/prisma";
import { Prisma } from "@/app/generated/prisma";

/**
 * Data Layer - Invoice Repository
 * 职责：封装所有与 Invoice 表的数据库交互
 */
export class InvoiceRepository {
  /**
   * 根据条件查找多个 Invoice
   */
  async findMany(where: Prisma.InvoiceWhereInput, include?: Prisma.InvoiceInclude, orderBy?: Prisma.InvoiceOrderByWithRelationInput[]) {
    return await prisma.invoice.findMany({
      where,
      include,
      orderBy,
    });
  }

  /**
   * 根据 ID 查找单个 Invoice
   */
  async findById(id: string, include?: Prisma.InvoiceInclude) {
    return await prisma.invoice.findUnique({
      where: { id },
      include,
    });
  }

  /**
   * 创建 Invoice
   */
  async create(data: Prisma.InvoiceCreateInput) {
    return await prisma.invoice.create({
      data,
    });
  }

  /**
   * 更新 Invoice
   */
  async update(id: string, data: Prisma.InvoiceUpdateInput) {
    return await prisma.invoice.update({
      where: { id },
      data,
    });
  }

  /**
   * 删除 Invoice
   */
  async delete(id: string) {
    return await prisma.invoice.delete({
      where: { id },
    });
  }

  /**
   * 统计 Invoice 数量
   */
  async count(where: Prisma.InvoiceWhereInput) {
    return await prisma.invoice.count({
      where,
    });
  }

  /**
   * 根据 Agent ID 查找所有管理房产的账单
   */
  async findByAgentId(agentId: string) {
    return await this.findMany(
      {
        property: {
          agentId,
        },
      },
      {
        property: {
          select: { id: true, title: true, address: true },
        },
        tenant: {
          select: { id: true, name: true, email: true },
        },
      },
      [{ dueDate: "desc" }]
    );
  }

  /**
   * 根据 Tenant ID 查找租户的账单
   */
  async findByTenantId(tenantId: string) {
    return await this.findMany(
      { tenantId },
      {
        property: {
          select: { id: true, title: true, address: true },
        },
      },
      [{ dueDate: "desc" }]
    );
  }
}

// 导出单例
export const invoiceRepository = new InvoiceRepository();
