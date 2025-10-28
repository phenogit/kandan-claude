// src/app/api/auth/verify-email/route.ts
import { NextResponse } from "next/server";
import { connectDatabases } from "@/lib/mongodb";
import { verifyToken } from "@/lib/verification-tokens";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { success: false, error: "缺少驗證令牌" },
        { status: 400 }
      );
    }

    // Verify token
    const tokenResult = await verifyToken(token, "email_verification");

    if (!tokenResult.success) {
      return NextResponse.json(
        { success: false, error: tokenResult.error },
        { status: 400 }
      );
    }

    const { newDb } = await connectDatabases();

    // Update user's emailVerified status
    const updateResult = await newDb.collection("users").updateOne(
      { _id: tokenResult.userId },
      {
        $set: {
          emailVerified: true,
          emailVerifiedAt: new Date(),
        },
      }
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: "找不到用戶" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "電子郵件驗證成功！您現在可以登入了",
    });
  } catch (error) {
    console.error("Error in verify-email:", error);
    return NextResponse.json(
      { success: false, error: "伺服器錯誤" },
      { status: 500 }
    );
  }
}
