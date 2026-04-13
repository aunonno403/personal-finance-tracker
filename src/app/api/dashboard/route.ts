import { NextResponse } from "next/server";
import {
  getBudgetSettings,
  getDashboardSummary,
  getTransactions,
} from "@/lib/server/finance-repository";

export async function GET() {
  const [transactions, budget] = await Promise.all([
    getTransactions(),
    getBudgetSettings(),
  ]);

  const summary = getDashboardSummary(transactions);

  return NextResponse.json({
    summary,
    budget,
    recentTransactions: transactions.slice(0, 8),
  });
}
