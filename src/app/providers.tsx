"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { ToastViewport } from "../components/shared/ToastViewport";

export type ProvidersProps = {
  children: ReactNode;
};

export const Providers = ({ children }: ProvidersProps): JSX.Element => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            gcTime: 10 * 60_000,
            placeholderData: (previousData: unknown) => previousData,
            retry: 1,
            refetchOnWindowFocus: false,
            staleTime: 60_000,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ToastViewport />
    </QueryClientProvider>
  );
};
