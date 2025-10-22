// src/app/api/users/[username]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDatabases } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { auth } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;

    if (!username) {
      return NextResponse.json(
        { success: false, error: "Username is required" },
        { status: 400 }
      );
    }

    const { legacyDb, newDb } = await connectDatabases();

    // Get current session to check if viewer is logged in
    const session = await auth();
    const viewerId = session?.user?.id;

    // Try to find user in new database first
    let user = await newDb.collection("users").findOne({
      username: username,
    });

    let isLegacy = false;
    let stats: any = null;

    if (user) {
      // New user found
      isLegacy = false;

      // Get stats from userStats collection
      stats = await newDb.collection("userStats").findOne({
        userId: user._id,
      });

      // If no stats exist, initialize default stats
      if (!stats) {
        stats = {
          totalPredictions: 0,
          resolvedPredictions: 0,
          accuracyRate: 0,
          avgProfitRate: 0,
          currentStreak: 0,
          highestStreak: 0,
          subscriberCount: 0,
          subscribedToCount: 0,
        };
      }
    } else {
      // Try legacy database
      const legacyUser = await legacyDb.collection("users").findOne({
        name: username,
      });

      if (!legacyUser) {
        return NextResponse.json(
          { success: false, error: "User not found" },
          { status: 404 }
        );
      }

      isLegacy = true;

      // Transform legacy user to new format
      user = {
        _id: legacyUser._id,
        username: legacyUser.name,
        displayName: legacyUser.name,
        bio: null,
        avatarUrl: null,
        isLegacy: true,
        joinedAt: legacyUser.createTime || legacyUser.created_at || new Date(),
      };

      // OPTION 1: Use pre-calculated stats from legacy user document
      // (This is faster and what legacy app uses)
      if (
        legacyUser.totalPredictionCount !== undefined &&
        legacyUser.totalPredictionCount > 0
      ) {
        const finishedCount = legacyUser.finishedPredictionCount || 0;
        const successCount = legacyUser.successPredictionCount || 0;
        const accuracyRate =
          finishedCount > 0 ? (successCount / finishedCount) * 100 : 0;

        stats = {
          totalPredictions: legacyUser.totalPredictionCount || 0,
          resolvedPredictions: finishedCount,
          accuracyRate: Math.round(accuracyRate * 10) / 10,
          avgProfitRate: legacyUser.avgProfitRate || 0,
          currentStreak: legacyUser.currentStreak || 0,
          highestStreak: legacyUser.highestStreak || 0,
          subscriberCount: 0,
          subscribedToCount: 0,
        };
      } else {
        // OPTION 2: Calculate from predictions if stats don't exist
        // Query by userName (not userId) for legacy predictions
        const legacyPredictions = await legacyDb
          .collection("predictions")
          .find({
            userName: legacyUser.name, // Use name, not userId!
          })
          .toArray();

        const totalPredictions = legacyPredictions.length;
        const resolvedPredictions = legacyPredictions.filter(
          (p) => p.isCompleted
        ).length;
        const successfulPredictions = legacyPredictions.filter(
          (p) => p.isCompleted && p.profitRate > 0
        ).length;

        const accuracyRate =
          resolvedPredictions > 0
            ? (successfulPredictions / resolvedPredictions) * 100
            : 0;

        // Calculate average profit rate
        const profitRates = legacyPredictions
          .filter((p) => p.isCompleted && p.profitRate != null)
          .map((p) => p.profitRate);

        const avgProfitRate =
          profitRates.length > 0
            ? profitRates.reduce((sum, rate) => sum + rate, 0) /
              profitRates.length
            : 0;

        // Calculate streaks
        const sortedPredictions = legacyPredictions
          .filter((p) => p.isCompleted)
          .sort((a, b) => {
            const aTime = a.endTime || a.lastModifiedTime || new Date(0);
            const bTime = b.endTime || b.lastModifiedTime || new Date(0);
            return aTime.getTime() - bTime.getTime();
          });

        let currentStreak = 0;
        let highestStreak = 0;
        let tempStreak = 0;

        for (let i = sortedPredictions.length - 1; i >= 0; i--) {
          const pred = sortedPredictions[i];
          if (pred.profitRate > 0) {
            tempStreak++;
            if (i === sortedPredictions.length - 1) {
              currentStreak = tempStreak;
            }
            highestStreak = Math.max(highestStreak, tempStreak);
          } else {
            if (i === sortedPredictions.length - 1) {
              currentStreak = 0;
            }
            tempStreak = 0;
          }
        }

        stats = {
          totalPredictions,
          resolvedPredictions,
          accuracyRate: Math.round(accuracyRate * 10) / 10,
          avgProfitRate: Math.round(avgProfitRate * 100) / 100,
          currentStreak,
          highestStreak,
          subscriberCount: 0,
          subscribedToCount: 0,
        };
      }
    }

    // Check if viewer subscribes to this user
    let isSubscribed = false;
    if (viewerId && !isLegacy) {
      const subscription = await newDb.collection("subscriptions").findOne({
        subscriberId: new ObjectId(viewerId),
        subscribedToId: user._id,
      });
      isSubscribed = !!subscription;
    }

    // Check if this is the viewer's own profile
    const isOwnProfile = viewerId && user._id.toString() === viewerId;

    // Build response
    const response = {
      success: true,
      data: {
        user: {
          _id: user._id.toString(),
          username: user.username,
          displayName: user.displayName || user.username,
          bio: user.bio || null,
          avatarUrl: user.avatarUrl || null,
          isLegacy,
          joinedAt: user.joinedAt || user.created_at || new Date(),
        },
        stats: {
          totalPredictions: stats.totalPredictions || 0,
          resolvedPredictions: stats.resolvedPredictions || 0,
          accuracyRate: stats.accuracyRate || 0,
          avgProfitRate: stats.avgProfitRate || 0,
          currentStreak: stats.currentStreak || 0,
          highestStreak: stats.highestStreak || 0,
          subscriberCount: stats.subscriberCount || 0,
          subscribedToCount: stats.subscribedToCount || 0,
        },
        isSubscribed: viewerId ? isSubscribed : undefined,
        isOwnProfile,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
