export const CATEGORY_SUGGESTIONS = [
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

export type Category = (typeof CATEGORY_SUGGESTIONS)[number];
export type TransactionType = "income" | "expense";

export type Transaction = {
  id: string;
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
