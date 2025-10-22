// Temporary debug endpoint to check legacy user data
// Add this to: src/app/api/debug/legacy-user/route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectDatabases } from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const username = searchParams.get("username");

    if (!username) {
      return NextResponse.json({ error: "Username required" }, { status: 400 });
    }

    const { legacyDb } = await connectDatabases();

    // Get legacy user
    const legacyUser = await legacyDb.collection("users").findOne({
      name: username,
    });

    if (!legacyUser) {
      return NextResponse.json(
        { error: "Legacy user not found" },
        { status: 404 }
      );
    }

    // Get legacy predictions
    const legacyPredictions = await legacyDb
      .collection("predictions")
      .find({
        userName: username,
      })
      .limit(10)
      .toArray();

    // Debug info
    const debug = {
      user: {
        _id: legacyUser._id,
        name: legacyUser.name,
        totalPredictionCount: legacyUser.totalPredictionCount,
        finishedPredictionCount: legacyUser.finishedPredictionCount,
        successPredictionCount: legacyUser.successPredictionCount,
        avgProfitRate: legacyUser.avgProfitRate,
        currentStreak: legacyUser.currentStreak,
        highestStreak: legacyUser.highestStreak,
        // Show all fields
        allFields: Object.keys(legacyUser),
      },
      predictions: {
        total: legacyPredictions.length,
        sample: legacyPredictions.slice(0, 3).map((p) => ({
          _id: p._id,
          userName: p.userName,
          ticker: p.stockId,
          isCompleted: p.isCompleted,
          profitRate: p.profitRate,
          // Show all fields
          allFields: Object.keys(p),
        })),
      },
      calculations: {
        totalFromDB: legacyUser.totalPredictionCount,
        totalFromQuery: legacyPredictions.length,
        completed: legacyPredictions.filter((p) => p.isCompleted).length,
        successful: legacyPredictions.filter(
          (p) => p.isCompleted && p.profitRate > 0
        ).length,
      },
    };

    return NextResponse.json({
      success: true,
      debug,
    });
  } catch (error) {
    console.error("Debug error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
