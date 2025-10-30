// src/app/api/auth/reset-password/route.ts
import { NextResponse } from "next/server";
import { connectDatabases } from "@/lib/mongodb";
import { verifyToken } from "@/lib/verification-tokens";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();

    // Validation
    if (!token) {
      return NextResponse.json(
        { success: false, error: "缺少重設令牌" },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { success: false, error: "請提供新密碼" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: "密碼必須至少 8 個字元" },
        { status: 400 }
      );
    }

    // Verify the token
    const tokenResult = await verifyToken(token, "password_reset");

    if (!tokenResult.success) {
      return NextResponse.json(
        { success: false, error: tokenResult.error },
        { status: 400 }
      );
    }

    const { newDb } = await connectDatabases();

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user's password
    const updateResult = await newDb.collection("users").updateOne(
      { _id: tokenResult.userId },
      {
        $set: {
          passwordHash: hashedPassword,
          updatedAt: new Date(),
        },
      }
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: "找不到用戶" },
        { status: 404 }
      );
    }

    console.log(`✅ Password reset successful for user ${tokenResult.userId}`);

    // TODO (Optional): Invalidate all existing sessions for this user
    // This would require session management implementation

    return NextResponse.json({
      success: true,
      message: "密碼重設成功！您現在可以使用新密碼登入",
    });
  } catch (error) {
    console.error("Error in reset-password:", error);
    return NextResponse.json(
      { success: false, error: "伺服器錯誤，請稍後再試" },
      { status: 500 }
    );
  }
}
