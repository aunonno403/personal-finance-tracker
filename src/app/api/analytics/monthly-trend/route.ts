import { NextResponse } from "next/server";
import { getMonthlyTrend } from "@/lib/server/finance-repository";

export async function GET() {
  const trend = await getMonthlyTrend();
  return NextResponse.json({ trend });
}
