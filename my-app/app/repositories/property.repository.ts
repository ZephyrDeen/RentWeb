import { prisma } from "@/app/lib/prisma";
import { Prisma } from "@/app/generated/prisma";

/**
 * Data Layer - Property Repository
 * 职责：封装所有与 Property 表的数据库交互
 */
export class PropertyRepository {
  /**
   * 根据条件查找多个 Property
   */
  async findMany(where: Prisma.PropertyWhereInput, include?: Prisma.PropertyInclude, orderBy?: Prisma.PropertyOrderByWithRelationInput[]) {
    return await prisma.property.findMany({
      where,
      include,
      orderBy,
    });
  }

  /**
   * 根据 ID 查找单个 Property
   */
  async findById(id: string, include?: Prisma.PropertyInclude) {
    return await prisma.property.findUnique({
      where: { id },
      include,
    });
  }

  /**
   * 根据条件查找第一个 Property
   */
  async findFirst(where: Prisma.PropertyWhereInput, include?: Prisma.PropertyInclude) {
    return await prisma.property.findFirst({
      where,
      include,
    });
  }

  /**
   * 创建 Property
   */
  async create(data: Prisma.PropertyCreateInput) {
    return await prisma.property.create({
      data,
    });
  }

  /**
   * 更新 Property
   */
  async update(id: string, data: Prisma.PropertyUpdateInput) {
    return await prisma.property.update({
      where: { id },
      data,
    });
  }

  /**
   * 删除 Property
   */
  async delete(id: string) {
    return await prisma.property.delete({
      where: { id },
    });
  }

  /**
   * 统计 Property 数量
   */
  async count(where: Prisma.PropertyWhereInput) {
    return await prisma.property.count({
      where,
    });
  }

  /**
   * 根据 Agent ID 查找所有管理的房产
   */
  async findByAgentId(agentId: string) {
    return await this.findMany(
      { agentId },
      {
        tenant: {
          select: { id: true, name: true, email: true },
        },
      },
      [{ createdAt: "desc" }]
    );
  }

  /**
   * 根据 Tenant ID 查找租户的房产
   */
  async findByTenantId(tenantId: string) {
    return await this.findFirst(
      { tenantId },
      {
        agent: {
          select: { id: true, name: true, email: true, phone: true },
        },
      }
    );
  }
}

// 导出单例
export const propertyRepository = new PropertyRepository();
