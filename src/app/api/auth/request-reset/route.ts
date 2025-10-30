// src/app/api/auth/request-reset/route.ts
import { NextResponse } from "next/server";
import { connectDatabases } from "@/lib/mongodb";
import { generateVerificationToken, sendPasswordResetEmail } from "@/lib/email";
import { createVerificationToken } from "@/lib/verification-tokens";
import { ObjectId } from "mongodb";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: "請提供電子郵件地址" },
        { status: 400 }
      );
    }

    const { newDb } = await connectDatabases();

    // Find user by email
    const user = await newDb.collection("users").findOne({
      email: email.toLowerCase(),
    });

    // SECURITY: Always return success even if user doesn't exist
    // This prevents email enumeration attacks
    if (!user) {
      return NextResponse.json({
        success: true,
        message: "如果該電子郵件已註冊，重設連結將會寄送到您的信箱",
      });
    }

    // Generate reset token
    const token = generateVerificationToken();

    // Store token in database with 1 hour expiration
    const tokenResult = await createVerificationToken(
      user._id as ObjectId,
      token,
      "password_reset"
    );

    if (!tokenResult.success) {
      console.error("Failed to create reset token:", tokenResult.error);
      return NextResponse.json(
        { success: false, error: "無法創建重設令牌，請稍後再試" },
        { status: 500 }
      );
    }

    // Send password reset email
    const emailResult = await sendPasswordResetEmail(
      user.email,
      token,
      user.displayName || user.username
    );

    if (!emailResult.success) {
      console.error("Failed to send reset email:", emailResult.error);
      // Still return success to prevent email enumeration
      return NextResponse.json({
        success: true,
        message: "如果該電子郵件已註冊，重設連結將會寄送到您的信箱",
      });
    }

    console.log(`✅ Password reset email sent to ${email}`);

    return NextResponse.json({
      success: true,
      message: "重設連結已發送，請檢查您的信箱",
    });
  } catch (error) {
    console.error("Error in request-reset:", error);
    return NextResponse.json(
      { success: false, error: "伺服器錯誤，請稍後再試" },
      { status: 500 }
    );
  }
}
