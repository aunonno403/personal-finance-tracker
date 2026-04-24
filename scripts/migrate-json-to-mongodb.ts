import { MongoClient } from "mongodb";
import { readFileSync } from "fs";
import { join } from "path";

/**
 * Migration script: Migrate data from JSON files to MongoDB
 * Usage: node scripts/migrate-json-to-mongodb.ts
 *
 * Prerequisites:
 * 1. Set MONGODB_URI environment variable
 * 2. Ensure MongoDB connection string is valid
 * 3. Run "npm install mongodb" if not already installed
 */

async function migrate() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.error("ERROR: MONGODB_URI environment variable not set");
    console.error("Usage: MONGODB_URI=mongodb+srv://... node scripts/migrate.ts");
    process.exit(1);
  }

  const client = new MongoClient(mongoUri);

  try {
    console.log("🔄 Connecting to MongoDB...");
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(process.env.MONGODB_DB_NAME || "personal-finance");

    // Read JSON files
    console.log("\n📂 Reading JSON files...");
    const dataDir = join(process.cwd(), "data");

    let transactions = [];
    let budget = {
      monthlyBudget: 50000,
      warningThreshold: 0.8,
      currency: "BDT",
    };

    try {
      const transactionsData = readFileSync(
        join(dataDir, "transactions.json"),
        "utf-8",
      );
      transactions = JSON.parse(transactionsData);
      console.log(`✅ Loaded ${transactions.length} transactions`);
    } catch (err) {
      console.warn("⚠️  Could not load transactions.json, using empty array");
      transactions = [];
    }

    try {
      const budgetData = readFileSync(join(dataDir, "budget.json"), "utf-8");
      budget = JSON.parse(budgetData);
      console.log("✅ Loaded budget settings");
    } catch (err) {
      console.warn("⚠️  Could not load budget.json, using defaults");
    }

    // Clear existing collections
    console.log("\n🗑️  Clearing existing collections...");
    await db.collection("transactions").deleteMany({});
    await db.collection("budget").deleteMany({});
    console.log("✅ Collections cleared");

    // Insert transactions
    if (transactions.length > 0) {
      console.log("\n📝 Inserting transactions...");
      const result = await db
        .collection("transactions")
        .insertMany(transactions);
      console.log(`✅ Inserted ${result.insertedCount} transactions`);
    }

    // Insert budget
    console.log("\n💰 Inserting budget settings...");
    const budgetResult = await db.collection("budget").insertOne(budget);
    console.log(`✅ Inserted budget settings (ID: ${budgetResult.insertedId})`);

    // Create indexes
    console.log("\n🔧 Creating indexes...");
    await db.collection("transactions").createIndex({ date: -1 });
    await db.collection("transactions").createIndex({ category: 1 });
    await db.collection("transactions").createIndex({ type: 1 });
    await db.collection("transactions").createIndex({ createdAt: -1 });
    console.log("✅ Indexes created");

    // Verification
    console.log("\n✔️  Verifying migration...");
    const transactionCount = await db
      .collection("transactions")
      .countDocuments();
    const budgetCount = await db.collection("budget").countDocuments();

    console.log(`📊 Transaction count: ${transactionCount}`);
    console.log(`📊 Budget count: ${budgetCount}`);

    if (transactionCount === transactions.length && budgetCount > 0) {
      console.log("\n✅ Migration completed successfully!");
    } else {
      console.warn("\n⚠️  Migration verification failed - counts don't match");
      process.exit(1);
    }
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await client.close();
    console.log("\n🔌 Disconnected from MongoDB");
  }
}

migrate();
