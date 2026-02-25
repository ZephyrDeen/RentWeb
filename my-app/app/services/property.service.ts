import { propertyRepository } from "@/app/repositories/property.repository";

/**
 * Service Layer - Property Service
 * 职责：处理业务逻辑、权限验证、数据验证
 */
export class PropertyService {
  /**
   * 获取用户的 Property 列表
   * 业务逻辑：Agent 看所有管理的房产，Tenant 看自己租的房产
   */
  async getPropertiesByUser(userId: string, role: string) {
    if (role === "AGENT") {
      // Agent: 获取所有管理的房产
      return await propertyRepository.findByAgentId(userId);
    } else if (role === "TENANT") {
      // Tenant: 获取自己租的房产
      const property = await propertyRepository.findByTenantId(userId);
      return property;
    }

    return null;
  }

  /**
   * 根据 ID 获取单个 Property
   */
  async getPropertyById(propertyId: string, userId: string, role: string) {
    const property = await propertyRepository.findById(propertyId, {
      agent: {
        select: { id: true, name: true, email: true, phone: true },
      },
      tenant: {
        select: { id: true, name: true, email: true, phone: true },
      },
    });

    if (!property) {
      throw new Error("Property not found");
    }

    // 权限检查
    this.checkPropertyAccess(property, userId, role);

    return property;
  }

  /**
   * 创建 Property（仅 Agent）
   */
  async createProperty(
    userId: string,
    role: string,
    data: { title: string; address: string; rent: number }
  ) {
    // 业务规则：只有 Agent 可以创建 Property
    if (role !== "AGENT") {
      throw new Error("Only agents can add properties");
    }

    // 数据验证
    if (!data.title || !data.address || data.rent === undefined) {
      throw new Error("Title, address, and rent are required");
    }

    if (isNaN(data.rent) || data.rent <= 0) {
      throw new Error("Rent must be a positive number");
    }

    // 创建 Property
    return await propertyRepository.create({
      title: data.title,
      address: data.address,
      rent: data.rent,
      agent: {
        connect: { id: userId },
      },
    });
  }

  /**
   * 更新 Property（仅 Agent，且必须是该房产的管理者）
   */
  async updateProperty(
    propertyId: string,
    userId: string,
    role: string,
    data: { title?: string; address?: string; rent?: number; tenantId?: string | null }
  ) {
    // 业务规则：只有 Agent 可以更新 Property
    if (role !== "AGENT") {
      throw new Error("Only agents can update properties");
    }

    // 检查房产是否存在并验证权限
    const property = await propertyRepository.findById(propertyId);

    if (!property) {
      throw new Error("Property not found");
    }

    if (property.agentId !== userId) {
      throw new Error("You don't have access to this property");
    }

    // 构建更新数据
    const updateData: any = {};
    if (data.title) updateData.title = data.title;
    if (data.address) updateData.address = data.address;
    if (data.rent !== undefined) updateData.rent = data.rent;
    if (data.tenantId !== undefined) {
      updateData.tenantId = data.tenantId || null;
    }

    // 更新 Property
    return await propertyRepository.update(propertyId, updateData);
  }

  /**
   * 删除 Property（仅 Agent）
   */
  async deleteProperty(propertyId: string, userId: string, role: string) {
    // 业务规则：只有 Agent 可以删除 Property
    if (role !== "AGENT") {
      throw new Error("Only agents can delete properties");
    }

    // 检查房产是否存在并验证权限
    const property = await propertyRepository.findById(propertyId);

    if (!property) {
      throw new Error("Property not found");
    }

    if (property.agentId !== userId) {
      throw new Error("You don't have access to this property");
    }

    // 删除 Property
    return await propertyRepository.delete(propertyId);
  }

  /**
   * 私有方法：检查用户是否有权限访问 Property
   */
  private checkPropertyAccess(property: any, userId: string, role: string) {
    if (role === "AGENT" && property.agentId !== userId) {
      throw new Error("You don't have access to this property");
    }

    if (role === "TENANT" && property.tenantId !== userId) {
      throw new Error("You don't have access to this property");
    }
  }
}

// 导出单例
export const propertyService = new PropertyService();
