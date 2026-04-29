import { NextResponse } from "next/server";
import {
  getBudgetSettings,
  getDashboardSummary,
  getTransactions,
} from "@/lib/server/finance-repository";
import { getAuthSession } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const [summary, budget, transactions] = await Promise.all([
    getDashboardSummary(session.userId),
    getBudgetSettings(session.userId),
    getTransactions(session.userId),
  ]);

  return NextResponse.json({
    summary,
    budget,
    recentTransactions: transactions.slice(0, 8),
  });
}
