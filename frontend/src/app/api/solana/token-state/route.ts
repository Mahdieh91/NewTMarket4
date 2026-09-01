import { NextResponse } from "next/server";
import {
  getTokenState,
  adjustSupply,
  adjustShopBalance,
} from "@/app/lib/solana/token-admin";

export async function GET() {
  try {
    return NextResponse.json(await getTokenState());
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body.supply !== undefined) {
      return NextResponse.json(await adjustSupply(String(body.supply)));
    }

    if (body.shopBalance !== undefined) {
      return NextResponse.json(
        await adjustShopBalance(String(body.shopBalance)),
      );
    }

    return NextResponse.json(
      { error: "Provide a supply or shopBalance target" },
      { status: 400 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
