import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  NewTransactionInput,
  Transaction,
} from "@/lib/types/finance";

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === ',' && !inQuotes) {
      result.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  result.push(cur);
  return result;
}

export function parseCsvToTransactions(csvText: string): NewTransactionInput[] {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return [];

  // Detect header
  const firstCols = splitCsvLine(lines[0]).map((c) => c.trim().toLowerCase());
  let startIndex = 0;
  const hasHeader = ["date", "type", "category", "description", "amount"].every((h) =>
    firstCols.includes(h),
  );
  if (hasHeader) startIndex = 1;

  const parsed: NewTransactionInput[] = [];

  for (let i = startIndex; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]);
    // Expect at least 5 columns: Date, Type, Category, Description, Amount
    if (cols.length < 5) continue;

    const date = cols[0].trim();
    const typeRaw = cols[1].trim().toLowerCase();
    const categoryRaw = cols[2].trim();
    const description = cols[3].trim();
    const amountRaw = cols[4].trim();

    const type = typeRaw === "income" ? "income" : "expense";

    // Normalize category
    const allExpense = Array.from(EXPENSE_CATEGORIES as readonly string[]);
    const allIncome = Array.from(INCOME_CATEGORIES as readonly string[]);
    let category = "Others";
    if (allExpense.find((c) => c.toLowerCase() === categoryRaw.toLowerCase())) {
      category = allExpense.find((c) => c.toLowerCase() === categoryRaw.toLowerCase()) || "Others";
    } else if (allIncome.find((c) => c.toLowerCase() === categoryRaw.toLowerCase())) {
      category = allIncome.find((c) => c.toLowerCase() === categoryRaw.toLowerCase()) || "Others";
    } else {
      // fallback: choose Others of the given type
      category = type === "income" ? "Others" : "Others";
    }

    const amount = Number(amountRaw.replace(/[^0-9.-]+/g, ""));
    if (Number.isNaN(amount)) continue;

    const item: NewTransactionInput = {
      type: type as NewTransactionInput["type"],
      amount,
      category: category as NewTransactionInput["category"],
      date: date,
      description: description || "",
    };

    parsed.push(item);
  }

  return parsed;
}

export default parseCsvToTransactions;
