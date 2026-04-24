import { NextResponse } from "next/server";
import {
  getBudgetSettings,
  updateBudgetSettings,
} from "@/lib/server/finance-repository";

export async function GET() {
  const budget = await getBudgetSettings();
  return NextResponse.json({ budget });
}

export async function PUT(request: Request) {
  const body = (await request.json()) as { monthlyBudget?: number };

  if (!body.monthlyBudget || Number(body.monthlyBudget) <= 0) {
    return NextResponse.json(
      { message: "Monthly budget must be greater than 0." },
      { status: 400 },
    );
  }

  const currentSettings = await getBudgetSettings();
  const updatedSettings = {
    ...currentSettings,
    monthlyBudget: Number(body.monthlyBudget),
  };
  const budget = await updateBudgetSettings(updatedSettings);
  return NextResponse.json({ budget });
}
