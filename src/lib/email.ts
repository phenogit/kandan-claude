// src/lib/email.ts
import { Resend } from "resend";
import crypto from "crypto";

if (!process.env.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY is not defined in environment variables");
}

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.EMAIL_FROM || "onboarding@resend.dev";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/**
 * Generate a secure verification token
 */
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Send verification email to user
 */
export async function sendVerificationEmail(
  email: string,
  token: string,
  username: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const verificationUrl = `${APP_URL}/auth/verify-email?token=${token}`;

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "驗證您的電子郵件 - 股票預測平台",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>驗證您的電子郵件</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
              <h1 style="color: #2563eb; margin: 0 0 20px 0; font-size: 24px;">歡迎加入股票預測平台！</h1>
              <p style="margin: 0 0 10px 0; font-size: 16px;">嗨 <strong>${username}</strong>，</p>
              <p style="margin: 0 0 20px 0; font-size: 16px;">感謝您註冊！請點擊下方按鈕驗證您的電子郵件地址。</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" 
                   style="background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; font-size: 16px;">
                  驗證電子郵件
                </a>
              </div>
              
              <p style="margin: 20px 0 10px 0; font-size: 14px; color: #666;">如果按鈕無法點擊，請複製以下連結到瀏覽器：</p>
              <p style="margin: 0; font-size: 14px; word-break: break-all; color: #2563eb;">
                <a href="${verificationUrl}" style="color: #2563eb;">${verificationUrl}</a>
              </p>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                <p style="margin: 0; font-size: 12px; color: #999;">此連結將在 24 小時後過期。</p>
                <p style="margin: 10px 0 0 0; font-size: 12px; color: #999;">如果您沒有註冊此帳號，請忽略此郵件。</p>
              </div>
            </div>
            
            <div style="text-align: center; color: #999; font-size: 12px;">
              <p style="margin: 0;">© 2025 股票預測平台. All rights reserved.</p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return { success: false, error: error.message };
    }

    console.log("Verification email sent:", data);
    return { success: true };
  } catch (error) {
    console.error("Error sending verification email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  token: string,
  username: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const resetUrl = `${APP_URL}/auth/reset-password?token=${token}`;

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "重設您的密碼 - 股票預測平台",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>重設密碼</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
              <h1 style="color: #2563eb; margin: 0 0 20px 0; font-size: 24px;">重設您的密碼</h1>
              <p style="margin: 0 0 10px 0; font-size: 16px;">嗨 <strong>${username}</strong>，</p>
              <p style="margin: 0 0 20px 0; font-size: 16px;">我們收到了重設您密碼的請求。請點擊下方按鈕重設密碼。</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" 
                   style="background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; font-size: 16px;">
                  重設密碼
                </a>
              </div>
              
              <p style="margin: 20px 0 10px 0; font-size: 14px; color: #666;">如果按鈕無法點擊，請複製以下連結到瀏覽器：</p>
              <p style="margin: 0; font-size: 14px; word-break: break-all; color: #2563eb;">
                <a href="${resetUrl}" style="color: #2563eb;">${resetUrl}</a>
              </p>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                <p style="margin: 0; font-size: 12px; color: #999;">此連結將在 1 小時後過期。</p>
                <p style="margin: 10px 0 0 0; font-size: 12px; color: #999;">如果您沒有要求重設密碼，請忽略此郵件，您的密碼不會被變更。</p>
              </div>
            </div>
            
            <div style="text-align: center; color: #999; font-size: 12px;">
              <p style="margin: 0;">© 2025 股票預測平台. All rights reserved.</p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return { success: false, error: error.message };
    }

    console.log("Password reset email sent:", data);
    return { success: true };
  } catch (error) {
    console.error("Error sending password reset email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
