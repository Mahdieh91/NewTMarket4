import { NextResponse } from "next/server";
import { listDeployments } from "@/app/lib/admin/registry";

export async function GET() {
  try {
    return NextResponse.json(listDeployments());
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}