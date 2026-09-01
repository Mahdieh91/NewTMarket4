# CODES.md — Code & Script Reference

Every TypeScript / TSX file in `app/` (with subdirectories) and the main data files under `data/`.
Non-code assets (e.g. `app/globals.css`, `app/favicon.ico`) are intentionally skipped.

## Pages & Layouts

| File | Role |
|---|---|
| `app/layout.tsx` | Root layout. Sets global metadata ("TECH Token Shop"), loads the Inter font and `globals.css`; wraps every route in `<html>/<body>`. |
| `app/page.tsx` | Landing page (`/`). A single card linking to the `/solana` demo plus a link into the `/admin` console. |
| `app/providers.tsx` | Global client providers wrapper. Currently a passthrough stub (`<>{children}</>`), kept as the mounting point for future providers. |
| `app/solana/layout.tsx` | Layout for the `/solana` shop route; wraps children in the Solana `WalletContextProvider`. |
| `app/solana/page.tsx` | **Shop frontend** (`/solana`, client). Connect Phantom wallet, buy products with TECH, buy TECH with SOL (live CoinGecko quote + manual refresh button), view token state/supply, submit transactions, and log them to the local ledger. |
| `app/admin/page.tsx` | **Admin console** (`/admin`). Deploy form, deployment list, remove action, on-chain metadata view, supply & shop-balance adjustment, and step-by-step setup guides (keypair, deploy, funding). |

## Components

| File | Role |
|---|---|
| `app/components/solana/wallet-provider.tsx` | React context provider for `@solana/wallet-adapter`: `ConnectionProvider` (devnet) → `WalletProvider` (auto-connect) → `WalletModalProvider`. Phantom and other standard wallets are auto-discovered — no explicit adapters are registered. |

## Client Services

| File | Role |
|---|---|
| `app/services/solana/token-service.ts` | Client-side helper `createBuyTransaction()` that builds an SPL TECH-transfer transaction (payer → shop). **Currently unused**: no page imports it (the shop page builds its own transaction); kept for reference. |

## API Routes (Next.js route handlers)

| File | Role |
|---|---|
| `app/api/pricing/route.ts` | `GET` → returns the price payload `{ techUsdt, solUsdt }` used by the shop page. `techUsdt` from env, `solUsdt` live from CoinGecko (env fallback). |
| `app/api/solana/token-state/route.ts` | `GET` → current token state (mint, decimals, supply, shop balance, mint authority). `POST` → set a new target for `supply` or `shopBalance` (mints or burns TECH on-chain). |
| `app/api/solana/buy-tokens/route.ts` | `POST` → the SOL→TECH exchange. Validates the received SOL payment to the shop wallet (verifies the tx on-chain), ensures the buyer has a TECH token account, checks shop TECH balance, then transfers TECH to the buyer. Uses `payer-keypair.json` as the server-side shop wallet. |
| `app/api/solana/transactions/route.ts` | `GET` → return the full transaction ledger from `data/transactions.json`. `POST` → append a normalized `TransactionRecord` (BUY_PRODUCT / BUY_TECH / ADJUSTMENT) to the ledger. |
| `app/api/admin/deploy/route.ts` | `POST` → validate chain/network/decimals, build a `DeployFormInput`, and call `deploySolanaToken()`. Solana-only. |
| `app/api/admin/deployments/route.ts` | `GET` → list all registered deployments (persisted + env-derived ones) from `data/token-deployments.json`. |
| `app/api/admin/remove/route.ts` | `POST` → validate the Solana network and call `removeSolanaToken()` to unregister (and optionally destroy) a deployment. |
| `app/api/admin/metadata/route.ts` | `GET` → serve the on-chain token metadata JSON (name, symbol, description, image, decimals, attributes) for a registered `chain`/`network`. |

## Libraries (server-side logic)

| File | Role |
|---|---|
| `app/lib/json-store.ts` | Tiny JSON file persistence layer (read/write atomic helpers) used for `data/transactions.json` (and the reserved `data/shop-state.json`). |
| `app/lib/pricing.ts` | Pricing math: `TECH_USDT_RATE` (from env, default 10), `getSolUsdtRate()` (live CoinGecko, 60s cache, `NEXT_PUBLIC_SOL_USDT_RATE` fallback), and integer micro-unit conversions (`techRawToLamports`, `rateToMicro`, `ceilDiv`) so payments never use floats. |
| `app/lib/solana/token-admin.ts` | On-chain token administration: `getTokenState()` (mint/supply/shop balance) and `adjustSupply`/`adjustShopBalance` which mint or burn TECH to reach a target, signing with the shop keypair from `payer-keypair.json`. |
| `app/lib/admin/networks.ts` | Solana network presets (devnet/testnet/mainnet-beta): RPC URLs (env-overridable, comma-separated fallback), explorer URL builders, `parseRpcUrls`, `isNetworkKey`/`getNetwork` helpers. |
| `app/lib/admin/types.ts` | Shared admin types (`DeployFormInput`, `DeployResult`, `RemoveResult`) plus `humanToBaseUnits()` and `parseUsdtRate()` helpers. |
| `app/lib/admin/registry.ts` | Deployment registry: `listDeployments` (merges persisted records with env-derived `NEXT_PUBLIC_TOKEN_MINT`/`NEXT_PUBLIC_SHOP_WALLET` ones), `getDeployment`, `saveDeployment`, `removeDeployment`. |
| `app/lib/admin/spl-metadata.ts` | Raw Metaplex token-metadata instructions: computes the metadata PDA and builds/sends `CreateMetadataAccountV3` to attach name/symbol/uri to an existing SPL mint using the mint authority. |
| `app/lib/admin/solana-deploy.ts` | The admin deploy/remove engine: `deploySolanaToken()` creates a new SPL mint + shop token account, mints the requested supply, attaches on-chain metadata, persists the registry record and prints `.env` lines; `removeSolanaToken()` unregisters and optionally destroys the mint & metadata. Loads the shop wallet from `payer-keypair.json`. |

## Data Store (database files)

| File | Role |
|---|---|
| `data/token-deployments.json` | Deployment registry data: one entry per token deployment (id, chain, network, mint `address`, name/symbol/decimals, icon/metadata URLs, total supply, USDT rate, owner/shop wallet, deploy tx, timestamp). Read/updated by `app/lib/admin/registry.ts` and the admin API. |
| `data/transactions.json` | Transaction ledger: chronological records of BUY_PRODUCT / BUY_TECH / ADJUSTMENT with status, amounts, signatures and double-entry `legs` (debit/credit per asset & account). Read/updated by `app/api/solana/transactions/route.ts`. |