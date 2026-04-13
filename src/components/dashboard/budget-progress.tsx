"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { formatBDT } from "@/lib/utils/currency";

type BudgetProgressProps = {
  monthlyBudget: number;
  monthlyExpense: number;
  warningThreshold: number;
  onBudgetUpdated: (value: number) => Promise<void>;
};

export function BudgetProgress({
  monthlyBudget,
  monthlyExpense,
  warningThreshold,
  onBudgetUpdated,
}: BudgetProgressProps) {
  const [editingBudget, setEditingBudget] = useState(String(monthlyBudget));
  const [saving, setSaving] = useState(false);

  const usage = monthlyBudget > 0 ? (monthlyExpense / monthlyBudget) * 100 : 0;
  const warningAt = warningThreshold * 100;
  const isWarning = usage >= warningAt;

  async function submitBudget() {
    const value = Number(editingBudget);
    if (!value || value <= 0) {
      return;
    }

    setSaving(true);
    await onBudgetUpdated(value);
    setSaving(false);
  }

  return (
    <Card className="border-white/10 bg-[#111b2e]/80">
      <CardHeader>
        <CardTitle className="text-lg">Monthly Budget Tracking</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-300">Spent</span>
            <span className="font-medium text-slate-100">{formatBDT(monthlyExpense)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-300">Budget</span>
            <span className="font-medium text-slate-100">{formatBDT(monthlyBudget)}</span>
          </div>
        </div>

        <div className="space-y-2">
          <Progress value={Math.min(100, usage)} className="h-2" />
          <p className="text-xs text-slate-400">{usage.toFixed(1)}% used (warning starts at {warningAt.toFixed(0)}%)</p>
        </div>

        {isWarning ? (
          <Alert className="border-amber-500/30 bg-amber-500/10 text-amber-200">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Budget warning</AlertTitle>
            <AlertDescription>
              You are close to your monthly limit. Consider reducing non-essential expenses.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="border-emerald-500/20 bg-emerald-500/10 text-emerald-200">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>On track</AlertTitle>
            <AlertDescription>Your spending is within a healthy range for this month.</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Input
            type="number"
            min={1}
            value={editingBudget}
            onChange={(event) => setEditingBudget(event.target.value)}
            className="bg-slate-900/60"
          />
          <Button onClick={submitBudget} disabled={saving}>
            {saving ? "Saving..." : "Update"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
