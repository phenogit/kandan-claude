// Add at the very top of each file:
require("dotenv").config({ path: ".env.local" });
// test-create-user.js
const { MongoClient, ObjectId } = require("mongodb");
const bcrypt = require("bcryptjs");

const newUri = process.env.MONGODB_URI_NEW || "your-new-uri-here";

async function createTestUser() {
  console.log("🧪 Creating Test User...\n");

  const client = new MongoClient(newUri);
  await client.connect();
  const db = client.db("kandan_v2");

  // Check if test user exists
  const existing = await db.collection("users").findOne({
    email: "test@example.com",
  });

  if (existing) {
    console.log("✅ Test user already exists!");
    console.log(`   Username: ${existing.username}`);
    console.log(`   Email: ${existing.email}`);
    await client.close();
    return;
  }

  // Create test user
  const passwordHash = await bcrypt.hash("password123", 12);

  const testUser = {
    _id: new ObjectId(),
    username: "testuser",
    email: "test@example.com",
    displayName: "Test User",
    passwordHash,
    authProvider: "local",
    userType: "native",
    isReadOnly: false,
    emailVerified: true,
    isPublic: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await db.collection("users").insertOne(testUser);

  // Create user stats
  await db.collection("user_stats").insertOne({
    _id: new ObjectId(),
    userId: testUser._id,
    totalPredictions: 0,
    pendingPredictions: 0,
    resolvedPredictions: 0,
    successfulPredictions: 0,
    failedPredictions: 0,
    originalPredictions: 0,
    followedPredictions: 0,
    accuracyRate: 0,
    avgProfitRate: 0,
    avgProfitRateAdjustedByConfidence: 0,
    currentStreak: 0,
    highestStreak: 0,
    subscriberCount: 0,
    subscribedToCount: 0,
    predictionFollowCount: 0,
    updatedAt: new Date(),
  });

  console.log("✅ Test user created successfully!");
  console.log(`   Username: testuser`);
  console.log(`   Email: test@example.com`);
  console.log(`   Password: password123`);
  console.log("\n🎯 You can use these credentials to test login!\n");

  await client.close();
}

createTestUser().catch(console.error);
