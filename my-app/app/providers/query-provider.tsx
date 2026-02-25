"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

/**
 * React Query Provider
 * 为整个应用提供 React Query 上下文
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  // 使用 useState 确保 QueryClient 只创建一次
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 数据保持新鲜的时间（1 分钟）
            staleTime: 60 * 1000,
            // 缓存时间（5 分钟）
            gcTime: 5 * 60 * 1000,
            // 失败后重试次数
            retry: 1,
            // 窗口重新获得焦点时不自动重新获取
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* 开发环境显示 React Query DevTools */}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
