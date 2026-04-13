import { NextResponse } from "next/server";
import { getMonthlyTrend, getTransactions } from "@/lib/server/finance-repository";

export async function GET() {
  const transactions = await getTransactions();
  const trend = getMonthlyTrend(transactions);
  return NextResponse.json({ trend });
}
