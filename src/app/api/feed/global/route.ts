// src/app/api/feed/global/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDatabases } from "@/lib/mongodb";
import { legacyPredictions, mapLegacyPrediction } from "@/lib/legacyDb";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Filter parameters
    const ticker = searchParams.get("ticker")?.toUpperCase() || null;
    const status = searchParams.get("status") || "all"; // all | pending | resolved
    const direction = searchParams.get("direction") || "all"; // all | bull | bear
    const userType = searchParams.get("userType") || "all"; // all | legacy | new
    const timeRange = searchParams.get("timeRange") || "all"; // all | today | week | month
    const sortBy = searchParams.get("sortBy") || "newest"; // newest | popular | ending-soon

    const { newDb } = await connectDatabases();

    // ===== BUILD TIME RANGE FILTER =====
    let dateFilter: Date | null = null;
    if (timeRange === "today") {
      dateFilter = new Date();
      dateFilter.setHours(0, 0, 0, 0);
    } else if (timeRange === "week") {
      dateFilter = new Date();
      dateFilter.setDate(dateFilter.getDate() - 7);
    } else if (timeRange === "month") {
      dateFilter = new Date();
      dateFilter.setMonth(dateFilter.getMonth() - 1);
    }

    // ===== FETCH NEW PREDICTIONS =====
    let newPredictions: any[] = [];

    if (userType !== "legacy") {
      const newQuery: any = { isPublic: true };

      // Ticker filter
      if (ticker) {
        newQuery.ticker = { $regex: ticker, $options: "i" };
      }

      // Status filter
      if (status === "pending") {
        newQuery.status = "pending";
      } else if (status === "resolved") {
        newQuery.status = { $ne: "pending" };
      }

      // Direction filter
      if (direction === "bull") {
        newQuery.direction = 1;
      } else if (direction === "bear") {
        newQuery.direction = -1;
      }

      // Time range filter
      if (dateFilter) {
        newQuery.createdAt = { $gte: dateFilter };
      }

      // Sorting
      let sortOption: any = { createdAt: -1 }; // Default: newest first

      if (sortBy === "popular") {
        sortOption = { followCount: -1, createdAt: -1 };
      } else if (sortBy === "ending-soon") {
        // For ending soon, we want pending predictions sorted by how close they are to target
        sortOption = { status: 1, createdAt: 1 }; // Oldest pending first
      }

      newPredictions = await newDb
        .collection("predictions")
        .find(newQuery)
        .sort(sortOption)
        .limit(limit * 2)
        .toArray();

      // Enrich with user data
      const userIds = [...new Set(newPredictions.map((p: any) => p.userId))];
      const users = await newDb
        .collection("users")
        .find({ _id: { $in: userIds } })
        .toArray();

      const userMap = new Map(users.map((u: any) => [u._id.toString(), u]));

      newPredictions = newPredictions.map((pred: any) => {
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
          followCount: pred.followCount || 0,
          isLegacy: false,
          createdAt: pred.createdAt.toISOString(),
          rationale: pred.rationale || null,
        };
      });
    }

    // ===== FETCH LEGACY PREDICTIONS =====
    let legacyPreds: any[] = [];

    if (userType !== "new") {
      const legacyQuery: any = {};

      // Ticker filter
      if (ticker) {
        legacyQuery.stockId = { $regex: ticker, $options: "i" };
      }

      // Status filter
      if (status === "pending") {
        legacyQuery.isCompleted = false;
      } else if (status === "resolved") {
        legacyQuery.isCompleted = true;
      }

      // Direction filter
      if (direction === "bull") {
        legacyQuery.bearOrBull = 1;
      } else if (direction === "bear") {
        legacyQuery.bearOrBull = -1;
      }

      // Time range filter
      if (dateFilter) {
        legacyQuery.startTime = { $gte: dateFilter };
      }

      // Sorting
      let legacySortOption: any = { startTime: -1 }; // Default: newest first

      if (sortBy === "popular") {
        // Sort by followers array length (legacy has followers array)
        legacySortOption = { followers: -1, startTime: -1 };
      } else if (sortBy === "ending-soon") {
        legacySortOption = { isCompleted: 1, startTime: 1 }; // Oldest pending first
      }

      legacyPreds = await legacyPredictions.find(legacyQuery, {
        sort: legacySortOption,
        limit: limit * 2,
      });

      legacyPreds = legacyPreds.map((pred: any) => ({
        ...mapLegacyPrediction(pred),
        followCount: pred.followers?.length || 0,
      }));
    }

    // ===== MERGE AND SORT =====
    let allPredictions = [...newPredictions, ...legacyPreds];

    // Sort combined results based on sortBy
    if (sortBy === "newest") {
      allPredictions.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA; // Most recent first
      });
    } else if (sortBy === "popular") {
      allPredictions.sort((a, b) => {
        // Sort by followCount, then by date
        if (b.followCount !== a.followCount) {
          return b.followCount - a.followCount;
        }
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      });
    } else if (sortBy === "ending-soon") {
      // Filter only pending, then sort by creation date (oldest first = closest to ending)
      allPredictions = allPredictions
        .filter((p) => p.status === "pending")
        .sort((a, b) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return dateA - dateB; // Oldest first
        });
    }

    // Paginate after merge
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedPredictions = allPredictions.slice(startIndex, endIndex);

    // Calculate total (approximate for performance)
    const total = allPredictions.length; // This is approximate based on current filters
    const hasMore = endIndex < total;

    return NextResponse.json({
      success: true,
      data: paginatedPredictions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore,
      },
      filters: {
        ticker: ticker || null,
        status,
        direction,
        userType,
        timeRange,
        sortBy,
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
