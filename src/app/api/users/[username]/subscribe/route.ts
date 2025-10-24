// src/app/api/users/[username]/subscribe/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDatabases } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { auth } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const { username } = await params;
    const subscriberId = session.user.id;

    if (!username) {
      return NextResponse.json(
        { success: false, error: "Username is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { action } = body; // 'subscribe' or 'unsubscribe'

    if (!action || !["subscribe", "unsubscribe"].includes(action)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid action. Must be 'subscribe' or 'unsubscribe'",
        },
        { status: 400 }
      );
    }

    const { newDb } = await connectDatabases();

    // Look up target user by username (only new users, not legacy)
    const targetUser = await newDb.collection("users").findOne({
      username: username,
    });

    if (!targetUser) {
      return NextResponse.json(
        {
          success: false,
          error:
            "User not found or is a legacy user (cannot subscribe to legacy users)",
        },
        { status: 404 }
      );
    }

    const userId = targetUser._id.toString();

    // Cannot subscribe to yourself
    if (userId === subscriberId) {
      return NextResponse.json(
        { success: false, error: "Cannot subscribe to yourself" },
        { status: 400 }
      );
    }

    const subscriberObjectId = new ObjectId(subscriberId);
    const subscribedToObjectId = targetUser._id;

    if (action === "subscribe") {
      // Check if already subscribed
      const existing = await newDb.collection("subscriptions").findOne({
        subscriberId: subscriberObjectId,
        subscribedToId: subscribedToObjectId,
      });

      if (existing) {
        return NextResponse.json(
          { success: false, error: "Already subscribed to this user" },
          { status: 400 }
        );
      }

      // Create subscription
      await newDb.collection("subscriptions").insertOne({
        _id: new ObjectId(),
        subscriberId: subscriberObjectId,
        subscribedToId: subscribedToObjectId,
        createdAt: new Date(),
      });

      // Update subscriber counts
      await newDb
        .collection("userStats")
        .updateOne(
          { userId: subscribedToObjectId },
          { $inc: { subscriberCount: 1 } },
          { upsert: true }
        );

      await newDb
        .collection("userStats")
        .updateOne(
          { userId: subscriberObjectId },
          { $inc: { subscribedToCount: 1 } },
          { upsert: true }
        );

      // Create notification for target user
      await newDb.collection("notifications").insertOne({
        _id: new ObjectId(),
        userId: subscribedToObjectId,
        type: "new_subscriber",
        data: {
          subscriberId: subscriberId,
          subscriberUsername: session.user.username || session.user.name,
        },
        isRead: false,
        createdAt: new Date(),
      });

      return NextResponse.json({
        success: true,
        message: "Successfully subscribed",
        data: {
          isSubscribed: true,
        },
      });
    } else {
      // Unsubscribe
      const result = await newDb.collection("subscriptions").deleteOne({
        subscriberId: subscriberObjectId,
        subscribedToId: subscribedToObjectId,
      });

      if (result.deletedCount === 0) {
        return NextResponse.json(
          { success: false, error: "Subscription not found" },
          { status: 404 }
        );
      }

      // Update subscriber counts
      await newDb
        .collection("userStats")
        .updateOne(
          { userId: subscribedToObjectId },
          { $inc: { subscriberCount: -1 } }
        );

      await newDb
        .collection("userStats")
        .updateOne(
          { userId: subscriberObjectId },
          { $inc: { subscribedToCount: -1 } }
        );

      return NextResponse.json({
        success: true,
        message: "Successfully unsubscribed",
        data: {
          isSubscribed: false,
        },
      });
    }
  } catch (error) {
    console.error("Error in subscribe/unsubscribe:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
