"use client";

import { useCallback, useEffect, useState } from "react";
import { Landmark, RefreshCcw } from "lucide-react";
import { ExpenseCategoryPie } from "@/components/charts/expense-category-pie";
import { MonthlyTrendBar } from "@/components/charts/monthly-trend-bar";
import { AddTransactionForm } from "@/components/dashboard/add-transaction-form";
import { BudgetProgress } from "@/components/dashboard/budget-progress";
import { ImportHistoryPanel } from "@/components/dashboard/import-history-panel";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { InsightsPanel } from "@/components/dashboard/insights-panel";
import { TransactionFilters, type TransactionFilters as TransactionFiltersType } from "@/components/dashboard/transaction-filters";
import { Button } from "@/components/ui/button";
import {
  CategoryDistributionItem,
  DashboardPayload,
  ImportHistoryEntry,
  MonthlyTrendItem,
  NewTransactionInput,
  Transaction,
} from "@/lib/types/finance";

export default function HomePage() {
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const [distribution, setDistribution] = useState<CategoryDistributionItem[]>([]);
  const [trend, setTrend] = useState<MonthlyTrendItem[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [showFullHistory, setShowFullHistory] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [insightsRefreshTrigger, setInsightsRefreshTrigger] = useState(0);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [importHistory, setImportHistory] = useState<ImportHistoryEntry[]>([]);
  const [undoingImportId, setUndoingImportId] = useState<string | null>(null);
  const [filters, setFilters] = useState<TransactionFiltersType>({
    searchQuery: "",
    type: "all",
    category: "all",
    dateFrom: "",
    dateTo: "",
  });

  const loadDashboardSummary = useCallback(async () => {
    const dashboardResponse = await fetch("/api/dashboard", { cache: "no-store" });
    if (!dashboardResponse.ok) {
      throw new Error("Could not load dashboard data.");
    }

    const dashboardData = (await dashboardResponse.json()) as DashboardPayload;
    setDashboard(dashboardData);
  }, []);

  const loadAnalytics = useCallback(async () => {
    const [distributionResponse, trendResponse] = await Promise.all([
      fetch("/api/analytics/category-distribution", { cache: "no-store" }),
      fetch("/api/analytics/monthly-trend", { cache: "no-store" }),
    ]);

    if (!distributionResponse.ok || !trendResponse.ok) {
      throw new Error("Could not load analytics data.");
    }

    const distributionData = (await distributionResponse.json()) as {
      distribution: CategoryDistributionItem[];
    };
    const trendData = (await trendResponse.json()) as { trend: MonthlyTrendItem[] };

    setDistribution(distributionData.distribution);
    setTrend(trendData.trend);
  }, []);

  const loadTransactions = useCallback(async () => {
    const transactionsResponse = await fetch("/api/transactions", { cache: "no-store" });
    if (!transactionsResponse.ok) {
      throw new Error("Could not load transactions.");
    }

    const transactionsData = (await transactionsResponse.json()) as {
      transactions: Transaction[];
    };

    setAllTransactions(transactionsData.transactions);
  }, []);

  const loadAll = useCallback(async () => {
    setError("");

    await Promise.all([loadDashboardSummary(), loadAnalytics(), loadTransactions()]);
  }, [loadDashboardSummary, loadAnalytics, loadTransactions]);

  const refreshAfterTransactionMutation = useCallback(async () => {
    await Promise.all([loadDashboardSummary(), loadAnalytics(), loadTransactions()]);
    setInsightsRefreshTrigger((t) => t + 1);
  }, [loadDashboardSummary, loadAnalytics, loadTransactions]);

  useEffect(() => {
    async function initialize() {
      try {
        await loadAll();
      } catch {
        setError("Failed to load data.");
      } finally {
        setLoading(false);
      }
    }

    void initialize();
  }, [loadAll]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("pft-import-history");
      if (raw) {
        const parsed = JSON.parse(raw) as ImportHistoryEntry[];
        setImportHistory(Array.isArray(parsed) ? parsed : []);
      }
    } catch {
      setImportHistory([]);
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("pft-import-history", JSON.stringify(importHistory));
    } catch {
      // ignore storage failures
    }
  }, [importHistory]);

  async function addTransaction(payload: NewTransactionInput) {
    const response = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error("Save failed");
    }

    await refreshAfterTransactionMutation();
  }

  async function importTransactions(payloads: NewTransactionInput[]) {
    const response = await fetch("/api/transactions/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payloads),
    });

    if (!response.ok) {
      throw new Error("Bulk import failed");
    }

    const result = (await response.json()) as { created: Transaction[] };
    const createdIds = result.created.map((item) => item.id);
    const historyEntry: ImportHistoryEntry = {
      id: globalThis.crypto?.randomUUID?.() ?? `import-${Date.now()}`,
      createdAt: new Date().toISOString(),
      count: result.created.length,
      transactionIds: createdIds,
    };

    setImportHistory((current) => [historyEntry, ...current].slice(0, 20));
    await refreshAfterTransactionMutation();
  }

  async function undoImport(entry: ImportHistoryEntry) {
    if (entry.transactionIds.length === 0) {
      return;
    }

    setUndoingImportId(entry.id);
    try {
      const response = await fetch("/api/transactions/bulk", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: entry.transactionIds }),
      });

      if (!response.ok) {
        throw new Error("Undo failed");
      }

      setImportHistory((current) => current.filter((item) => item.id !== entry.id));
      await refreshAfterTransactionMutation();
    } finally {
      setUndoingImportId(null);
    }
  }

  async function deleteTransaction(id: string) {
    const response = await fetch(`/api/transactions?id=${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Delete failed");
    }

    await refreshAfterTransactionMutation();
  }

  async function editTransaction(id: string, payload: NewTransactionInput) {
    const response = await fetch(`/api/transactions?id=${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error("Update failed");
    }

    await refreshAfterTransactionMutation();
  }

  async function updateBudget(monthlyBudget: number) {
    const response = await fetch("/api/budget", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ monthlyBudget }),
    });

    if (!response.ok) {
      throw new Error("Budget update failed");
    }

    await loadDashboardSummary();
  }

  async function refreshDashboard() {
    setRefreshing(true);
    try {
      await loadAll();
    } finally {
      setRefreshing(false);
    }
  }

  const getFilteredTransactions = useCallback(() => {
    let filtered = showFullHistory ? allTransactions : dashboard?.recentTransactions || [];

    // Filter by type
    if (filters.type !== "all") {
      filtered = filtered.filter((t) => t.type === filters.type);
    }

    // Filter by category
    if (filters.category !== "all") {
      filtered = filtered.filter((t) => t.category === filters.category);
    }

    // Filter by search query (description)
    if (filters.searchQuery.trim() !== "") {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter((t) =>
        t.description.toLowerCase().includes(query)
      );
    }

    // Filter by date range
    if (filters.dateFrom) {
      filtered = filtered.filter((t) => t.date >= filters.dateFrom);
    }
    if (filters.dateTo) {
      filtered = filtered.filter((t) => t.date <= filters.dateTo);
    }

    return filtered;
  }, [allTransactions, dashboard?.recentTransactions, showFullHistory, filters]);

  if (loading || !dashboard) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center p-6">
        <p className="text-slate-300">Loading finance dashboard...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70 p-6 shadow-2xl shadow-cyan-950/20 backdrop-blur sm:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(56,189,248,0.16),transparent_35%,rgba(16,185,129,0.12)_70%,rgba(249,115,22,0.16))]" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-cyan-200">
              <Landmark className="h-3.5 w-3.5" />
              Premium Personal Finance
            </div>
            <h1 className="headline text-3xl font-semibold text-slate-100 sm:text-4xl">
              Nexus Ledger Dashboard
            </h1>
            <p className="mt-2 text-sm text-slate-300 sm:text-base">
              Track spending, control budget, and monitor monthly trends in one place.
            </p>
          </div>

          <Button
            variant="secondary"
            onClick={refreshDashboard}
            disabled={refreshing}
            className="w-full sm:w-auto"
          >
            <RefreshCcw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </section>

      {error ? (
        <section className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </section>
      ) : null}

      <SummaryCards
        balance={dashboard.summary.currentBalance}
        income={dashboard.summary.totalIncomeThisMonth}
        expense={dashboard.summary.totalExpenseThisMonth}
      />

      <InsightsPanel refreshTrigger={insightsRefreshTrigger} />

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <AddTransactionForm onTransactionAdded={addTransaction} />
        <BudgetProgress
          monthlyBudget={dashboard.budget.monthlyBudget}
          monthlyExpense={dashboard.summary.totalExpenseThisMonth}
          warningThreshold={dashboard.budget.warningThreshold}
          onBudgetUpdated={updateBudget}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <ExpenseCategoryPie data={distribution} />
        <MonthlyTrendBar data={trend} />
      </section>

      <ImportHistoryPanel entries={importHistory} onUndo={undoImport} undoingId={undoingImportId} />

      <TransactionFilters
        filters={filters}
        onFiltersChange={setFilters}
        isOpen={isFiltersOpen}
        onToggle={() => setIsFiltersOpen((v) => !v)}
      />

      <RecentTransactions
        transactions={getFilteredTransactions()}
        totalCount={allTransactions.length}
        isShowingFullHistory={showFullHistory}
        onToggleHistory={() => setShowFullHistory((value) => !value)}
        onDeleteTransaction={deleteTransaction}
        onEditTransaction={editTransaction}
        allTransactions={allTransactions}
        onImportTransactions={importTransactions}
      />
    </main>
  );
}
