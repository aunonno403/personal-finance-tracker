import { NextRequest, NextResponse } from "next/server";
import { generateMonthlyInsights, MonthlyInsight } from "@/lib/server/ai-service";
import { getTransactions, getBudgetSettings } from "@/lib/server/finance-repository";
import { getMonthKey } from "@/lib/utils/date";
import { format, subMonths } from "date-fns";
import { getAuthSession } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const transactions = await getTransactions(session.userId);
    const budget = await getBudgetSettings(session.userId);

    const now = new Date();
    const currentMonthKey = getMonthKey(format(now, "yyyy-MM-dd"));
    const lastMonthKey = getMonthKey(format(subMonths(now, 1), "yyyy-MM-dd"));

    // Filter current month expenses
    const currentMonthExpenses = transactions
      .filter((t) => {
        const transactionMonth = getMonthKey(t.date);
        return t.type === "expense" && transactionMonth === currentMonthKey;
      })
      .reduce((sum, t) => sum + t.amount, 0);

    // Filter last month expenses
    const lastMonthExpenses = transactions
      .filter((t) => {
        const transactionMonth = getMonthKey(t.date);
        return t.type === "expense" && transactionMonth === lastMonthKey;
      })
      .reduce((sum, t) => sum + t.amount, 0);

    // Calculate category distribution for current month
    const categoryDistribution: Array<{ category: string; total: number }> = [];
    const categoryMap = new Map<string, number>();

    transactions
      .filter((t) => {
        const transactionMonth = getMonthKey(t.date);
        return t.type === "expense" && transactionMonth === currentMonthKey;
      })
      .forEach((t) => {
        const current = categoryMap.get(t.category) || 0;
        categoryMap.set(t.category, current + t.amount);
      });

    // Sort by total descending
    categoryMap.forEach((total, category) => {
      categoryDistribution.push({ category, total });
    });
    categoryDistribution.sort((a, b) => b.total - a.total);

    const insights: MonthlyInsight = generateMonthlyInsights(
      currentMonthExpenses,
      lastMonthExpenses,
      categoryDistribution as Array<{ category: any; total: number }>,
      budget.monthlyBudget,
    );

    return NextResponse.json(insights, { status: 200 });
  } catch (error) {
    console.error("Error generating monthly insights:", error);
    return NextResponse.json(
      { error: "Failed to generate insights" },
      { status: 500 },
    );
  }
}
