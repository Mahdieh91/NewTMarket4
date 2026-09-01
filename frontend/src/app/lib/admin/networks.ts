export type ChainId = "solana";

export type NetworkKey = "solana-devnet" | "solana-testnet" | "solana-mainnet";

export type SolanaCluster = "devnet" | "testnet" | "mainnet-beta";

export type NetworkPreset = {
  key: NetworkKey;
  chain: ChainId;
  label: string;
  kind: "testnet" | "mainnet";
  currency: string;
  currencyDecimals: number;
  rpcUrl: string;
  rpcUrls: string[];
  cluster: SolanaCluster | null;
  explorerBase: string;
};

/**
 * Parse an RPC list from a single env var. The value may be a single URL or a
 * comma-separated list so callers can build connections that survive a flaky
 * endpoint. Whitespace is trimmed, blank entries dropped. Falls back to
 * `defaults` when unset.
 */
export function parseRpcUrls(
  raw: string | undefined,
  defaults: string[],
): string[] {
  const fromEnv = (raw ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return fromEnv.length > 0 ? fromEnv : defaults;
}

export const CHAINS: { id: ChainId; label: string; icon: string }[] = [
  { id: "solana", label: "Solana", icon: "🟣" },
];

export const NETWORKS: Record<NetworkKey, NetworkPreset> = {
  "solana-devnet": {
    key: "solana-devnet",
    chain: "solana",
    label: "Solana Devnet",
    kind: "testnet",
    currency: "SOL",
    currencyDecimals: 9,
    rpcUrl:
      process.env.NEXT_PUBLIC_SOLANA_DEVNET_RPC_URL ?? "https://api.devnet.solana.com",
    rpcUrls: parseRpcUrls(process.env.NEXT_PUBLIC_SOLANA_DEVNET_RPC_URL, [
      "https://api.devnet.solana.com",
    ]),
    cluster: "devnet",
    explorerBase: "https://explorer.solana.com",
  },
  "solana-testnet": {
    key: "solana-testnet",
    chain: "solana",
    label: "Solana Testnet",
    kind: "testnet",
    currency: "SOL",
    currencyDecimals: 9,
    rpcUrl:
      process.env.NEXT_PUBLIC_SOLANA_TESTNET_RPC_URL ?? "https://api.testnet.solana.com",
    rpcUrls: parseRpcUrls(process.env.NEXT_PUBLIC_SOLANA_TESTNET_RPC_URL, [
      "https://api.testnet.solana.com",
    ]),
    cluster: "testnet",
    explorerBase: "https://explorer.solana.com",
  },
  "solana-mainnet": {
    key: "solana-mainnet",
    chain: "solana",
    label: "Solana Mainnet",
    kind: "mainnet",
    currency: "SOL",
    currencyDecimals: 9,
    rpcUrl:
      process.env.NEXT_PUBLIC_SOLANA_MAINNET_RPC_URL ?? "https://api.mainnet-beta.solana.com",
    rpcUrls: parseRpcUrls(process.env.NEXT_PUBLIC_SOLANA_MAINNET_RPC_URL, [
      "https://api.mainnet-beta.solana.com",
    ]),
    cluster: "mainnet-beta",
    explorerBase: "https://explorer.solana.com",
  },
};

export function networksForChain(chain: ChainId): NetworkPreset[] {
  return Object.values(NETWORKS).filter((preset) => preset.chain === chain);
}

export function getNetwork(key: NetworkKey): NetworkPreset {
  const preset = NETWORKS[key];
  if (!preset) throw new Error(`Unknown network key: ${key}`);
  return preset;
}

export function isNetworkKey(
  value: string | undefined,
  chain?: ChainId,
): value is NetworkKey {
  if (!value) return false;
  const preset = NETWORKS[value as NetworkKey];
  return !!preset && (chain ? preset.chain === chain : true);
}

function solanaQuery(cluster: SolanaCluster): string {
  return cluster === "mainnet-beta" ? "" : `?cluster=${cluster}`;
}

export function explorerAddressUrl(key: NetworkKey, address: string): string {
  const preset = getNetwork(key);
  return preset.cluster
    ? `${preset.explorerBase}/address/${address}${solanaQuery(preset.cluster)}`
    : `${preset.explorerBase}/address/${address}`;
}

export function explorerTxUrl(key: NetworkKey, signature: string): string {
  const preset = getNetwork(key);
  return preset.cluster
    ? `${preset.explorerBase}/tx/${signature}${solanaQuery(preset.cluster)}`
    : `${preset.explorerBase}/tx/${signature}`;
}