// src/app/api/users/most-successful/route.ts
import { NextResponse } from "next/server";
import {
  legacyUsers,
  legacyPredictions,
  getDateDaysAgo,
  mapLegacyUser,
} from "@/lib/legacyDb";

export async function GET() {
  try {
    const sevenDaysAgo = getDateDaysAgo(7);

    // Get users who had predictions resolved in last 7 days
    const recentPredictions = await legacyPredictions.aggregate([
      {
        $match: {
          endTime: { $gte: sevenDaysAgo },
          isCompleted: true,
        },
      },
      {
        $group: {
          _id: "$userName",
          totalResolved: { $sum: 1 },
          successful: {
            $sum: { $cond: [{ $gte: ["$profitRate", 0] }, 1, 0] },
          },
          avgProfit: { $avg: "$profitRate" },
        },
      },
      // Filter: at least 3 resolved predictions
      { $match: { totalResolved: { $gte: 3 } } },
      // Calculate accuracy
      {
        $project: {
          userName: "$_id",
          totalResolved: 1,
          successful: 1,
          avgProfit: 1,
          accuracyRate: {
            $multiply: [{ $divide: ["$successful", "$totalResolved"] }, 100],
          },
        },
      },
      // Sort by accuracy rate
      { $sort: { accuracyRate: -1 } },
      { $limit: 5 },
    ]);

    // Get user details for each
    const usersWithStats = await Promise.all(
      recentPredictions.map(async (stat: any) => {
        const user = await legacyUsers.findOne({ name: stat.userName });
        if (!user) return null;

        return {
          ...mapLegacyUser(user),
          weekStats: {
            resolved: stat.totalResolved,
            successful: stat.successful,
            accuracyRate: Math.round(stat.accuracyRate * 10) / 10,
            avgProfit: Math.round(stat.avgProfit * 100) / 100,
          },
        };
      })
    );

    // Filter out nulls
    const validUsers = usersWithStats.filter((u) => u !== null);

    return NextResponse.json({
      success: true,
      data: validUsers,
    });
  } catch (error) {
    console.error("Error fetching most successful users:", error);
    return NextResponse.json(
      { error: "Failed to fetch most successful users" },
      { status: 500 }
    );
  }
}
