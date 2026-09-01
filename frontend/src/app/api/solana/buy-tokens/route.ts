import { NextResponse } from "next/server";
import {
  Connection,
  Keypair,
  PublicKey,
  clusterApiUrl,
  Transaction,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
  getAccount,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
import fs from "fs";
import path from "path";

import {
  getSolUsdtRate,
  TECH_USDT_RATE,
  techRawToLamports,
} from "../../../lib/pricing";

const TOKEN_MINT = new PublicKey(process.env.NEXT_PUBLIC_TOKEN_MINT!);
const SHOP_WALLET = new PublicKey(process.env.NEXT_PUBLIC_SHOP_WALLET!);
const DECIMALS = Number(process.env.NEXT_PUBLIC_TOKEN_DECIMALS ?? 9);

export async function POST(request: Request) {
  try {
    if (!TECH_USDT_RATE || TECH_USDT_RATE <= 0) {
      return NextResponse.json(
        { error: "TECH_USDT_RATE is not configured" },
        { status: 500 },
      );
    }

    const solUsdt = await getSolUsdtRate();
    if (!solUsdt || solUsdt <= 0) {
      return NextResponse.json(
        { error: "SOL/USDT price is not configured" },
        { status: 500 },
      );
    }

    const body = await request.json();
    const { userWallet, techBaseUnits, paymentSignature } = body;

    if (!userWallet || !techBaseUnits || !paymentSignature) {
      return NextResponse.json(
        { error: "Missing userWallet, techBaseUnits, or paymentSignature" },
        { status: 400 },
      );
    }

    let userPubkey: PublicKey;
    try {
      userPubkey = new PublicKey(userWallet);
    } catch {
      return NextResponse.json(
        { error: "Invalid user wallet address" },
        { status: 400 },
      );
    }

    let techAmount: bigint;
    try {
      techAmount = BigInt(techBaseUnits);
    } catch {
      return NextResponse.json(
        { error: "Invalid TECH amount" },
        { status: 400 },
      );
    }
    if (techAmount <= BigInt(0)) {
      return NextResponse.json(
        { error: "Invalid TECH amount" },
        { status: 400 },
      );
    }

    // Equivalent USDT value via the TECH↔USDT reference price, expressed in
    // SOL at the current SOL/USDT rate: ceil(tech * rate / solPrice).
    const requiredLamports = techRawToLamports(
      techAmount,
      TECH_USDT_RATE,
      solUsdt,
    );
    // Small tolerance so a price tick between the page preview and this
    // verification (both share the same 60s-cached quote) never fails a buy.
    const acceptedFromLamports = (requiredLamports * 95n) / 100n;

    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

    // Load the shop wallet (mint authority / payer)
    const keypairPath = path.join(process.cwd(), "payer-keypair.json");
    if (!fs.existsSync(keypairPath)) {
      return NextResponse.json(
        { error: "Shop keypair not found on server" },
        { status: 500 },
      );
    }
    const secretKey = JSON.parse(fs.readFileSync(keypairPath, "utf8"));
    const shopWallet = Keypair.fromSecretKey(new Uint8Array(secretKey));

    // Verify the SOL payment actually went to the shop wallet
    let payment;
    try {
      payment = await connection.getTransaction(paymentSignature, {
        maxSupportedTransactionVersion: 0,
        commitment: "confirmed",
      });
    } catch {
      return NextResponse.json(
        { error: "Invalid payment transaction signature" },
        { status: 400 },
      );
    }
    if (!payment) {
      return NextResponse.json(
        { error: "Payment transaction not found" },
        { status: 400 },
      );
    }
    if (payment.meta?.err) {
      return NextResponse.json(
        { error: "Payment transaction failed on-chain" },
        { status: 400 },
      );
    }

    const accountKeys = payment.transaction.message.getAccountKeys();
    const shopIndex = accountKeys.staticAccountKeys.findIndex((key: PublicKey) =>
      key.equals(SHOP_WALLET),
    );
    if (shopIndex === -1) {
      return NextResponse.json(
        { error: "Payment did not include the shop wallet" },
        { status: 400 },
      );
    }
    const pre = payment.meta!.preBalances[shopIndex];
    const post = payment.meta!.postBalances[shopIndex];
    const received = post - pre;
    if (received < acceptedFromLamports) {
      return NextResponse.json(
        { error: "Payment amount is less than requested" },
        { status: 400 },
      );
    }

    // Ensure the buyer has a token account
    const userTokenAccount = await getAssociatedTokenAddress(
      TOKEN_MINT,
      userPubkey,
    );
    try {
      await getAccount(connection, userTokenAccount);
    } catch {
      const createIx = createAssociatedTokenAccountInstruction(
        shopWallet.publicKey,
        userTokenAccount,
        userPubkey,
        TOKEN_MINT,
      );
      const createTx = new Transaction().add(createIx);
      const { blockhash } = await connection.getLatestBlockhash("confirmed");
      createTx.recentBlockhash = blockhash;
      createTx.feePayer = shopWallet.publicKey;
      await connection.sendTransaction(createTx, [shopWallet], {
        skipPreflight: true,
      });
    }

    const shopTokenAccount = await getAssociatedTokenAddress(
      TOKEN_MINT,
      shopWallet.publicKey,
    );
    const shopAccount = await getAccount(connection, shopTokenAccount);
    const shopBalance = BigInt(shopAccount.amount);
    if (shopBalance < techAmount) {
      return NextResponse.json(
        {
          error: `Shop does not have enough TECH balance. Needed ${Number(
            techAmount,
          ) / 10 ** DECIMALS} TECH.`,
        },
        { status: 400 },
      );
    }

    // Pay the buyer in TECH from the shop
    const transferIx = createTransferInstruction(
      shopTokenAccount,
      userTokenAccount,
      shopWallet.publicKey,
      techAmount,
      [],
      TOKEN_PROGRAM_ID,
    );
    const tx = new Transaction().add(transferIx);
    const { blockhash } = await connection.getLatestBlockhash("confirmed");
    tx.recentBlockhash = blockhash;
    tx.feePayer = shopWallet.publicKey;

    const techSignature = await connection.sendTransaction(tx, [shopWallet], {
      skipPreflight: true,
      preflightCommitment: "confirmed",
    });
    await connection.confirmTransaction(techSignature, "confirmed");

    return NextResponse.json({ techSignature });
  } catch (error) {
    console.error("❌ buy-tokens error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
