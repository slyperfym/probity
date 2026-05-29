"use client";

import { darkTheme, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as React from "react";
import { WagmiProvider } from "wagmi";

import { ThemeProvider } from "@/components/theme/theme-provider";
import { wagmiConfig } from "@/config/wagmi";
import { probityChain } from "@/config/chains";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 10_000
          }
        }
      })
  );

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          initialChain={probityChain}
          modalSize="compact"
          showRecentTransactions
          theme={darkTheme({
            accentColor: "#22d3ee",
            accentColorForeground: "#020617",
            borderRadius: "small",
            fontStack: "system"
          })}
        >
          <ThemeProvider>{children}</ThemeProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
