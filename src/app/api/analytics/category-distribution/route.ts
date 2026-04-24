import { NextResponse } from "next/server";
import { getCategoryDistribution } from "@/lib/server/finance-repository";

export async function GET() {
  const distribution = await getCategoryDistribution();
  return NextResponse.json({ distribution });
}
