import { NextResponse } from "next/server";
import { clearAuthSession } from "@/lib/server/auth";

export async function POST() {
  await clearAuthSession();
  return NextResponse.json({ ok: true });
}
