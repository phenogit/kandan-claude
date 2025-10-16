// src/lib/auth.ts
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import AppleProvider from "next-auth/providers/apple";
import bcrypt from "bcryptjs";
import { connectDatabases } from "./mongodb";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    // Email/Password Provider
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("請輸入電子郵件和密碼");
        }

        const { newDb } = await connectDatabases();

        // Find user by email
        const user = await newDb.collection("users").findOne({
          email: (credentials.email as string).toLowerCase(),
        });

        if (!user) {
          throw new Error("電子郵件或密碼錯誤");
        }

        // Check if user registered with OAuth (no password)
        if (!user.passwordHash) {
          throw new Error("此帳號使用社群媒體登入，請使用相應的登入方式");
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isPasswordValid) {
          throw new Error("電子郵件或密碼錯誤");
        }

        // Check email verification
        if (!user.emailVerified) {
          throw new Error("請先驗證您的電子郵件");
        }

        // Update last login
        await newDb
          .collection("users")
          .updateOne({ _id: user._id }, { $set: { lastLoginAt: new Date() } });

        // Return user object for session
        return {
          id: user._id.toString(),
          email: user.email,
          name: user.displayName,
          username: user.username,
          image: user.avatarUrl,
        };
      },
    }),

    // Google OAuth Provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    // Facebook OAuth Provider
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    }),

    // Apple OAuth Provider
    AppleProvider({
      clientId: process.env.APPLE_ID!,
      clientSecret: process.env.APPLE_SECRET!,
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      if (!account) {
        return false;
      }

      if (account.provider === "credentials") {
        // Credentials login already handled in authorize()
        return true;
      }

      // OAuth login - create/update user
      const { newDb } = await connectDatabases();

      try {
        // Check if user exists by email or OAuth provider ID
        const existingUser = await newDb.collection("users").findOne({
          $or: [
            { email: user.email?.toLowerCase() },
            {
              authProvider: account.provider,
              authProviderId: account.providerAccountId,
            },
          ],
        });

        if (existingUser) {
          // User exists - update last login
          await newDb.collection("users").updateOne(
            { _id: existingUser._id },
            {
              $set: {
                lastLoginAt: new Date(),
                ...(existingUser.authProvider !== account.provider && {
                  authProvider: account.provider,
                  authProviderId: account.providerAccountId,
                }),
              },
            }
          );

          // Update user object with username
          user.id = existingUser._id.toString();
          user.username = existingUser.username;

          return true;
        }

        // New user - create account
        const username = await generateUniqueUsername(
          user.name || user.email?.split("@")[0] || "user",
          newDb
        );

        const newUser = {
          username,
          email: user.email?.toLowerCase(),
          displayName: user.name || username,
          passwordHash: null,
          authProvider: account.provider,
          authProviderId: account.providerAccountId,
          emailVerified: true,
          userType: "native",
          isReadOnly: false,
          isPublic: true,
          bio: "",
          avatarUrl: user.image || "",
          createdAt: new Date(),
          updatedAt: new Date(),
          lastLoginAt: new Date(),
        };

        const result = await newDb.collection("users").insertOne(newUser);
        user.id = result.insertedId.toString();
        user.username = username;

        return true;
      } catch (error) {
        console.error("Error in signIn callback:", error);
        return false;
      }
    },

    async jwt({ token, user, trigger }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }

      return token;
    },

    async session({ session, token }) {
      // Add custom fields to session
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string;
      }

      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  secret: process.env.NEXTAUTH_SECRET,
});

// Helper function
async function generateUniqueUsername(
  baseName: string,
  newDb: any
): Promise<string> {
  let username = baseName
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .substring(0, 20);

  let exists = await newDb.collection("users").findOne({ username });

  if (!exists) {
    return username;
  }

  let attempts = 0;
  while (exists && attempts < 10) {
    const randomNum = Math.floor(Math.random() * 9999);
    username = `${baseName.substring(0, 20)}_${randomNum}`;
    exists = await newDb.collection("users").findOne({ username });
    attempts++;
  }

  return username;
}
