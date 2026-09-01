import { NextResponse } from "next/server";
import { readJson, writeJson, TRANSACTIONS_FILE } from "@/app/lib/json-store";

export type LedgerLeg = {
  account: string;
  asset: "TECH" | "SOL";
  direction: "credit" | "debit";
  amountBaseUnits: string;
  txSignature: string | null;
};

export type TransactionRecord = {
  id: string;
  timestamp: string;
  type: "BUY_PRODUCT" | "BUY_TECH" | "ADJUSTMENT";
  status: "submitted" | "verified" | "confirmed" | "finalized" | "failed";
  label: string;
  productId: string | null;
  productName: string | null;
  techBaseUnits: string | null;
  solLamports: string | null;
  exchangeRate: number | null;
  userWallet: string | null;
  solSignature: string | null;
  techSignature: string | null;
  detail: string;
  legs: LedgerLeg[];
};

function defaultTransactions(): TransactionRecord[] {
  return [];
}

function humanToBaseUnits(human: number, decimals: number): string {
  if (typeof human !== "number" || !Number.isFinite(human)) return "0";
  return BigInt(Math.round(human * 10 ** decimals)).toString();
}

export async function GET() {
  const transactions = readJson<TransactionRecord[]>(
    TRANSACTIONS_FILE,
    defaultTransactions(),
  );
  return NextResponse.json(transactions);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.type) {
      return NextResponse.json({ error: "Missing transaction type" }, { status: 400 });
    }

    const transactions = readJson<TransactionRecord[]>(
      TRANSACTIONS_FILE,
      defaultTransactions(),
    );

    const record: TransactionRecord = {
      id:
        body.id ||
        `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: body.timestamp || new Date().toISOString(),
      type: body.type,
      status: body.status || "confirmed",
      label: body.label || body.type,
      productId: body.productId ?? null,
      productName: body.productName ?? null,
      techBaseUnits:
        body.techBaseUnits !== undefined && body.techBaseUnits !== null
          ? String(body.techBaseUnits)
          : body.techAmount !== undefined
            ? humanToBaseUnits(Number(body.techAmount), 9)
            : null,
      solLamports:
        body.solLamports !== undefined && body.solLamports !== null
          ? String(body.solLamports)
          : body.solAmount !== undefined
            ? humanToBaseUnits(Number(body.solAmount), 9)
            : null,
      exchangeRate: body.exchangeRate ?? null,
      userWallet: body.userWallet || body.wallet || null,
      solSignature: body.solSignature || null,
      techSignature: body.techSignature || body.txSignature || null,
      detail: body.detail || "",
      legs: Array.isArray(body.legs) ? body.legs : [],
    };

    transactions.unshift(record);
    writeJson(TRANSACTIONS_FILE, transactions);

    return NextResponse.json(record);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
