"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  NewTransactionInput,
} from "@/lib/types/finance";

interface ImportPreviewModalProps {
  items: NewTransactionInput[];
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (items: NewTransactionInput[]) => Promise<void>;
  loading?: boolean;
}

function buildSafeCategory(type: NewTransactionInput["type"], category: string) {
  const validCategories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  return validCategories.includes(category as any) ? (category as NewTransactionInput["category"]) : validCategories[0];
}

export function ImportPreviewModal({ items, isOpen, onClose, onConfirm, loading }: ImportPreviewModalProps) {
  const [draftItems, setDraftItems] = useState<NewTransactionInput[]>(items);

  useEffect(() => {
    if (isOpen) {
      setDraftItems(items);
    }
  }, [items, isOpen]);

  const hasRows = draftItems.length > 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-[900px] max-w-full">
        <Card>
          <CardHeader>
            <CardTitle>Preview Import ({draftItems.length} rows)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[60vh] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {draftItems.map((it, idx) => {
                    const validCategories = it.type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
                    return (
                      <TableRow key={`${it.date}-${it.category}-${idx}`}>
                        <TableCell className="min-w-[120px]">
                          <Select
                            value={it.type}
                            onValueChange={(value) => {
                              const nextType = value as NewTransactionInput["type"];
                              setDraftItems((current) =>
                                current.map((row, rowIndex) =>
                                  rowIndex === idx
                                    ? {
                                        ...row,
                                        type: nextType,
                                        category: buildSafeCategory(nextType, row.category),
                                      }
                                    : row,
                                ),
                              );
                            }}
                          >
                            <SelectTrigger className="h-9 w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="expense">expense</SelectItem>
                              <SelectItem value="income">income</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="min-w-[140px]">
                          <Input
                            type="date"
                            value={it.date}
                            onChange={(e) =>
                              setDraftItems((current) =>
                                current.map((row, rowIndex) =>
                                  rowIndex === idx ? { ...row, date: e.target.value } : row,
                                ),
                              )
                            }
                          />
                        </TableCell>
                        <TableCell className="min-w-[180px]">
                          <Select
                            value={it.category}
                            onValueChange={(value) =>
                              setDraftItems((current) =>
                                current.map((row, rowIndex) =>
                                  rowIndex === idx ? { ...row, category: value as NewTransactionInput["category"] } : row,
                                ),
                              )
                            }
                          >
                            <SelectTrigger className="h-9 w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {validCategories.map((category) => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="min-w-[260px]">
                          <Input
                            value={it.description}
                            onChange={(e) =>
                              setDraftItems((current) =>
                                current.map((row, rowIndex) =>
                                  rowIndex === idx ? { ...row, description: e.target.value } : row,
                                ),
                              )
                            }
                          />
                        </TableCell>
                        <TableCell className="text-right min-w-[120px]">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={it.amount}
                            onChange={(e) =>
                              setDraftItems((current) =>
                                current.map((row, rowIndex) =>
                                  rowIndex === idx ? { ...row, amount: Number(e.target.value) } : row,
                                ),
                              )
                            }
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDraftItems((current) => current.filter((_, rowIndex) => rowIndex !== idx))}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {!hasRows ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-slate-400">
                        No rows left to import.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button
                variant="secondary"
                onClick={() => setDraftItems(items)}
                disabled={loading}
              >
                Reset
              </Button>
              <Button onClick={() => onConfirm(draftItems)} disabled={loading || !hasRows}>
                {loading ? "Importing..." : "Confirm Import"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default ImportPreviewModal;
