// src/app/api/stocks/price/route.ts
import { NextRequest, NextResponse } from "next/server";
import { fetchStockPrice } from "@/lib/priceService";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const ticker = searchParams.get("ticker");

    if (!ticker) {
      return NextResponse.json(
        { error: "Ticker is required" },
        { status: 400 }
      );
    }

    // Fetch real price from Yahoo Taiwan or Finnhub
    try {
      const priceData = await fetchStockPrice(ticker);

      return NextResponse.json(priceData);
    } catch (priceError) {
      // If both sources fail, return error
      console.error("Price fetch error:", priceError);

      return NextResponse.json(
        {
          error: "Failed to fetch stock price",
          details:
            priceError instanceof Error ? priceError.message : "Unknown error",
        },
        { status: 503 } // Service Unavailable
      );
    }
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
