// src/app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { newDB } from "@/lib/mongodb";
import { z } from "zod";

// Validation schema
const signupSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores"
    ),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  displayName: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validationResult = signupSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: validationResult.error.issues.map((i) => i.message).join(", "),
        },
        { status: 400 }
      );
    }

    const { username, email, password, displayName } = validationResult.data;

    // Check if username already exists
    const existingUsername = await newDB.users.findOne({
      username: username.toLowerCase(),
    });

    if (existingUsername) {
      return NextResponse.json(
        { success: false, error: "Username already taken" },
        { status: 409 }
      );
    }

    // Check if email already exists
    const existingEmail = await newDB.users.findOne({
      email: email.toLowerCase(),
    });

    if (existingEmail) {
      return NextResponse.json(
        { success: false, error: "Email already registered" },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const newUser = {
      _id: new ObjectId(),
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      displayName: displayName || username,
      passwordHash,
      authProvider: "local" as const,
      userType: "native" as const,
      isReadOnly: false,
      emailVerified: false,
      isPublic: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await newDB.users.insertOne(newUser);

    // Initialize user stats
    await newDB.userStats.updateOne(
      { userId: newUser._id },
      {
        $set: {
          _id: new ObjectId(),
          userId: newUser._id,
          totalPredictions: 0,
          pendingPredictions: 0,
          resolvedPredictions: 0,
          successfulPredictions: 0,
          failedPredictions: 0,
          originalPredictions: 0,
          followedPredictions: 0,
          accuracyRate: 0,
          avgProfitRate: 0,
          avgProfitRateAdjustedByConfidence: 0,
          currentStreak: 0,
          highestStreak: 0,
          subscriberCount: 0,
          subscribedToCount: 0,
          predictionFollowCount: 0,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    // TODO: Send email verification (Phase 1: required)
    // await sendVerificationEmail(email, verificationToken);

    return NextResponse.json({
      success: true,
      message:
        "Account created successfully. Please check your email to verify your account.",
      data: {
        userId: newUser._id.toString(),
        username: newUser.username,
        email: newUser.email,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
