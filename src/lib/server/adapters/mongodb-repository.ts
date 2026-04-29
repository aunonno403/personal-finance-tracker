import { MongoClient, Db, Collection } from "mongodb";
import { randomUUID } from "crypto";
import {
  BudgetSettings,
  CategoryDistributionItem,
  DashboardSummary,
  MonthlyTrendItem,
  NewTransactionInput,
  Transaction,
} from "@/lib/types/finance";
import { getMonthKey } from "@/lib/utils/date";
import { subMonths, format, parseISO } from "date-fns";

let mongoClient: MongoClient | null = null;
let db: Db | null = null;

async function getDatabase(): Promise<Db> {
  if (!db) {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error(
        "MONGODB_URI environment variable is required for MongoDB adapter",
      );
    }

    mongoClient = new MongoClient(uri, {
      maxPoolSize: 10,
      minPoolSize: 2,
    });

    await mongoClient.connect();
    db = mongoClient.db(process.env.MONGODB_DB_NAME || "personal-finance");

    // Create indexes
    await createIndexes(db);
  }

  return db;
}

async function createIndexes(database: Db): Promise<void> {
  const transactionsCollection = database.collection("transactions");
  const budgetCollection = database.collection("budget");

  // Create transaction indexes
  await transactionsCollection.createIndex({ userId: 1, date: -1 });
  await transactionsCollection.createIndex({ date: -1 });
  await transactionsCollection.createIndex({ category: 1 });
  await transactionsCollection.createIndex({ type: 1 });
  await transactionsCollection.createIndex({ createdAt: -1 });

  // Create budget indexes (userId for future multi-user support)
  await budgetCollection.createIndex({ userId: 1 }, { unique: true });
}

export async function getTransactions(userId?: string): Promise<Transaction[]> {
  const db = await getDatabase();
  const collection = db.collection<Transaction>("transactions");

  const transactions = await collection
    .find(userId ? { userId } : {})
    .sort({ date: -1 })
    .toArray();

  return transactions;
}

export async function addTransaction(
  input: NewTransactionInput & { userId?: string },
): Promise<Transaction> {
  const db = await getDatabase();
  const collection = db.collection<Transaction>("transactions");

  const transaction: Transaction = {
    ...input,
    userId: input.userId,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
  };

  await collection.insertOne(transaction);

  return transaction;
}

export async function deleteTransactionById(id: string, userId?: string): Promise<boolean> {
  const db = await getDatabase();
  const collection = db.collection<Transaction>("transactions");

  const result = await collection.deleteOne(userId ? { id, userId } : { id });

  return result.deletedCount > 0;
}

export async function updateTransactionById(
  id: string,
  input: NewTransactionInput,
  userId?: string,
): Promise<Transaction | null> {
  const db = await getDatabase();
  const collection = db.collection<Transaction>("transactions");

  const updatedTransaction: Transaction = {
    ...input,
    id,
    userId,
    createdAt: new Date().toISOString(),
  };

  const result = await collection.findOneAndUpdate(
    userId ? { id, userId } : { id },
    { $set: updatedTransaction },
    { returnDocument: "after" },
  );

  return (result as any)?.value || null;
}

export async function getDashboardSummary(userId?: string): Promise<DashboardSummary> {
  const db = await getDatabase();
  const collection = db.collection<Transaction>("transactions");

  const now = new Date();
  const currentMonthKey = getMonthKey(format(now, "yyyy-MM-dd"));

  // Calculate current balance (all time income - all time expense)
  const allTransactions = await collection.find(userId ? { userId } : {}).toArray();

  const currentBalance = allTransactions.reduce((sum, t) => {
    return t.type === "income" ? sum + t.amount : sum - t.amount;
  }, 0);

  // Calculate this month totals
  const thisMonthTransactions = allTransactions.filter((t) => {
    return getMonthKey(t.date) === currentMonthKey;
  });

  const totalIncomeThisMonth = thisMonthTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenseThisMonth = thisMonthTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    currentBalance,
    totalIncomeThisMonth,
    totalExpenseThisMonth,
    monthKey: currentMonthKey,
  };
}

export async function getCategoryDistribution(userId?: string): Promise<CategoryDistributionItem[]> {
  const db = await getDatabase();
  const collection = db.collection<Transaction>("transactions");

  const now = new Date();
  const currentMonthKey = getMonthKey(format(now, "yyyy-MM-dd"));

  const allTransactions = await collection.find(userId ? { userId } : {}).toArray();

  const categoryMap = new Map<string, number>();

  allTransactions
    .filter((t) => {
      const transactionMonth = getMonthKey(t.date);
      return t.type === "expense" && transactionMonth === currentMonthKey;
    })
    .forEach((t) => {
      const current = categoryMap.get(t.category) || 0;
      categoryMap.set(t.category, current + t.amount);
    });

  const distribution: CategoryDistributionItem[] = [];
  categoryMap.forEach((total, category) => {
    distribution.push({
      category: category as any,
      total,
    });
  });

  return distribution.sort((a, b) => b.total - a.total);
}

export async function getMonthlyTrend(userId?: string): Promise<MonthlyTrendItem[]> {
  const db = await getDatabase();
  const collection = db.collection<Transaction>("transactions");

  const allTransactions = await collection.find(userId ? { userId } : {}).toArray();
  const monthlyMap = new Map<
    string,
    { income: number; expense: number; month: string }
  >();

  // Initialize last 6 months
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const month = subMonths(now, i);
    const monthKey = getMonthKey(format(month, "yyyy-MM-dd"));
    monthlyMap.set(monthKey, {
      month: monthKey,
      income: 0,
      expense: 0,
    });
  }

  // Aggregate transactions
  allTransactions.forEach((t) => {
    const monthKey = getMonthKey(t.date);
    const monthData = monthlyMap.get(monthKey);

    if (monthData) {
      if (t.type === "income") {
        monthData.income += t.amount;
      } else {
        monthData.expense += t.amount;
      }
    }
  });

  // Convert to array and sort
  const trend: MonthlyTrendItem[] = Array.from(monthlyMap.values());
  return trend.sort(
    (a, b) => new Date(a.month).getTime() - new Date(b.month).getTime(),
  );
}

export async function getBudgetSettings(userId?: string): Promise<BudgetSettings> {
  const db = await getDatabase();
  const collection = db.collection<BudgetSettings & { userId: string }>("budget");

  const budget = await collection.findOne(userId ? { userId } : {});

  return (
    budget || {
      monthlyBudget: 50000,
      warningThreshold: 0.8,
      currency: "BDT",
    }
  );
}

export async function updateBudgetSettings(
  userId: string,
  settings: BudgetSettings,
): Promise<BudgetSettings> {
  const db = await getDatabase();
  const collection = db.collection<BudgetSettings & { userId: string }>("budget");

  const result = await collection.findOneAndUpdate(
    { userId },
    { $set: { ...settings, userId } },
    {
      upsert: true,
      returnDocument: "after",
    },
  );

  return ((result as any)?.value || settings) as BudgetSettings;
}

export async function closeConnection(): Promise<void> {
  if (mongoClient) {
    await mongoClient.close();
    mongoClient = null;
    db = null;
  }
}
