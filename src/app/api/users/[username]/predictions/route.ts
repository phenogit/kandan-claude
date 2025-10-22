// src/app/api/users/[username]/predictions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDatabases } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const searchParams = request.nextUrl.searchParams;

    // Query parameters
    const filter = searchParams.get("filter") || "all"; // all, original, followed
    const status = searchParams.get("status") || "all"; // all, pending, resolved
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const skip = (page - 1) * limit;

    const { legacyDb, newDb } = await connectDatabases();

    // Find user in new or legacy database
    let user = await newDb.collection("users").findOne({ username });
    let isLegacy = false;

    if (!user) {
      const legacyUser = await legacyDb
        .collection("users")
        .findOne({ name: username });
      if (!legacyUser) {
        return NextResponse.json(
          { success: false, error: "User not found" },
          { status: 404 }
        );
      }
      user = legacyUser;
      isLegacy = true;
    }

    let predictions: any[] = [];
    let total = 0;

    if (isLegacy) {
      // Fetch legacy predictions
      const query: any = { userId: user._id };

      // Status filter for legacy
      if (status === "pending") {
        query.isCompleted = false;
      } else if (status === "resolved") {
        query.isCompleted = true;
      }

      total = await legacyDb.collection("predictions").countDocuments(query);

      const legacyPredictions = await legacyDb
        .collection("predictions")
        .find(query)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();

      // Transform legacy predictions to unified format
      predictions = legacyPredictions.map((pred) => {
        // Parse price if it's a range (e.g., "29.6000-30.0000")
        let currentPrice = pred.currentPrice;
        if (typeof currentPrice === "string" && currentPrice.includes("-")) {
          currentPrice = parseFloat(currentPrice.split("-")[0]);
        } else {
          currentPrice = parseFloat(currentPrice);
        }

        // Determine status
        let predStatus = "pending";
        if (pred.isCompleted) {
          predStatus = pred.profitRate > 0 ? "auto-success" : "auto-fail";
        }

        return {
          _id: pred._id.toString(),
          userName: pred.userName || username,
          ticker: pred.ticker,
          tickerName: pred.tickerName || pred.ticker,
          direction: pred.direction,
          ceiling: pred.ceiling,
          floor: pred.floor,
          startPrice: pred.startPrice,
          currentPrice,
          confidence: pred.confidence || 1,
          status: predStatus,
          profitRate: pred.profitRate || null,
          isLegacy: true,
          createdAt: pred.created_at,
          resolvedAt: pred.resolvedAt || pred.updated_at,
          rationale: pred.rationale || null,
          basedOnPredictionId: null,
        };
      });
    } else {
      // Fetch new predictions
      const query: any = { userId: user._id };

      // Filter by prediction type
      if (filter === "original") {
        query.basedOnPredictionId = null;
      } else if (filter === "followed") {
        query.basedOnPredictionId = { $ne: null };
      }

      // Status filter
      if (status === "pending") {
        query.status = "pending";
      } else if (status === "resolved") {
        query.status = { $regex: "success|fail" };
      }

      total = await newDb.collection("predictions").countDocuments(query);

      const newPredictions = await newDb
        .collection("predictions")
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();

      // Transform to response format
      predictions = newPredictions.map((pred) => ({
        _id: pred._id.toString(),
        userName: pred.userName || username,
        ticker: pred.ticker,
        tickerName: pred.tickerName || pred.ticker,
        direction: pred.direction,
        ceiling: pred.ceiling,
        floor: pred.floor,
        startPrice: pred.startPrice,
        currentPrice: pred.currentPrice || pred.startPrice,
        confidence: pred.confidence,
        status: pred.status,
        profitRate: pred.profitRate || null,
        profitRateAdjusted: pred.profitRateAdjusted || null,
        isLegacy: false,
        createdAt: pred.createdAt,
        resolvedAt: pred.resolvedAt || null,
        rationale: pred.rationale || null,
        basedOnPredictionId: pred.basedOnPredictionId
          ? pred.basedOnPredictionId.toString()
          : null,
      }));
    }

    const hasMore = skip + predictions.length < total;

    return NextResponse.json({
      success: true,
      data: {
        predictions,
        pagination: {
          total,
          page,
          limit,
          hasMore,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching user predictions:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
