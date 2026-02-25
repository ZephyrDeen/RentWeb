import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * Property 类型定义
 */
interface Property {
  id: string;
  title: string;
  address: string;
  rent: number;
  agentId: string;
  tenantId: string | null;
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
  createdAt: string;
  updatedAt: string;
}

/**
 * Query Keys
 */
export const propertyKeys = {
  all: ["properties"] as const,
  lists: () => [...propertyKeys.all, "list"] as const,
  detail: (id: string) => [...propertyKeys.all, id] as const,
};

/**
 * Hook: 获取 Properties 列表
 */
export function useProperties() {
  return useQuery({
    queryKey: propertyKeys.lists(),
    queryFn: async () => {
      const res = await fetch("/api/properties");
      if (!res.ok) {
        throw new Error("Failed to fetch properties");
      }
      const data = await res.json();
      return (data.properties || []) as Property[];
    },
    staleTime: 60 * 1000, // 1 分钟
  });
}

/**
 * Hook: 获取单个 Property
 */
export function useProperty(id: string) {
  return useQuery({
    queryKey: propertyKeys.detail(id),
    queryFn: async () => {
      const res = await fetch(`/api/properties/${id}`);
      if (!res.ok) {
        throw new Error("Failed to fetch property");
      }
      const data = await res.json();
      return data.property as Property;
    },
    enabled: !!id,
    staleTime: 60 * 1000,
  });
}

/**
 * Hook: 创建 Property
 */
export function useCreateProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newProperty: {
      title: string;
      address: string;
      rent: number;
      tenantId?: string;
    }) => {
      const res = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProperty),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create property");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.lists() });
    },
  });
}

/**
 * Hook: 更新 Property
 */
export function useUpdateProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Property>;
    }) => {
      const res = await fetch(`/api/properties/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update property");
      }

      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.lists() });
      queryClient.invalidateQueries({ queryKey: propertyKeys.detail(variables.id) });
    },
  });
}

/**
 * Hook: 删除 Property
 */
export function useDeleteProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/properties/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete property");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.lists() });
    },
  });
}
