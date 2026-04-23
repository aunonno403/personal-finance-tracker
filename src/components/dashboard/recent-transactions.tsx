"use client";

import { useState } from "react";
import { ArrowDownCircle, ArrowUpCircle, Trash2 } from "lucide-react";
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
import { Transaction } from "@/lib/types/finance";
import { formatBDT } from "@/lib/utils/currency";
import { formatHumanDate } from "@/lib/utils/date";

type RecentTransactionsProps = {
  transactions: Transaction[];
  onDeleteTransaction: (id: string) => Promise<void>;
};

export function RecentTransactions({
  transactions,
  onDeleteTransaction,
}: RecentTransactionsProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  return (
    <Card className="border-white/10 bg-[#111b2e]/80">
      <CardHeader>
        <CardTitle className="text-lg">Recent Transactions</CardTitle>
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
              <TableHead className="w-[76px] text-right">Action</TableHead>
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
                    className="text-rose-300 hover:bg-rose-500/15 hover:text-rose-200"
                    disabled={deletingId === item.id}
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
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
    </Card>
  );
}
