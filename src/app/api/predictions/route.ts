// src/app/api/predictions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDatabases } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      ticker,
      tickerName,
      direction,
      ceiling,
      floor,
      startPrice,
      dailyHigh,
      dailyLow,
      confidence,
      rationale,
    } = body;

    // Validation
    if (!ticker || !tickerName) {
      return NextResponse.json({ error: "請選擇股票" }, { status: 400 });
    }

    if (direction !== 1 && direction !== -1) {
      return NextResponse.json({ error: "請選擇預測方向" }, { status: 400 });
    }

    if (!ceiling || !floor || !startPrice) {
      return NextResponse.json(
        { error: "請輸入完整的價格資訊" },
        { status: 400 }
      );
    }

    if (ceiling <= floor) {
      return NextResponse.json(
        { error: "天花板必須高於地板" },
        { status: 400 }
      );
    }

    if (ceiling <= startPrice || floor >= startPrice) {
      return NextResponse.json(
        { error: "價格區間必須包含現價" },
        { status: 400 }
      );
    }

    if (confidence < 1 || confidence > 5) {
      return NextResponse.json(
        { error: "信心指數必須在 1-5 之間" },
        { status: 400 }
      );
    }

    // Connect to database
    const { newDb } = await connectDatabases();

    // Get user from database
    const user = await newDb.collection("users").findOne({
      email: session.user.email,
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create prediction document
    const prediction = {
      userId: user._id,
      ticker,
      tickerName,
      direction, // 1 for bull, -1 for bear
      ceiling,
      floor,
      startPrice,
      dailyHigh,
      dailyLow,
      currentPrice: startPrice, // Initially same as start price
      confidence,
      rationale: rationale || null,
      status: "pending", // pending, success, failure, stopped_out
      isPublic: true, // Phase 1: all predictions are public
      basedOnPredictionId: null, // null for original predictions
      profitRate: null, // calculated on resolution
      createdAt: new Date(),
      updatedAt: new Date(),
      resolvedAt: null,
      startTime: new Date(),
    };

    const result = await newDb.collection("predictions").insertOne(prediction);

    return NextResponse.json({
      success: true,
      predictionId: result.insertedId.toString(),
      message: "預測創建成功",
    });
  } catch (error) {
    console.error("Create prediction error:", error);
    return NextResponse.json(
      { error: "Failed to create prediction" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const ticker = searchParams.get("ticker");
    const status = searchParams.get("status");
    const userId = searchParams.get("userId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const { newDb } = await connectDatabases();

    // Build query
    const query: any = {};
    if (ticker) query.ticker = ticker;
    if (status) query.status = status;
    if (userId) query.userId = new ObjectId(userId);

    // Get predictions with pagination
    const predictions = await newDb
      .collection("predictions")
      .find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    // Get total count
    const total = await newDb.collection("predictions").countDocuments(query);

    // Get user info for each prediction
    const userIds = [...new Set(predictions.map((p) => p.userId))];
    const users = await newDb
      .collection("users")
      .find({ _id: { $in: userIds } })
      .toArray();

    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    // Enrich predictions with user data
    const enrichedPredictions = predictions.map((pred) => {
      const user = userMap.get(pred.userId.toString());
      return {
        ...pred,
        _id: pred._id.toString(),
        userId: pred.userId.toString(),
        user: user
          ? {
              username: user.username,
              displayName: user.displayName,
              avatarUrl: user.avatarUrl,
            }
          : null,
      };
    });

    return NextResponse.json({
      predictions: enrichedPredictions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get predictions error:", error);
    return NextResponse.json(
      { error: "Failed to get predictions" },
      { status: 500 }
    );
  }
}
