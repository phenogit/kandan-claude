// src/app/api/stocks/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q")?.toLowerCase() || "";

    if (!query || query.length < 1) {
      return NextResponse.json({ stocks: [] });
    }

    // Load Taiwan stocks data from JSON file
    const filePath = path.join(
      process.cwd(),
      "public",
      "data",
      "taiwan-stocks.json"
    );
    const fileContent = await readFile(filePath, "utf-8");
    const allStocks = JSON.parse(fileContent);

    // Search by ticker OR name (Chinese/English)
    const results = allStocks
      .filter((stock: any) => {
        return (
          stock.ticker.toLowerCase().includes(query) ||
          stock.name.includes(query) ||
          (stock.nameEn && stock.nameEn.toLowerCase().includes(query))
        );
      })
      .slice(0, 10); // Limit to 10 results

    return NextResponse.json({ stocks: results });
  } catch (error) {
    console.error("Stock search error:", error);
    return NextResponse.json(
      { error: "Failed to search stocks" },
      { status: 500 }
    );
  }
}
