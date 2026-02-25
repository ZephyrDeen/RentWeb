import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * Invitation 类型定义
 */
interface Invitation {
  id: string;
  email: string;
  token: string;
  propertyId: string;
  agentId: string;
  status: "PENDING" | "ACCEPTED" | "EXPIRED";
  expiresAt: string;
  createdAt: string;
  property?: {
    id: string;
    title: string;
    address: string;
    rent: number;
  };
  agent?: {
    id: string;
    name: string;
    email: string;
  };
}

/**
 * Query Keys
 */
export const invitationKeys = {
  all: ["invitations"] as const,
  lists: () => [...invitationKeys.all, "list"] as const,
  detail: (token: string) => [...invitationKeys.all, token] as const,
};

/**
 * Hook: 获取 Invitations 列表（Agent 查看自己发出的邀请）
 */
export function useInvitations() {
  return useQuery({
    queryKey: invitationKeys.lists(),
    queryFn: async () => {
      const res = await fetch("/api/invitations");
      if (!res.ok) {
        throw new Error("Failed to fetch invitations");
      }
      const data = await res.json();
      return (data.invitations || []) as Invitation[];
    },
    staleTime: 60 * 1000, // 1 分钟
  });
}

/**
 * Hook: 验证邀请 token（租户注册时使用）
 */
export function useVerifyInvitation(token: string) {
  return useQuery({
    queryKey: invitationKeys.detail(token),
    queryFn: async () => {
      const res = await fetch(`/api/invitations?token=${token}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Invalid invitation");
      }
      return res.json();
    },
    enabled: !!token,
    retry: false, // 不重试，因为无效 token 不会变有效
    staleTime: 5 * 60 * 1000, // 5 分钟
  });
}

/**
 * Hook: 创建邀请
 */
export function useCreateInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      email: string;
      agentId: string;
      propertyId: string;
    }) => {
      const res = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create invitation");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invitationKeys.lists() });
    },
  });
}

/**
 * Hook: 重新发送邀请
 */
export function useResendInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      const res = await fetch(`/api/invitations/${invitationId}/resend`, {
        method: "POST",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to resend invitation");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invitationKeys.lists() });
    },
  });
}

/**
 * Hook: 取消邀请
 */
export function useCancelInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      const res = await fetch(`/api/invitations/${invitationId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to cancel invitation");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invitationKeys.lists() });
    },
  });
}
