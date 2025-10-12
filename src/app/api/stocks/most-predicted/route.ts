// src/app/api/stocks/most-predicted/route.ts
import { NextResponse } from "next/server";
import { legacyPredictions, getDateDaysAgo } from "@/lib/legacyDb";

export async function GET() {
  try {
    const sevenDaysAgo = getDateDaysAgo(7);

    // Aggregate predictions by stock, count occurrences in last 7 days
    const result = await legacyPredictions.aggregate([
      // Filter: predictions from last 7 days
      {
        $match: {
          startTime: { $gte: sevenDaysAgo },
        },
      },
      // Group by stock
      {
        $group: {
          _id: "$stockId",
          stockName: { $first: "$stockName" },
          count: { $sum: 1 },
          // Calculate bull vs bear majority
          bullCount: {
            $sum: { $cond: [{ $eq: ["$bearOrBull", 1] }, 1, 0] },
          },
          bearCount: {
            $sum: { $cond: [{ $eq: ["$bearOrBull", -1] }, 1, 0] },
          },
        },
      },
      // Sort by count descending
      { $sort: { count: -1 } },
      // Limit to top 5
      { $limit: 5 },
      // Format output
      {
        $project: {
          ticker: "$_id",
          name: "$stockName",
          predictionCount: "$count",
          // Majority direction: bull (1) or bear (-1)
          majorityDirection: {
            $cond: [
              { $gte: ["$bullCount", "$bearCount"] },
              1, // Bull majority
              -1, // Bear majority
            ],
          },
          bullCount: 1,
          bearCount: 1,
        },
      },
    ]);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error fetching most predicted stocks:", error);
    return NextResponse.json(
      { error: "Failed to fetch most predicted stocks" },
      { status: 500 }
    );
  }
}
