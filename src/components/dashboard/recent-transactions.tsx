"use client";

import { useState, useRef } from "react";
import { ArrowDownCircle, ArrowUpCircle, Loader2, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EditTransactionModal } from "@/components/dashboard/edit-transaction-modal";
import { exportTransactionsToCSV } from "@/lib/utils/csv-export";
import { parseCsvToTransactions } from "@/lib/utils/csv-import";
import {
  CATEGORY_SUGGESTIONS,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  NewTransactionInput,
  Transaction,
} from "@/lib/types/finance";
import { formatBDT } from "@/lib/utils/currency";
import { formatHumanDate } from "@/lib/utils/date";

type RecentTransactionsProps = {
  transactions: Transaction[];
  totalCount: number;
  isShowingFullHistory: boolean;
  onToggleHistory: () => void;
  onDeleteTransaction: (id: string) => Promise<void>;
  onEditTransaction: (id: string, payload: NewTransactionInput) => Promise<void>;
  allTransactions?: Transaction[];
  onImportTransactions?: (payloads: NewTransactionInput[]) => Promise<void>;
};

export function RecentTransactions({
  transactions,
  totalCount,
  isShowingFullHistory,
  onToggleHistory,
  onDeleteTransaction,
  onEditTransaction,
  allTransactions,
  onImportTransactions,
}: RecentTransactionsProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function handleDelete(id: string) {
    const confirmed = window.confirm("Delete this transaction?");
    if (!confirmed) {
      return;
    }

    setDeletingId(id);
    try {
      await onDeleteTransaction(id);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleEdit(item: Transaction) {
    setEditingTransaction(item);
    setIsEditModalOpen(true);
  }

  async function handleSaveEdit(payload: NewTransactionInput) {
    if (!editingTransaction) {
      return;
    }

    setIsSavingEdit(true);
    try {
      await onEditTransaction(editingTransaction.id, payload);
    } finally {
      setIsSavingEdit(false);
      setEditingTransaction(null);
      setIsEditModalOpen(false);
    }
  }

  return (
    <Card className="border-white/10 bg-[#111b2e]/80">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-lg">
            {isShowingFullHistory ? "Full Transaction History" : "Recent Transactions"}
          </CardTitle>
          <div className="flex items-center gap-2">
            {totalCount > 8 ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={onToggleHistory}
                className="text-xs"
              >
                {isShowingFullHistory ? "Show Last 8" : `View Full History (${totalCount})`}
              </Button>
            ) : null}

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => exportTransactionsToCSV(transactions)}
                disabled={transactions.length === 0}
                className="text-sm"
              >
                Export Visible
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => exportTransactionsToCSV(allTransactions ?? transactions)}
                disabled={(allTransactions ?? []).length === 0}
                className="text-sm"
              >
                Export All
              </Button>

              <input
                ref={(el) => { fileInputRef.current = el; }}
                type="file"
                accept="text/csv"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file || !onImportTransactions) return;
                  setIsImporting(true);
                  try {
                    const text = await file.text();
                    const parsed = parseCsvToTransactions(text);
                    if (parsed.length === 0) {
                      window.alert("No valid rows found in CSV.");
                      return;
                    }
                    await onImportTransactions(parsed);
                    window.alert(`Imported ${parsed.length} transactions.`);
                  } catch (err) {
                    console.error(err);
                    window.alert("Import failed. Check CSV format.");
                  } finally {
                    setIsImporting(false);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }
                }}
              />

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={!onImportTransactions}
                className="text-sm"
              >
                {isImporting ? "Importing..." : "Import CSV"}
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-white/10">
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="w-[140px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((item) => (
              <TableRow key={item.id} className="border-white/5">
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      item.type === "income"
                        ? "border-emerald-400/40 text-emerald-200"
                        : "border-rose-400/40 text-rose-200"
                    }
                  >
                    <span className="mr-1 inline-flex align-middle">
                      {item.type === "income" ? (
                        <ArrowUpCircle className="h-3.5 w-3.5" />
                      ) : (
                        <ArrowDownCircle className="h-3.5 w-3.5" />
                      )}
                    </span>
                    {item.type}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-[200px] truncate">{item.description}</TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell>{formatHumanDate(item.date)}</TableCell>
                <TableCell className="text-right font-medium">{formatBDT(item.amount)}</TableCell>
                <TableCell className="text-right">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="mr-1 text-cyan-300 hover:bg-cyan-500/15 hover:text-cyan-200"
                    disabled={editingId === item.id || deletingId === item.id}
                    onClick={() => handleEdit(item)}
                  >
                    {editingId === item.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Pencil className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-rose-300 hover:bg-rose-500/15 hover:text-rose-200"
                    disabled={deletingId === item.id || editingId === item.id}
                    onClick={() => handleDelete(item.id)}
                  >
                    {deletingId === item.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {transactions.length === 0 ? (
              <TableRow className="border-white/5">
                <TableCell className="text-slate-400" colSpan={6}>
                  No transactions found.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </CardContent>

      <EditTransactionModal
        transaction={editingTransaction}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingTransaction(null);
        }}
        onSave={handleSaveEdit}
        loading={isSavingEdit}
      />
    </Card>
  );
}
