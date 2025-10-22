// src/app/api/users/profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDatabases } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { auth } from "@/lib/auth";

export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await request.json();

    // Validate input
    const { displayName, bio, avatarUrl } = body;

    // Validation rules
    if (displayName !== undefined) {
      if (typeof displayName !== "string" || displayName.trim().length === 0) {
        return NextResponse.json(
          { success: false, error: "Display name cannot be empty" },
          { status: 400 }
        );
      }
      if (displayName.length > 50) {
        return NextResponse.json(
          {
            success: false,
            error: "Display name must be 50 characters or less",
          },
          { status: 400 }
        );
      }
    }

    if (bio !== undefined) {
      if (typeof bio !== "string") {
        return NextResponse.json(
          { success: false, error: "Bio must be a string" },
          { status: 400 }
        );
      }
      if (bio.length > 500) {
        return NextResponse.json(
          { success: false, error: "Bio must be 500 characters or less" },
          { status: 400 }
        );
      }
    }

    if (avatarUrl !== undefined && avatarUrl !== null) {
      if (typeof avatarUrl !== "string") {
        return NextResponse.json(
          { success: false, error: "Avatar URL must be a string" },
          { status: 400 }
        );
      }
      // Basic URL validation
      try {
        new URL(avatarUrl);
      } catch {
        return NextResponse.json(
          { success: false, error: "Invalid avatar URL" },
          { status: 400 }
        );
      }
    }

    const { newDb } = await connectDatabases();

    // Check if user exists
    const user = await newDb.collection("users").findOne({
      _id: new ObjectId(userId),
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Build update object (only update provided fields)
    const updateFields: any = {
      updatedAt: new Date(),
    };

    if (displayName !== undefined) {
      updateFields.displayName = displayName.trim();
    }

    if (bio !== undefined) {
      updateFields.bio = bio.trim();
    }

    if (avatarUrl !== undefined) {
      updateFields.avatarUrl = avatarUrl;
    }

    // Update user
    await newDb
      .collection("users")
      .updateOne({ _id: new ObjectId(userId) }, { $set: updateFields });

    // Fetch updated user
    const updatedUser = await newDb.collection("users").findOne({
      _id: new ObjectId(userId),
    });

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: {
          _id: updatedUser!._id.toString(),
          username: updatedUser!.username,
          displayName: updatedUser!.displayName,
          bio: updatedUser!.bio || null,
          avatarUrl: updatedUser!.avatarUrl || null,
        },
      },
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch own profile
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { newDb } = await connectDatabases();

    const user = await newDb.collection("users").findOne({
      _id: new ObjectId(userId),
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          _id: user._id.toString(),
          username: user.username,
          email: user.email,
          displayName: user.displayName,
          bio: user.bio || null,
          avatarUrl: user.avatarUrl || null,
          emailVerified: user.emailVerified || false,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
