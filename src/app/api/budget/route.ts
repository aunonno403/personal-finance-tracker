import { NextResponse } from "next/server";
import {
  getBudgetSettings,
  updateBudgetSettings,
} from "@/lib/server/finance-repository";
import { getAuthSession } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const budget = await getBudgetSettings(session.userId);
  return NextResponse.json({ budget });
}

export async function PUT(request: Request) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { monthlyBudget?: number };

  if (!body.monthlyBudget || Number(body.monthlyBudget) <= 0) {
    return NextResponse.json(
      { message: "Monthly budget must be greater than 0." },
      { status: 400 },
    );
  }

  const currentSettings = await getBudgetSettings(session.userId);
  const updatedSettings = {
    ...currentSettings,
    monthlyBudget: Number(body.monthlyBudget),
  };
  const budget = await updateBudgetSettings(session.userId, updatedSettings);
  return NextResponse.json({ budget });
}
