import { NextResponse } from "next/server";
import {
  addTransaction,
  deleteTransactionById,
  getTransactions,
  updateTransactionById,
} from "@/lib/server/finance-repository";
import { NewTransactionInput } from "@/lib/types/finance";
import { validateTransactionInput } from "@/lib/server/transaction-validation";

export async function GET() {
  const transactions = await getTransactions();
  return NextResponse.json({ transactions });
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<NewTransactionInput>;

  const validation = validateTransactionInput(body, { normalizeEmptyDescription: true });
  if (!validation.ok) {
    return NextResponse.json({ message: validation.message }, { status: validation.status });
  }

  const transaction = await addTransaction(validation.payload);

  return NextResponse.json({ transaction }, { status: 201 });
  // No logic changes, just touching the file
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

  const validation = validateTransactionInput(body, { normalizeEmptyDescription: true });
  if (!validation.ok) {
    return NextResponse.json({ message: validation.message }, { status: validation.status });
  }

  const transaction = await updateTransactionById(id, validation.payload);

  if (!transaction) {
    return NextResponse.json({ message: "Transaction not found." }, { status: 404 });
  }

  return NextResponse.json({ transaction });
}
