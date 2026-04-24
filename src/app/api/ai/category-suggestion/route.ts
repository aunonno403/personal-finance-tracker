import { NextRequest, NextResponse } from "next/server";
import { suggestCategory } from "@/lib/server/ai-service";
import { Category } from "@/lib/types/finance";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { description, type } = body;

    if (!description || typeof description !== "string") {
      return NextResponse.json(
        { error: "Description is required and must be a string" },
        { status: 400 },
      );
    }

    if (!type || !["income", "expense"].includes(type)) {
      return NextResponse.json(
        { error: "Type is required and must be 'income' or 'expense'" },
        { status: 400 },
      );
    }

    const suggestedCategory: Category = suggestCategory(description, type);

    return NextResponse.json(
      {
        suggestedCategory,
        confidence: "high",
        source: "deterministic-keyword-matching",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error in category suggestion:", error);
    return NextResponse.json(
      { error: "Failed to suggest category" },
      { status: 500 },
    );
  }
}
