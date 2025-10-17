// ============================================
// src/app/api/stocks/price/route.ts
// ============================================

import {
  NextRequest as PriceRequest,
  NextResponse as PriceResponse,
} from "next/server";

export async function GET(request: PriceRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const ticker = searchParams.get("ticker");

    if (!ticker) {
      return PriceResponse.json(
        { error: "Ticker is required" },
        { status: 400 }
      );
    }

    // TODO: Implement actual price fetching from Yahoo Taiwan or Finnhub
    // For now, return mock data for development
    const mockPrice = {
      ticker,
      price: 580.0 + Math.random() * 20, // Mock current price
      dailyHigh: 595.0,
      dailyLow: 575.0,
      timestamp: new Date().toISOString(),
    };

    return PriceResponse.json(mockPrice);
  } catch (error) {
    console.error("Price fetch error:", error);
    return PriceResponse.json(
      { error: "Failed to fetch price" },
      { status: 500 }
    );
  }
}
