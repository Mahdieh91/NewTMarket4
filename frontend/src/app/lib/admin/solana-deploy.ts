import fs from "fs";
import path from "path";

import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import {
  AuthorityType,
  burn,
  closeAccount,
  createMint,
  getAccount,
  getAssociatedTokenAddress,
  getMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  setAuthority,
} from "@solana/spl-token";
import {
  getNetwork,
  explorerAddressUrl,
  explorerTxUrl,
} from "./networks";
import type { NetworkPreset } from "./networks";
import {
  getDeployment,
  removeDeployment,
  saveDeployment,
  type DeploymentRecord,
} from "./registry";
import { createTokenMetadata } from "./spl-metadata";
import {
  humanToBaseUnits,
  type DeployFormInput,
  type DeployResult,
  type RemoveResult,
} from "./types";

const MIN_SOL_BALANCE = 0.02 * 1e9;

function loadShopKeypair(): Keypair {
  const keypairPath = path.join(process.cwd(), "payer-keypair.json");
  if (!fs.existsSync(keypairPath)) {
    throw new Error(
      "payer-keypair.json not found on the server. This file holds the shop " +
        "wallet that creates the mint and holds the mint authority. Create " +
        "and fund a keypair first (see the Admin Guide tab).",
    );
  }
  const secretKey = JSON.parse(fs.readFileSync(keypairPath, "utf8"));
  if (!Array.isArray(secretKey)) {
    throw new Error("payer-keypair.json is malformed (expected a secret-key array).");
  }
  return Keypair.fromSecretKey(new Uint8Array(secretKey));
}

async function buildMetadata(
  network: NetworkPreset,
  payer: Keypair,
  mint: PublicKey,
  input: DeployFormInput,
  metadataUri: string,
): Promise<string> {
  const connection = new Connection(network.rpcUrl, "confirmed");
  return createTokenMetadata(connection, payer, mint, {
    name: input.name,
    symbol: input.symbol,
    uri: metadataUri,
  });
}

function validateInput(input: DeployFormInput): void {
  if (!input.name || input.name.trim().length === 0) {
    throw new Error("Token name is required.");
  }
  if (input.name.trim().length > 32) {
    throw new Error("Token name must be 32 characters or fewer.");
  }
  if (!input.symbol || input.symbol.trim().length === 0) {
    throw new Error("Token symbol is required.");
  }
  if (input.symbol.trim().length > 10) {
    throw new Error("Token symbol must be 10 characters or fewer.");
  }
  if (!Number.isInteger(input.decimals) || input.decimals < 0 || input.decimals > 9) {
    throw new Error("SPL tokens support 0–9 decimals.");
  }
  if (!/^\d*\.?\d+$/.test(input.totalSupply.trim()) ||
      Number(input.totalSupply) <= 0) {
    throw new Error("Total supply must be a positive number.");
  }
}

export async function deploySolanaToken(
  input: DeployFormInput,
  metadataBaseUrl: string,
): Promise<DeployResult> {
  validateInput(input);

  const network = getNetwork(input.network);
  const payer = loadShopKeypair();
  const connection = new Connection(network.rpcUrl, "confirmed");

  const balance = await connection.getBalance(payer.publicKey);
  if (balance < MIN_SOL_BALANCE) {
    throw new Error(
      `The shop wallet (${payer.publicKey.toString()}) needs at least 0.02 ${network.currency} on ${network.label} to deploy. ` +
        `Current balance: ${(balance / 1e9).toFixed(4)} ${network.currency}. ` +
        `Fund it from a faucet first (see the Guides tab).`,
    );
  }

  const messages: string[] = [];

  const mint = await createMint(
    connection,
    payer,
    payer.publicKey,
    payer.publicKey,
    input.decimals,
  );
  messages.push(
    `✅ Mint created: ${mint.toString()}`,
    `   ${explorerAddressUrl(input.network, mint.toString())}`,
  );

  const metadataUri =
    input.metadataUrl?.trim() ||
    `${metadataBaseUrl}/api/admin/metadata?chain=solana&network=${input.network}`;

  const metadataSignature = await buildMetadata(
    network,
    payer,
    mint,
    input,
    metadataUri,
  );
  messages.push(
    `✅ On-chain metadata registered for “${input.name}” (${input.symbol}).`,
    `   Metadata JSON: ${metadataUri}`,
    `   Tx: ${explorerTxUrl(input.network, metadataSignature)}`,
  );

  const shopTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mint,
    payer.publicKey,
  );
  const supplyRaw = humanToBaseUnits(input.totalSupply, input.decimals);
  const supplySignature = await mintTo(
    connection,
    payer,
    mint,
    shopTokenAccount.address,
    payer,
    supplyRaw,
  );
  await connection.confirmTransaction(supplySignature, "confirmed");
  messages.push(
    `✅ Minted ${input.totalSupply} ${input.symbol} to the shop wallet (${payer.publicKey.toString()}).`,
    `   Tx: ${explorerTxUrl(input.network, supplySignature)}`,
  );

  const record: DeploymentRecord = {
    id: `${input.chain}-${input.network}`,
    chain: "solana",
    network: input.network,
    managed: true,
    address: mint.toString(),
    name: input.name,
    symbol: input.symbol,
    decimals: input.decimals,
    iconUrl: input.iconUrl || null,
    metadataUrl: metadataUri,
    description: input.description || null,
    totalSupply: input.totalSupply,
    usdtRate: input.usdtRate,
    owner: payer.publicKey.toString(),
    shopWallet: payer.publicKey.toString(),
    currency: network.currency,
    deployTx: metadataSignature,
    deployedAt: new Date().toISOString(),
  };
  saveDeployment(record);

  messages.push(
    `🎉 TECH is live on ${network.label}.`,
    `📝 Activate it in the app: set the env vars below in .env.local, then restart the app.`,
  );

  return {
    record,
    messages,
    envLines: [
      `NEXT_PUBLIC_TOKEN_MINT=${mint.toString()}`,
      `NEXT_PUBLIC_SHOP_WALLET=${payer.publicKey.toString()}`,
    ],
  };
}

export async function removeSolanaToken(
  networkKey: DeploymentRecord["network"],
): Promise<RemoveResult> {
  const network = getNetwork(networkKey);
  const record = getDeployment("solana", networkKey);
  if (!record) {
    throw new Error(`No TECH deployment found on ${network.label}.`);
  }

  const messages: string[] = [];
  const address: string | null = record.address;
  let payer: Keypair | null = null;

  try {
    const connection = new Connection(network.rpcUrl, "confirmed");
    const mint = new PublicKey(record.address);
    let mintInfo;
    try {
      mintInfo = await getMint(connection, mint);
    } catch {
      messages.push(`ℹ️ The mint ${record.address} no longer exists on-chain.`);
      mintInfo = null;
    }

    try {
      payer = loadShopKeypair();
    } catch (error) {
      messages.push(
        `ℹ️ ${error instanceof Error ? error.message : String(error)} — ` +
          "on-chain cleanup skipped.",
      );
    }

    if (mintInfo && payer) {
      // Burn the shop's own balance so its token account can be closed.
      const shopAta = await getAssociatedTokenAddress(mint, payer.publicKey);
      let shopBalance = BigInt(0);
      try {
        const account = await getAccount(connection, shopAta);
        shopBalance = account.amount;
      } catch {
        // No shop token account yet.
      }

      if (shopBalance > BigInt(0)) {
        const burnSig = await burn(
          connection,
          payer,
          shopAta,
          mint,
          payer.publicKey,
          shopBalance,
        );
        await connection.confirmTransaction(burnSig, "confirmed");
        messages.push(
          `🔥 Burned ${Number(shopBalance) / 10 ** record.decimals} ${record.symbol} held by the shop.`,
          `   Tx: ${explorerTxUrl(networkKey, burnSig)}`,
        );
      }

      try {
        const closeSig = await closeAccount(
          connection,
          payer,
          shopAta,
          payer.publicKey,
          payer.publicKey,
        );
        await connection.confirmTransaction(closeSig, "confirmed");
        messages.push(
          `🔒 Closed the shop token account (rent refunded).`,
          `   Tx: ${explorerTxUrl(networkKey, closeSig)}`,
        );
      } catch {
        messages.push(
          `ℹ️ Could not close the shop token account (it may still hold tokens). ` +
            "Burn the remaining balance first.",
        );
      }

      // Permanently revoke mint + freeze authority.
      const revokeMintSig = await setAuthority(
        connection,
        payer,
        mint,
        payer.publicKey,
        AuthorityType.MintTokens,
        null,
      );
      await connection.confirmTransaction(revokeMintSig, "confirmed");
      const revokeFreezeSig = await setAuthority(
        connection,
        payer,
        mint,
        payer.publicKey,
        AuthorityType.FreezeAccount,
        null,
      );
      await connection.confirmTransaction(revokeFreezeSig, "confirmed");
      messages.push(
        `🚫 Mint authority revoked — no more ${record.symbol} can ever be minted from ${record.address}.`,
        `   Tx: ${explorerTxUrl(networkKey, revokeMintSig)}`,
      );
    }
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Failed to clean up the token on ${network.label}: ${detail}`,
    );
  }

  removeDeployment("solana", networkKey);
  messages.push(
    `🗑️ Removed TECH ${record.address} from the ${network.label} registry.`,
    `📝 To stop the app using it, remove NEXT_PUBLIC_TOKEN_MINT and ` +
      `NEXT_PUBLIC_SHOP_WALLET from .env.local (or point them at a new mint) and restart the app.`,
    `ℹ️ The mint address itself cannot be deleted while tokens are held by wallets. ` +
      "The shop balance was burned and mint authority revoked, so the token is permanently defunct.",
  );

  return {
    chain: "solana",
    network: networkKey,
    address,
    messages,
    envLines: [
      `# Remove from .env.local:`,
      `# NEXT_PUBLIC_TOKEN_MINT=${record.address}`,
      `# NEXT_PUBLIC_SHOP_WALLET=${record.shopWallet}`,
    ],
  };
}