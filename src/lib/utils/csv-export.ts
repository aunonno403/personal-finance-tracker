import { Transaction } from "@/lib/types/finance";

function escapeCsvField(value: string) {
  if (value == null) return "";
  // Escape double quotes by doubling them and wrap field in quotes if it contains comma/newline/quote
  const stringValue = String(value);
  const needsWrapping = /[",\n]/.test(stringValue);
  const escaped = stringValue.replace(/"/g, '""');
  return needsWrapping ? `"${escaped}"` : escaped;
}

export function exportTransactionsToCSV(transactions: Transaction[], filename?: string) {
  const header = ["Date", "Type", "Category", "Description", "Amount"];

  const rows = transactions.map((t) => [
    t.date,
    t.type,
    t.category,
    t.description ?? "",
    String(t.amount),
  ]);

  const csvLines = [header, ...rows]
    .map((cols) => cols.map((c) => escapeCsvField(c)).join(","))
    .join("\n");

  const blob = new Blob([csvLines], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.href = url;
  const name = filename ?? `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
  link.setAttribute("download", name);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default exportTransactionsToCSV;
