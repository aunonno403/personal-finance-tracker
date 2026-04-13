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

const budgetFallback: BudgetSettings = {
  monthlyBudget: 50000,
  warningThreshold: 0.8,
  currency: "BDT",
};

export async function getTransactions(): Promise<Transaction[]> {
  const data = await readJsonFile<Transaction[]>(TRANSACTIONS_FILE, []);
  return data.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function addTransaction(input: NewTransactionInput): Promise<Transaction> {
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

export async function getBudgetSettings(): Promise<BudgetSettings> {
  return readJsonFile<BudgetSettings>(BUDGET_FILE, budgetFallback);
}

export async function updateBudgetSettings(monthlyBudget: number): Promise<BudgetSettings> {
  const current = await getBudgetSettings();
  const updated: BudgetSettings = {
    ...current,
    monthlyBudget,
  };

  await writeJsonFile(BUDGET_FILE, updated);
  return updated;
}

export function getDashboardSummary(transactions: Transaction[]): DashboardSummary {
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

export function getCategoryDistribution(
  transactions: Transaction[],
): CategoryDistributionItem[] {
  const totals = new Map<string, number>();

  transactions
    .filter((item) => item.type === "expense")
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

export function getMonthlyTrend(transactions: Transaction[]): MonthlyTrendItem[] {
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
