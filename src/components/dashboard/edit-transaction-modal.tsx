"use client";

import { FormEvent, useEffect, useState } from "react";
import { Loader2, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  Category,
  NewTransactionInput,
  Transaction,
  TransactionType,
} from "@/lib/types/finance";

interface EditTransactionModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: NewTransactionInput) => Promise<void>;
  loading?: boolean;
}

export function EditTransactionModal({
  transaction,
  isOpen,
  onClose,
  onSave,
  loading = false,
}: EditTransactionModalProps) {
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<Category>("Food");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [suggestingCategory, setSuggestingCategory] = useState(false);

  const categoryOptions = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  // Reset form when modal opens with new transaction
  useEffect(() => {
    if (isOpen && transaction) {
      setType(transaction.type);
      setAmount(String(transaction.amount));
      setCategory(transaction.category);
      setDate(transaction.date);
      setDescription(transaction.description);
      setError("");
    }
  }, [isOpen, transaction]);

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    // Set default category for the new type
    setCategory(newType === "income" ? "Salary" : "Food");
  };

  async function suggestCategoryFromDescription() {
    if (!description.trim()) {
      setError("Please enter a description first");
      return;
    }

    setSuggestingCategory(true);
    setError("");

    try {
      const response = await fetch("/api/ai/category-suggestion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: description.trim(),
          type,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get category suggestion");
      }

      const data = await response.json();
      setCategory(data.suggestedCategory);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not suggest category",
      );
    } finally {
      setSuggestingCategory(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const amountValue = Number(amount);
    if (!amountValue || amountValue <= 0) {
      setError("Amount must be greater than 0");
      return;
    }

    try {
      await onSave({
        type,
        amount: amountValue,
        category,
        date,
        description: description.trim() || "N/A",
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save transaction");
    }
  }

  if (!isOpen || !transaction) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg border border-white/10 bg-slate-900 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/10 p-4">
          <h2 className="text-lg font-semibold text-white">Edit Transaction</h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-slate-400 hover:text-slate-200 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <select
                id="type"
                value={type}
                onChange={(e) => handleTypeChange(e.target.value as TransactionType)}
                disabled={loading}
                className="h-9 w-full rounded-lg border border-input bg-slate-900/50 px-2.5 text-sm text-foreground disabled:opacity-50"
              >
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount (BDT)</Label>
              <Input
                id="amount"
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={loading}
                className="bg-slate-900/50"
              />
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                disabled={loading}
                className="h-9 w-full rounded-lg border border-input bg-slate-900/50 px-2.5 text-sm text-foreground disabled:opacity-50"
              >
                {categoryOptions.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={loading}
                className="bg-slate-900/50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="description">Description</Label>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={suggestCategoryFromDescription}
                disabled={suggestingCategory || loading || !description.trim()}
                className="h-7 text-xs"
              >
                {suggestingCategory ? (
                  <>
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    Suggesting...
                  </>
                ) : (
                  <>
                    <Zap className="mr-1 h-3 w-3" />
                    AI Suggest
                  </>
                )}
              </Button>
            </div>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              className="min-h-[88px] bg-slate-900/50"
              placeholder="Transaction details..."
            />
          </div>

          {error && (
            <div className="rounded bg-red-900/30 p-2 text-sm text-red-200">
              {error}
            </div>
          )}

          <div className="flex gap-2 border-t border-white/10 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
