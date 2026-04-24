import {
  CATEGORY_SUGGESTIONS,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  NewTransactionInput,
} from "@/lib/types/finance";

type ValidationOptions = {
  normalizeEmptyDescription?: boolean;
};

type ValidationError = {
  ok: false;
  message: string;
  status: number;
};

type ValidationSuccess = {
  ok: true;
  payload: NewTransactionInput;
};

export type TransactionValidationResult = ValidationError | ValidationSuccess;

export function normalizeDescription(
  description: string | undefined,
  normalizeEmptyDescription: boolean,
): string {
  if (typeof description !== "string") {
    return normalizeEmptyDescription ? "N/A" : "";
  }

  const value = description.trim();
  if (!value && normalizeEmptyDescription) {
    return "N/A";
  }

  return value;
}

export function validateTransactionInput(
  body: Partial<NewTransactionInput>,
  options: ValidationOptions = {},
): TransactionValidationResult {
  const normalizeEmptyDescription = options.normalizeEmptyDescription ?? true;

  if (!body.type || !body.amount || !body.category || !body.date) {
    return { ok: false, message: "Missing required fields.", status: 400 };
  }

  if (!CATEGORY_SUGGESTIONS.includes(body.category)) {
    return { ok: false, message: "Invalid category.", status: 400 };
  }

  // Validate category matches transaction type
  const validCategoriesForType =
    body.type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  if (!validCategoriesForType.includes(body.category as any)) {
    return {
      ok: false,
      message: `Invalid category for ${body.type} transaction.`,
      status: 400,
    };
  }

  const amount = Number(body.amount);
  if (Number.isNaN(amount) || amount <= 0) {
    return { ok: false, message: "Amount must be positive.", status: 400 };
  }

  return {
    ok: true,
    payload: {
      type: body.type,
      amount,
      category: body.category,
      date: body.date,
      description: normalizeDescription(body.description, normalizeEmptyDescription),
    },
  };
}
