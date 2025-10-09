const { MongoClient } = require("mongodb");

const uri =
  "mongodb+srv://dbKandan:WHZworVdlqpEJBba@cluster0.72ioc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"; // paste your full connection string

async function testConnection() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected successfully to kandan_v2!");

    const db = client.db("kandan");
    const collections = await db.listCollections().toArray();
    console.log(
      "📁 Collections:",
      collections.map((c) => c.name)
    );
  } catch (error) {
    console.error("❌ Connection failed:", error.message);
  } finally {
    await client.close();
  }
}

testConnection();
