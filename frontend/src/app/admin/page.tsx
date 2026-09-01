"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  explorerAddressUrl,
  getNetwork,
  isNetworkKey,
  networksForChain,
  type NetworkKey,
} from "@/app/lib/admin/networks";
import type { DeploymentRecord } from "@/app/lib/admin/registry";

const inputClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-200 disabled:opacity-50 disabled:cursor-not-allowed";

const labelClass = "mb-1 block text-xs font-medium text-gray-500";

const buttonPrimary =
  "w-full rounded-lg py-2.5 text-sm font-semibold text-white shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

type DeployResult = {
  record: DeploymentRecord;
  messages: string[];
  envLines: string[];
};

type RemoveResult = {
  network: NetworkKey;
  address: string | null;
  messages: string[];
  envLines: string[];
};

function shorten(value: string, start = 8, end = 6): string {
  return value.length <= start + end
    ? value
    : `${value.slice(0, start)}…${value.slice(-end)}`;
}

function StatusCard({ messages }: { messages: string[] }) {
  return (
    <div className="mt-4 space-y-1 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm">
      {messages.map((message, index) => {
        const isLink = message.trim().startsWith("https://") ||
          message.trim().startsWith("   https://");
        const isHeading = /^[✅🎉📝🎯]/.test(message) || /^[✅🎉📝📌]/.test(message);
        return (
          <p
            key={index}
            className={`whitespace-pre-wrap font-mono text-xs leading-relaxed ${
              isLink
                ? "break-all text-blue-600"
                : isHeading
                  ? "font-semibold text-gray-800"
                  : "text-gray-600"
            }`}
          >
            {message}
          </p>
        );
      })}
    </div>
  );
}

function EnvBlock({
  envLines,
  onCopied,
}: {
  envLines: string[];
  onCopied: () => void;
}) {
  return (
    <div className="mt-4 rounded-xl border border-gray-900/10 bg-gray-900 p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-300">
          ADD TO .env.local
        </p>
        <button
          onClick={() =>
            navigator.clipboard
              .writeText(envLines.filter((line) => !line.startsWith("#")).join("\n"))
              .then(onCopied)
              .catch(() => {})
          }
          className="rounded-md bg-white/10 px-2 py-1 text-xs font-medium text-white hover:bg-white/20"
        >
          Copy
        </button>
      </div>
      <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-xs leading-relaxed text-green-300">
        {envLines.join("\n")}
      </pre>
      <p className="mt-2 text-[11px] text-gray-400">
        After adding the lines above, restart the app (stop and re-run{" "}
        <code className="text-gray-300">npm run dev</code>) so the new values
        take effect.
      </p>
    </div>
  );
}

function ExampleBlock({
  title,
  content,
}: {
  title: string;
  content: string;
}) {
  return (
    <div className="mt-4 rounded-xl border border-gray-900/10 bg-gray-900 p-4">
      <p className="text-xs font-semibold text-gray-300">{title}</p>
      <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-xs leading-relaxed text-green-300">
        {content}
      </pre>
    </div>
  );
}

export default function AdminPage() {
  const [tab, setTab] = useState<"deploy" | "remove" | "guides">("deploy");

  const [network, setNetwork] = useState<NetworkKey>("solana-devnet");

  const [name, setName] = useState("Tech Token");
  const [symbol, setSymbol] = useState("TECH");
  const [decimals, setDecimals] = useState("9");
  const [iconUrl, setIconUrl] = useState("");
  const [metadataUrl, setMetadataUrl] = useState("");
  const [description, setDescription] = useState(
    "TECH — cross-chain demo token.",
  );
  const [totalSupply, setTotalSupply] = useState("1000000");
  const [usdtRate, setUsdtRate] = useState("10");

  const [deploying, setDeploying] = useState(false);
  const [deployResult, setDeployResult] = useState<DeployResult | null>(null);
  const [resultRegion, setResultRegion] = useState<"deploy" | "remove" | null>(null);

  const [deployments, setDeployments] = useState<DeploymentRecord[] | null>(null);
  const [removing, setRemoving] = useState<NetworkKey | null>(null);

  const [status, setStatus] = useState("");
  const [copied, setCopied] = useState(false);

  const loadDeployments = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/deployments");
      if (!res.ok) throw new Error("Failed to load deployments");
      setDeployments((await res.json()) as DeploymentRecord[]);
    } catch (error) {
      setDeployments([]);
      setStatus(
        `❌ ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDeployments();
  }, [loadDeployments]);

  const handleDeploy = async () => {
    setDeploying(true);
    setDeployResult(null);
    setResultRegion(null);
    setStatus("");
    try {
      const res = await fetch("/api/admin/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chain: "solana",
          network,
          name,
          symbol,
          decimals: Number(decimals),
          iconUrl: iconUrl.trim() || null,
          metadataUrl: metadataUrl.trim() || null,
          description: description.trim() || null,
          totalSupply: totalSupply.trim(),
          usdtRate: Number(usdtRate),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Deployment failed");
      }
      setDeployResult(data as DeployResult);
      setResultRegion("deploy");
      setStatus("🎉 Token deployed successfully!");
      loadDeployments();
    } catch (error) {
      setStatus(
        `❌ ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      setDeploying(false);
    }
  };

  const handleRemove = async (record: DeploymentRecord) => {
    if (
      !window.confirm(
        `Remove TECH from ${getNetwork(record.network).label}?\n\n` +
          "This burns the shop balance, revokes mint authority, " +
          "removes it from the registry, and stops the app using it.\n\n" +
          "On-chain addresses cannot be fully deleted. Continue?",
      )
    ) {
      return;
    }

    setRemoving(record.network);
    setResultRegion(null);
    try {
      const res = await fetch("/api/admin/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chain: "solana", network: record.network }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Removal failed");
      }
      setResultRegion("remove");
      setRemoveResult(data as RemoveResult);
      setStatus("🗑️ Token removed.");
      loadDeployments();
    } catch (error) {
      setStatus(
        `❌ ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      setRemoving(null);
    }
  };

  const [removeResult, setRemoveResult] = useState<RemoveResult | null>(null);

  const preset = getNetwork(network);
  const statusClass = status.includes("❌")
    ? "bg-red-50 border border-red-200 text-red-700"
    : status.includes("🎉") || status.includes("✅") || status.includes("🗑️")
      ? "bg-green-50 border border-green-200 text-green-700"
      : "bg-blue-50 border border-blue-200 text-blue-700";

  const tabButton = (key: typeof tab, label: string) => (
    <button
      key={key}
      onClick={() => {
        setTab(key);
        setResultRegion(null);
      }}
      className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
        tab === key
          ? "bg-gray-900 text-white shadow-sm"
          : "text-gray-600 hover:bg-gray-100"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-900 text-xl shadow-sm transition-transform hover:scale-105"
            >
              🏠
            </Link>
            <div>
              <h1 className="text-lg font-bold leading-tight text-gray-900">
                TECH Token Admin
              </h1>
              <p className="text-xs text-gray-500">
                Deploy, configure and remove the TECH token on Solana
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-600 sm:inline-flex">
              ⚙️ Server admin console
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex gap-2 border-b border-gray-200 pb-3">
          {tabButton("deploy", "🚀 Deploy Token")}
          {tabButton("remove", "🗑️ Remove Token")}
          {tabButton("guides", "📖 Admin Guide")}
        </div>

        {/* ────────────────────────── DEPLOY ────────────────────────── */}
        {tab === "deploy" && (
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <section className="rounded-xl border border-gray-200 bg-white p-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-gray-900">
                    🚀 Deploy TechToken
                  </h2>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                    {preset.label}
                  </span>
                </div>

                {/* Network */}
                <div className="mt-4">
                  <label htmlFor="network-select" className={labelClass}>
                    Network
                  </label>
                  <select
                    id="network-select"
                    value={network}
                    onChange={(event) => {
                      const value = event.target.value;
                      if (isNetworkKey(value, "solana")) setNetwork(value);
                    }}
                    className={inputClass}
                  >
                    {networksForChain("solana").map((presetOption) => (
                      <option key={presetOption.key} value={presetOption.key}>
                        {presetOption.label} — {presetOption.kind === "mainnet" ? "mainnet" : "testnet"}
                        {presetOption.kind === "mainnet" ? " ⚠️ real funds" : ""}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-[11px] text-gray-400">
                    RPC: {preset.rpcUrl}
                  </p>
                </div>

                {/* Token metadata */}
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="token-name" className={labelClass}>
                      Token name
                    </label>
                    <input
                      id="token-name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      maxLength={32}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="token-symbol" className={labelClass}>
                      Symbol (≤ 10 chars)
                    </label>
                    <input
                      id="token-symbol"
                      value={symbol}
                      onChange={(event) => setSymbol(event.target.value)}
                      maxLength={10}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="token-decimals" className={labelClass}>
                      Decimals
                    </label>
                    <input
                      id="token-decimals"
                      type="number"
                      min="0"
                      max="9"
                      value={decimals}
                      onChange={(event) => setDecimals(event.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="token-icon" className={labelClass}>
                      Icon URL (image)
                    </label>
                    <input
                      id="token-icon"
                      placeholder="https://…/tech.png"
                      value={iconUrl}
                      onChange={(event) => setIconUrl(event.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label htmlFor="token-metadata" className={labelClass}>
                    Metadata JSON URL{" "}
                    <span className="font-normal text-gray-400">
                      (leave empty to auto-host it via this app)
                    </span>
                  </label>
                  <input
                    id="token-metadata"
                    placeholder="https://…/metadata.json"
                    value={metadataUrl}
                    onChange={(event) => setMetadataUrl(event.target.value)}
                    className={inputClass}
                  />
                </div>

                <div className="mt-4">
                  <label htmlFor="token-description" className={labelClass}>
                    Description
                  </label>
                  <textarea
                    id="token-description"
                    rows={2}
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    maxLength={200}
                    className={inputClass}
                  />
                </div>

                {/* Token economics */}
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="total-supply" className={labelClass}>
                      Total supply (minted to shop wallet)
                    </label>
                    <input
                      id="total-supply"
                      inputMode="decimal"
                      value={totalSupply}
                      onChange={(event) => setTotalSupply(event.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="usdt-rate" className={labelClass}>
                      1 {symbol || "TECH"} = ? USDT
                    </label>
                    <input
                      id="usdt-rate"
                      type="number"
                      min="0"
                      step="0.01"
                      value={usdtRate}
                      onChange={(event) => setUsdtRate(event.target.value)}
                      className={inputClass}
                    />
                    <p className="mt-1 text-[11px] text-gray-400">
                      Reference price anchor. Default: 1 TECH = 10 USDT.
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-[11px] leading-relaxed text-amber-800">
                  <strong>Before deploying:</strong> the server needs{" "}
                  <code className="font-mono">payer-keypair.json</code>{" "}
                  (already used by the demo) funded with enough{" "}
                  {preset.currency} on {preset.label}. Mint authority and shop
                  wallet = this keypair.
                </div>

                <button
                  onClick={handleDeploy}
                  disabled={deploying}
                  className={`${buttonPrimary} mt-4 bg-gray-900 hover:bg-gray-800`}
                >
                  {deploying
                    ? "Deploying… (3–4 txs)"
                    : `🚀 Deploy on ${preset.label}`}
                </button>

                {resultRegion === "deploy" && deployResult && (
                  <div className="mt-4">
                    <StatusCard messages={deployResult.messages} />
                    <EnvBlock
                      envLines={deployResult.envLines}
                      onCopied={() => {
                        setCopied(true);
                        setTimeout(() => setCopied(false), 1500);
                      }}
                    />
                    <p className="mt-2 text-[11px] text-gray-400">
                      {copied ? "✔️ Copied to clipboard." : "Click Copy, then follow the restart note above."}
                    </p>
                  </div>
                )}
              </section>
            </div>

            <div className="space-y-6">
              <section className="rounded-xl border border-gray-200 bg-white p-5">
                <h3 className="text-sm font-semibold text-gray-900">
                  🧭 How deployment works
                </h3>
                <ol className="mt-3 list-decimal space-y-2 pl-4 text-xs leading-relaxed text-gray-600">
                  <li>
                    Pick a network (Solana testnet or mainnet).
                  </li>
                  <li>
                    Configure token metadata: name, symbol, decimals, icon and
                    metadata URL.
                  </li>
                  <li>
                    Set the total supply (minted to the shop wallet) and the
                    TECH↔USDT reference rate (default 1 TECH = 10 USDT).
                  </li>
                  <li>
                    Click Deploy. The server signs ~2–4 transactions with the
                    shop wallet.
                  </li>
                  <li>
                    Copy the printed env vars into{" "}
                    <code className="font-mono">.env.local</code> and restart
                    the app to activate the token in the shop.
                  </li>
                </ol>

                <ExampleBlock
                  title="Example — token metadata JSON (GET /api/admin/metadata?chain=solana&network=solana-devnet)"
                  content={`{
  "name": "Tech Token",
  "symbol": "TECH",
  "description": "TECH — cross-chain demo token.",
  "image": "https://myapp.example.com/tech.png",
  "decimals": 9,
  "attributes": [
    {
      "trait_type": "Chain",
      "value": "Solana"
    },
    {
      "trait_type": "Network",
      "value": "Solana Devnet"
    },
    {
      "trait_type": "Total Supply",
      "value": "1000000"
    },
    {
      "trait_type": "Reference Price (USDT)",
      "value": "1 TECH = 10 USDT"
    }
  ]
}`}
                />
              </section>

              <section className="rounded-xl border border-gray-200 bg-white p-5">
                <h3 className="text-sm font-semibold text-gray-900">
                  📡 Server requirements
                </h3>
                <ul className="mt-3 space-y-2 text-xs leading-relaxed text-gray-600">
                  <li>
                    <code className="font-mono">payer-keypair.json</code> in the
                    repo root (mint authority + shop wallet).
                  </li>
                  <li>
                    The wallet must be funded with the network&apos;s gas
                    currency before deploying.
                  </li>
                </ul>

                <ExampleBlock
                  title="Example 1 — Solana: payer-keypair.json  (repo root; = the shop wallet / mint authority)"
                  content={`// Location: repo root / payer-keypair.json — a JSON array of 64 bytes
// (the ed25519 secret key). Loaded via Keypair.fromSecretKey().
// !! NEVER commit or share this file — it controls the mint. !!

[
  172, 206,  95, 132, 115, 168, 154, 133,
  225,  82,   4, 239, 161, 210, 121, 223,
  154, 171,  87, 139, 240, 231,  52, 169,
  151,  11, 137,  76, 246, 251,  45, 123,
  159, 125, 146,  11, 224,  24,  23,  21,
   24, 188, 128,  17, 227, 115, 230, 150,
  113, 145,  41, 138, 135, 153, 203,  12,
   79, 141, 235, 115, 176,  56, 111,  67
]

// EXAMPLE numbers only (shows the format). The real file is a fresh
// ed25519 secret key (see the "Create the Solana payer keypair" guide tab).
// Fund the wallet with SOL (faucet: https://faucet.solana.com/).`}
                />

                <ExampleBlock
                  title="Example 2 — full registry: data/token-deployments.json (after deploying on Solana)"
                  content={`[
  {
    "id": "solana-devnet",
    "chain": "solana",
    "network": "solana-devnet",
    "managed": true,
    "address": "<mint-address>",
    "name": "Tech Token",
    "symbol": "TECH",
    "decimals": 9,
    "iconUrl": null,
    "metadataUrl": "http://localhost:4125/api/admin/metadata?chain=solana&network=solana-devnet",
    "description": "TECH — demo token.",
    "totalSupply": "1000000",
    "usdtRate": 10,
    "owner": "<shop-wallet>",
    "shopWallet": "<shop-wallet>",
    "currency": "SOL",
    "deployTx": "4PnTfj6M2KsQ…QzB2wST1W",
    "deployedAt": "2026-08-29T12:00:00.000Z"
  }
]

// The app reads this file (GET /api/admin/deployments) to show the Remove tab,
// and the printed env vars (NEXT_PUBLIC_TOKEN_MINT / NEXT_PUBLIC_SHOP_WALLET)
// activate the matching token in the shop after a restart.`}
                />
              </section>
            </div>
          </div>
        )}

        {/* ────────────────────────── REMOVE ────────────────────────── */}
        {tab === "remove" && (
          <div className="mt-6">
            <section className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-900">
                  🗑️ Remove TECH token from a network
                </h2>
                <button
                  onClick={loadDeployments}
                  className="text-xs font-medium text-gray-600 hover:text-gray-900"
                >
                  ↻ Refresh
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Select a deployment below. Removal burns the shop&apos;s own
                token balance, revokes mint authority, removes it from the
                registry and tells you how to clear the app&apos;s env vars.
                Blockchain addresses themselves cannot be deleted.
              </p>

              {deployments === null ? (
                <p className="mt-4 rounded-lg border border-dashed border-gray-200 py-8 text-center text-sm text-gray-500">
                  Loading deployments…
                </p>
              ) : deployments.length === 0 ? (
                <p className="mt-4 rounded-lg border border-dashed border-gray-200 py-8 text-center text-sm text-gray-500">
                  No TECH deployments found. Deploy a token first, or wire one
                  up via .env.local (registered deployments appear here
                  automatically).
                </p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {deployments.map((record) => {
                    const preset = getNetwork(record.network);
                    return (
                      <li
                        key={record.id}
                        className="rounded-lg border border-gray-200 p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-medium text-purple-700">
                              🟣 Solana
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                preset.kind === "mainnet"
                                  ? "bg-red-50 text-red-700"
                                  : "bg-emerald-50 text-emerald-700"
                              }`}
                            >
                              {preset.label}
                            </span>
                            {!record.managed && (
                              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                                via .env
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => handleRemove(record)}
                            disabled={removing === record.network}
                            className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
                          >
                            {removing === record.network
                              ? "Removing…"
                              : `Remove from ${preset.label}`}
                          </button>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600">
                          <a
                            href={explorerAddressUrl(record.network, record.address)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="break-all font-mono text-blue-600 hover:underline"
                          >
                            {shorten(record.address, 12, 8)}
                          </a>
                          <span>
                            {record.name || "Tech Token"} ({record.symbol || "TECH"})
                          </span>
                          {record.totalSupply && (
                            <span>Supply: {record.totalSupply}</span>
                          )}
                          {record.usdtRate != null && (
                            <span>1 = {record.usdtRate} USDT</span>
                          )}
                          <span className="text-gray-400">
                            shop: {shorten(record.shopWallet, 6, 4)}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}

              {resultRegion === "remove" && removeResult && (
                <div className="mt-4">
                  <StatusCard messages={removeResult.messages} />
                  <EnvBlock
                    envLines={removeResult.envLines}
                    onCopied={() => {
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1500);
                    }}
                  />
                </div>
              )}
            </section>
          </div>
        )}

        {/* ────────────────────────── GUIDES ────────────────────────── */}
        {tab === "guides" && (
          <div className="mt-6 space-y-6">
            <section className="rounded-xl border border-gray-200 bg-white p-5">
              <h2 className="text-base font-semibold text-gray-900">
                📖 Admin Guide — deploying and removing the TECH token
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-gray-500">
                This guide walks you through the full lifecycle of the TECH
                token on Solana. Read the relevant section before you act —
                deploying is a real on-chain action that costs gas on the
                chosen network.
              </p>
            </section>

            <GuideSection
              title="1 · Prerequisites (all networks)"
              items={[
                [
                  "Install wallets",
                  `Everyone testing the shop needs the Phantom (Solana) wallet extension. The admin console itself runs on the server and never needs a browser wallet.`,
                ],
                [
                  "Prepare the server wallet",
                  "The shop wallet is the keypair stored in payer-keypair.json (the demo already created it). The server signs all admin transactions with it.",
                ],
                [
                  "Fund the shop wallet",
                  "The network needs its own native gas currency. Use the faucet below, then verify the balance. Nothing deploys with zero balance.",
                ],
                [
                  "Network endpoints",
                  "Defaults: Solana api.devnet/api.testnet/api.mainnet-beta.solana.com. Override via env vars if needed.",
                ],
              ]}
            />

            <GuideSection
              title="2 · Create the Solana payer keypair"
              items={[
                [
                  "What it is",
                  "payer-keypair.json lives in the repo root and IS the Solana shop wallet: it becomes the mint authority and the shop wallet for any Solana deployment. Content = a JSON array of 64 bytes (ed25519 secret key). It is read server-side only — the Admin Panel requires it to already exist and will error if it's missing.",
                ],
                [
                  "Option A — generate just the key (recommended before an Admin Panel deploy)",
                  "Run the one-liner below. It creates payer-keypair.json in the repo root and prints the wallet address. This is all you need before deploying from this console — the console mints its own new token.",
                  `npx tsx -e "import { Keypair } from '@solana/web3.js'; import fs from 'fs'; const kp = Keypair.generate(); fs.writeFileSync('payer-keypair.json', JSON.stringify(Array.from(kp.secretKey))); console.log('Wallet:', kp.publicKey.toString());"`,
                ],
                [
                  "Option B — Solana CLI",
                  "solana-keygen new --outfile payer-keypair.json writes the same 64-byte array format and prints the public key. (Install the Solana toolchain if you don't have it.)",
                ],
                [
                  "Fund it",
                  "The panel refuses to deploy with less than 0.02 SOL on the wallet. Devnet faucet: https://faucet.solana.com/ (paste the printed public key). Mainnet needs real SOL.",
                ],
                [
                  "Security",
                  "payer-keypair.json is a live private key. Never commit it, never send it to anyone, and keep it only on the machine running the app (.gitignore already skips it — verify with git status after creating).",
                ],
              ]}
            />

            <GuideSection
              title="3 · Deploy on Solana"
              items={[
                [
                  "1. Choose the network",
                  "In the Deploy tab pick chain = Solana, then a network: Solana Devnet (testnet), Solana Testnet (testnet), or Solana Mainnet (real funds).",
                ],
                [
                  "2. Fund the shop wallet",
                  "The server reads payer-keypair.json. Top it up with the network's SOL. Devnet faucet: https://faucet.solana.com/ (paste the wallet address). Mainnet requires buying/transferring real SOL.",
                ],
                [
                  "3. Fill token metadata",
                  "Name (≤ 32 chars) and symbol (≤ 10 chars) are stored on-chain via Metaplex. Decimals must be 0–9 for SPL. The icon URL is embedded in the metadata JSON; the metadata JSON URL defaults to a JSON this app serves at /api/admin/metadata?chain=solana&network=….",
                ],
                [
                  "4. Set token economics",
                  "Total supply is minted to the shop wallet at deploy time. The USDT rate (default 1 TECH = 10 USDT) is recorded as the reference price.",
                ],
                [
                  "5. Deploy",
                  "Click Deploy. The server creates the mint, registers on-chain metadata, creates the shop token account and mints the total supply (3–4 transactions).",
                ],
                [
                  "6. Activate in the app",
                  "Copy NEXT_PUBLIC_TOKEN_MINT and NEXT_PUBLIC_SHOP_WALLET into .env.local, then restart the app. The mint address, shop balance and supply will now show on the Solana shop page.",
                ],
              ]}
            />

            <GuideSection
              title="4 · Swap pricing (USDT-anchored)"
              items={[
                [
                  "Why a USDT anchor?",
                  "The shop sells TECH for SOL, not USDT directly. Next.js pricing routes (lib/pricing.ts) anchor TECH to USDT (NEXT_PUBLIC_TECH_USDT_RATE, default 10) and convert to SOL through the live CoinGecko price, cached 60s.",
                ],
                [
                  "Live rate fallbacks",
                  "If the CoinGecko quote is offline, NEXT_PUBLIC_SOL_USDT_RATE (default 150) is used instead. If unset, the buy section disables when the live quote is unavailable.",
                ],
                [
                  "Where to set them",
                  "In .env.local, alongside the mint values. They are read at app start, so restart the app after changing them.",
                ],
              ]}
            />

            <GuideSection
              title="5 · Remove TECH from a network"
              items={[
                [
                  "What happens",
                  "The server burns the shop's own token balance, closes the shop token account (refunding rent), and permanently revokes mint + freeze authority. The token can never be minted again. The mint address remains visible on-chain because wallets still hold tokens — it cannot be deleted while supply exists.",
                ],
                [
                  "Registry",
                  "The deployment is removed from the admin registry. The result view shows which .env.local lines to remove so the app stops pointing at the old token.",
                ],
                [
                  "⚠️ Warning",
                  "Removal is permanent and costs gas. Tokens held by users are not recoverable by you. Use only on testnets first.",
                ],
              ]}
            />

            <GuideSection
              title="6 · Security notes"
              items={[
                [
                  "Private keys stay server-side",
                  "payer-keypair.json is only read by the Node server. Never expose it in client code or commit it to git (.env* and payer-keypair.json should stay ignored).",
                ],
                [
                  "This console has no authentication",
                  "It is a demo. Anyone who can reach the server URL can trigger deployments and removals. Put it behind a login/VPN before exposing it on a mainnet.",
                ],
                [
                  "Mainnet is expensive and irreversible",
                  "Test the whole flow on Solana devnet first. A mainnet deployment burns real gas and, once live, cannot be silently taken back.",
                ],
              ]}
            />
          </div>
        )}
      </main>

      <footer className="mt-8 text-center text-xs text-gray-400">
        <p>
          Admin console · Solana (devnet / testnet / mainnet-beta)
        </p>
      </footer>

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

function GuideSection({
  title,
  items,
}: {
  title: string;
  items: [string, string, string?][];
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      <div className="mt-3 space-y-4">
        {items.map(([heading, body, code]) => (
          <div key={heading}>
            <p className="text-xs font-semibold text-gray-700">{heading}</p>
            <p className="mt-1 text-xs leading-relaxed text-gray-600">{body}</p>
            {code && (
              <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-lg bg-gray-900 p-3 text-[11px] leading-relaxed text-green-300">
                {code}
              </pre>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}