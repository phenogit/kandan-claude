// src/app/api/feed/global/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDatabases } from "@/lib/mongodb";
import { legacyPredictions, mapLegacyPrediction } from "@/lib/legacyDb";
import { ObjectId } from "mongodb";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Cursor-based pagination: use timestamp instead of page number
    const cursorParam = searchParams.get("cursor");
    const cursor = cursorParam ? new Date(cursorParam) : new Date(); // Default to current time for first page
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

    // ===== FETCH NEW PREDICTIONS (with cursor) =====
    let newPredictions: any[] = [];

    if (userType !== "legacy") {
      const newQuery: any = {
        isPublic: true,
        createdAt: { $lt: cursor }, // CURSOR: Fetch items older than cursor
      };

      // Ticker filter
      if (ticker) {
        newQuery.ticker = { $regex: ticker, $options: "i" };
      }

      // Status filter
      if (status === "pending") {
        newQuery.status = "pending";
      } else if (status === "resolved") {
        newQuery.status = "resolved";
      }

      // Direction filter
      if (direction === "bull") {
        newQuery.direction = 1; // Bull = 1 (number, not string)
      } else if (direction === "bear") {
        newQuery.direction = -1; // Bear = -1 (number, not string)
      }

      // Time range filter (combine with cursor)
      if (dateFilter) {
        newQuery.createdAt = {
          $lt: cursor,
          $gte: dateFilter,
        };
      }

      // Sorting
      let sortOption: any = { createdAt: -1 }; // Default: newest first

      if (sortBy === "popular") {
        sortOption = { followCount: -1, createdAt: -1 };
      } else if (sortBy === "ending-soon") {
        // For ending-soon, only show pending and sort by oldest first
        newQuery.status = "pending";
        sortOption = { createdAt: 1 };
      }

      const preds = await newDb
        .collection("predictions")
        .find(newQuery)
        .sort(sortOption)
        .limit(limit) // Fetch exactly limit items from new DB
        .toArray();

      // Get unique user IDs from predictions
      const userIds = [...new Set(preds.map((p) => p.userId).filter(Boolean))];

      // Convert to ObjectId for MongoDB query, filtering out nulls
      const userObjectIds = userIds
        .map((id) => {
          try {
            return new ObjectId(id);
          } catch {
            return null;
          }
        })
        .filter((id): id is ObjectId => id !== null); // Type guard to remove nulls

      // Fetch user details for all users at once (batch lookup)
      const users = await newDb
        .collection("users")
        .find({ _id: { $in: userObjectIds } })
        .toArray();

      // Create a map for quick user lookup
      const userMap = new Map(users.map((u) => [u._id.toString(), u]));

      newPredictions = preds.map((pred: any) => {
        const user = userMap.get(pred.userId?.toString());

        return {
          _id: pred._id.toString(),
          userId: pred.userId?.toString() || "unknown",
          userName: user?.username || user?.displayName || "Anonymous",
          userAvatar: user?.avatar || user?.profileImage || null,
          ticker: pred.ticker || "N/A",
          stockName: pred.stockName || pred.ticker || "Unknown Stock",
          direction: pred.direction,
          currentPrice: pred.currentPrice || 0,
          floor: pred.floor || 0,
          ceiling: pred.ceiling || 0,
          confidence: pred.confidence,
          followCount: pred.followCount || 0,
          status: pred.status,
          isLegacy: false,
          createdAt: pred.createdAt.toISOString(),
          rationale: pred.rationale || null,
        };
      });
    }

    // ===== FETCH LEGACY PREDICTIONS (with cursor) =====
    let legacyPreds: any[] = [];

    if (userType !== "new") {
      const legacyQuery: any = {
        startTime: { $lt: cursor }, // CURSOR: Fetch items older than cursor
      };

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

      // Time range filter (combine with cursor)
      if (dateFilter) {
        legacyQuery.startTime = {
          $lt: cursor,
          $gte: dateFilter,
        };
      }

      // Sorting
      let legacySortOption: any = { startTime: -1 }; // Default: newest first

      if (sortBy === "popular") {
        legacySortOption = { followers: -1, startTime: -1 };
      } else if (sortBy === "ending-soon") {
        legacyQuery.isCompleted = false; // Only pending
        legacySortOption = { startTime: 1 }; // Oldest first
      }

      legacyPreds = await legacyPredictions.find(legacyQuery, {
        sort: legacySortOption,
        limit: limit, // Fetch exactly limit items from legacy DB
      });

      legacyPreds = legacyPreds.map((pred: any) => ({
        ...mapLegacyPrediction(pred),
        followCount: pred.followers?.length || 0,
      }));
    }

    // ===== MERGE AND SORT (merge-sort algorithm) =====
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
      // Already filtered to pending only, sort by oldest first
      allPredictions.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateA - dateB; // Oldest first
      });
    }

    // Take only the first `limit` items after merging
    const paginatedPredictions = allPredictions.slice(0, limit);

    // Calculate next cursor (timestamp of the last item)
    const nextCursor =
      paginatedPredictions.length > 0
        ? paginatedPredictions[paginatedPredictions.length - 1].createdAt
        : null;

    // Determine if there are more results
    // If we got fewer than limit items, there's definitely no more
    // If we got exactly limit items, there might be more (we don't know for sure)
    const hasMore = paginatedPredictions.length === limit;

    return NextResponse.json({
      success: true,
      data: paginatedPredictions,
      pagination: {
        limit,
        nextCursor, // Return cursor instead of page number
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
