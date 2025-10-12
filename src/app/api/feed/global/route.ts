// src/app/api/feed/global/route.ts
import { NextRequest, NextResponse } from "next/server";
import { legacyPredictions, mapLegacyPrediction } from "@/lib/legacyDb";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Get predictions from legacy database
    // TODO: Later merge with new database predictions
    const predictions = await legacyPredictions.find(
      {},
      {
        sort: { startTime: -1 }, // Most recent first
        skip,
        limit,
      }
    );

    // Get total count for pagination
    const total = await legacyPredictions.countDocuments({});

    // Map to unified format
    const mapped = predictions.map(mapLegacyPrediction);

    return NextResponse.json({
      success: true,
      data: mapped,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + predictions.length < total,
      },
    });
  } catch (error) {
    console.error("Error fetching global feed:", error);
    return NextResponse.json(
      { error: "Failed to fetch global feed" },
      { status: 500 }
    );
  }
}
