import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * Invoice 类型定义
 */
interface Invoice {
  id: string;
  propertyId: string;
  tenantId: string;
  amount: number;
  billingMonth: string;
  dueDate: string;
  status: "PENDING" | "PAID" | "OVERDUE";
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  property?: {
    id: string;
    title: string;
    address: string;
  };
  tenant?: {
    id: string;
    name: string;
    email: string;
  };
}

/**
 * Query Keys
 */
export const invoiceKeys = {
  all: ["invoices"] as const,
  lists: () => [...invoiceKeys.all, "list"] as const,
  detail: (id: string) => [...invoiceKeys.all, id] as const,
};

/**
 * Hook: 获取 Invoices 列表
 */
export function useInvoices() {
  return useQuery({
    queryKey: invoiceKeys.lists(),
    queryFn: async () => {
      const res = await fetch("/api/invoices");
      if (!res.ok) {
        throw new Error("Failed to fetch invoices");
      }
      const data = await res.json();
      return (data.invoices || []) as Invoice[];
    },
    staleTime: 60 * 1000, // 1 分钟
  });
}

/**
 * Hook: 获取单个 Invoice
 */
export function useInvoice(id: string) {
  return useQuery({
    queryKey: invoiceKeys.detail(id),
    queryFn: async () => {
      const res = await fetch(`/api/invoices/${id}`);
      if (!res.ok) {
        throw new Error("Failed to fetch invoice");
      }
      const data = await res.json();
      return data.invoice as Invoice;
    },
    enabled: !!id,
    staleTime: 60 * 1000,
  });
}

/**
 * Hook: 创建 Invoice
 */
export function useCreateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newInvoice: {
      propertyId: string;
      tenantId: string;
      amount: number;
      billingMonth: string;
      dueDate: string;
    }) => {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newInvoice),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create invoice");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
    },
  });
}

/**
 * Hook: 更新 Invoice 状态
 */
export function useUpdateInvoiceStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: "PENDING" | "PAID" | "OVERDUE";
    }) => {
      const res = await fetch(`/api/invoices/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update invoice");
      }

      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(variables.id) });
    },
  });
}

/**
 * Hook: 删除 Invoice
 */
export function useDeleteInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/invoices/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete invoice");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
    },
  });
}
