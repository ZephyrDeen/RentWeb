import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * Inspection 类型定义
 */
interface Inspection {
  id: string;
  propertyId: string;
  agentId: string;
  tenantId: string | null;
  availableDates: string[];
  scheduledDate: string | null;
  status: "PENDING_SCHEDULE" | "SCHEDULED" | "COMPLETED" | "CANCELLED";
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  property?: {
    id: string;
    title: string;
    address: string;
  };
  agent?: {
    id: string;
    name: string;
    email: string;
  };
  tenant?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

/**
 * Query Keys
 */
export const inspectionKeys = {
  all: ["inspections"] as const,
  lists: () => [...inspectionKeys.all, "list"] as const,
  detail: (id: string) => [...inspectionKeys.all, id] as const,
};

/**
 * Hook: 获取 Inspections 列表
 */
export function useInspections() {
  return useQuery({
    queryKey: inspectionKeys.lists(),
    queryFn: async () => {
      const res = await fetch("/api/inspections");
      if (!res.ok) {
        throw new Error("Failed to fetch inspections");
      }
      const data = await res.json();
      return (data.inspections || []) as Inspection[];
    },
    staleTime: 60 * 1000, // 1 分钟
  });
}

/**
 * Hook: 获取单个 Inspection
 */
export function useInspection(id: string) {
  return useQuery({
    queryKey: inspectionKeys.detail(id),
    queryFn: async () => {
      const res = await fetch(`/api/inspections/${id}`);
      if (!res.ok) {
        throw new Error("Failed to fetch inspection");
      }
      const data = await res.json();
      return data.inspection as Inspection;
    },
    enabled: !!id,
    staleTime: 60 * 1000,
  });
}

/**
 * Hook: 创建 Inspection
 */
export function useCreateInspection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newInspection: {
      propertyId: string;
      availableDates: string[];
      notes?: string;
    }) => {
      const res = await fetch("/api/inspections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newInspection),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create inspection");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inspectionKeys.lists() });
    },
  });
}

/**
 * Hook: 更新 Inspection（选择日期或更新状态）
 */
export function useUpdateInspection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: {
        scheduledDate?: string;
        status?: "PENDING_SCHEDULE" | "SCHEDULED" | "COMPLETED" | "CANCELLED";
        notes?: string;
      };
    }) => {
      const res = await fetch(`/api/inspections/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update inspection");
      }

      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: inspectionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: inspectionKeys.detail(variables.id) });
    },
  });
}

/**
 * Hook: 删除 Inspection
 */
export function useDeleteInspection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/inspections/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete inspection");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inspectionKeys.lists() });
    },
  });
}
