"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import {
  Connection,
  clusterApiUrl,
  Transaction,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
  getAccount,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";

const TOKEN_MINT_RAW = (process.env.NEXT_PUBLIC_TOKEN_MINT ?? "").trim();
const SHOP_WALLET_RAW = (process.env.NEXT_PUBLIC_SHOP_WALLET ?? "").trim();
const IS_DEPLOYED = TOKEN_MINT_RAW.length > 0 && SHOP_WALLET_RAW.length > 0;
const TOKEN_MINT = IS_DEPLOYED ? new PublicKey(TOKEN_MINT_RAW) : null!;
const SHOP_WALLET = IS_DEPLOYED ? new PublicKey(SHOP_WALLET_RAW) : null!;
const DECIMALS = Number(process.env.NEXT_PUBLIC_TOKEN_DECIMALS ?? 9);
const DEVNET_RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_DEVNET_RPC_URL ?? clusterApiUrl("devnet");

import {
  TECH_USDT_RATE,
  techRawToLamports,
} from "../lib/pricing";

type Product = {
  id: string;
  name: string;
  emoji: string;
  price: number;
};

const PRODUCTS: Product[] = [
  { id: "pen", name: "Ballpoint Pen", emoji: "🖊️", price: 0.5 },
  { id: "mug", name: "Coffee Mug", emoji: "☕", price: 2 },
  { id: "tshirt", name: "T-Shirt", emoji: "👕", price: 5 },
  { id: "headphones", name: "Headphones", emoji: "🎧", price: 15 },
  { id: "watch", name: "Smart Watch", emoji: "⌚", price: 25 },
];

const inputClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 disabled:opacity-50 disabled:cursor-not-allowed";

const buttonPrimary =
  "w-full rounded-lg py-2.5 text-sm font-semibold text-white shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

type TokenState = {
  mint: string;
  decimals: number;
  supplyRaw: string;
  shopBalanceRaw: string;
  mintAuthority: string | null;
};

type AdjustResult = {
  state: TokenState;
  txSignature: string | null;
  action: "mint" | "burn" | "none";
  amountRaw: string;
  target: string;
};

type LedgerLeg = {
  account: string;
  asset: "TECH" | "SOL";
  direction: "credit" | "debit";
  amountBaseUnits: string;
  txSignature: string | null;
};

type TransactionRecord = {
  id: string;
  timestamp: string;
  type: "BUY_PRODUCT" | "BUY_TECH" | "ADJUSTMENT";
  status: "submitted" | "verified" | "confirmed" | "finalized" | "failed";
  label: string;
  productId: string | null;
  productName: string | null;
  techBaseUnits: string | null;
  solLamports: string | null;
  exchangeRate: number | null;
  userWallet: string | null;
  solSignature: string | null;
  techSignature: string | null;
  detail: string;
  legs: LedgerLeg[];
};

async function fetchTokenState(): Promise<TokenState> {
  const res = await fetch("/api/solana/token-state");
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load token state");
  return data;
}

async function adjustSupply(supply: string): Promise<AdjustResult> {
  const res = await fetch("/api/solana/token-state", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ supply }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to adjust supply");
  return data;
}

async function adjustShopBalance(balance: string): Promise<AdjustResult> {
  const res = await fetch("/api/solana/token-state", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ shopBalance: balance }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to adjust shop balance");
  return data;
}

async function fetchTransactions(): Promise<TransactionRecord[]> {
  const res = await fetch("/api/solana/transactions");
  if (!res.ok) throw new Error("Failed to load transactions");
  return res.json();
}

async function addTransaction(
  tx: Omit<TransactionRecord, "id" | "timestamp">,
): Promise<TransactionRecord> {
  const res = await fetch("/api/solana/transactions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(tx),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to record transaction");
  return data;
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  if (isNaN(date.getTime())) return iso;
  return date.toLocaleString();
}

function rawToInput(raw: string, decimals: number): string {
  const big = BigInt(raw);
  const divisor = BigInt(10) ** BigInt(decimals);
  const intPart = big / divisor;
  const frac = (big % divisor)
    .toString()
    .padStart(decimals, "0")
    .replace(/0+$/, "");
  return frac ? `${intPart}.${frac}` : intPart.toString();
}

function formatRaw(raw: string, decimals: number): string {
  const big = BigInt(raw);
  const divisor = BigInt(10) ** BigInt(decimals);
  const intPart = big / divisor;
  const frac = (big % divisor)
    .toString()
    .padStart(decimals, "0")
    .replace(/0+$/, "");
  const intStr = intPart.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return frac ? `${intStr}.${frac}` : intStr;
}

function humanToBaseUnits(human: string, decimals: number): string {
  const cleaned = human.trim().replace(/,/g, "");
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return "0";
  const [intPart, fracPart = ""] = cleaned.split(".");
  const frac = fracPart.padEnd(decimals, "0").slice(0, decimals);
  return (
    BigInt(intPart) * BigInt(10) ** BigInt(decimals) + BigInt(frac || "0")
  ).toString();
}

function shorten(address: string, start = 6, end = 4): string {
  return address.length <= start + end
    ? address
    : `${address.slice(0, start)}...${address.slice(-end)}`;
}

function typeBadgeClass(type: string): string {
  if (type === "BUY_TECH") return "bg-blue-50 text-blue-700";
  if (type === "ADJUSTMENT") return "bg-amber-50 text-amber-700";
  return "bg-emerald-50 text-emerald-700";
}

function statusBadgeClass(status: string): string {
  if (status === "finalized" || status === "confirmed")
    return "bg-green-50 text-green-700";
  if (status === "failed") return "bg-red-50 text-red-700";
  return "bg-gray-100 text-gray-600";
}

function StatCard({
  icon,
  label,
  value,
  subtext,
}: {
  icon: string;
  label: string;
  value: string;
  subtext?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-2">
        <span className="text-base">{icon}</span>
        <p className="text-xs font-medium text-gray-500">{label}</p>
      </div>
      <p className="mt-2 truncate text-xl font-bold text-gray-900 sm:text-2xl">
        {value}
      </p>
      {subtext && <p className="mt-1 text-[11px] text-gray-400">{subtext}</p>}
    </div>
  );
}

export default function Home() {
  const {
    publicKey: adapterPublicKey,
    signTransaction,
  } = useWallet();
  const {
    publicKey: walletPublicKey,
    connected,
    disconnect,
    sendTransaction,
  } = useWallet();

  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product>(PRODUCTS[0]);
  const [price, setPrice] = useState(String(PRODUCTS[0].price));
  const [buyTechAmount, setBuyTechAmount] = useState("");
  const [techBalance, setTechBalance] = useState<number | null>(null);
  const [solUsdt, setSolUsdt] = useState<number | null>(null);
  const [refreshingPrice, setRefreshingPrice] = useState(false);

  const [tokenState, setTokenState] = useState<TokenState | null>(null);
  const [supplyDraft, setSupplyDraft] = useState("");
  const [shopBalanceDraft, setShopBalanceDraft] = useState("");
  const [isSavingSupply, setIsSavingSupply] = useState(false);
  const [isSavingShopBalance, setIsSavingShopBalance] = useState(false);

  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { setVisible: setWalletModalVisible } = useWalletModal();

  const connectWallet = () => {
    setWalletModalVisible(true);
  };

  const disconnectWallet = async () => {
    try {
      await disconnect();

      setPublicKey(null);
      setIsConnected(false);
      setTechBalance(null);
      setStatus("👋 Disconnected");
    } catch (error) {
      console.error("Disconnect error:", error);
    }
  };

  useEffect(() => {
    if (connected && walletPublicKey) {
      const address = walletPublicKey.toString();

      setPublicKey(address);
      setIsConnected(true);

      loadTechBalance(walletPublicKey);
    } else {
      setPublicKey(null);
      setIsConnected(false);
      setTechBalance(null);
    }
  }, [connected, walletPublicKey]);

  // ✅ بهتر error handling برای balance
  const loadTechBalance = async (wallet: PublicKey) => {
    try {
      console.log("📊 Checking TECH balance...");

      const connection = new Connection(DEVNET_RPC_URL, "confirmed");
      const userTokenAccount = await getAssociatedTokenAddress(
        TOKEN_MINT,
        wallet,
      );

      console.log("📝 User TECH Token Account:", userTokenAccount.toString());

      try {
        const account = await getAccount(connection, userTokenAccount);
        const balance = Number(account.amount) / 10 ** DECIMALS;

        console.log("💰 User TECH Balance:", balance);
        setTechBalance(balance);
      } catch (error) {
        console.log("ℹ️ User has no TECH token account yet.");
        setTechBalance(0);
      }
    } catch (error) {
      console.error("❌ Failed to load TECH balance:", error);
      setTechBalance(null);
    }
  };

  const loadTokenState = async () => {
    try {
      const state = await fetchTokenState();
      setTokenState(state);
      setSupplyDraft(rawToInput(state.supplyRaw, state.decimals));
      setShopBalanceDraft(rawToInput(state.shopBalanceRaw, state.decimals));
    } catch (error) {
      console.error("❌ Failed to load token state:", error);
      setStatus("❌ Failed to load on-chain token state");
    }
  };

  const loadTransactions = async () => {
    try {
      const list = await fetchTransactions();
      setTransactions(list);
    } catch (error) {
      console.error("❌ Failed to load transactions:", error);
    }
  };

  const recordTransaction = async (
    tx: Omit<TransactionRecord, "id" | "timestamp">,
  ) => {
    try {
      await addTransaction(tx);
      await loadTransactions();
    } catch (error) {
      console.error("❌ Failed to record transaction:", error);
    }
  };

  const handleSaveSupply = async () => {
    if (!supplyDraft.trim()) return;
    setIsSavingSupply(true);
    try {
      const prevRaw = tokenState?.supplyRaw ?? null;
      const result = await adjustSupply(supplyDraft);

      setTokenState(result.state);
      setSupplyDraft(rawToInput(result.state.supplyRaw, result.state.decimals));
      setShopBalanceDraft(
        rawToInput(result.state.shopBalanceRaw, result.state.decimals),
      );

      const decimals = result.state.decimals;
      setStatus(
        `✅ Total supply is now ${formatRaw(result.state.supplyRaw, decimals)} TECH`,
      );

      if (result.action !== "none" && prevRaw !== null) {
        const delta = formatRaw(result.amountRaw, decimals);
        await recordTransaction({
          type: "ADJUSTMENT",
          status: "confirmed",
          label:
            result.action === "mint"
              ? "Supply increased"
              : "Supply decreased",
          productId: null,
          productName: null,
          techBaseUnits: result.amountRaw,
          solLamports: null,
          exchangeRate: null,
          userWallet: null,
          solSignature: null,
          techSignature: result.txSignature,
          detail: `Total supply: ${formatRaw(prevRaw, decimals)} → ${formatRaw(
            result.state.supplyRaw,
            decimals,
          )} TECH (${result.action} ${delta})`,
          legs: [
            {
              account:
                result.action === "mint"
                  ? "minted → total supply"
                  : "burned ← total supply",
              asset: "TECH",
              direction: result.action === "mint" ? "credit" : "debit",
              amountBaseUnits: result.amountRaw,
              txSignature: result.txSignature,
            },
            {
              account: SHOP_WALLET.toString(),
              asset: "TECH",
              direction: result.action === "mint" ? "credit" : "debit",
              amountBaseUnits: result.amountRaw,
              txSignature: result.txSignature,
            },
          ],
        });
      }
    } catch (error) {
      console.error("❌ Failed to adjust supply:", error);
      setStatus(
        `❌ ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      setIsSavingSupply(false);
    }
  };

  const handleSaveShopBalance = async () => {
    if (!shopBalanceDraft.trim()) return;
    setIsSavingShopBalance(true);
    try {
      const prevRaw = tokenState?.shopBalanceRaw ?? null;
      const result = await adjustShopBalance(shopBalanceDraft);

      setTokenState(result.state);
      setSupplyDraft(rawToInput(result.state.supplyRaw, result.state.decimals));
      setShopBalanceDraft(
        rawToInput(result.state.shopBalanceRaw, result.state.decimals),
      );

      const decimals = result.state.decimals;
      setStatus(
        `✅ Shop balance is now ${formatRaw(result.state.shopBalanceRaw, decimals)} TECH`,
      );

      if (result.action !== "none" && prevRaw !== null) {
        const delta = formatRaw(result.amountRaw, decimals);
        await recordTransaction({
          type: "ADJUSTMENT",
          status: "confirmed",
          label:
            result.action === "mint"
              ? "Shop balance increased"
              : "Shop balance decreased",
          productId: null,
          productName: null,
          techBaseUnits: result.amountRaw,
          solLamports: null,
          exchangeRate: null,
          userWallet: null,
          solSignature: null,
          techSignature: result.txSignature,
          detail: `Shop balance: ${formatRaw(prevRaw, decimals)} → ${formatRaw(
            result.state.shopBalanceRaw,
            decimals,
          )} TECH (${result.action} ${delta})`,
          legs: [
            {
              account:
                result.action === "mint"
                  ? "minted → shop balance"
                  : "burned ← shop balance",
              asset: "TECH",
              direction: result.action === "mint" ? "credit" : "debit",
              amountBaseUnits: result.amountRaw,
              txSignature: result.txSignature,
            },
            {
              account: SHOP_WALLET.toString(),
              asset: "TECH",
              direction: result.action === "mint" ? "credit" : "debit",
              amountBaseUnits: result.amountRaw,
              txSignature: result.txSignature,
            },
          ],
        });
      }
    } catch (error) {
      console.error("❌ Failed to adjust shop balance:", error);
      setStatus(
        `❌ ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      setIsSavingShopBalance(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadTokenState();
    loadTransactions();
  }, []);

  const refreshSolPrice = useCallback(async (opts?: { force?: boolean }) => {
    try {
      const url = opts?.force
        ? `/api/pricing?t=${Date.now()}`
        : "/api/pricing";
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load pricing");
      setSolUsdt(Number(data.solUsdt));
    } catch (error) {
      console.error("❌ Failed to load SOL/USDT price:", error);
      setStatus(
        "❌ Live SOL price unavailable — buying TECH with SOL is disabled.",
      );
    } finally {
      if (opts?.force) setRefreshingPrice(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshSolPrice();
  }, [refreshSolPrice]);

  // ✅ تابع جدید برای ایجاد associated token account
  const ensureTokenAccount = async (
    connection: Connection,
    wallet: PublicKey,
  ): Promise<PublicKey> => {
    try {
      const tokenAccount = await getAssociatedTokenAddress(TOKEN_MINT, wallet);

      // بررسی اینکه account وجود دارد یا نه
      const accountInfo = await connection.getAccountInfo(tokenAccount);

      if (accountInfo === null) {
        console.log("🔨 Creating associated token account...");
        setStatus("🔨 Creating token account...");

        // ایجاد transaction برای ایجاد account
        const transaction = new Transaction().add(
          createAssociatedTokenAccountInstruction(
            new PublicKey(publicKey!), // payer
            tokenAccount, // associated token account
            wallet, // owner
            TOKEN_MINT, // mint
          ),
        );

        const { blockhash } = await connection.getLatestBlockhash("confirmed");
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = new PublicKey(publicKey!);

        if (!connected || !walletPublicKey) {
          throw new Error("Wallet is not connected");
        }

        console.log("✍️ Signing token account creation with Wallet Adapter...");

        const signature = await sendTransaction(transaction, connection, {
          skipPreflight: false,
          preflightCommitment: "confirmed",
        });

        console.log("🚀 Token account creation sent:", signature);

        console.log("⏳ Confirming token account creation...");
        await connection.confirmTransaction(signature, "confirmed");

        console.log("✅ Token account created!");
      } else {
        console.log("✅ Token account already exists");
      }

      return tokenAccount;
    } catch (error: any) {
      console.error("❌ Error ensuring token account:", error);
      throw new Error(
        `Failed to create token account: ${error.message || error}`,
      );
    }
  };

  // ✅ بهبود شده transaction creation با detailed logging
  const createTechTransferTransaction = async (
    connection: Connection,
    userWallet: PublicKey,
    amount: number,
  ): Promise<Transaction> => {
    console.log("🔍 Creating TECH transfer transaction...");

    try {
      // Get or create user token account
      const userTokenAccount = await ensureTokenAccount(connection, userWallet);
      console.log("👤 User Token Account:", userTokenAccount.toString());

      // Get or create shop token account
      const shopTokenAccount = await getAssociatedTokenAddress(
        TOKEN_MINT,
        SHOP_WALLET,
      );
      console.log("🏪 Shop Token Account:", shopTokenAccount.toString());

      // بررسی اینکه shop token account وجود دارد
      const shopAccountInfo = await connection.getAccountInfo(shopTokenAccount);
      if (shopAccountInfo === null) {
        throw new Error(
          "❌ Shop token account does not exist. Admin must create it first.",
        );
      }

      const amountWithDecimals = amount * 10 ** DECIMALS;
      console.log("📊 Amount with decimals:", amountWithDecimals);

      const transferInstruction = createTransferInstruction(
        userTokenAccount,
        shopTokenAccount,
        userWallet,
        BigInt(amountWithDecimals),
        [],
        TOKEN_PROGRAM_ID,
      );

      const transaction = new Transaction().add(transferInstruction);

      const { blockhash } = await connection.getLatestBlockhash("confirmed");
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = userWallet;

      console.log("✅ TECH transfer transaction created");
      return transaction;
    } catch (error: any) {
      console.error("❌ Error creating transfer transaction:", error);
      throw new Error(`Transaction creation failed: ${error.message || error}`);
    }
  };

  // ✅ بهبود شده handleBuyProduct
  const handleBuyProduct = async () => {
    if (!connected || !walletPublicKey) {
      setStatus("❌ Please connect your wallet first");
      return;
    }

    const parsedPrice = parseFloat(price);

    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setStatus("❌ Please enter a valid price");
      return;
    }

    if (techBalance === null) {
      setStatus("🔄 Checking your TECH balance...");
      await loadTechBalance(walletPublicKey);
      return;
    }

    if (techBalance < parsedPrice) {
      setStatus(
        `❌ Insufficient TECH balance.\n\nYou have ${techBalance} TECH, but this product costs ${parsedPrice} TECH.`,
      );
      return;
    }

    setIsLoading(true);
    setStatus(
      `🔄 Preparing to buy ${selectedProduct.name} for ${parsedPrice} TECH...`,
    );

    try {
      const connection = new Connection(DEVNET_RPC_URL, "confirmed");
      const userWallet = walletPublicKey;

      console.log("📋 Step 1: Creating transaction...");
      const transaction = await createTechTransferTransaction(
        connection,
        userWallet,
        parsedPrice,
      );

      console.log("🧪 Step 2: Simulating transaction...");
      const simulation = await connection.simulateTransaction(transaction);

      if (simulation.value.err) {
        console.error("❌ Simulation error:", simulation.value.err);
        throw new Error(
          `Transaction simulation failed: ${JSON.stringify(
            simulation.value.err,
          )}`,
        );
      }

      console.log("✅ Simulation successful");
      setStatus(
        `📝 Please approve ${parsedPrice} TECH payment in Phantom...`,
      );

      if (!connected || !walletPublicKey) {
        throw new Error("Wallet is not connected");
      }
      console.log("✍️ Step 3: Asking Phantom to sign transaction...");

      if (!signTransaction) {
        throw new Error("Wallet does not support signTransaction");
      }

      if (!adapterPublicKey) {
        throw new Error("Wallet public key is not available");
      }

      // Refresh blockhash immediately before signing.
      const latestBlockhash = await connection.getLatestBlockhash("confirmed");

      transaction.recentBlockhash = latestBlockhash.blockhash;
      transaction.lastValidBlockHeight =
        latestBlockhash.lastValidBlockHeight;
      transaction.feePayer = adapterPublicKey;

      console.log("🔐 Fee payer:", transaction.feePayer?.toString());
      console.log("🔐 Blockhash:", transaction.recentBlockhash);
      console.log("🔐 Instructions:", transaction.instructions.length);

      console.log("✍️ Requesting Phantom signature...");

      const signedTransaction = await signTransaction(transaction);

      console.log("✅ Phantom signed transaction");

      const rawTransaction = signedTransaction.serialize();

      console.log(
        "📦 Serialized transaction size:",
        rawTransaction.length,
      );

      console.log("📡 Sending signed transaction...");

      const signature = await connection.sendRawTransaction(
        rawTransaction,
        {
          skipPreflight: true,
          preflightCommitment: "confirmed",
          maxRetries: 3,
        },
      );

      console.log("🚀 Transaction sent:", signature);

      setStatus("⏳ Confirming payment...");

      console.log("✅ Step 4: Confirming transaction...");

      const confirmation = await connection.confirmTransaction(
        {
          signature,
          blockhash: latestBlockhash.blockhash,
          lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
        },
        "confirmed",
      );

      if (confirmation.value.err) {
        console.error("❌ Confirmation error:", confirmation.value.err);
        throw new Error(
          `Payment failed: ${JSON.stringify(confirmation.value.err)}`,
        );
      }

      console.log("✅ Payment confirmed!");
      await loadTechBalance(userWallet);
      const paidBaseUnits = humanToBaseUnits(price, DECIMALS);
      await recordTransaction({
        type: "BUY_PRODUCT",
        status: "confirmed",
        label: selectedProduct.name,
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        techBaseUnits: paidBaseUnits,
        solLamports: null,
        exchangeRate: null,
        userWallet: walletPublicKey.toString(),
        solSignature: null,
        techSignature: signature,
        detail: `Paid ${parsedPrice} TECH for ${selectedProduct.emoji} ${selectedProduct.name}`,
        legs: [
          {
            account: walletPublicKey.toString(),
            asset: "TECH",
            direction: "debit",
            amountBaseUnits: paidBaseUnits,
            txSignature: signature,
          },
          {
            account: SHOP_WALLET.toString(),
            asset: "TECH",
            direction: "credit",
            amountBaseUnits: paidBaseUnits,
            txSignature: signature,
          },
        ],
      });
      await loadTokenState();

      setStatus(
        `🎉 Purchase successful!\n\n${selectedProduct.emoji} ${selectedProduct.name}\n💰 Paid: ${parsedPrice} TECH\n\nTX: ${signature.slice(
          0,
          8,
        )}...${signature.slice(-8)}`,
      );
    } catch (error: any) {
      console.error("❌ Full error details:", error);

      let errorMessage = error.message || "Unknown error";

      if (error.message?.includes("User rejected")) {
        errorMessage = "Payment rejected by user";
      } else if (error.message?.includes("insufficient funds")) {
        errorMessage = "Insufficient SOL for transaction fees";
      } else if (error.message?.includes("Token account")) {
        errorMessage = error.message;
      }

      setStatus(`❌ Payment failed:\n${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const techPayment = (
    techInput: string,
  ): { techBaseUnits: bigint; lamports: bigint; solHuman: number } | null => {
    const tech = parseFloat(techInput);

    if (isNaN(tech) || tech <= 0 || solUsdt === null || TECH_USDT_RATE <= 0) {
      return null;
    }

    const techBaseUnits = BigInt(Math.round(tech * 10 ** DECIMALS));
    const lamports = techRawToLamports(techBaseUnits, TECH_USDT_RATE, solUsdt);

    return {
      techBaseUnits,
      lamports,
      solHuman: Number(lamports) / 10 ** 9,
    };
  };

  const handleBuyTokens = async () => {
    if (!connected || !walletPublicKey) {
      setStatus("❌ Please connect your wallet first");
      return;
    }

    const payment = techPayment(buyTechAmount);

    if (payment === null) {
      setStatus("❌ Please enter a valid TECH amount");
      return;
    }

    const { techBaseUnits, lamports: requiredLamports, solHuman: solCost } =
      payment;

    setIsLoading(true);
    setStatus(
      `🔄 Preparing to buy ${parseFloat(buyTechAmount)} TECH for ${solCost} SOL...`,
    );

    try {
      const connection = new Connection(DEVNET_RPC_URL, "confirmed");

      // Step 1: user pays the equivalent SOL to the shop wallet
      const paymentTx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: walletPublicKey,
          toPubkey: SHOP_WALLET,
          lamports: requiredLamports,
        }),
      );
      const { blockhash } = await connection.getLatestBlockhash("confirmed");
      paymentTx.recentBlockhash = blockhash;
      paymentTx.lastValidBlockHeight = 0;
      paymentTx.feePayer = walletPublicKey;

      if (!signTransaction) {
        throw new Error("Wallet does not support signTransaction");
      }

      setStatus(`📝 Please approve ${solCost} SOL payment in Phantom...`);
      const signedPayment = await signTransaction(paymentTx);
      const paymentSignature = await connection.sendRawTransaction(
        signedPayment.serialize(),
        { skipPreflight: true, preflightCommitment: "confirmed" },
      );
      await connection.confirmTransaction(paymentSignature, "confirmed");

      setStatus("⏳ SOL received. Sending you TECH...");

      // Step 2: server verifies payment and pays TECH from the shop
      const response = await fetch("/api/solana/buy-tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userWallet: walletPublicKey.toString(),
          techBaseUnits: techBaseUnits.toString(),
          paymentSignature,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to buy tokens");
      }

      await loadTechBalance(walletPublicKey);
      const techRaw = techBaseUnits.toString();
      const solRaw = requiredLamports.toString();
      await recordTransaction({
        type: "BUY_TECH",
        status: "confirmed",
        label: "TECH purchase",
        productId: null,
        productName: null,
        techBaseUnits: techRaw,
        solLamports: solRaw,
        exchangeRate: TECH_USDT_RATE,
        userWallet: walletPublicKey.toString(),
        solSignature: paymentSignature,
        techSignature: result.techSignature,
        detail: `Paid ≈ ${solCost} SOL, received ${parseFloat(
          buyTechAmount,
        )} TECH (1 TECH = ${TECH_USDT_RATE} USDT · 1 SOL ≈ ${solUsdt} USDT)`,
        legs: [
          {
            account: walletPublicKey.toString(),
            asset: "SOL",
            direction: "debit",
            amountBaseUnits: solRaw,
            txSignature: paymentSignature,
          },
          {
            account: SHOP_WALLET.toString(),
            asset: "SOL",
            direction: "credit",
            amountBaseUnits: solRaw,
            txSignature: paymentSignature,
          },
          {
            account: SHOP_WALLET.toString(),
            asset: "TECH",
            direction: "debit",
            amountBaseUnits: techRaw,
            txSignature: result.techSignature,
          },
          {
            account: walletPublicKey.toString(),
            asset: "TECH",
            direction: "credit",
            amountBaseUnits: techRaw,
            txSignature: result.techSignature,
          },
        ],
      });
      await loadTokenState();

      setStatus(
        `🎉 Purchase successful!\n\nPaid: ${solCost} SOL\nReceived: ${parseFloat(
          buyTechAmount,
        )} TECH\n\nSOL TX: ${paymentSignature.slice(
          0,
          8,
        )}...${paymentSignature.slice(-8)}\nTECH TX: ${result.techSignature.slice(
          0,
          8,
        )}...${result.techSignature.slice(-8)}`,
      );
    } catch (error: any) {
      console.error("❌ Buy tokens error:", error);
      setStatus(`❌ Purchase failed:\n${error.message || "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const decimals = tokenState?.decimals ?? DECIMALS;
  const supplyDisplay = tokenState
    ? `${formatRaw(tokenState.supplyRaw, decimals)} TECH`
    : "Loading…";
  const shopDisplay = tokenState
    ? `${formatRaw(tokenState.shopBalanceRaw, decimals)} TECH`
    : "Loading…";
  const techDisplay =
    techBalance === null ? "..." : `${techBalance.toLocaleString()} TECH`;

  const pendingPayment = techPayment(buyTechAmount);

  const statusClass = status.includes("❌")
    ? "bg-red-50 border border-red-200 text-red-700"
    : status.includes("🎉") || status.includes("✅")
      ? "bg-green-50 border border-green-200 text-green-700"
      : "bg-blue-50 border border-blue-200 text-blue-700";

  if (!IS_DEPLOYED) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-4 sm:px-6">
            <Link
              href="/"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600 text-xl shadow-sm transition-transform hover:scale-105"
            >
              🏠
            </Link>
            <h1 className="text-lg font-bold leading-tight text-gray-900">
              TECH Token Shop
            </h1>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6">
          <div className="text-4xl">🪙</div>
          <h2 className="mt-4 text-xl font-semibold text-gray-900">
            No TECH token deployed on Solana yet
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-gray-600">
            Set <code className="font-mono">NEXT_PUBLIC_TOKEN_MINT</code> and{" "}
            <code className="font-mono">NEXT_PUBLIC_SHOP_WALLET</code> in{" "}
            <code className="font-mono">.env.local</code> (deploy via the Shop
            Management panel),
            then restart the app.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600 text-xl shadow-sm transition-transform hover:scale-105"
            >
              🏠
            </Link>
            <div>
              <h1 className="text-lg font-bold leading-tight text-gray-900">
                TECH Token Shop
              </h1>
              <p className="text-xs text-gray-500">Solana Devnet · SPL Token Demo</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-medium text-green-700 sm:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              Devnet
            </span>

            {!isConnected ? (
              <button
                onClick={connectWallet}
                disabled={isLoading}
                className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-700 disabled:opacity-50"
              >
                🔗 Connect Wallet
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">
                  {shorten(publicKey ?? "", 8, 6)}
                </span>
                <button
                  onClick={disconnectWallet}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
                >
                  Disconnect
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Stats */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon="🪙"
            label="Total TECH Supply"
            value={supplyDisplay}
            subtext={
              tokenState
                ? `Mint: ${shorten(tokenState.mint, 10, 6)}`
                : "Loading from network…"
            }
          />
          <StatCard
            icon="🏪"
            label="Shop TECH Balance"
            value={shopDisplay}
            subtext="Real on-chain shop holdings"
          />
          <StatCard
            icon="👤"
            label="Your TECH Balance"
            value={isConnected ? techDisplay : "—"}
            subtext={isConnected ? "Your wallet" : "Connect to view"}
          />
          <StatCard
            icon="💱"
            label="Exchange Rate"
            value={
              TECH_USDT_RATE > 0
                ? `1 TECH = ${TECH_USDT_RATE} USDT`
                : "Not set"
            }
            subtext={
              solUsdt !== null
                ? `1 SOL ≈ ${solUsdt} USDT · live`
                : "Loading live SOL price…"
            }
          />
        </section>

        {/* Main two-column grid */}
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left: shopping */}
          <div className="space-y-6">
            {isConnected ? (
              <>
                <section className="rounded-xl border border-gray-200 bg-white p-5">
                  <h2 className="text-base font-semibold text-gray-900">
                    🛍️ Products
                  </h2>

                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {PRODUCTS.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => {
                          setSelectedProduct(product);
                          setPrice(String(product.price));
                        }}
                        className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-center transition-colors ${
                          selectedProduct.id === product.id
                            ? "border-purple-500 bg-purple-50"
                            : "border-gray-200 bg-gray-50 hover:border-purple-200 hover:bg-purple-50/50"
                        }`}
                      >
                        <span className="text-2xl">{product.emoji}</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {product.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {product.price} TECH
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center justify-between rounded-lg bg-purple-50 px-4 py-2.5">
                    <span className="text-sm text-purple-700">
                      Selected: {selectedProduct.emoji} {selectedProduct.name}
                    </span>
                    <span className="text-xs text-purple-500">
                      ✏️ Price editable below
                    </span>
                  </div>

                  <div className="mt-4">
                    <label
                      htmlFor="price-input"
                      className="mb-1 block text-xs font-medium text-gray-500"
                    >
                      Price (TECH)
                    </label>
                    <input
                      id="price-input"
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      disabled={isLoading}
                      className={inputClass}
                    />
                  </div>

                  <button
                    onClick={handleBuyProduct}
                    disabled={
                      isLoading ||
                      techBalance === null ||
                      isNaN(parseFloat(price)) ||
                      parseFloat(price) <= 0 ||
                      techBalance < parseFloat(price)
                    }
                    className={`${buttonPrimary} mt-4 bg-green-600 hover:bg-green-700`}
                  >
                    {isLoading ? "Processing..." : `🛒 Buy for ${price} TECH`}
                  </button>
                </section>

                {TECH_USDT_RATE > 0 && (
                  <section className="rounded-xl border border-gray-200 bg-white p-5">
                    <div className="flex items-center justify-between">
                      <h2 className="text-base font-semibold text-gray-900">
                        💱 Buy TECH with SOL
                      </h2>
                      <button
                        onClick={() => {
                          setRefreshingPrice(true);
                          refreshSolPrice({ force: true });
                        }}
                        disabled={isLoading || refreshingPrice}
                        className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-purple-50 hover:text-purple-700 disabled:opacity-50"
                      >
                        {refreshingPrice
                          ? "⏳ Updating…"
                          : "🔄 Refresh SOL price"}
                      </button>
                    </div>

                    <div className="mt-4 rounded-lg bg-purple-50 p-3 text-center">
                      <p className="text-xs text-purple-700">Reference prices</p>
                      <p className="text-lg font-bold text-purple-700">
                        1 TECH = {TECH_USDT_RATE} USDT
                      </p>
                      <p className="text-xs text-purple-600">
                        {solUsdt !== null
                          ? `1 SOL ≈ ${solUsdt} USDT (live)`
                          : "⏳ Fetching live SOL price online…"}
                      </p>
                    </div>

                    <div className="mt-4">
                      <label
                        htmlFor="buy-tech-input"
                        className="mb-1 block text-xs font-medium text-gray-500"
                      >
                        Amount (TECH)
                      </label>
                      <input
                        id="buy-tech-input"
                        type="number"
                        min="0"
                        step="1"
                        value={buyTechAmount}
                        onChange={(e) => setBuyTechAmount(e.target.value)}
                        disabled={isLoading || solUsdt === null}
                        className={inputClass}
                      />
                    </div>

                    {pendingPayment !== null && (
                      <p className="mt-3 text-center text-sm text-gray-600">
                        You will pay{" "}
                        <span className="font-bold text-purple-700">
                          ≈ {pendingPayment.solHuman} SOL
                        </span>{" "}
                        (1 TECH = {TECH_USDT_RATE} USDT · 1 SOL ≈{" "}
                        {solUsdt} USDT)
                      </p>
                    )}

                    <button
                      onClick={handleBuyTokens}
                      disabled={isLoading || pendingPayment === null}
                      className={`${buttonPrimary} mt-4 bg-blue-600 hover:bg-blue-700`}
                    >
                      {isLoading ? "Processing..." : "💱 Buy TECH with SOL"}
                    </button>
                  </section>
                )}
              </>
            ) : (
              <section className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-white p-10 text-center">
                <div className="text-4xl">🔗</div>
                <h2 className="mt-3 font-semibold text-gray-900">
                  Connect your wallet
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Connect Phantom to buy products and purchase TECH with SOL.
                </p>
                <button
                  onClick={connectWallet}
                  disabled={isLoading}
                  className="mt-4 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
                >
                  🔗 Connect Wallet
                </button>
              </section>
            )}
          </div>

          {/* Right: management + history */}
          <div className="space-y-6">
            {/* Shop management */}
            <section className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-900">
                  ⚙️ Shop Management
                </h2>
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                  Admin · on-chain
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Changes mint or burn real TECH tokens on the network.
              </p>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Total supply */}
                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="text-xs font-medium text-gray-500">
                    Total TECH Available
                  </p>
                  <p className="mt-1 text-lg font-bold text-gray-900">
                    {supplyDisplay}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    Minted supply on-chain
                  </p>

                  <input
                    id="supply-input"
                    type="text"
                    inputMode="decimal"
                    value={supplyDraft}
                    onChange={(e) => setSupplyDraft(e.target.value)}
                    disabled={isSavingSupply}
                    placeholder="Target total supply"
                    className={`${inputClass} mt-3 text-center`}
                  />
                  <button
                    onClick={handleSaveSupply}
                    disabled={isSavingSupply || !supplyDraft.trim()}
                    className={`${buttonPrimary} mt-2 bg-amber-600 hover:bg-amber-700`}
                  >
                    {isSavingSupply ? "Adjusting…" : "💾 Save Total"}
                  </button>
                </div>

                {/* Shop balance */}
                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="text-xs font-medium text-gray-500">
                    Shop TECH Balance
                  </p>
                  <p className="mt-1 text-lg font-bold text-gray-900">
                    {shopDisplay}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    Tokens held by the shop
                  </p>

                  <input
                    id="shop-balance-input"
                    type="text"
                    inputMode="decimal"
                    value={shopBalanceDraft}
                    onChange={(e) => setShopBalanceDraft(e.target.value)}
                    disabled={isSavingShopBalance}
                    placeholder="Target shop balance"
                    className={`${inputClass} mt-3 text-center`}
                  />
                  <button
                    onClick={handleSaveShopBalance}
                    disabled={isSavingShopBalance || !shopBalanceDraft.trim()}
                    className={`${buttonPrimary} mt-2 bg-amber-600 hover:bg-amber-700`}
                  >
                    {isSavingShopBalance ? "Adjusting…" : "💾 Save Balance"}
                  </button>
                </div>
              </div>
            </section>

            {/* Transaction history */}
            <section className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-900">
                  🧾 Transaction History
                </h2>
                <button
                  onClick={loadTransactions}
                  className="text-xs font-medium text-purple-600 hover:text-purple-800"
                >
                  ↻ Refresh
                </button>
              </div>

              {transactions.length === 0 ? (
                <p className="mt-4 rounded-lg border border-dashed border-gray-200 py-8 text-center text-sm text-gray-500">
                  No transactions yet
                </p>
              ) : (
                <ul className="mt-4 max-h-96 space-y-2 overflow-y-auto pr-1">
                  {transactions.map((tx) => (
                    <li
                      key={tx.id}
                      className="rounded-lg border border-gray-100 p-3 text-sm"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-gray-800">
                          {tx.label}
                        </span>
                        <div className="flex shrink-0 items-center gap-1.5">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${typeBadgeClass(
                              tx.type,
                            )}`}
                          >
                            {tx.type.replace("_", " ")}
                          </span>
                          <span className="text-xs text-gray-400">
                            {formatTime(tx.timestamp)}
                          </span>
                        </div>
                      </div>

                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        {tx.techBaseUnits !== null && (
                          <span className="rounded bg-emerald-50 px-1.5 py-0.5 font-semibold text-emerald-700">
                            {formatRaw(tx.techBaseUnits, decimals)} TECH
                          </span>
                        )}
                        {tx.solLamports !== null && (
                          <span className="rounded bg-blue-50 px-1.5 py-0.5 font-semibold text-blue-700">
                            {formatRaw(tx.solLamports, 9)} SOL
                          </span>
                        )}
                        {tx.exchangeRate !== null && (
                          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-600">
                            1 TECH = {tx.exchangeRate} USDT
                          </span>
                        )}
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${statusBadgeClass(
                            tx.status,
                          )}`}
                        >
                          {tx.status}
                        </span>
                      </div>

                      {(tx.legs ?? []).length > 0 && (
                        <ul className="mt-1.5 space-y-0.5">
                          {(tx.legs ?? []).map((leg, index) => (
                            <li
                              key={index}
                              className="flex items-center gap-1 text-[11px] text-gray-500"
                            >
                              <span className="font-mono">
                                {shorten(leg.account, 6, 4)}
                              </span>
                              <span
                                className={
                                  leg.direction === "credit"
                                    ? "font-semibold text-emerald-600"
                                    : "font-semibold text-red-500"
                                }
                              >
                                {leg.direction === "credit" ? "+" : "−"}
                                {formatRaw(leg.amountBaseUnits, decimals)}{" "}
                                {leg.asset}
                              </span>
                              {leg.txSignature && (
                                <span className="text-purple-500">
                                  · {shorten(leg.txSignature, 6, 4)}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}

                      <p className="mt-1.5 text-xs text-gray-500">{tx.detail}</p>

                      {tx.userWallet && (
                        <p className="mt-1 break-all text-[11px] text-gray-400">
                          👤 {shorten(tx.userWallet, 8, 6)}
                        </p>
                      )}
                      {(tx.solSignature || tx.techSignature) && (
                        <div className="mt-0.5 space-y-0.5">
                          {tx.solSignature && (
                            <p className="break-all text-[11px] text-blue-600">
                              SOL TX: {shorten(tx.solSignature, 10, 8)}
                            </p>
                          )}
                          {tx.techSignature && (
                            <p className="break-all text-[11px] text-purple-600">
                              TECH TX: {shorten(tx.techSignature, 10, 8)}
                            </p>
                          )}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>

        <footer className="mt-8 text-center text-xs text-gray-400">
          <p>Network: Solana Devnet · Token: TECH</p>
          <p className="mt-1 break-all">
            Mint: {process.env.NEXT_PUBLIC_TOKEN_MINT}
          </p>
        </footer>
      </main>

      {/* Status toast */}
      {status && (
        <div
          className={`fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 rounded-xl p-4 text-sm shadow-lg ${statusClass}`}
        >
          <div className="flex items-start justify-between gap-3">
            <p className="whitespace-pre-wrap">{status}</p>
            <button
              onClick={() => setStatus("")}
              className="shrink-0 opacity-50 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
