import { format, subMonths, parseISO } from "date-fns";
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
import { readJsonFile, writeJsonFile } from "@/lib/server/json-store";

const TRANSACTIONS_FILE = "transactions.json";
const BUDGET_FILE = "budget.json";

const budgetFallback: BudgetSettings = {
  monthlyBudget: 50000,
  warningThreshold: 0.8,
  currency: "BDT",
};

// Determine which adapter to use based on environment
const useMongoDb = process.env.DB_TYPE === "mongodb";

// Import MongoDB adapter dynamically if needed
let mongoAdapter: typeof import("@/lib/server/adapters/mongodb-repository") | null =
  null;

async function getMongoAdapter() {
  if (!mongoAdapter && useMongoDb) {
    mongoAdapter =
      await import("@/lib/server/adapters/mongodb-repository");
  }
  return mongoAdapter;
}

// JSON-based implementation (fallback)
async function getTransactionsJson(): Promise<Transaction[]> {
  const data = await readJsonFile<Transaction[]>(TRANSACTIONS_FILE, []);
  return data.sort((a, b) => (a.date < b.date ? 1 : -1));
}

async function addTransactionJson(input: NewTransactionInput): Promise<Transaction> {
  const transactions = await readJsonFile<Transaction[]>(TRANSACTIONS_FILE, []);

  const transaction: Transaction = {
    ...input,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
  };

  transactions.push(transaction);
  await writeJsonFile(TRANSACTIONS_FILE, transactions);

  return transaction;
}

async function deleteTransactionByIdJson(id: string): Promise<boolean> {
  const transactions = await readJsonFile<Transaction[]>(TRANSACTIONS_FILE, []);
  const nextTransactions = transactions.filter((item) => item.id !== id);

  if (nextTransactions.length === transactions.length) {
    return false;
  }

  await writeJsonFile(TRANSACTIONS_FILE, nextTransactions);
  return true;
}

async function updateTransactionByIdJson(
  id: string,
  input: NewTransactionInput,
): Promise<Transaction | null> {
  const transactions = await readJsonFile<Transaction[]>(TRANSACTIONS_FILE, []);
  const index = transactions.findIndex((item) => item.id === id);

  if (index === -1) {
    return null;
  }

  const current = transactions[index];
  const updated: Transaction = {
    ...current,
    ...input,
  };

  transactions[index] = updated;
  await writeJsonFile(TRANSACTIONS_FILE, transactions);

  return updated;
}

async function getDashboardSummaryJson(): Promise<DashboardSummary> {
  const transactions = await readJsonFile<Transaction[]>(TRANSACTIONS_FILE, []);
  const monthKey = format(new Date(), "yyyy-MM");
  let currentBalance = 0;
  let totalIncomeThisMonth = 0;
  let totalExpenseThisMonth = 0;

  for (const item of transactions) {
    if (item.type === "income") {
      currentBalance += item.amount;
    } else {
      currentBalance -= item.amount;
    }

    if (getMonthKey(item.date) === monthKey) {
      if (item.type === "income") {
        totalIncomeThisMonth += item.amount;
      } else {
        totalExpenseThisMonth += item.amount;
      }
    }
  }

  return {
    currentBalance,
    totalIncomeThisMonth,
    totalExpenseThisMonth,
    monthKey,
  };
}

async function getCategoryDistributionJson(): Promise<CategoryDistributionItem[]> {
  const transactions = await readJsonFile<Transaction[]>(TRANSACTIONS_FILE, []);
  const monthKey = format(new Date(), "yyyy-MM");
  const totals = new Map<string, number>();

  transactions
    .filter((item) => item.type === "expense" && getMonthKey(item.date) === monthKey)
    .forEach((item) => {
      const prev = totals.get(item.category) ?? 0;
      totals.set(item.category, prev + item.amount);
    });

  return Array.from(totals.entries())
    .map(([category, total]) => ({
      category: category as CategoryDistributionItem["category"],
      total,
    }))
    .sort((a, b) => b.total - a.total);
}

async function getMonthlyTrendJson(): Promise<MonthlyTrendItem[]> {
  const transactions = await readJsonFile<Transaction[]>(TRANSACTIONS_FILE, []);
  const now = new Date();
  const monthKeys = Array.from({ length: 6 }, (_, index) =>
    format(subMonths(now, 5 - index), "yyyy-MM"),
  );

  const bucket = new Map<string, MonthlyTrendItem>();

  for (const key of monthKeys) {
    bucket.set(key, { month: key, income: 0, expense: 0 });
  }

  for (const item of transactions) {
    const key = getMonthKey(item.date);
    if (!bucket.has(key)) {
      continue;
    }

    const value = bucket.get(key);
    if (!value) {
      continue;
    }

    if (item.type === "income") {
      value.income += item.amount;
    } else {
      value.expense += item.amount;
    }
  }

  return monthKeys.map((key) => bucket.get(key) as MonthlyTrendItem);
}

async function getBudgetSettingsJson(): Promise<BudgetSettings> {
  return readJsonFile<BudgetSettings>(BUDGET_FILE, budgetFallback);
}

async function updateBudgetSettingsJson(
  settings: BudgetSettings,
): Promise<BudgetSettings> {
  await writeJsonFile(BUDGET_FILE, settings);
  return settings;
}

// Adapter routing functions
export async function getTransactions(): Promise<Transaction[]> {
  if (useMongoDb) {
    const adapter = await getMongoAdapter();
    if (adapter) {
      return adapter.getTransactions();
    }
  }
  return getTransactionsJson();
}

export async function addTransaction(input: NewTransactionInput): Promise<Transaction> {
  if (useMongoDb) {
    const adapter = await getMongoAdapter();
    if (adapter) {
      return adapter.addTransaction(input);
    }
  }
  return addTransactionJson(input);
}

export async function deleteTransactionById(id: string): Promise<boolean> {
  if (useMongoDb) {
    const adapter = await getMongoAdapter();
    if (adapter) {
      return adapter.deleteTransactionById(id);
    }
  }
  return deleteTransactionByIdJson(id);
}

export async function updateTransactionById(
  id: string,
  input: NewTransactionInput,
): Promise<Transaction | null> {
  if (useMongoDb) {
    const adapter = await getMongoAdapter();
    if (adapter) {
      return adapter.updateTransactionById(id, input);
    }
  }
  return updateTransactionByIdJson(id, input);
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  if (useMongoDb) {
    const adapter = await getMongoAdapter();
    if (adapter) {
      return adapter.getDashboardSummary();
    }
  }
  return getDashboardSummaryJson();
}

export async function getCategoryDistribution(): Promise<CategoryDistributionItem[]> {
  if (useMongoDb) {
    const adapter = await getMongoAdapter();
    if (adapter) {
      return adapter.getCategoryDistribution();
    }
  }
  return getCategoryDistributionJson();
}

export async function getMonthlyTrend(): Promise<MonthlyTrendItem[]> {
  if (useMongoDb) {
    const adapter = await getMongoAdapter();
    if (adapter) {
      return adapter.getMonthlyTrend();
    }
  }
  return getMonthlyTrendJson();
}

export async function getBudgetSettings(): Promise<BudgetSettings> {
  if (useMongoDb) {
    const adapter = await getMongoAdapter();
    if (adapter) {
      return adapter.getBudgetSettings();
    }
  }
  return getBudgetSettingsJson();
}

export async function updateBudgetSettings(settings: BudgetSettings): Promise<BudgetSettings> {
  if (useMongoDb) {
    const adapter = await getMongoAdapter();
    if (adapter) {
      return adapter.updateBudgetSettings(settings);
    }
  }
  return updateBudgetSettingsJson(settings);
}
