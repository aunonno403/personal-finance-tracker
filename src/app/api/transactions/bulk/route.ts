import { NextResponse } from "next/server";
import { addTransactionsBulk, deleteTransactionsBulk } from "@/lib/server/finance-repository";
import { validateTransactionInput } from "@/lib/server/transaction-validation";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    if (!Array.isArray(body)) {
      return NextResponse.json({ error: "Expected an array of transactions" }, { status: 400 });
    }

    const validatedInputs: Parameters<typeof addTransactionsBulk>[0] = [];
    for (const item of body) {
      const validation = validateTransactionInput(item as any, { normalizeEmptyDescription: true });
      if (!validation.ok) {
        return NextResponse.json({ error: validation.message }, { status: validation.status });
      }
      validatedInputs.push(validation.payload);
    }

    const created = await addTransactionsBulk(validatedInputs);
    return NextResponse.json({ created }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = (await request.json()) as { ids?: string[] };
    if (!Array.isArray(body?.ids)) {
      return NextResponse.json({ error: "Expected ids array" }, { status: 400 });
    }

    const deleted = await deleteTransactionsBulk(body.ids);
    return NextResponse.json({ deleted }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Bulk delete failed" }, { status: 500 });
  }
}
