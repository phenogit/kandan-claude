// src/lib/legacyDb.ts
import { MongoClient, Db } from "mongodb";

if (!process.env.MONGODB_URI_LEGACY) {
  throw new Error("Please add MONGODB_URI_LEGACY to .env.local");
}

const uri = process.env.MONGODB_URI_LEGACY;
const options = {
  maxPoolSize: 10,
  // Read-only configuration for safety
  readPreference: "secondary" as const,
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  // In development, use a global variable to preserve the connection
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromiseLegacy?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromiseLegacy) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromiseLegacy = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromiseLegacy;
} else {
  // In production, create a new client for each request
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

// Database name for legacy data
const DB_NAME = "kandan";

/**
 * Connect to legacy database (READ-ONLY)
 */
export async function connectToLegacyDatabase(): Promise<Db> {
  const client = await clientPromise;
  return client.db(DB_NAME);
}

/**
 * Safe read-only wrapper for legacy users collection
 */
export const legacyUsers = {
  async findOne(query: any) {
    const db = await connectToLegacyDatabase();
    return db.collection("users").findOne(query);
  },

  async find(query: any, options?: any) {
    const db = await connectToLegacyDatabase();
    return db.collection("users").find(query, options).toArray();
  },

  async countDocuments(query: any) {
    const db = await connectToLegacyDatabase();
    return db.collection("users").countDocuments(query);
  },

  async aggregate(pipeline: any[]) {
    const db = await connectToLegacyDatabase();
    return db.collection("users").aggregate(pipeline).toArray();
  },
};

/**
 * Safe read-only wrapper for legacy predictions collection
 */
export const legacyPredictions = {
  async findOne(query: any) {
    const db = await connectToLegacyDatabase();
    return db.collection("predictions").findOne(query);
  },

  async find(query: any, options?: any) {
    const db = await connectToLegacyDatabase();
    return db.collection("predictions").find(query, options).toArray();
  },

  async countDocuments(query: any) {
    const db = await connectToLegacyDatabase();
    return db.collection("predictions").countDocuments(query);
  },

  async aggregate(pipeline: any[]) {
    const db = await connectToLegacyDatabase();
    return db.collection("predictions").aggregate(pipeline).toArray();
  },
};

/**
 * Helper: Get date 7 days ago (for "this week" queries)
 */
export function getDateDaysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

/**
 * Helper: Map legacy prediction to unified format
 */
export function mapLegacyPrediction(legacyPred: any) {
  return {
    _id: legacyPred._id,
    userId: null, // Legacy users don't have IDs in new system
    userName: legacyPred.userName,
    ticker: legacyPred.stockId,
    tickerName: legacyPred.stockName,
    direction: legacyPred.bearOrBull, // 1 = bull, -1 = bear
    ceiling: legacyPred.highPrice,
    floor: legacyPred.lowPrice,
    confidence: legacyPred.confidence,
    startTime: legacyPred.startTime,
    startPrice: parseFloat(legacyPred.startPrice) || 0,
    currentPrice: parseCurrentPrice(legacyPred.currentPrice),
    endPrice: legacyPred.endPrice,
    status: legacyPred.isCompleted
      ? legacyPred.profitRate >= 0
        ? "auto-success"
        : "auto-fail"
      : "pending",
    profitRate: legacyPred.profitRate,
    rationale: "", // Legacy doesn't have rationale
    isLegacy: true,
    createdAt: legacyPred.startTime,
    resolvedAt: legacyPred.endTime,
  };
}

/**
 * Helper: Parse legacy currentPrice (can be "29.6000-30.0000" or single value)
 */
function parseCurrentPrice(priceString: string | number): number {
  if (typeof priceString === "number") return priceString;
  if (!priceString) return 0;

  // If it's a range like "29.6000-30.0000", take the first value
  const parts = priceString.split("-");
  return parseFloat(parts[0]) || 0;
}

/**
 * Helper: Map legacy user to unified format
 */
export function mapLegacyUser(legacyUser: any) {
  return {
    _id: legacyUser._id,
    username: legacyUser.name,
    displayName: legacyUser.name,
    userType: "legacy",
    isReadOnly: true,
    stats: {
      totalPredictions: legacyUser.totalPredictionCount || 0,
      resolvedPredictions: legacyUser.finishedPredictionCount || 0,
      successfulPredictions: legacyUser.successPredictionCount || 0,
      failedPredictions: legacyUser.failPredictionCount || 0,
      accuracyRate: calculateAccuracyRate(
        legacyUser.successPredictionCount || 0,
        legacyUser.finishedPredictionCount || 0
      ),
      avgProfitRate: legacyUser.avgProfitRate || 0,
      currentStreak: legacyUser.currentStreak || 0,
      highestStreak: legacyUser.highestStreak || 0,
    },
    createdAt: legacyUser.createTime,
    isLegacy: true,
  };
}

/**
 * Helper: Calculate accuracy rate
 */
function calculateAccuracyRate(successful: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((successful / total) * 100 * 10) / 10; // Round to 1 decimal
}
