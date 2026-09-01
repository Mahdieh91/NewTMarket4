import { NextResponse } from "next/server";
import type { ChainId, NetworkKey } from "@/app/lib/admin/networks";
import { isNetworkKey } from "@/app/lib/admin/networks";
import { deploySolanaToken } from "@/app/lib/admin/solana-deploy";
import {
  parseUsdtRate,
  type DeployFormInput,
} from "@/app/lib/admin/types";

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

    const decimals = Number(body.decimals);
    if (!Number.isInteger(decimals)) {
      return NextResponse.json(
        { error: "Decimals must be a whole number." },
        { status: 400 },
      );
    }

    const origin = new URL(request.url).origin;
    const input: DeployFormInput = {
      chain,
      network: network as NetworkKey,
      name: String(body.name ?? "").trim(),
      symbol: String(body.symbol ?? "").trim(),
      decimals,
      iconUrl: body.iconUrl ? String(body.iconUrl).trim() : null,
      metadataUrl: body.metadataUrl ? String(body.metadataUrl).trim() : null,
      description: body.description ? String(body.description).trim() : null,
      totalSupply: String(body.totalSupply ?? "0").trim(),
      usdtRate: parseUsdtRate(body.usdtRate, 10),
    };

    const result = await deploySolanaToken(input, origin);

    return NextResponse.json(result);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error("❌ admin deploy error:", detail);
    return NextResponse.json({ error: detail }, { status: 400 });
  }
}