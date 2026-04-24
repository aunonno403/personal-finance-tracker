import { NextResponse } from "next/server";
import {
  getBudgetSettings,
  getDashboardSummary,
  getTransactions,
} from "@/lib/server/finance-repository";

export async function GET() {
  const [summary, budget, transactions] = await Promise.all([
    getDashboardSummary(),
    getBudgetSettings(),
    getTransactions(),
  ]);

  return NextResponse.json({
    summary,
    budget,
    recentTransactions: transactions.slice(0, 8),
  });
}
