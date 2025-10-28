// src/lib/verification-tokens.ts
import { connectDatabases } from "./mongodb";
import { ObjectId } from "mongodb";

export interface VerificationToken {
  _id?: ObjectId;
  userId: ObjectId;
  token: string;
  type: "email_verification" | "password_reset";
  expiresAt: Date;
  createdAt: Date;
  usedAt?: Date;
}

/**
 * Create a new verification token in the database
 */
export async function createVerificationToken(
  userId: ObjectId,
  token: string,
  type: "email_verification" | "password_reset" = "email_verification"
): Promise<{ success: boolean; error?: string }> {
  try {
    const { newDb } = await connectDatabases();

    // Delete any existing unused tokens for this user and type
    await newDb.collection("verificationTokens").deleteMany({
      userId,
      type,
      usedAt: { $exists: false },
    });

    // Calculate expiration (24 hours for email, 1 hour for password reset)
    const expiresInHours = type === "email_verification" ? 24 : 1;
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

    // Insert new token
    await newDb.collection("verificationTokens").insertOne({
      userId,
      token,
      type,
      expiresAt,
      createdAt: new Date(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error creating verification token:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Verify and use a token
 */
export async function verifyToken(
  token: string,
  type: "email_verification" | "password_reset" = "email_verification"
): Promise<{
  success: boolean;
  userId?: ObjectId;
  error?: string;
}> {
  try {
    const { newDb } = await connectDatabases();

    // Find the token
    const tokenDoc = await newDb.collection("verificationTokens").findOne({
      token,
      type,
      usedAt: { $exists: false }, // Not already used
    });

    if (!tokenDoc) {
      return {
        success: false,
        error: "驗證連結無效或已被使用",
      };
    }

    // Check if expired
    if (new Date() > tokenDoc.expiresAt) {
      return {
        success: false,
        error: "驗證連結已過期，請重新發送驗證郵件",
      };
    }

    // Mark token as used
    await newDb
      .collection("verificationTokens")
      .updateOne({ _id: tokenDoc._id }, { $set: { usedAt: new Date() } });

    return {
      success: true,
      userId: tokenDoc.userId,
    };
  } catch (error) {
    console.error("Error verifying token:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Delete expired tokens (cleanup function)
 */
export async function cleanupExpiredTokens(): Promise<number> {
  try {
    const { newDb } = await connectDatabases();

    const result = await newDb.collection("verificationTokens").deleteMany({
      expiresAt: { $lt: new Date() },
    });

    console.log(`Deleted ${result.deletedCount} expired tokens`);
    return result.deletedCount;
  } catch (error) {
    console.error("Error cleaning up expired tokens:", error);
    return 0;
  }
}
