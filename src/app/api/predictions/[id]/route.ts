// src/app/api/predictions/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDatabases } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// Type definitions for better type safety
interface UserInfo {
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  isLegacy?: boolean;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid prediction ID" },
        { status: 400 }
      );
    }

    const { newDb, legacyDb } = await connectDatabases();

    // Try new database first
    let prediction = await newDb.collection("predictions").findOne({
      _id: new ObjectId(id),
    });

    let isLegacy = false;

    // If not found, try legacy database
    if (!prediction && legacyDb) {
      const legacyPrediction = await legacyDb
        .collection("predictions")
        .findOne({ _id: new ObjectId(id) });

      if (legacyPrediction) {
        // Transform legacy prediction
        prediction = transformLegacyPrediction(legacyPrediction);
        isLegacy = true;
      }
    }

    if (!prediction) {
      return NextResponse.json(
        { success: false, error: "Prediction not found" },
        { status: 404 }
      );
    }

    // Get user info with proper typing
    let userInfo: UserInfo | null = null;

    if (isLegacy) {
      // For legacy, try to find migrated user
      const migratedUser = await newDb
        .collection("users")
        .findOne({ legacyUserId: prediction.userId?.toString() });

      if (migratedUser) {
        userInfo = {
          username: migratedUser.username,
          displayName: migratedUser.displayName || migratedUser.username,
          avatarUrl: migratedUser.avatarUrl || null,
          isLegacy: true,
        };
      } else {
        // Create placeholder user info from legacy data
        userInfo = {
          username: prediction.userName || "legacy_user",
          displayName: prediction.userName || "Legacy User",
          avatarUrl: null,
          isLegacy: true,
        };
      }
    } else {
      // For new predictions
      const user = await newDb.collection("users").findOne({
        _id: prediction.userId,
      });

      if (user) {
        userInfo = {
          username: user.username,
          displayName: user.displayName || user.username,
          avatarUrl: user.avatarUrl || null,
          isLegacy: false,
        };
      }
    }

    // Format response
    const formattedPrediction = {
      ...prediction,
      _id: prediction._id.toString(),
      userId: prediction.userId?.toString(),
      isLegacy,
      user: userInfo,
    };

    return NextResponse.json({
      success: true,
      prediction: formattedPrediction,
    });
  } catch (error) {
    console.error("Get prediction error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get prediction" },
      { status: 500 }
    );
  }
}

// Helper function to transform legacy prediction
function transformLegacyPrediction(legacyPred: any) {
  // Parse currentPrice if it's a range (e.g., "29.6000-30.0000")
  let currentPrice = legacyPred.currentPrice;
  if (typeof currentPrice === "string" && currentPrice.includes("-")) {
    currentPrice = parseFloat(currentPrice.split("-")[0]);
  } else {
    currentPrice = parseFloat(currentPrice) || 0;
  }

  // Determine status based on legacy fields
  let status = "pending";
  if (legacyPred.isCompleted) {
    status =
      legacyPred.profitRate && legacyPred.profitRate > 0
        ? "auto-success"
        : "auto-fail";
  }

  return {
    _id: legacyPred._id,
    userId: legacyPred.userId,
    userName: legacyPred.userName,
    ticker: legacyPred.stockId, // Legacy uses stockId
    tickerName: legacyPred.stockName, // Legacy uses stockName
    direction: legacyPred.bearOrBull, // Legacy uses bearOrBull
    ceiling: parseFloat(legacyPred.highPrice), // Legacy uses highPrice
    floor: parseFloat(legacyPred.lowPrice), // Legacy uses lowPrice
    startPrice: parseFloat(legacyPred.startPrice),
    currentPrice: currentPrice,
    confidence: 1, // Legacy predictions default to confidence 1
    status: status,
    profitRate: legacyPred.profitRate || null,
    rationale: legacyPred.rationale || null,
    createdAt: legacyPred.startTime || legacyPred.createdAt,
    resolvedAt: legacyPred.endTime || null,
    endPrice: legacyPred.endPrice ? parseFloat(legacyPred.endPrice) : null,
  };
}
