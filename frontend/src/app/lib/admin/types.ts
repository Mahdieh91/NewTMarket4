import type { ChainId, NetworkKey } from "./networks";

export type DeployFormInput = {
  chain: ChainId;
  network: NetworkKey;
  name: string;
  symbol: string;
  decimals: number;
  iconUrl: string | null;
  metadataUrl: string | null;
  description: string | null;
  totalSupply: string;
  usdtRate: number;
};

export type DeployResult = {
  record: import("./registry").DeploymentRecord;
  messages: string[];
  envLines: string[];
};

export type RemoveResult = {
  chain: ChainId;
  network: NetworkKey;
  address: string | null;
  messages: string[];
  envLines: string[];
};

export function humanToBaseUnits(human: string, decimals: number): bigint {
  const cleaned = human.trim().replace(/,/g, "").replace(/\s/g, "");
  if (!/^\d+(\.\d+)?$/.test(cleaned)) {
    throw new Error("Invalid amount: expected a positive number");
  }
  const [intPart, fracPart = ""] = cleaned.split(".");
  const frac = fracPart.padEnd(decimals, "0").slice(0, decimals);
  return BigInt(intPart) * BigInt(10) ** BigInt(decimals) + BigInt(frac || "0");
}

export function parseUsdtRate(value: unknown, fallback: number): number {
  const rate = typeof value === "number" ? value : Number(String(value ?? ""));
  if (!Number.isFinite(rate) || rate <= 0) return fallback;
  return rate;
}