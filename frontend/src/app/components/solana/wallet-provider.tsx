"use client";

import { useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";

// Import styles
import "@solana/wallet-adapter-react-ui/styles.css";

export function WalletContextProvider({ children }: { children: React.ReactNode }) {
  const endpoint = useMemo(() => clusterApiUrl("devnet"), []);

  // Phantom (and other installed wallets) self-register as Standard Wallets,
  // so they are auto-discovered. Passing an explicit PhantomWalletAdapter here
  // creates a duplicate registration and triggers a warning from the library.
  const wallets = useMemo(() => [], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
