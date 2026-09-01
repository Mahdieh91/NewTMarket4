import path from "path";
import { readJson, writeJson } from "@/app/lib/json-store";
import type { ChainId, NetworkKey } from "./networks";
import { getNetwork } from "./networks";

export const DEPLOYMENTS_FILE = path.join(
  process.cwd(),
  "data",
  "token-deployments.json",
);

export type DeploymentRecord = {
  id: string;
  chain: ChainId;
  network: NetworkKey;
  /** true when deployed through the admin panel. */
  managed: boolean;
  /** Solana mint address. */
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  iconUrl: string | null;
  metadataUrl: string | null;
  description: string | null;
  totalSupply: string;
  usdtRate: number | null;
  owner: string;
  shopWallet: string;
  currency: string;
  deployTx: string | null;
  deployedAt: string;
};

function isValidSolanaAddress(value: string | undefined): value is string {
  return !!value && value.length >= 32 && value.length <= 44;
}

/**
 * Deployments that are wired through the app's .env (the legacy path).
 * They are surfaced so the admin can also remove them, even though they were
 * not deployed through this panel.
 */
function envDerivedDeployments(): DeploymentRecord[] {
  const records: DeploymentRecord[] = [];
  const now = new Date(0).toISOString();

  const solMint = process.env.NEXT_PUBLIC_TOKEN_MINT;
  const solShop = process.env.NEXT_PUBLIC_SHOP_WALLET;
  if (isValidSolanaAddress(solMint)) {
    records.push({
      id: "solana-devnet",
      chain: "solana",
      network: "solana-devnet",
      managed: false,
      address: solMint,
      name: "Tech Token",
      symbol: "TECH",
      decimals: 9,
      iconUrl: null,
      metadataUrl: null,
      description: null,
      totalSupply: "",
      usdtRate: null,
      owner: solShop ?? "",
      shopWallet: solShop ?? "",
      currency: "SOL",
      deployTx: null,
      deployedAt: now,
    });
  }

  return records;
}

export function listDeployments(): DeploymentRecord[] {
  const persisted = readJson<DeploymentRecord[]>(DEPLOYMENTS_FILE, []);
  const merged = new Map<string, DeploymentRecord>();
  for (const record of [...persisted, ...envDerivedDeployments()]) {
    if (record?.id && !merged.has(record.id)) {
      merged.set(record.id, record);
    }
  }
  return Array.from(merged.values());
}

export function getDeployment(
  chain: ChainId,
  network: NetworkKey,
): DeploymentRecord | null {
  return (
    listDeployments().find(
      (record) => record.chain === chain && record.network === network,
    ) ?? null
  );
}

export function saveDeployment(record: DeploymentRecord): DeploymentRecord {
  const all = listDeployments().filter(
    (existing) => existing.id !== record.id,
  );
  all.push(record);
  writeJson(DEPLOYMENTS_FILE, all);
  return record;
}

export function removeDeployment(
  chain: ChainId,
  network: NetworkKey,
): DeploymentRecord | null {
  const all = readJson<DeploymentRecord[]>(DEPLOYMENTS_FILE, []);
  const existing = all.find(
    (record) => record.chain === chain && record.network === network,
  );
  if (!existing) return null;
  writeJson(
    DEPLOYMENTS_FILE,
    all.filter((record) => record.chain !== chain || record.network !== network),
  );
  return existing;
}

export function deploymentSummary(record: DeploymentRecord): string {
  const network = getNetwork(record.network);
  return `${network.label} · ${record.address}`;
}