// src/app/api/feed/global/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDatabases } from "@/lib/mongodb";
import { legacyPredictions, mapLegacyPrediction } from "@/lib/legacyDb";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const { newDb } = await connectDatabases();

    // ===== FETCH NEW PREDICTIONS =====
    const newPredictions = await newDb
      .collection("predictions")
      .find({ isPublic: true })
      .sort({ createdAt: -1 })
      .limit(limit * 2) // Get more to ensure we have enough after merge
      .toArray();

    // Enrich with user data
    const userIds = [...new Set(newPredictions.map((p: any) => p.userId))];
    const users = await newDb
      .collection("users")
      .find({ _id: { $in: userIds } })
      .toArray();

    const userMap = new Map(users.map((u: any) => [u._id.toString(), u]));

    const mappedNewPredictions = newPredictions.map((pred: any) => {
      const user = userMap.get(pred.userId.toString());
      return {
        _id: pred._id.toString(),
        userName: user?.username || "Unknown",
        ticker: pred.ticker,
        tickerName: pred.tickerName,
        direction: pred.direction,
        ceiling: pred.ceiling,
        floor: pred.floor,
        startPrice: pred.startPrice,
        currentPrice: pred.currentPrice || pred.startPrice,
        confidence: pred.confidence,
        status: pred.status,
        profitRate: pred.profitRate,
        isLegacy: false,
        createdAt: pred.createdAt.toISOString(),
        rationale: pred.rationale || null,
      };
    });

    // ===== FETCH LEGACY PREDICTIONS =====
    const legacyPreds = await legacyPredictions.find(
      {},
      {
        sort: { startTime: -1 },
        limit: limit * 2,
      }
    );

    const mappedLegacyPredictions = legacyPreds.map(mapLegacyPrediction);

    // ===== MERGE AND SORT =====
    const allPredictions = [...mappedNewPredictions, ...mappedLegacyPredictions]
      .sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA; // Most recent first
      })
      .slice((page - 1) * limit, page * limit); // Paginate after merge

    // Calculate total (approximate for performance)
    const newTotal = await newDb
      .collection("predictions")
      .countDocuments({ isPublic: true });
    const legacyTotal = await legacyPredictions.countDocuments({});
    const total = newTotal + legacyTotal;

    const hasMore = page * limit < total;

    return NextResponse.json({
      success: true,
      data: allPredictions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore,
      },
    });
  } catch (error) {
    console.error("Error fetching global feed:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch global feed",
      },
      { status: 500 }
    );
  }
}
