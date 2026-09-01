// app/providers.tsx
"use client";

import { WalletContextProvider } from "@/app/components/solana/wallet-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* اگر provider دیگری مثل ThemeProvider یا NextAuth دارید، اینجا اضافه کنید */}
      <WalletContextProvider>
        {children}
      </WalletContextProvider>
    </>
  );
}