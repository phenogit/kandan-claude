// src/app/api/predictions/most-followed/route.ts
import { NextResponse } from "next/server";
import {
  legacyPredictions,
  getDateDaysAgo,
  mapLegacyPrediction,
} from "@/lib/legacyDb";

export async function GET() {
  try {
    const sevenDaysAgo = getDateDaysAgo(7);

    // Get predictions from last 7 days
    // Note: Legacy has 'followers' array, but we'll use length for now
    const predictions = await legacyPredictions.find(
      {
        startTime: { $gte: sevenDaysAgo },
      },
      {
        sort: { startTime: -1 },
        limit: 100, // Get more to sort by followers
      }
    );

    // Sort by followers count (legacy has followers array)
    const sorted = predictions
      .map((pred) => ({
        ...mapLegacyPrediction(pred),
        followCount: pred.followers?.length || 0,
        followers: pred.followers || [],
      }))
      .sort((a, b) => b.followCount - a.followCount)
      .slice(0, 5); // Top 5

    return NextResponse.json({
      success: true,
      data: sorted,
    });
  } catch (error) {
    console.error("Error fetching most followed predictions:", error);
    return NextResponse.json(
      { error: "Failed to fetch most followed predictions" },
      { status: 500 }
    );
  }
}
