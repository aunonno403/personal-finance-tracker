import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ user: session });
}
