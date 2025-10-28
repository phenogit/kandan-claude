// src/app/api/auth/send-verification/route.ts
import { NextResponse } from "next/server";
import { connectDatabases } from "@/lib/mongodb";
import { generateVerificationToken, sendVerificationEmail } from "@/lib/email";
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

    if (!user) {
      // Don't reveal if email exists or not (security)
      return NextResponse.json({
        success: true,
        message: "如果該電子郵件已註冊，驗證信將會寄送到您的信箱",
      });
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json(
        { success: false, error: "此電子郵件已經驗證過了" },
        { status: 400 }
      );
    }

    // Generate verification token
    const token = generateVerificationToken();

    // Store token in database
    const tokenResult = await createVerificationToken(
      user._id as ObjectId,
      token,
      "email_verification"
    );

    if (!tokenResult.success) {
      return NextResponse.json(
        { success: false, error: "無法創建驗證令牌" },
        { status: 500 }
      );
    }

    // Send verification email
    const emailResult = await sendVerificationEmail(
      user.email,
      token,
      user.displayName || user.username
    );

    if (!emailResult.success) {
      return NextResponse.json(
        { success: false, error: "無法發送驗證郵件，請稍後再試" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "驗證郵件已發送，請檢查您的信箱",
    });
  } catch (error) {
    console.error("Error in send-verification:", error);
    return NextResponse.json(
      { success: false, error: "伺服器錯誤" },
      { status: 500 }
    );
  }
}
