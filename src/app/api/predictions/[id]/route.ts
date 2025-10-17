// src/app/api/predictions/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDatabases } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid prediction ID" },
        { status: 400 }
      );
    }

    const { newDb } = await connectDatabases();

    // Get prediction
    const prediction = await newDb.collection("predictions").findOne({
      _id: new ObjectId(id),
    });

    if (!prediction) {
      return NextResponse.json(
        { error: "Prediction not found" },
        { status: 404 }
      );
    }

    // Get user info
    const user = await newDb.collection("users").findOne({
      _id: prediction.userId,
    });

    // Format response
    const formattedPrediction = {
      ...prediction,
      _id: prediction._id.toString(),
      userId: prediction.userId.toString(),
      user: user
        ? {
            username: user.username,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl || null,
          }
        : null,
    };

    return NextResponse.json({
      prediction: formattedPrediction,
    });
  } catch (error) {
    console.error("Get prediction error:", error);
    return NextResponse.json(
      { error: "Failed to get prediction" },
      { status: 500 }
    );
  }
}
