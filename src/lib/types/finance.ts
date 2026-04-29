export const EXPENSE_CATEGORIES = [
  "Food",
  "Transport",
  "Rent",
  "Shopping",
  "Entertainment",
  "Health",
  "Education",
  "Bills",
  "Others",
  "Cigarettes",
] as const;

export const INCOME_CATEGORIES = [
  "Salary",
  "Freelance",
  "Investment",
  "Bonus",
  "Gift",
  "Refund",
  "Others",
] as const;

export const CATEGORY_SUGGESTIONS = [
  ...EXPENSE_CATEGORIES,
  ...INCOME_CATEGORIES,
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
export type IncomeCategory = (typeof INCOME_CATEGORIES)[number];
export type Category = ExpenseCategory | IncomeCategory;
export type TransactionType = "income" | "expense";

export type Transaction = {
  id: string;
  userId?: string;
  type: TransactionType;
  amount: number;
  category: Category;
  date: string;
  description: string;
  createdAt: string;
};

export type NewTransactionInput = {
  type: TransactionType;
  amount: number;
  category: Category;
  date: string;
  description: string;
};

export type BudgetSettings = {
  monthlyBudget: number;
  warningThreshold: number;
  currency: string;
};

export type DashboardSummary = {
  currentBalance: number;
  totalIncomeThisMonth: number;
  totalExpenseThisMonth: number;
  monthKey: string;
};

export type CategoryDistributionItem = {
  category: Category;
  total: number;
};

export type MonthlyTrendItem = {
  month: string;
  income: number;
  expense: number;
};

export type DashboardPayload = {
  summary: DashboardSummary;
  budget: BudgetSettings;
  recentTransactions: Transaction[];
};

export type ImportHistoryEntry = {
  id: string;
  createdAt: string;
  count: number;
  transactionIds: string[];
};
