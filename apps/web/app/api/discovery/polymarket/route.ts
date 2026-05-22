import { NextResponse } from "next/server";

import { fetchPolymarketReferences } from "@/features/discovery/polymarket-gamma";

export async function GET() {
  try {
    const markets = await fetchPolymarketReferences();

    return NextResponse.json({
      markets
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to fetch external market references",
        markets: []
      },
      { status: 502 }
    );
  }
}
