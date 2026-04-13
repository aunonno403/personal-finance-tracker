import { NextResponse } from "next/server";
import {
  getCategoryDistribution,
  getTransactions,
} from "@/lib/server/finance-repository";

export async function GET() {
  const transactions = await getTransactions();
  const distribution = getCategoryDistribution(transactions);
  return NextResponse.json({ distribution });
}
