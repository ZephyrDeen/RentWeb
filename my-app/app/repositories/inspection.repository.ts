import { prisma } from "@/app/lib/prisma";
import { Prisma } from "@/app/generated/prisma";

/**
 * Data Layer - Inspection Repository
 * 职责：封装所有与 Inspection 表的数据库交互
 */
export class InspectionRepository {
  /**
   * 根据条件查找多个 Inspection
   */
  async findMany(
    where: Prisma.InspectionWhereInput,
    include?: Prisma.InspectionInclude,
    orderBy?: Prisma.InspectionOrderByWithRelationInput[]
  ) {
    return await prisma.inspection.findMany({
      where,
      include,
      orderBy,
    });
  }

  /**
   * 根据 ID 查找单个 Inspection
   */
  async findById(id: string, include?: Prisma.InspectionInclude) {
    return await prisma.inspection.findUnique({
      where: { id },
      include,
    });
  }

  /**
   * 创建 Inspection
   */
  async create(data: Prisma.InspectionCreateInput) {
    return await prisma.inspection.create({
      data,
    });
  }

  /**
   * 更新 Inspection
   */
  async update(id: string, data: Prisma.InspectionUpdateInput) {
    return await prisma.inspection.update({
      where: { id },
      data,
    });
  }

  /**
   * 删除 Inspection
   */
  async delete(id: string) {
    return await prisma.inspection.delete({
      where: { id },
    });
  }

  /**
   * 统计 Inspection 数量
   */
  async count(where: Prisma.InspectionWhereInput) {
    return await prisma.inspection.count({
      where,
    });
  }

  /**
   * 根据 Agent ID 查找所有管理房产的查房记录
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
          select: { id: true, name: true, email: true, phone: true },
        },
      },
      [{ createdAt: "desc" }]
    );
  }

  /**
   * 根据 Tenant ID 查找租户的查房记录
   */
  async findByTenantId(tenantId: string) {
    return await this.findMany(
      { tenantId },
      {
        property: {
          select: { id: true, title: true, address: true },
        },
      },
      [{ createdAt: "desc" }]
    );
  }

  /**
   * 根据 Property ID 查找该房产的查房记录
   */
  async findByPropertyId(propertyId: string) {
    return await this.findMany(
      { propertyId },
      {
        tenant: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
      [{ createdAt: "desc" }]
    );
  }
}

// 导出单例
export const inspectionRepository = new InspectionRepository();
