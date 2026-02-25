import { inspectionRepository } from "@/app/repositories/inspection.repository";
import { propertyRepository } from "@/app/repositories/property.repository";

/**
 * Service Layer - Inspection Service
 * 职责：处理业务逻辑、权限验证、数据验证
 */
export class InspectionService {
  /**
   * 获取用户的 Inspection 列表
   * 业务逻辑：Agent 看所有管理房产的查房，Tenant 看自己的查房
   */
  async getInspectionsByUser(userId: string, role: string) {
    if (role === "AGENT") {
      // Agent: 获取所有管理房产的查房
      return await inspectionRepository.findByAgentId(userId);
    } else if (role === "TENANT") {
      // Tenant: 获取自己的查房
      return await inspectionRepository.findByTenantId(userId);
    }

    return [];
  }

  /**
   * 根据 ID 获取单个 Inspection
   */
  async getInspectionById(inspectionId: string, userId: string, role: string) {
    const inspection = await inspectionRepository.findById(inspectionId, {
      property: {
        include: {
          agent: {
            select: { id: true, name: true, email: true, phone: true },
          },
        },
      },
      tenant: {
        select: { id: true, name: true, email: true, phone: true },
      },
    });

    if (!inspection) {
      throw new Error("Inspection not found");
    }

    // 权限检查
    this.checkInspectionAccess(inspection, userId, role);

    return inspection;
  }

  /**
   * 创建 Inspection（仅 Agent）
   */
  async createInspection(
    userId: string,
    role: string,
    data: {
      propertyId: string;
      availableDates: string[]; // ISO date strings
      notes?: string;
    }
  ) {
    // 业务规则：只有 Agent 可以创建 Inspection
    if (role !== "AGENT") {
      throw new Error("Only agents can create inspections");
    }

    // 数据验证
    if (!data.propertyId || !data.availableDates || data.availableDates.length === 0) {
      throw new Error("Property ID and available dates are required");
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

    // 转换日期字符串为 Date 对象
    const availableDates = data.availableDates.map((date) => new Date(date));

    // 验证日期是否都在未来
    const now = new Date();
    const invalidDates = availableDates.filter((date) => date <= now);
    if (invalidDates.length > 0) {
      throw new Error("All available dates must be in the future");
    }

    // 创建 Inspection
    return await inspectionRepository.create({
      property: {
        connect: { id: property.id },
      },
      tenant: {
        connect: { id: property.tenantId },
      },
      availableDates,
      notes: data.notes,
      status: "PENDING_SCHEDULE",
    });
  }

  /**
   * 租户选择查房时间
   */
  async scheduleInspection(
    inspectionId: string,
    userId: string,
    role: string,
    selectedDate: string
  ) {
    // 业务规则：只有 Tenant 可以选择时间
    if (role !== "TENANT") {
      throw new Error("Only tenants can schedule inspections");
    }

    // 获取 Inspection 并检查权限
    const inspection = await inspectionRepository.findById(inspectionId);

    if (!inspection) {
      throw new Error("Inspection not found");
    }

    if (inspection.tenantId !== userId) {
      throw new Error("You don't have access to this inspection");
    }

    // 检查状态
    if (inspection.status !== "PENDING_SCHEDULE") {
      throw new Error("Inspection is not pending schedule");
    }

    // 验证选择的日期是否在可选日期列表中
    const selected = new Date(selectedDate);
    const isValidDate = inspection.availableDates.some((date) => {
      const availableDate = new Date(date);
      return (
        availableDate.getFullYear() === selected.getFullYear() &&
        availableDate.getMonth() === selected.getMonth() &&
        availableDate.getDate() === selected.getDate()
      );
    });

    if (!isValidDate) {
      throw new Error("Selected date is not in the available dates list");
    }

    // 更新 Inspection
    return await inspectionRepository.update(inspectionId, {
      scheduledDate: selected,
      status: "SCHEDULED",
    });
  }

  /**
   * 标记查房为已完成（仅 Agent）
   */
  async completeInspection(
    inspectionId: string,
    userId: string,
    role: string,
    notes?: string
  ) {
    // 业务规则：只有 Agent 可以标记完成
    if (role !== "AGENT") {
      throw new Error("Only agents can complete inspections");
    }

    // 获取 Inspection 并检查权限
    const inspection = await inspectionRepository.findById(inspectionId, {
      property: true,
    });

    if (!inspection) {
      throw new Error("Inspection not found");
    }

    if (inspection.property.agentId !== userId) {
      throw new Error("You don't have access to this inspection");
    }

    // 检查状态
    if (inspection.status !== "SCHEDULED") {
      throw new Error("Inspection must be scheduled before completion");
    }

    // 更新 Inspection
    return await inspectionRepository.update(inspectionId, {
      status: "COMPLETED",
      completedAt: new Date(),
      notes: notes || inspection.notes,
    });
  }

  /**
   * 取消查房
   */
  async cancelInspection(inspectionId: string, userId: string, role: string) {
    // 获取 Inspection 并检查权限
    const inspection = await inspectionRepository.findById(inspectionId, {
      property: true,
    });

    if (!inspection) {
      throw new Error("Inspection not found");
    }

    // 权限检查：Agent 或 Tenant 都可以取消
    if (role === "AGENT" && inspection.property.agentId !== userId) {
      throw new Error("You don't have access to this inspection");
    }

    if (role === "TENANT" && inspection.tenantId !== userId) {
      throw new Error("You don't have access to this inspection");
    }

    // 检查状态：已完成的不能取消
    if (inspection.status === "COMPLETED") {
      throw new Error("Cannot cancel a completed inspection");
    }

    // 更新 Inspection
    return await inspectionRepository.update(inspectionId, {
      status: "CANCELLED",
    });
  }

  /**
   * 删除查房记录（仅 Agent）
   */
  async deleteInspection(inspectionId: string, userId: string, role: string) {
    // 业务规则：只有 Agent 可以删除
    if (role !== "AGENT") {
      throw new Error("Only agents can delete inspections");
    }

    // 获取 Inspection 并检查权限
    const inspection = await inspectionRepository.findById(inspectionId, {
      property: true,
    });

    if (!inspection) {
      throw new Error("Inspection not found");
    }

    if (inspection.property.agentId !== userId) {
      throw new Error("You don't have access to this inspection");
    }

    // 删除 Inspection
    return await inspectionRepository.delete(inspectionId);
  }

  /**
   * 私有方法：检查用户是否有权限访问 Inspection
   */
  private checkInspectionAccess(inspection: any, userId: string, role: string) {
    if (role === "AGENT" && inspection.property.agentId !== userId) {
      throw new Error("You don't have access to this inspection");
    }

    if (role === "TENANT" && inspection.tenantId !== userId) {
      throw new Error("You don't have access to this inspection");
    }
  }
}

// 导出单例
export const inspectionService = new InspectionService();
