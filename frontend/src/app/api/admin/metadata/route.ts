import { NextResponse } from "next/server";
import type { ChainId, NetworkKey } from "@/app/lib/admin/networks";
import { getNetwork, isNetworkKey } from "@/app/lib/admin/networks";
import { getDeployment } from "@/app/lib/admin/registry";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const chain = searchParams.get("chain") as ChainId | null;
  const network = searchParams.get("network") as NetworkKey | null;

  if (!isNetworkKey(network ?? undefined, chain ?? undefined)) {
    return NextResponse.json({ error: "Invalid chain/network." }, { status: 400 });
  }

  const record = getDeployment(chain!, network!);
  if (!record) {
    return NextResponse.json(
      { error: `No TECH deployment registered on ${getNetwork(network!).label}.` },
      { status: 404 },
    );
  }

  const attributes = [
    { trait_type: "Chain", value: "Solana" },
    { trait_type: "Network", value: getNetwork(network!).label },
    {
      trait_type: "Total Supply",
      value: record.totalSupply || null,
    },
    {
      trait_type: "Reference Price (USDT)",
      value:
        record.usdtRate != null
          ? `1 ${record.symbol} = ${record.usdtRate} USDT`
          : null,
    },
  ].filter((attribute) => attribute.value !== null);

  return NextResponse.json(
    {
      name: record.name,
      symbol: record.symbol,
      description:
        record.description ||
        `Tech Token (${record.symbol}) deployed on ${getNetwork(network!).label}.`,
      image: record.iconUrl,
      decimals: record.decimals,
      attributes,
    },
    {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    },
  );
}