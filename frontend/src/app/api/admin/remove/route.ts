import { NextResponse } from "next/server";
import type { ChainId, NetworkKey } from "@/app/lib/admin/networks";
import { isNetworkKey } from "@/app/lib/admin/networks";
import { removeSolanaToken } from "@/app/lib/admin/solana-deploy";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const chain = body.chain as ChainId;
    const network = body.network as NetworkKey;

    if (chain !== "solana") {
      return NextResponse.json(
        { error: "Only Solana is supported." },
        { status: 400 },
      );
    }
    if (!isNetworkKey(network, chain)) {
      return NextResponse.json(
        { error: "Invalid network for the selected chain." },
        { status: 400 },
      );
    }

    const result = await removeSolanaToken(network as NetworkKey);

    return NextResponse.json(result);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error("❌ admin remove error:", detail);
    return NextResponse.json({ error: detail }, { status: 400 });
  }
}