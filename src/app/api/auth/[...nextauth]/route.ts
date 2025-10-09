// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import AppleProvider from "next-auth/providers/apple";
import bcrypt from "bcryptjs";
import { newDB } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export const authOptions: NextAuthConfig = {
  providers: [
    // Email/Password Provider
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing credentials");
        }

        // Find user in new database
        const user = await newDB.users.findOne({
          email: (credentials.email as string).toLowerCase(),
        });

        if (!user) {
          throw new Error("No user found with this email");
        }

        if (!user.passwordHash) {
          throw new Error("Please sign in with your OAuth provider");
        }

        // Verify password
        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isValid) {
          throw new Error("Invalid password");
        }

        // Update last login
        await newDB.users.updateOne(
          { _id: user._id },
          { $set: { lastLoginAt: new Date() } }
        );

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.displayName || user.username,
          image: user.avatarUrl,
        };
      },
    }),

    // Google OAuth
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),

    // Facebook OAuth
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID || "",
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || "",
    }),

    // Apple OAuth
    AppleProvider({
      clientId: process.env.APPLE_ID || "",
      clientSecret: process.env.APPLE_SECRET || "",
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  pages: {
    signIn: "/login",
    signOut: "/",
    error: "/login",
    verifyRequest: "/verify-email",
  },

  callbacks: {
    async signIn({ user, account }) {
      // For OAuth providers, ensure user exists in new database
      if (account?.provider !== "credentials") {
        const existingUser = await newDB.users.findOne({
          email: user.email?.toLowerCase(),
        });

        if (!existingUser && user.email) {
          // Create new user from OAuth
          const username = await generateUniqueUsername(
            user.name || user.email.split("@")[0] || "user"
          );

          await newDB.users.insertOne({
            _id: new ObjectId(),
            username,
            email: user.email.toLowerCase(),
            displayName: user.name || username,
            authProvider: account?.provider as any,
            authProviderId: account?.providerAccountId,
            avatarUrl: user.image || undefined,
            userType: "native",
            isReadOnly: false,
            emailVerified: true, // OAuth emails are pre-verified
            isPublic: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            lastLoginAt: new Date(),
          });
        } else if (existingUser) {
          // Update last login
          await newDB.users.updateOne(
            { _id: existingUser._id },
            { $set: { lastLoginAt: new Date() } }
          );
        }
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;

        // Fetch full user data
        const userData = await newDB.users.findOne({
          _id: new ObjectId(token.id as string),
        });

        if (userData) {
          session.user.username = userData.username;
          session.user.displayName = userData.displayName || userData.username;
        }
      }
      return session;
    },
  },

  events: {
    async signIn(message) {
      const { user, account } = message;
      if (user?.email && account?.provider) {
        console.log(`✅ User signed in: ${user.email} via ${account.provider}`);
      }
    },
  },

  debug: process.env.NODE_ENV === "development",
};

// Helper function to generate unique username
async function generateUniqueUsername(baseName: string): Promise<string> {
  let username = baseName
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .substring(0, 30);

  let counter = 1;
  let isUnique = false;

  while (!isUnique) {
    const testUsername = counter === 1 ? username : `${username}_${counter}`;
    const existing = await newDB.users.findOne({ username: testUsername });

    if (!existing) {
      username = testUsername;
      isUnique = true;
    } else {
      counter++;
    }
  }

  return username;
}

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
