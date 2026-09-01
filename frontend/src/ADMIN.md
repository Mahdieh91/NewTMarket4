# TECH Token Admin Console

The admin console (available at **`/admin`** in the running app) deploys,
configures and removes the TECH token on **Solana** — devnet, testnet and
mainnet-beta.

It is a server-side console: all transactions are signed on the server with
the shop wallet (`payer-keypair.json`). It does **not** need a browser wallet.

---

## 1. Quick start

1. Start the app: `npm run dev`
2. Open http://localhost:4125/admin
3. Make sure the server-side shop wallet is funded on the network you want:
   `payer-keypair.json` (repo root) — needs SOL (devnet faucet:
   https://faucet.solana.com/).
4. **Deploy tab** → pick a network → fill token metadata → set total supply &
   USDT rate → **Deploy**
5. Copy the printed env vars into `.env.local`, restart the app to activate.

---

## 2. What the console does

### Deploy

| | Solana |
| --- | --- |
| Networks | devnet · testnet · mainnet-beta |
| Token kind | SPL token + Metaplex metadata |
| Who signs | `payer-keypair.json` |
| Wallet roles | mint authority + shop wallet |
| On-chain ops | create mint, metadata, token account, mint supply |
| Supply | minted to shop at deploy (SPL, 0–9 decimals) |
| Metadata URL | default: `<app>/api/admin/metadata?chain=solana&network=…` |

Deployment results are written to `data/token-deployments.json` and the panel
prints the env lines to activate the token in the shop:

- `NEXT_PUBLIC_TOKEN_MINT`, `NEXT_PUBLIC_SHOP_WALLET`

After adding them, **restart the app** (these are `NEXT_PUBLIC_*` values read at
startup).

### Remove

| | Solana |
| --- | --- |
| Burn | shop token account balance burned |
| Close | shop token account closed (rent refunded) |
| Authority | mint + freeze authority permanently revoked |
| Registry | record removed |

Addresses already held by users stay on-chain; the shop can no longer mint or
hold them via the app. The panel prints which `.env.local` lines to delete.

### Env-derived "legacy" deployments

Deployments referenced directly via `NEXT_PUBLIC_TOKEN_MINT` /
`NEXT_PUBLIC_SHOP_WALLET` show up in the Remove tab automatically and can be
deregistered too.

---

## 3. Prerequisites & funding

- **Solana**: `payer-keypair.json` already exists (repo root). Devnet faucet:
  https://faucet.solana.com/ (paste the wallet address). Mainnet requires real
  SOL.

---

## 4. Token economics

The console records two things per deployment:

- **Total supply** — minted to the shop wallet at deploy time.
- **USDT rate** — the reference price, default **1 TECH = 10 USDT**.

The shop sells TECH at the **USDT-anchored swap price**: the client converts
the requested TECH → USDT via `NEXT_PUBLIC_TECH_USDT_RATE` (default 10), then
USDT → SOL via the **live CoinGecko quote** (cached 60s, fallback
`NEXT_PUBLIC_SOL_USDT_RATE`). The server re-verifies the exact payment itself,
so price ticks between the preview and the confirmation are handled with a
small tolerance.

---

## 5. Metadata

Solana on-chain metadata uses the Metaplex Token Metadata legacy
`createMetadataAccountV3` instruction (name/symbol/URI), built manually in
`app/lib/admin/spl-metadata.ts`. The URI defaults to the app-hosted JSON at
`/api/admin/metadata` unless you provide your own `metadataUrl`.

---

## 6. Security notes

- **Private keys stay server-side.** `payer-keypair.json` is never sent to the
  browser.
- **This console has no authentication** — it is a demo. Put it behind a
  login/VPN before exposing on a mainnet.
- **Mainnet is real.** Deploying and removing burn real gas and are largely
  irreversible. Test everything on devnet first.

---

## 7. Related files

| File | Purpose |
| --- | --- |
| `app/admin/page.tsx` | Admin console UI (Deploy / Remove / Guide tabs) |
| `app/api/admin/deploy/route.ts` | DEPLOY endpoint |
| `app/api/admin/remove/route.ts` | REMOVE endpoint |
| `app/api/admin/deployments/route.ts` | registry listing |
| `app/api/admin/metadata/route.ts` | app-hosted SPL metadata JSON |
| `app/lib/admin/networks.ts` | network presets & RPCs |
| `app/lib/admin/registry.ts` | deployment registry (`data/token-deployments.json`) |
| `app/lib/admin/solana-deploy.ts` | deploy/remove logic |
| `app/lib/admin/spl-metadata.ts` | Metaplex metadata instruction builder |
| `app/lib/solana/token-admin.ts` | on-chain state + mint/burn adjustment |

See `CODES.md` for the full per-file role table.
