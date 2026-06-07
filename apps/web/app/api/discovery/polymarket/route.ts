import { NextResponse } from "next/server";

import { fetchPolymarketReferences } from "@/features/discovery/polymarket-gamma";

export async function GET() {
  try {
    const markets = await fetchPolymarketReferences();
    const response = NextResponse.json({
      markets
    });

    response.headers.set("Cache-Control", "public, max-age=0, s-maxage=300, stale-while-revalidate=900");

    return response;
  } catch (error) {
    const response = NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to fetch external market references",
        markets: []
      },
      { status: 502 }
    );

    response.headers.set("Cache-Control", "no-store");

    return response;
  }
}
