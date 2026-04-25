"use client";

import { useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
} from "@/lib/types/finance";

export interface TransactionFilters {
  searchQuery: string;
  type: "all" | "income" | "expense";
  category: "all" | string;
  dateFrom: string;
  dateTo: string;
}

interface TransactionFiltersProps {
  filters: TransactionFilters;
  onFiltersChange: (filters: TransactionFilters) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function TransactionFilters({
  filters,
  onFiltersChange,
  isOpen,
  onToggle,
}: TransactionFiltersProps) {
  const categoryOptions =
    filters.type === "income"
      ? INCOME_CATEGORIES
      : filters.type === "expense"
        ? EXPENSE_CATEGORIES
        : [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

  const handleClearFilters = () => {
    onFiltersChange({
      searchQuery: "",
      type: "all",
      category: "all",
      dateFrom: "",
      dateTo: "",
    });
  };

  const hasActiveFilters =
    filters.searchQuery !== "" ||
    filters.type !== "all" ||
    filters.category !== "all" ||
    filters.dateFrom !== "" ||
    filters.dateTo !== "";

  if (!isOpen) {
    return (
      <div className="mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onToggle}
          className="gap-2"
        >
          <ChevronDown className="h-4 w-4" />
          Show Filters
          {hasActiveFilters && (
            <span className="ml-2 inline-flex items-center rounded-full bg-cyan-500/20 px-2 py-0.5 text-xs font-medium text-cyan-200">
              {Object.values(filters).filter((v) => v && v !== "all").length} active
            </span>
          )}
        </Button>
      </div>
    );
  }

  return (
    <Card className="mb-4 border-slate-700/50 bg-slate-900/50">
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200">Filters</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="h-6 w-6 p-0"
            >
              <ChevronDown className="h-4 w-4 rotate-180" />
            </Button>
          </div>

          {/* Filter Controls */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {/* Search */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300">
                Description
              </label>
              <input
                type="text"
                placeholder="Search..."
                value={filters.searchQuery}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    searchQuery: e.target.value,
                  })
                }
                className="w-full rounded border border-slate-600 bg-slate-800/50 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
              />
            </div>

            {/* Type */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300">
                Type
              </label>
              <select
                value={filters.type}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    type: e.target.value as "all" | "income" | "expense",
                    category: "all", // Reset category when type changes
                  })
                }
                className="w-full rounded border border-slate-600 bg-slate-800/50 px-3 py-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
              >
                <option value="all">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    category: e.target.value,
                  })
                }
                className="w-full rounded border border-slate-600 bg-slate-800/50 px-3 py-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
              >
                <option value="all">All Categories</option>
                {categoryOptions.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Date From */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300">
                From
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    dateFrom: e.target.value,
                  })
                }
                className="w-full rounded border border-slate-600 bg-slate-800/50 px-3 py-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
              />
            </div>

            {/* Date To */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300">
                To
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    dateTo: e.target.value,
                  })
                }
                className="w-full rounded border border-slate-600 bg-slate-800/50 px-3 py-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
              />
            </div>
          </div>

          {/* Actions */}
          {hasActiveFilters && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFilters}
                className="gap-1 text-slate-300 hover:text-slate-100"
              >
                <X className="h-3.5 w-3.5" />
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
