import { format, subMonths } from "date-fns";
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

type BudgetStore = Record<string, BudgetSettings>;

const budgetFallback: BudgetSettings = {
  monthlyBudget: 50000,
  warningThreshold: 0.8,
  currency: "BDT",
};

const useMongoDb = process.env.DB_TYPE === "mongodb";

let mongoAdapter: typeof import("@/lib/server/adapters/mongodb-repository") | null = null;

async function getMongoAdapter() {
  if (!mongoAdapter && useMongoDb) {
    mongoAdapter = await import("@/lib/server/adapters/mongodb-repository");
  }
  return mongoAdapter;
}

function isBudgetSettings(value: unknown): value is BudgetSettings {
  if (!value || typeof value !== "object") {
    return false;
  }

  const cast = value as Partial<BudgetSettings>;
  return (
    typeof cast.monthlyBudget === "number" &&
    typeof cast.warningThreshold === "number" &&
    typeof cast.currency === "string"
  );
}

async function getTransactionsJson(userId: string): Promise<Transaction[]> {
  const data = await readJsonFile<Transaction[]>(TRANSACTIONS_FILE, []);
  return data
    .filter((item) => item.userId === userId)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

async function addTransactionJson(userId: string, input: NewTransactionInput): Promise<Transaction> {
  const transactions = await readJsonFile<Transaction[]>(TRANSACTIONS_FILE, []);

  const transaction: Transaction = {
    ...input,
    userId,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
  };

  transactions.push(transaction);
  await writeJsonFile(TRANSACTIONS_FILE, transactions);

  return transaction;
}

async function deleteTransactionByIdJson(userId: string, id: string): Promise<boolean> {
  const transactions = await readJsonFile<Transaction[]>(TRANSACTIONS_FILE, []);
  const index = transactions.findIndex((item) => item.id === id && item.userId === userId);

  if (index === -1) {
    return false;
  }

  transactions.splice(index, 1);
  await writeJsonFile(TRANSACTIONS_FILE, transactions);
  return true;
}

async function updateTransactionByIdJson(
  userId: string,
  id: string,
  input: NewTransactionInput,
): Promise<Transaction | null> {
  const transactions = await readJsonFile<Transaction[]>(TRANSACTIONS_FILE, []);
  const index = transactions.findIndex((item) => item.id === id && item.userId === userId);

  if (index === -1) {
    return null;
  }

  const current = transactions[index];
  const updated: Transaction = {
    ...current,
    ...input,
    userId,
  };

  transactions[index] = updated;
  await writeJsonFile(TRANSACTIONS_FILE, transactions);

  return updated;
}

async function getDashboardSummaryJson(userId: string): Promise<DashboardSummary> {
  const transactions = await getTransactionsJson(userId);
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

async function getCategoryDistributionJson(userId: string): Promise<CategoryDistributionItem[]> {
  const transactions = await getTransactionsJson(userId);
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

async function getMonthlyTrendJson(userId: string): Promise<MonthlyTrendItem[]> {
  const transactions = await getTransactionsJson(userId);
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

async function getBudgetSettingsJson(userId: string): Promise<BudgetSettings> {
  const raw = await readJsonFile<BudgetSettings | BudgetStore>(BUDGET_FILE, budgetFallback);

  if (isBudgetSettings(raw)) {
    return raw;
  }

  return raw[userId] ?? budgetFallback;
}

async function updateBudgetSettingsJson(
  userId: string,
  settings: BudgetSettings,
): Promise<BudgetSettings> {
  const raw = await readJsonFile<BudgetSettings | BudgetStore>(BUDGET_FILE, budgetFallback);

  const store: BudgetStore = isBudgetSettings(raw) ? {} : { ...raw };
  store[userId] = settings;

  await writeJsonFile(BUDGET_FILE, store);
  return settings;
}

function ensureOwnedTransaction(userId: string, transaction: Transaction) {
  return transaction.userId === userId;
}

export async function getTransactions(userId: string): Promise<Transaction[]> {
  if (useMongoDb) {
    const adapter = await getMongoAdapter();
    if (adapter) {
      return adapter.getTransactions(userId);
    }
  }

  return getTransactionsJson(userId);
}

export async function addTransaction(
  userId: string,
  input: NewTransactionInput,
): Promise<Transaction> {
  if (useMongoDb) {
    const adapter = await getMongoAdapter();
    if (adapter) {
      return adapter.addTransaction({ ...input, userId });
    }
  }

  return addTransactionJson(userId, input);
}

export async function addTransactionsBulk(
  userId: string,
  inputs: NewTransactionInput[],
): Promise<Transaction[]> {
  if (useMongoDb) {
    const adapter = await getMongoAdapter();
    if (adapter) {
      const created: Transaction[] = [];
      for (const input of inputs) {
        const transaction = await adapter.addTransaction({ ...input, userId });
        created.push(transaction);
      }
      return created;
    }
  }

  const transactions = await readJsonFile<Transaction[]>(TRANSACTIONS_FILE, []);
  const created: Transaction[] = [];

  for (const input of inputs) {
    const transaction: Transaction = {
      ...input,
      userId,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
    };

    transactions.push(transaction);
    created.push(transaction);
  }

  await writeJsonFile(TRANSACTIONS_FILE, transactions);
  return created;
}

export async function deleteTransactionsBulk(userId: string, ids: string[]): Promise<number> {
  if (ids.length === 0) {
    return 0;
  }

  if (useMongoDb) {
    const adapter = await getMongoAdapter();
    if (adapter) {
      const transactions = await adapter.getTransactions(userId);
      const ownedIds = new Set(transactions.map((item) => item.id));

      let deleted = 0;
      for (const id of ids) {
        if (!ownedIds.has(id)) {
          continue;
        }

        const result = await adapter.deleteTransactionById(id, userId);
        if (result) {
          deleted += 1;
        }
      }

      return deleted;
    }
  }

  const transactions = await readJsonFile<Transaction[]>(TRANSACTIONS_FILE, []);
  const idSet = new Set(ids);
  const nextTransactions = transactions.filter(
    (item) => !(item.userId === userId && idSet.has(item.id)),
  );

  const deleted = transactions.length - nextTransactions.length;
  if (deleted > 0) {
    await writeJsonFile(TRANSACTIONS_FILE, nextTransactions);
  }

  return deleted;
}

export async function deleteTransactionById(userId: string, id: string): Promise<boolean> {
  if (useMongoDb) {
    const adapter = await getMongoAdapter();
    if (adapter) {
      const transactions = await adapter.getTransactions(userId);
      const transaction = transactions.find((item) => item.id === id);
      if (!transaction || !ensureOwnedTransaction(userId, transaction)) {
        return false;
      }

      return adapter.deleteTransactionById(id, userId);
    }
  }

  return deleteTransactionByIdJson(userId, id);
}

export async function updateTransactionById(
  userId: string,
  id: string,
  input: NewTransactionInput,
): Promise<Transaction | null> {
  if (useMongoDb) {
    const adapter = await getMongoAdapter();
    if (adapter) {
      const transactions = await adapter.getTransactions(userId);
      const transaction = transactions.find((item) => item.id === id);
      if (!transaction || !ensureOwnedTransaction(userId, transaction)) {
        return null;
      }

      return adapter.updateTransactionById(id, input, userId);
    }
  }

  return updateTransactionByIdJson(userId, id, input);
}

export async function getDashboardSummary(userId: string): Promise<DashboardSummary> {
  if (useMongoDb) {
    const transactions = await getTransactions(userId);
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

  return getDashboardSummaryJson(userId);
}

export async function getCategoryDistribution(userId: string): Promise<CategoryDistributionItem[]> {
  if (useMongoDb) {
    const transactions = await getTransactions(userId);
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

  return getCategoryDistributionJson(userId);
}

export async function getMonthlyTrend(userId: string): Promise<MonthlyTrendItem[]> {
  if (useMongoDb) {
    const transactions = await getTransactions(userId);
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

  return getMonthlyTrendJson(userId);
}

export async function getBudgetSettings(userId: string): Promise<BudgetSettings> {
  if (useMongoDb) {
    const adapter = await getMongoAdapter();
    if (adapter) {
      return adapter.getBudgetSettings(userId);
    }
  }

  return getBudgetSettingsJson(userId);
}

export async function updateBudgetSettings(
  userId: string,
  settings: BudgetSettings,
): Promise<BudgetSettings> {
  if (useMongoDb) {
    const adapter = await getMongoAdapter();
    if (adapter) {
      return adapter.updateBudgetSettings(userId, settings);
    }
  }

  return updateBudgetSettingsJson(userId, settings);
}
