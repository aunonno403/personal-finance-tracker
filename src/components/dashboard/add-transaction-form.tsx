"use client";

import { FormEvent, useMemo, useState } from "react";
import { Loader2, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  CATEGORY_SUGGESTIONS,
  Category,
  NewTransactionInput,
  TransactionType,
} from "@/lib/types/finance";

type AddTransactionFormProps = {
  onTransactionAdded: (payload: NewTransactionInput) => Promise<void>;
};

export function AddTransactionForm({ onTransactionAdded }: AddTransactionFormProps) {
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<Category>("Food");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submitReady = useMemo(
    () => Number(amount) > 0 && description.trim().length > 2,
    [amount, description],
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const amountValue = Number(amount);
    if (!amountValue || amountValue <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    setLoading(true);

    try {
      await onTransactionAdded({
        type,
        amount: amountValue,
        category,
        date,
        description: description.trim(),
      });
      setAmount("");
      setDescription("");
    } catch {
      setError("Could not save transaction. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-white/10 bg-[#111b2e]/80">
      <CardHeader>
        <CardTitle className="text-lg">Add Transaction</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={onSubmit}>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Type</Label>
              <select
                value={type}
                onChange={(event) => setType(event.target.value as TransactionType)}
                className="h-9 w-full rounded-lg border border-input bg-slate-900/50 px-2.5 text-sm text-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Amount (BDT)</Label>
              <Input
                type="number"
                min={1}
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className="bg-slate-900/50"
                placeholder="5000"
              />
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Category</Label>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value as Category)}
                className="h-9 w-full rounded-lg border border-input bg-slate-900/50 px-2.5 text-sm text-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                {CATEGORY_SUGGESTIONS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="bg-slate-900/50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="min-h-[88px] bg-slate-900/50"
              placeholder="E.g. Team dinner and groceries"
            />
          </div>

          {error ? <p className="text-sm text-rose-300">{error}</p> : null}

          <Button type="submit" disabled={!submitReady || loading} className="w-full sm:w-auto">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
            {loading ? "Saving" : "Save Transaction"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
