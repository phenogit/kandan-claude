// test-database.js
require("dotenv").config({ path: ".env.local" });

const { MongoClient, ObjectId } = require("mongodb");

const legacyUri = process.env.MONGODB_URI_LEGACY;
const newUri = process.env.MONGODB_URI_NEW;

// Add validation
if (!legacyUri || !newUri) {
  console.error("❌ Missing environment variables!");
  console.error("   Make sure .env.local has:");
  console.error("   - MONGODB_URI_LEGACY");
  console.error("   - MONGODB_URI_NEW");
  process.exit(1);
}

async function testDatabases() {
  console.log("🧪 Testing Database Connections...\n");

  // Test Legacy Database (Read-Only)
  console.log("1️⃣ Testing Legacy Database (kandan)...");
  try {
    const legacyClient = new MongoClient(legacyUri);
    await legacyClient.connect();
    const legacyDb = legacyClient.db("kandan");

    const userCount = await legacyDb.collection("users").countDocuments();
    const predCount = await legacyDb.collection("predictions").countDocuments();

    console.log(`   ✅ Connected to legacy database`);
    console.log(`   📊 Users: ${userCount}`);
    console.log(`   📊 Predictions: ${predCount}`);

    // Get one sample user
    const sampleUser = await legacyDb.collection("users").findOne();
    if (sampleUser) {
      console.log(
        `   👤 Sample user: ${sampleUser.name} (${sampleUser.email})`
      );
    }

    await legacyClient.close();
  } catch (error) {
    console.error("   ❌ Legacy database error:", error.message);
  }

  console.log("\n2️⃣ Testing New Database (kandan_v2)...");
  try {
    const newClient = new MongoClient(newUri);
    await newClient.connect();
    const newDb = newClient.db("kandan_v2");

    const collections = await newDb.listCollections().toArray();
    console.log(`   ✅ Connected to new database`);
    console.log(
      `   📁 Collections: ${collections.map((c) => c.name).join(", ") || "none yet"}`
    );

    // Create collections if they don't exist
    if (collections.length === 0) {
      console.log("   📝 Creating initial collections...");
      await newDb.createCollection("users");
      await newDb.createCollection("predictions");
      await newDb.createCollection("subscriptions");
      await newDb.createCollection("user_stats");
      await newDb.createCollection("notifications");
      console.log("   ✅ Collections created!");
    }

    await newClient.close();
  } catch (error) {
    console.error("   ❌ New database error:", error.message);
  }

  console.log("\n✅ Database tests complete!\n");
}

testDatabases();
