import { WalletContextProvider } from "@/app/components/solana/wallet-provider";

export default function SolanaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <WalletContextProvider>{children}</WalletContextProvider>;
}
