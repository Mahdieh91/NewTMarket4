# 🛒 TECH Token Shop

A full-stack **Solana token storefront demo**: the same shopping experience running on **Solana (SPL token, devnet)**, built with **Next.js (App Router)**, **React**, and **TypeScript**. Users connect a wallet (Phantom), buy products with TECH tokens, buy TECH with SOL, and admins can deploy/remove tokens and mint/burn real tokens on-chain from the UI. Every order is recorded with accounting-grade detail (base-unit amounts, double-entry ledger legs, both transaction signatures, status lifecycle) in a JSON file for demo purposes.

This README documents the **current app**, then gives a **comprehensive, step-by-step guide** for turning it into a production-ready application.

---

## Table of Contents

1. [Features](#1-features)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [How It Works — Data Flows](#4-how-it-works--data-flows)
5. [Environment Setup](#5-environment-setup)
6. [Running Locally](#6-running-locally)
7. [On-Chain Accounts](#7-on-chain-accounts)
8. [Admin Controls](#8-admin-controls)
9. [Data Model & Demo JSON Ledger](#9-data-model--demo-json-ledger)
10. [API Reference](#10-api-reference)
11. [Code Map](#11-code-map)
12. [Demo Limitations & Security Warnings](#12-demo-limitations--security-warnings)
13. [Production Readiness — Step-by-Step Guide](#13-production-readiness--step-by-step-guide)
14. [Verification & Troubleshooting](#14-verification--troubleshooting)

---

## 1. Features

### User-facing
- **One demo** — the landing page links to `/solana` (SPL token, Phantom).
- **Wallet connection** — Phantom on Solana (standard-wallet auto-discovery, official wallet-selection modal, `autoConnect`).
- **Product catalog** — 5 products with different prices: Ballpoint Pen (0.5), Coffee Mug (2), T-Shirt (5), Headphones (15), Smart Watch (25) TECH.
- **Editable price** — select any product and override its price in the input before buying (a "pay any amount" model, min 0.1 TECH).
- **Buy product with TECH** — the user's wallet signs a token transfer; the shop's token account receives the TECH. Verified with a pre-sign simulation and on-chain confirmation.
- **Buy TECH with SOL** — a two-step atomic-ish flow:
  1. User signs and sends a SOL transfer to the shop wallet.
  2. The server **verifies the payment on-chain** (checks the shop's pre/post balance, amount ≥ required) and then transfers TECH from the shop to the user.
- **Live SOL price** — the SOL/USDT quote is fetched live (CoinGecko, 60s cache) with a manual **↻ Refresh** button.
- **Live on-chain stats** — 4 stat cards: Total TECH Supply, Shop TECH Balance, Your TECH Balance, Exchange Rate (all read live from the chain).

### Admin (no wallet needed — server uses its own keypair)
- **Admin Console at `/admin`** — deploy, configure and remove the TECH token on Solana (devnet/testnet/mainnet-beta) with user-set metadata name/symbol/decimals, icon & metadata URL, total supply and a TECH↔USDT reference rate (default 1 TECH = 10 USDT). Includes a full admin guide. See [ADMIN.md](./ADMIN.md).
- **Edit Total TECH Supply** — mints or burns the delta on-chain.
- **Edit Shop TECH Balance** — same operation (both act on the shop's token account, so they move together on-chain).
- Safe rejection of values above the u64 limit (~18.4B tokens at 9 decimals) and invalid/zero/negative inputs.

### Ledger & history
- Every order is stored as an **accounting-grade record**: exact **base-unit** amounts (never floats), `status` lifecycle, product metadata, exchange rate, **both** SOL and TECH transaction signatures, and **double-entry ledger legs** (account · asset · credit/debit · amount · signature).
- History is persisted to `data/transactions.json` (demo store) and rendered in the UI with type/status badges, signed amounts, and per-signature links.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) — see note in `AGENTS.md` |
| UI | React 19, TypeScript, Tailwind CSS v4 |
| Solana RPC | `@solana/web3.js` 1.x (`clusterApiUrl("devnet")`) |
| Tokens | `@solana/spl-token` (mint, burn, transfer, ATA) |
| Wallets | `@solana/wallet-adapter-react` + `-react-ui` (standard-wallet auto-discovery) |
| Metadata | Metaplex token-metadata program — `createMetadataAccountV3` built manually in `app/lib/admin/spl-metadata.ts` |
| Storage (demo) | JSON files under `data/` via `app/lib/json-store.ts` |

---

## 3. Project Structure

```
├── app/
│   ├── layout.tsx                  # Root layout + global metadata
│   ├── page.tsx                    # Landing page: links to /solana and /admin
│   ├── providers.tsx               # Global providers (passthrough stub)
│   ├── solana/
│   │   ├── layout.tsx              # Wraps /solana in the Solana wallet provider
│   │   └── page.tsx                # Shop UI (catalog, buy with TECH/SOL, stats, ledger)
│   ├── admin/
│   │   └── page.tsx                # Admin console (deploy/remove, supply & balance, guides)
│   ├── components/
│   │   └── solana/wallet-provider.tsx  # ConnectionProvider + WalletProvider + modal
│   ├── api/
│   │   ├── pricing/route.ts            # GET { techUsdt, solUsdt }
│   │   ├── admin/
│   │   │   ├── deploy/route.ts         # POST deploy SPL token
│   │   │   ├── remove/route.ts         # POST remove deployment
│   │   │   ├── deployments/route.ts    # GET registry listing
│   │   │   └── metadata/route.ts       # GET on-chain metadata JSON
│   │   └── solana/
│   │       ├── token-state/route.ts    # GET live state · POST adjust (mint/burn)
│   │       ├── transactions/route.ts   # GET/POST order + ledger records
│   │       └── buy-tokens/route.ts     # POST verify SOL payment → transfer TECH
│   ├── lib/
│   │   ├── json-store.ts               # Shared readJson/writeJson helpers + data paths
│   │   ├── pricing.ts                  # TECH↔USDT rate, live SOL/USDT, lamport math
│   │   ├── admin/
│   │   │   ├── networks.ts             # Network presets + RPC/explorer helpers
│   │   │   ├── types.ts                # Deploy input/result types + helpers
│   │   │   ├── registry.ts             # data/token-deployments.json registry
│   │   │   ├── spl-metadata.ts         # Metaplex metadata instruction builder
│   │   │   └── solana-deploy.ts        # Deploy/remove engine (mint, ATA, supply, metadata)
│   │   └── solana/
│   │       └── token-admin.ts          # Server-only on-chain state, mint/burn adjust
│   └── services/
│       └── solana/token-service.ts     # Client-side token helper (currently unused)
├── data/
│   ├── token-deployments.json          # Deployment registry
│   └── transactions.json               # Order/ledger store
├── payer-keypair.json              # ⚠️ SECRET: Solana shop wallet = mint authority (server-only)
├── .env.local                      # Public + private env vars (see §5)
├── CODES.md                        # Per-file role reference for every TS/TSX file
└── package.json
```

---

## 4. How It Works — Data Flows

### 4.1 Buy a product (TECH → shop)

1. User picks a product (price editable) and clicks **Buy**.
2. Client ensures the user's associated token account (ATA) exists.
3. Client builds a `createTransferInstruction` (user ATA → shop ATA), **simulates** it, then has the wallet sign and send it (`skipPreflight`, `confirmed`).
4. Client confirms the transaction, refreshes balances + on-chain state.
5. Client records a `BUY_PRODUCT` order with two ledger legs:
   - user wallet → `debit` TECH
   - shop wallet → `credit` TECH

### 4.2 Buy TECH with SOL (two-step swap)

1. Client computes the payment from the TECH↔USDT reference rate and the live SOL/USDT quote: `requiredLamports = ceil(techBaseUnits × (TECH rate in USDT) ÷ (SOL price in USDT))`.
2. User signs/sends a plain SOL `SystemProgram.transfer` to the shop wallet.
3. Client calls `POST /api/solana/buy-tokens` with `{ userWallet, techBaseUnits, paymentSignature }`.
4. Server:
   - recomputes `requiredLamports` itself from the same (60s-cached, shared) SOL/USDT quote — never trusts the client's SOL figure,
   - fetches the payment tx from the chain and checks `meta.err` is null,
   - verifies the shop wallet is in the tx and its **pre→post balance delta ≥ required** (with a small tolerance for price ticks),
   - creates the buyer's ATA (paid for by the shop),
   - checks the shop's TECH balance is sufficient,
   - transfers TECH shop → buyer, confirms.
5. Client records a `BUY_TECH` order with **four** legs (SOL debit/credit + TECH debit/credit) and **both** signatures.

### 4.3 Admin adjustment (supply / shop balance)

1. Admin types a target value into either box and saves.
2. Server reads the current on-chain value, computes the delta, and **mints** (delta > 0) or **burns** (delta < 0) into/from the shop's token account using `payer-keypair.json` (the mint authority).
3. Because minting has to land somewhere, both totals move together — the two controls are two views of the same on-chain knob.
4. Records an `ADJUSTMENT` order (delta amount, action, tx signature, legs).

---

## 5. Environment Setup

Copy these into `.env.local` (or see `.env.example`):

```bash
# Solana (SPL token)
NEXT_PUBLIC_TOKEN_MINT=FD3QyXXZSYvRKYSw57Z6Bgy94RaTrpCjJe9ZyY3Ga27W
NEXT_PUBLIC_SHOP_WALLET=FchKhYxxwXhHMDEaiqjq9BCoYiqkHr9HtkqwNovrLUTT
NEXT_PUBLIC_TOKEN_DECIMALS=9
NEXT_PUBLIC_CLUSTER=devnet
NEXT_PUBLIC_TECH_USDT_RATE=10     # 1 TECH = 10 USDT (reference price)
NEXT_PUBLIC_SOL_USDT_RATE=150     # fallback if the live quote is offline
```

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_TOKEN_MINT` | The TECH SPL mint address (9 decimals) |
| `NEXT_PUBLIC_SHOP_WALLET` | Solana shop public key — receives SOL/TECH, holds inventory |
| `NEXT_PUBLIC_TOKEN_DECIMALS` | Token decimals (default 9) |
| `NEXT_PUBLIC_CLUSTER` | Solana cluster: `devnet` / `testnet` / `mainnet-beta` |
| `NEXT_PUBLIC_TECH_USDT_RATE` | Reference price of TECH in USDT (default 1 TECH = 10 USDT); the buy flow anchors on this |
| `NEXT_PUBLIC_SOL_USDT_RATE` | Fallback SOL/USDT price used only when the live CoinGecko quote is unreachable |

Optional overrides (see `.env.example`):

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_COINGECKO_API_URL` | Live SOL price oracle (default: CoinGecko `simple/price`) |
| `NEXT_PUBLIC_SOLANA_DEVNET_RPC_URL` / `…_TESTNET_RPC_URL` / `…_MAINNET_RPC_URL` | Comma-separated RPC fallback lists used by the admin console |

> `NEXT_PUBLIC_*` variables are embedded in the client bundle — they are public by design. The **private** material (`payer-keypair.json`) is read server-side only.

---

## 6. Running Locally

```bash
npm install
npm run dev        # starts on port 4125 (configured in package.json)
```

Open **http://localhost:4125**.

Other commands:
- `npm run build` — production build
- `npm run lint` — ESLint
- `npx tsc --noEmit` — TypeScript check

---

## 7. On-Chain Accounts

### Solana (devnet)

| Item | Value |
|---|---|
| Network | Solana Devnet |
| TECH mint | `FD3QyXXZSYvRKYSw57Z6Bgy94RaTrpCjJe9ZyY3Ga27W` |
| Decimals | 9 |
| Shop wallet (mint authority) | `FchKhYxxwXhHMDEaiqjq9BCoYiqkHr9HtkqwNovrLUTT` |
| Shop TECH token account (ATA) | created at deploy |

**Key files**
- `payer-keypair.json` — the Solana shop wallet secret key (server-only, mint authority).

---

## 8. Admin Controls

On the right column of the dashboard: **⚙️ Shop Management**.

- **Total TECH Available** — input a target; server mints/burns the difference.
- **Shop TECH Balance** — same, expressed as the shop's holdings.

Both mint/burn into the shop's ATA, so the two numbers move together on-chain. The server rejects:
- non-numeric / zero / negative inputs,
- targets above the **u64 max** (~18,446,744,073 tokens at 9 decimals),
- targets that would fail on-chain (e.g. burn more than held).

No wallet connection is needed — the server signs with the shop keypair (and pays the tx fees from the shop wallet).

Token **deployment and removal** live in the Admin Console at `/admin` — see [ADMIN.md](./ADMIN.md).

---

## 9. Data Model & Demo JSON Ledger

### 9.1 `TransactionRecord` (order + ledger)

```ts
type LedgerLeg = {
  account: string;            // wallet address | "minted → ..." | "burned ← ..."
  asset: "TECH" | "SOL";
  direction: "credit" | "debit";
  amountBaseUnits: string;    // exact, never float
  txSignature: string | null;
};

type TransactionRecord = {
  id: string;                 // order id (base36 timestamp + random)
  timestamp: string;          // server UTC ISO
  type: "BUY_PRODUCT" | "BUY_TECH" | "ADJUSTMENT";
  status: "submitted" | "verified" | "confirmed" | "finalized" | "failed";
  label: string;
  productId: string | null;
  productName: string | null;
  techBaseUnits: string | null;   // exact TECH amount in base units
  solLamports: string | null;     // exact SOL amount in lamports
  exchangeRate: number | null;    // TECH↔USDT reference rate at time of order
  userWallet: string | null;
  solSignature: string | null;    // the SOL payment tx (BUY_TECH)
  techSignature: string | null;   // the token tx
  detail: string;
  legs: LedgerLeg[];              // double-entry entries
};
```

### 9.2 Why base units?

SPL tokens use 9 decimals. Floats (`0.1 + 0.2 ≠ 0.3`) silently corrupt balances. All accounting math in this app is done in **base units as strings** (`humanToBaseUnits`), so records are exact and reconcilable.

### 9.3 Where it's stored

- Demo store: `data/transactions.json` via `POST /api/solana/transactions`.
- **Production**: this JSON file is the thing you replace with a real database — see §13.

---

## 10. API Reference

### `GET /api/solana/token-state`
Live on-chain state:
```json
{ "mint": "FD3QyXXZSYvRKYSw57Z6Bgy94RaTrpCjJe9ZyY3Ga27W", "decimals": 9, "supplyRaw": "100000000000", "shopBalanceRaw": "90000000000", "mintAuthority": "FchKhYxxwXhHMDEaiqjq9BCoYiqkHr9HtkqwNovrLUTT" }
```

### `POST /api/solana/token-state`
Body: `{ "supply": "6500" }` **or** `{ "shopBalance": "6391" }`.
Mints/burns the delta on-chain using the shop keypair. Returns:
```json
{ "state": { "…" }, "txSignature": "…", "action": "mint" | "burn" | "none", "amountRaw": "…", "target": "…" }
```

### `GET /api/solana/transactions` · `POST /api/solana/transactions`
`GET` returns `TransactionRecord`s from the JSON store (newest first).
`POST` body: any partial `TransactionRecord` (`type` required). Legacy fields (`techAmount`, `solAmount`, `wallet`, `txSignature`) are normalized automatically. Returns the stored record.

### `POST /api/solana/buy-tokens`
Body: `{ "userWallet": "<addr>", "techBaseUnits": "10000000000", "paymentSignature": "<SOL tx sig>" }`.
Server verifies the SOL payment on-chain, then transfers TECH from shop → user. Returns `{ "techSignature": "…" }`.

### `GET /api/pricing`
Returns `{ "techUsdt": 10, "solUsdt": 104.05 }` — the TECH↔USDT reference price plus the live SOL/USDT quote (CoinGecko, cached 60s).

### Admin routes
- `GET /api/admin/deployments` — deployment registry listing.
- `POST /api/admin/deploy` — body: `{ chain: "solana", network, name, symbol, decimals, totalSupply, usdtRate, … }` → deploys the SPL token.
- `POST /api/admin/remove` — body: `{ chain: "solana", network }` → burns/revokes/removes the deployment.
- `GET /api/admin/metadata?chain=solana&network=solana-devnet` — the app-hosted on-chain metadata JSON.

---

## 11. Code Map

All TypeScript/TSX files in `app/` (pages, API routes, libs, components) plus the `data/` stores are documented in **[CODES.md](./CODES.md)** with a per-file role table.

The former `scripts/` CLI folder has been **removed** — every operation it provided is available from the app itself (Admin Console + API routes), no terminal tooling needed.

---

## 12. Demo Limitations & Security Warnings

> Read this before doing anything production-facing.

1. **`payer-keypair.json` is a live private key and the mint authority.** It is now in `.gitignore`, but an earlier copy was committed to git history. Before sharing the repo, remove it from tracking and rotate the key:
   ```bash
   git rm --cached payer-keypair.json
   ```
   In production it must never sit on an app server that is also internet-facing (see §13 Phase 1).
2. **The JSON file store is not a database.** `data/transactions.json` is fine for a demo, but writes are not transactional, not multi-instance safe, and are lost on serverless/ephemeral filesystems.
3. **Admin endpoints are unauthenticated.** Anyone who can reach the server can mint/burn. Acceptable only on devnet.
4. **`NEXT_PUBLIC_*` values are public.** Never put secrets in `NEXT_PUBLIC_*`.
5. **Single-instance, best-effort buy flow.** The SOL→TECH swap is two transactions; if the process dies between them, a user could be left with paid SOL and no TECH. Production needs idempotency + a reconciliation worker (§13 Phase 5).
6. **Devnet RPC via `clusterApiUrl`** is rate-limited and can be flaky — fine for a demo.
7. **Numbers in the UI** (e.g. `techBalance` as `number`) are display conveniences; the ledger always stores exact base-unit strings.
8. **No auth/authorization, no rate limiting, no CSRF protection, no audit trail beyond the JSON.**

---

## 13. Production Readiness — Step-by-Step Guide

This is the full playbook for turning this demo into a real application. Follow the phases in order.

### Phase 0 — Decisions up front

Make these choices first (they change the design):

- **Mainnet vs devnet first?** Build and load-test on devnet; the move to mainnet is a config + key-custody change, not a code change.
- **Hosting:** Node-capable host (VPS, Railway, Fly, Render, or Next on a Node server). Avoid stateless serverless for the swap worker; the demo's `fs`-based store rules out serverless anyway.
- **Database:** PostgreSQL (below) for ledger + orders + products. Use Prisma/Drizzle as ORM.
- **Key custody model:** Where does the mint authority live? (See Phase 1 — this is the single most important decision.)
- **Compliance scope:** KYC/AML requirements, tax jurisdiction, refund policy. This determines how much user data you must collect and retain.

### Phase 1 — Secrets & key custody (do this FIRST)

1. **Rotate the demo key.** Create a fresh keypair for production; the demo mint authority stays on devnet.
2. **Never ship the private key in the bundle or repo.** Store it in a secret manager (Vault, AWS Secrets Manager, GCP Secret Manager, `sops`-encrypted file) and load it at boot:
   ```
   SHOP_KEYPAIR=<base58 or secret-manager ref>
   ```
3. **Move the mint authority off the app server.** Best practices, best → acceptable:
   - **Best:** mint authority = multisig (e.g. SPL Governance / Squads), so no single server can mint.
   - **Good:** mint authority = a dedicated "issuer" key in a custody product (Fireblocks, Hex Trust) or an HSM, with mint/burn executed out-of-band (admin CLI or scheduled job), not from the live app.
   - **Acceptable for MVP:** keep the issuer key in a secret manager, decrypt only inside a Node runtime, sign in-memory, never log it.
4. **Admins sign in separately from the app.** Admin mint/burn should require MFA + a signed approval step; log every admin action to an append-only audit table.
5. Rotate keys on a schedule; add `payer-keypair.json`, `*.json` key files, `.env*` to `.gitignore`; enable branch protection + secret scanning (e.g. GitHub push protection).

### Phase 2 — Database & schema

Replace `data/transactions.json` with PostgreSQL. Reference schema (extend as needed):

```sql
-- Orders / receipts (the umbrella row per user action)
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key TEXT UNIQUE NOT NULL,        -- prevents double delivery on retry
  type TEXT NOT NULL CHECK (type IN ('buy_product','buy_tokens','mint','burn','adjustment')),
  user_wallet TEXT REFERENCES users(wallet_address),
  product_id UUID REFERENCES products(id),
  tech_base_units NUMERIC(39,0),               -- exact, no float
  sol_lamports NUMERIC(39,0),
  exchange_rate NUMERIC(30,9),
  rate_version INT NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'submitted',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  block_time TIMESTAMPTZ,
  slot BIGINT
);

-- Double-entry ledger legs (the bookkeeping truth)
CREATE TABLE ledger_legs (
  id BIGSERIAL PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  account TEXT NOT NULL,                        -- wallet addr | 'shop' | 'minted' | 'burned'
  asset TEXT NOT NULL CHECK (asset IN ('TECH','SOL')),
  direction TEXT NOT NULL CHECK (direction IN ('credit','debit')),
  amount_base_units NUMERIC(39,0) NOT NULL,
  tx_signature TEXT,
  balance_after_base_units NUMERIC(39,0),       -- snapshot for fast reconciliation
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Products (the hard-coded PRODUCTS array becomes a table)
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  emoji TEXT,
  price_base_units NUMERIC(39,0) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Status lifecycle (append-only event log per order)
CREATE TABLE order_events (
  id BIGSERIAL PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Users (wallet-bound; see Phase 4)
CREATE TABLE users (
  wallet_address TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login_at TIMESTAMPTZ,
  kyc_status TEXT DEFAULT 'pending'
);
```

Migration steps:
1. Add the ORM (Prisma/Drizzle) and migrate.
2. Point the transactions store and the buy flows at the ORM instead of `json-store.ts`.
3. Add indexes on `orders(idempotency_key)`, `orders(user_wallet)`, `ledger_legs(account, asset, created_at)`.
4. **Append-only discipline:** never `UPDATE` an order's final status or delete a ledger leg; add `order_events` rows instead.

### Phase 3 — Ledger & accounting discipline

1. **Store base units only.** Use `NUMERIC(39,0)` / `BIGINT`; parse with the existing `humanToBaseUnits` logic server-side. Never persist a float.
2. **Lifecycle states:** `submitted → verified → confirmed → finalized`, or `failed`/`reverted` with reason. Only treat `finalized` as settled for accounting.
3. **Double-entry invariant:** every order posts balanced legs (Σ credits = Σ debits). Add a test/constraint that enforces balance per order.
4. **One-sided funds handling:** in the SOL→TECH swap, the SOL leg and TECH leg confirm separately. Store both statuses; a reconciliation worker detects SOL-credited-but-TECH-not-delivered and resolves (deliver or refund).
5. **Daily reconciliation job:** pull on-chain history for the mint and shop wallet (via an indexer — Helius DAS, QuickNode, or `getSignaturesForAddress`) and diff against `ledger_legs` sums per day. Alert on mismatch.
6. **Idempotency:** client sends one `idempotency_key` per purchase intent; the DB unique constraint makes retries safe (return the original order, don't re-deliver).
7. **Audit trail:** `order_events` for status changes + admin action log. Timestamps in UTC; store Solana `block_time`/`slot` for on-chain correlation.

### Phase 4 — Wallet-bound authentication & authorization

The demo trusts whatever wallet address the client sends. Production must bind the session to the wallet.

1. **Sign In With Solana (SIWS):** on connect, request a `signMessage` (message = nonce + domain + timestamp). Verify the recovered pubkey matches the claimed address.
2. **Issue a session:** store the verified wallet → user row; issue a short-lived JWT/session cookie signed by the server. Every API call authenticates from the session, **not** from a client-supplied address.
3. **Admin role:** separate role + MFA on top of wallet auth for mint/burn/adjust endpoints. Middleware enforces it (e.g. Next.js `middleware.ts` or route guards).
4. **Rate limiting & abuse protection:** limit per-wallet purchase frequency and volume (Redis-based), CAPTCHA on high-value actions, and blocklist/flagging for repeat failures.
5. **CSRF:** for cookie-based sessions, use `SameSite=strict` + CSRF tokens on state-changing endpoints.
6. **Account abstraction alternative:** if the user experience matters more than self-custody, evaluate wallet-as-a-service / MPC wallets (e.g. Coinbase Wallet SDK, Privy, Turnkey) — your backend then controls the keys and `signMessage` semantics change accordingly.

### Phase 5 — Harden the buy flows

**Buy product (TECH → shop):**
1. Re-derive everything server-side: product price from DB (never from the client), converted to base units.
2. Verify the user's TECH balance server-side before building the tx (or rely on the transfer failing atomically — token transfers are atomic, so a shortfall simply fails the tx; still, check for a clean error).
3. Confirm with `finalized` for the receipt; store `block_time` + `slot`.
4. Handle the wallet-rejected and insufficient-funds error paths with clear UX (already partially present).

**Buy TECH with SOL (the risky two-step):**
1. **Idempotency key** generated on the client once; server rejects a duplicate (Phase 3.6).
2. **Replay protection:** keep a unique index on `paymentSignature`; if that SOL tx was already redeemed, return the existing order (don't deliver twice).
3. **Verify thoroughly** (already implemented, keep it): recompute `requiredLamports` server-side; fetch the payment tx; require `meta.err == null`; require shop wallet present; require `post − pre ≥ required`.
4. **Confirm at `finalized`** before crediting TECH, or confirm at `confirmed` + mark the order `pending_reconciliation` until a worker re-confirms.
5. **Refund path:** if TECH delivery fails after SOL was received (insufficient shop balance, RPC failure, etc.), either queue a retry worker or refund the SOL automatically; log both outcomes to `order_events`.
6. **Better long-term:** replace the two-step with a single atomic flow — a small on-chain program (escrow/swap) or an indexer-driven "payment detected → release tokens" pattern so SOL-in and TECH-out are tied to one trigger. (For a first product, the two-step + worker is acceptable.)
7. **Rate checks:** store `exchange_rate` + `rate_version` on the order; if the rate changes mid-flight, reject or use the rate at order creation time.

### Phase 6 — Product catalog & orders

1. Move `PRODUCTS` from code into the `products` table; add `admin` CRUD endpoints for managing prices/inventory.
2. Add **inventory** if products are physical/limited: `qty` column, decrement within a transaction, release on failure, restock policy.
3. Store order line items (`order_items`) rather than a single product reference, so future multi-item carts work.
4. Generate printable/exportable receipts (order id + explorer links + amounts in both base units and human units).

### Phase 7 — Admin controls (mint/burn)

1. Gate behind the admin role + MFA (Phase 4.3).
2. **Move execution out of the hot path** as discussed in Phase 1.3. If you must keep it in the app, add:
   - a rate limit (e.g. max 1 adjustment / minute),
   - a two-step confirm ("type the target again"),
   - an immutable audit log (admin, before/after supply, signature).
3. Reject targets that exceed u64 / mint cap (already implemented — keep the MAX_U64 check and the human-readable error).
4. Consider a **circuit breaker**: if the shop balance drops below a floor (or the day's net mint exceeds a budget), block further minting and alert.

### Phase 8 — Observability, testing & reliability

- **Logging:** structured JSON logs (pino/winston) per flow: order id, wallet, amounts, signatures, status, latency. Never log secrets.
- **Metrics:** counters/gauges for orders per status, SOL received per day, TECH delivered per day, mint/burn ops, error rates; a dashboard (Grafana/Datadog) + alerts on: failed swaps, one-sided funds, reconciliation mismatches, RPC failure rate.
- **Error reporting:** Sentry for both client and server.
- **Testing:**
  - Unit: `humanToBaseUnits` edge cases, `requiredLamports` ceil math, validation.
  - Integration: run against [solana-test-validator](https://docs.anza.xyz/cli/install) or [Bankrun](https://github.com/anza-xyz/solana-bankrun) to test buy/adjust flows without touching devnet.
  - E2E: Playwright driving the real UI (connect with an injected test wallet) — cover connect, buy product, buy TECH, admin adjust, empty states.
  - Security: `npm audit`, dependency scanning, review the routes with a threat model (unauthenticated admin, replay, one-sided funds, rate abuse).
- **RPC:** replace `clusterApiUrl("devnet")` with a paid provider (Helius, QuickNode, Triton) + a failover list; confirm at `finalized` for money movement; add retries with exponential backoff.

### Phase 9 — Deployment

1. **Environment:** all secrets in the platform's secret store; build-time `NEXT_PUBLIC_*` for public values; `NODE_ENV=production`.
2. **Runtime:** Node runtime (not Edge) everywhere a server-side keypair is loaded; persistent storage for the DB (managed Postgres).
3. **Scaling:** stateless app servers + Postgres + Redis (rate limits, idempotency cache, queues). The worker that executes TECH delivery / refunds runs as a separate process (or cron) so it isn't tied to request timeouts.
4. **CI/CD:** lint → typecheck → unit/integration tests → build → deploy; secret scan on every push.
5. **Backups & DR:** nightly DB backups with point-in-time recovery; documented runbooks for failed swaps and key rotation.
6. **Domain/TLS:** HTTPS everywhere; CSP and security headers; keep the explorer links server-rendered.

### Phase 10 — Compliance & operations

- **KYC/AML** where required: wallet identity verification before purchase, transaction monitoring, reporting thresholds.
- **Tax/records:** retain the immutable ledger per your jurisdiction (the double-entry legs + block_time + receipts are designed for this); export tooling.
- **User terms:** purchase agreement, refunds policy (relevant to the swap flow), fee disclosure.
- **Data retention & deletion** for user PII; privacy policy.
- **Operations runbook:** how to respond to a failed swap, a burn with insufficient balance, an RPC outage, a mint authority compromise.

### Migration map — demo → production

| Demo file/behavior | Production replacement |
|---|---|
| `data/transactions.json` + `json-store.ts` | PostgreSQL (`orders`, `ledger_legs`, `order_events`) via ORM |
| `payer-keypair.json` on server | Secret manager + HSM/multisig/custody; mint out-of-band |
| `POST /api/solana/token-state` unauthenticated | Admin role + MFA + rate limit + audit log |
| Client-supplied `userWallet` | Wallet-bound session (SIWS) + JWT |
| `PRODUCTS` const in `page.tsx` | `products` table + admin CRUD |
| `clusterApiUrl("devnet")` | Paid RPC + failover, `finalized` confirmations |
| Two-step SOL→TECH, best-effort | Idempotency keys, replay protection, refund/retry worker, reconciliation |
| Float display math in UI | Base-unit strings end-to-end (UI formats only) |
| Devnet mint authority on app server | Rotated, custody-controlled authority |
| Manual testing | Unit + Bankrun integration + Playwright E2E + CI |
| None | Observability (logs, metrics, alerts, Sentry) |
| None | Compliance: KYC/AML, tax retention, terms, refunds |

---

## 14. Verification & Troubleshooting

### Commands
```bash
npx tsc --noEmit   # typecheck
npm run lint       # lint — 7 pre-existing problems (6 errors, 1 warning) in app/solana/page.tsx, untouched
```

### Common issues

| Symptom | Cause / fix |
|---|---|
| `WalletNotSelectedError` on connect | The connect button used to call `connect()` directly with no adapter selected. Now it opens the wallet-selection modal (standard wallets auto-discover Phantom). If you still see it, clear site data / ensure a standard wallet is installed. |
| "Shop token account does not exist" | Shop ATA not created yet. Deploy via the Admin Console, or adjust supply/balance (any mint op creates it), or call `POST /api/solana/buy-tokens` once. |
| "Shop does not have enough TECH balance" | Mint more into the shop: Admin Console → **Shop Management → Save Total**, or `POST /api/solana/token-state` with `{ "shopBalance": "<target>" }`. |
| `Target too large. The maximum is …` | Value exceeds u64 at 9 decimals (~18.4B TECH). The server rejects it by design. |
| Payment sim fails / insufficient funds | The buyer needs SOL for fees in their wallet (devnet SOL via a faucet). |
| Status toast shows generic error | Each flow logs detailed errors to the browser console (`❌ …`). |
| JSON file history lost | Only relevant in serverless/ephemeral hosting — move to a DB (Phase 2). |

---

*Demo app — devnet only. Do not attach real value until you have completed Phase 0–10.*
