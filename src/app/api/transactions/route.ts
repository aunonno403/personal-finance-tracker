import { NextResponse } from "next/server";
import {
  addTransaction,
  deleteTransactionById,
  getTransactions,
  updateTransactionById,
} from "@/lib/server/finance-repository";
import { NewTransactionInput } from "@/lib/types/finance";
import { validateTransactionInput } from "@/lib/server/transaction-validation";
import { getAuthSession } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const transactions = await getTransactions(session.userId);
  return NextResponse.json({ transactions });
}

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as Partial<NewTransactionInput>;

  const validation = validateTransactionInput(body, { normalizeEmptyDescription: true });
  if (!validation.ok) {
    return NextResponse.json({ message: validation.message }, { status: validation.status });
  }

  const transaction = await addTransaction(session.userId, validation.payload);

  return NextResponse.json({ transaction }, { status: 201 });
}

export async function DELETE(request: Request) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ message: "Transaction id is required." }, { status: 400 });
  }

  const deleted = await deleteTransactionById(session.userId, id);
  if (!deleted) {
    return NextResponse.json({ message: "Transaction not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

export async function PUT(request: Request) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

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

  const transaction = await updateTransactionById(session.userId, id, validation.payload);

  if (!transaction) {
    return NextResponse.json({ message: "Transaction not found." }, { status: 404 });
  }

  return NextResponse.json({ transaction });
}
