import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * Ticket 类型定义
 */
interface Ticket {
  id: string;
  title: string;
  description: string;
  isUrgent: boolean;
  status: "OPEN" | "IN_PROGRESS" | "DONE" | "CLOSED";
  createdAt: string;
  property: {
    id: string;
    title: string;
    address: string;
  };
}

interface TicketReply {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    role: string;
  };
}

/**
 * Query Keys
 * 统一管理查询键
 */
export const ticketKeys = {
  all: ["tickets"] as const,
  lists: () => [...ticketKeys.all, "list"] as const,
  list: (filters?: object) => [...ticketKeys.lists(), filters] as const,
  details: () => [...ticketKeys.all, "detail"] as const,
  detail: (id: string) => [...ticketKeys.details(), id] as const,
  replies: (id: string) => [...ticketKeys.detail(id), "replies"] as const,
};

/**
 * Hook: 获取 Tickets 列表
 */
export function useTickets() {
  return useQuery({
    queryKey: ticketKeys.lists(),
    queryFn: async () => {
      const res = await fetch("/api/tickets");
      if (!res.ok) {
        throw new Error("Failed to fetch tickets");
      }
      const data = await res.json();
      return data.tickets as Ticket[];
    },
    staleTime: 60 * 1000, // 1 分钟内认为数据新鲜
  });
}

/**
 * Hook: 获取单个 Ticket 的回复
 */
export function useTicketReplies(ticketId: string) {
  return useQuery({
    queryKey: ticketKeys.replies(ticketId),
    queryFn: async () => {
      const res = await fetch(`/api/tickets/${ticketId}/replies`);
      if (!res.ok) {
        throw new Error("Failed to fetch replies");
      }
      const data = await res.json();
      return data.replies as TicketReply[];
    },
    enabled: !!ticketId, // 只有当 ticketId 存在时才执行查询
  });
}

/**
 * Hook: 创建 Ticket（带乐观更新）
 */
export function useCreateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newTicket: {
      title: string;
      description: string;
      isUrgent: boolean;
    }) => {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTicket),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create ticket");
      }

      return res.json();
    },
    // 乐观更新：立即更新 UI
    onMutate: async (newTicket) => {
      // 取消所有正在进行的查询
      await queryClient.cancelQueries({ queryKey: ticketKeys.lists() });

      // 保存之前的数据（用于回滚）
      const previousTickets = queryClient.getQueryData(ticketKeys.lists());

      // 乐观更新：立即添加新 ticket 到列表
      queryClient.setQueryData(ticketKeys.lists(), (old: Ticket[] = []) => [
        {
          id: "temp-" + Date.now(),
          ...newTicket,
          status: "OPEN" as const,
          createdAt: new Date().toISOString(),
          property: {
            id: "temp",
            title: "Loading...",
            address: "",
          },
        },
        ...old,
      ]);

      return { previousTickets };
    },
    // 如果失败，回滚
    onError: (err, newTicket, context) => {
      if (context?.previousTickets) {
        queryClient.setQueryData(ticketKeys.lists(), context.previousTickets);
      }
    },
    // 成功后，重新获取最新数据
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
    },
  });
}

/**
 * Hook: 更新 Ticket 状态
 */
export function useUpdateTicketStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: string;
    }) => {
      const res = await fetch(`/api/tickets/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update ticket");
      }

      return res.json();
    },
    // 乐观更新
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ticketKeys.lists() });

      const previousTickets = queryClient.getQueryData(ticketKeys.lists());

      queryClient.setQueryData(ticketKeys.lists(), (old: Ticket[] = []) =>
        old.map((ticket) =>
          ticket.id === id ? { ...ticket, status: status as any } : ticket
        )
      );

      return { previousTickets };
    },
    onError: (err, variables, context) => {
      if (context?.previousTickets) {
        queryClient.setQueryData(ticketKeys.lists(), context.previousTickets);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
    },
  });
}

/**
 * Hook: 创建回复
 */
export function useCreateReply(ticketId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch(`/api/tickets/${ticketId}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to post reply");
      }

      return res.json();
    },
    onSuccess: () => {
      // 刷新回复列表
      queryClient.invalidateQueries({ queryKey: ticketKeys.replies(ticketId) });
    },
  });
}
