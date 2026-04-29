import { NextResponse } from "next/server";
import { getCategoryDistribution } from "@/lib/server/finance-repository";
import { getAuthSession } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const distribution = await getCategoryDistribution(session.userId);
  return NextResponse.json({ distribution });
}
