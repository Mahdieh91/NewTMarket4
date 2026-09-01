import { NextResponse } from "next/server";

import { getSolUsdtRate, TECH_USDT_RATE } from "../../lib/pricing";

export async function GET() {
  try {
    const solUsdt = await getSolUsdtRate();
    return NextResponse.json({
      techUsdt: TECH_USDT_RATE,
      solUsdt,
    });
  } catch (error) {
    console.error("❌ /api/pricing error:", error);
    return NextResponse.json(
      {
        error:
          "Could not determine the native/USDT price. " +
          "Set NEXT_PUBLIC_SOL_USDT_RATE as a fallback.",
      },
      { status: 502 },
    );
  }
}