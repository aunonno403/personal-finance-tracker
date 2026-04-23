import { NextResponse } from "next/server";
import {
  addTransaction,
  deleteTransactionById,
  getTransactions,
  updateTransactionById,
} from "@/lib/server/finance-repository";
import { CATEGORY_SUGGESTIONS, NewTransactionInput } from "@/lib/types/finance";

export async function GET() {
  const transactions = await getTransactions();
  return NextResponse.json({ transactions });
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<NewTransactionInput>;

  if (!body.type || !body.amount || !body.category || !body.date || !body.description) {
    return NextResponse.json(
      { message: "Missing required fields." },
      { status: 400 },
    );
  }

  if (!CATEGORY_SUGGESTIONS.includes(body.category)) {
    return NextResponse.json({ message: "Invalid category." }, { status: 400 });
  }

  const amount = Number(body.amount);
  if (Number.isNaN(amount) || amount <= 0) {
    return NextResponse.json({ message: "Amount must be positive." }, { status: 400 });
  }

  const transaction = await addTransaction({
    type: body.type,
    amount,
    category: body.category,
    date: body.date,
    description: body.description,
  });

  return NextResponse.json({ transaction }, { status: 201 });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ message: "Transaction id is required." }, { status: 400 });
  }

  const deleted = await deleteTransactionById(id);
  if (!deleted) {
    return NextResponse.json({ message: "Transaction not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

export async function PUT(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ message: "Transaction id is required." }, { status: 400 });
  }

  const body = (await request.json()) as Partial<NewTransactionInput>;

  if (!body.type || !body.amount || !body.category || !body.date || !body.description) {
    return NextResponse.json(
      { message: "Missing required fields." },
      { status: 400 },
    );
  }

  if (!CATEGORY_SUGGESTIONS.includes(body.category)) {
    return NextResponse.json({ message: "Invalid category." }, { status: 400 });
  }

  const amount = Number(body.amount);
  if (Number.isNaN(amount) || amount <= 0) {
    return NextResponse.json({ message: "Amount must be positive." }, { status: 400 });
  }

  const transaction = await updateTransactionById(id, {
    type: body.type,
    amount,
    category: body.category,
    date: body.date,
    description: body.description,
  });

  if (!transaction) {
    return NextResponse.json({ message: "Transaction not found." }, { status: 404 });
  }

  return NextResponse.json({ transaction });
}
