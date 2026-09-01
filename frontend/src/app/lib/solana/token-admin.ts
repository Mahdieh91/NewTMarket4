import { Connection, Keypair, PublicKey, clusterApiUrl } from "@solana/web3.js";
import {
  getMint,
  getAccount,
  getAssociatedTokenAddress,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  burn,
} from "@solana/spl-token";
import fs from "fs";
import path from "path";

const TOKEN_MINT = new PublicKey(process.env.NEXT_PUBLIC_TOKEN_MINT!);
const MAX_U64 = (BigInt(1) << BigInt(64)) - BigInt(1);

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

export type TokenState = {
  mint: string;
  decimals: number;
  supplyRaw: string;
  shopBalanceRaw: string;
  mintAuthority: string | null;
};

export type AdjustResult = {
  state: TokenState;
  txSignature: string | null;
  action: "mint" | "burn" | "none";
  amountRaw: string;
  target: string;
};

function loadShopKeypair(): Keypair {
  const keypairPath = path.join(process.cwd(), "payer-keypair.json");
  if (!fs.existsSync(keypairPath)) {
    throw new Error("Shop keypair not found on server");
  }
  const secretKey = JSON.parse(fs.readFileSync(keypairPath, "utf8"));
  return Keypair.fromSecretKey(new Uint8Array(secretKey));
}

export function humanToBaseUnits(human: string, decimals: number): bigint {
  const cleaned = human.trim().replace(/,/g, "").replace(/\s/g, "");
  if (!/^\d+(\.\d+)?$/.test(cleaned)) {
    throw new Error("Invalid amount: expected a positive number");
  }
  const [intPart, fracPart = ""] = cleaned.split(".");
  const frac = fracPart.padEnd(decimals, "0").slice(0, decimals);
  return BigInt(intPart) * BigInt(10) ** BigInt(decimals) + BigInt(frac || "0");
}

export async function getTokenState(): Promise<TokenState> {
  const shopKeypair = loadShopKeypair();
  const mintInfo = await getMint(connection, TOKEN_MINT);
  const shopTokenAccount = await getAssociatedTokenAddress(
    TOKEN_MINT,
    shopKeypair.publicKey,
  );

  let shopBalanceRaw = BigInt(0);
  try {
    const account = await getAccount(connection, shopTokenAccount);
    shopBalanceRaw = account.amount;
  } catch {
    // Shop token account may not exist yet.
  }

  return {
    mint: TOKEN_MINT.toString(),
    decimals: mintInfo.decimals,
    supplyRaw: mintInfo.supply.toString(),
    shopBalanceRaw: shopBalanceRaw.toString(),
    mintAuthority: mintInfo.mintAuthority?.toString() ?? null,
  };
}

async function adjustToTarget(
  target: string,
  currentRaw: bigint,
  kind: "supply" | "shopBalance",
): Promise<AdjustResult> {
  const state = await getTokenState();
  const targetRaw = humanToBaseUnits(target, state.decimals);

  if (targetRaw > MAX_U64) {
    throw new Error(
      `Target too large. The maximum is ${MAX_U64} base units (${Number(
        MAX_U64 / BigInt(10) ** BigInt(state.decimals),
      ).toLocaleString()} tokens at ${state.decimals} decimals).`,
    );
  }

  const delta = targetRaw - currentRaw;
  if (delta === BigInt(0)) {
    return {
      state,
      txSignature: null,
      action: "none",
      amountRaw: "0",
      target,
    };
  }

  const shopKeypair = loadShopKeypair();
  const shopTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    shopKeypair,
    TOKEN_MINT,
    shopKeypair.publicKey,
  );

  let txSignature: string;
  if (delta > BigInt(0)) {
    txSignature = await mintTo(
      connection,
      shopKeypair,
      TOKEN_MINT,
      shopTokenAccount.address,
      shopKeypair,
      delta,
    );
  } else {
    txSignature = await burn(
      connection,
      shopKeypair,
      shopTokenAccount.address,
      TOKEN_MINT,
      shopKeypair,
      -delta,
    );
  }
  await connection.confirmTransaction(txSignature, "confirmed");

  const result: AdjustResult = {
    state: await getTokenState(),
    txSignature,
    action: delta > BigInt(0) ? "mint" : "burn",
    amountRaw: (delta > BigInt(0) ? delta : -delta).toString(),
    target,
  };

  if (kind === "supply") {
    console.log(`✅ Supply adjusted: ${result.state.supplyRaw} (${txSignature})`);
  } else {
    console.log(
      `✅ Shop balance adjusted: ${result.state.shopBalanceRaw} (${txSignature})`,
    );
  }

  return result;
}

export async function adjustSupply(target: string): Promise<AdjustResult> {
  const state = await getTokenState();
  return adjustToTarget(target, BigInt(state.supplyRaw), "supply");
}

export async function adjustShopBalance(
  target: string,
): Promise<AdjustResult> {
  const state = await getTokenState();
  return adjustToTarget(target, BigInt(state.shopBalanceRaw), "shopBalance");
}
