"use client";

import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { 
  getAssociatedTokenAddress, 
  createTransferInstruction,
  TOKEN_PROGRAM_ID
} from "@solana/spl-token";

const TOKEN_MINT = new PublicKey(process.env.NEXT_PUBLIC_TOKEN_MINT!);
const SHOP_WALLET = new PublicKey(process.env.NEXT_PUBLIC_SHOP_WALLET!);
const DECIMALS = Number(process.env.NEXT_PUBLIC_TOKEN_DECIMALS ?? 9);

export async function createBuyTransaction(
  connection: Connection,
  payerPublicKey: PublicKey,
  amount: number
): Promise<Transaction> {
  console.log("🔍 Creating buy transaction...");
  console.log(`📊 Amount: ${amount} TECH tokens`);
  
  // Get the payer's associated token account
  const payerTokenAccount = await getAssociatedTokenAddress(
    TOKEN_MINT,
    payerPublicKey
  );
  console.log(`📝 Payer token account: ${payerTokenAccount.toString()}`);

  // Get the shop's associated token account
  const shopTokenAccount = await getAssociatedTokenAddress(
    TOKEN_MINT,
    SHOP_WALLET
  );
  console.log(`📝 Shop token account: ${shopTokenAccount.toString()}`);

  // Calculate amount with decimals
  const amountWithDecimals = amount * Math.pow(10, DECIMALS);
  console.log(`📊 Amount with decimals: ${amountWithDecimals}`);

  // Create transfer instruction
  const transferIx = createTransferInstruction(
    payerTokenAccount,
    shopTokenAccount,
    payerPublicKey,
    BigInt(amountWithDecimals),
    [],
    TOKEN_PROGRAM_ID
  );

  // Create transaction
  const transaction = new Transaction().add(transferIx);
  
  // Get recent blockhash
  const { blockhash } = await connection.getRecentBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = payerPublicKey;

  console.log("✅ Transaction created successfully");
  console.log(`📝 Fee payer: ${transaction.feePayer?.toString()}`);
  
  return transaction;
}
