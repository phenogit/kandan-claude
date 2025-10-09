// src/lib/mongodb.ts
import { MongoClient, Db } from "mongodb";

if (!process.env.MONGODB_URI_LEGACY) {
  throw new Error("MONGODB_URI_LEGACY is not defined");
}

if (!process.env.MONGODB_URI_NEW) {
  throw new Error("MONGODB_URI_NEW is not defined");
}

// Legacy database (read-only)
const legacyClient = new MongoClient(process.env.MONGODB_URI_LEGACY, {
  maxPoolSize: 10,
  readPreference: "secondary", // Use secondary for reads to avoid affecting production
});

// New database (read/write)
const newClient = new MongoClient(process.env.MONGODB_URI_NEW, {
  maxPoolSize: 20,
});

let legacyDb: Db | null = null;
let newDb: Db | null = null;

export async function connectDatabases() {
  try {
    if (!legacyDb) {
      await legacyClient.connect();
      legacyDb = legacyClient.db("kandan");
      console.log("✅ Connected to legacy database (kandan)");
    }

    if (!newDb) {
      await newClient.connect();
      newDb = newClient.db("kandan_v2");
      console.log("✅ Connected to new database (kandan_v2)");
    }

    return { legacyDb, newDb };
  } catch (error) {
    console.error("❌ Database connection error:", error);
    throw error;
  }
}

export function getLegacyDb(): Db {
  if (!legacyDb) {
    throw new Error(
      "Legacy database not connected. Call connectDatabases() first."
    );
  }
  return legacyDb;
}

export function getNewDb(): Db {
  if (!newDb) {
    throw new Error(
      "New database not connected. Call connectDatabases() first."
    );
  }
  return newDb;
}

// Safe read-only wrapper for legacy database
export const legacyDB = {
  users: {
    async findOne(query: any) {
      const db = getLegacyDb();
      return db.collection("users").findOne(query);
    },
    async find(query: any, options?: any) {
      const db = getLegacyDb();
      return db.collection("users").find(query, options).toArray();
    },
    // NO INSERT, UPDATE, OR DELETE - read-only!
  },

  predictions: {
    async findOne(query: any) {
      const db = getLegacyDb();
      return db.collection("predictions").findOne(query);
    },
    async find(query: any, options?: any) {
      const db = getLegacyDb();
      return db.collection("predictions").find(query, options).toArray();
    },
    async count(query: any) {
      const db = getLegacyDb();
      return db.collection("predictions").countDocuments(query);
    },
    // NO INSERT, UPDATE, OR DELETE - read-only!
  },
};

// Full CRUD for new database
export const newDB = {
  users: {
    async findOne(query: any) {
      const db = getNewDb();
      return db.collection("users").findOne(query);
    },
    async insertOne(doc: any) {
      const db = getNewDb();
      return db.collection("users").insertOne(doc);
    },
    async updateOne(query: any, update: any) {
      const db = getNewDb();
      return db.collection("users").updateOne(query, update);
    },
    async deleteOne(query: any) {
      const db = getNewDb();
      return db.collection("users").deleteOne(query);
    },
  },

  predictions: {
    async findOne(query: any) {
      const db = getNewDb();
      return db.collection("predictions").findOne(query);
    },
    async find(query: any, options?: any) {
      const db = getNewDb();
      return db.collection("predictions").find(query, options).toArray();
    },
    async insertOne(doc: any) {
      const db = getNewDb();
      return db.collection("predictions").insertOne(doc);
    },
    async updateOne(query: any, update: any) {
      const db = getNewDb();
      return db.collection("predictions").updateOne(query, update);
    },
    async deleteOne(query: any) {
      const db = getNewDb();
      return db.collection("predictions").deleteOne(query);
    },
    async countDocuments(query: any) {
      const db = getNewDb();
      return db.collection("predictions").countDocuments(query);
    },
  },

  subscriptions: {
    async findOne(query: any) {
      const db = getNewDb();
      return db.collection("subscriptions").findOne(query);
    },
    async find(query: any, options?: any) {
      const db = getNewDb();
      return db.collection("subscriptions").find(query, options).toArray();
    },
    async insertOne(doc: any) {
      const db = getNewDb();
      return db.collection("subscriptions").insertOne(doc);
    },
    async deleteOne(query: any) {
      const db = getNewDb();
      return db.collection("subscriptions").deleteOne(query);
    },
    async countDocuments(query: any) {
      const db = getNewDb();
      return db.collection("subscriptions").countDocuments(query);
    },
  },

  userStats: {
    async findOne(query: any) {
      const db = getNewDb();
      return db.collection("user_stats").findOne(query);
    },
    async updateOne(query: any, update: any, options?: any) {
      const db = getNewDb();
      return db.collection("user_stats").updateOne(query, update, options);
    },
  },

  notifications: {
    async find(query: any, options?: any) {
      const db = getNewDb();
      return db.collection("notifications").find(query, options).toArray();
    },
    async insertOne(doc: any) {
      const db = getNewDb();
      return db.collection("notifications").insertOne(doc);
    },
    async updateOne(query: any, update: any) {
      const db = getNewDb();
      return db.collection("notifications").updateOne(query, update);
    },
  },
};

// Initialize database connection on module load
connectDatabases().catch(console.error);
