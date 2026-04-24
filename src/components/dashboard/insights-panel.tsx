"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Lightbulb, Loader2, TrendingDown, TrendingUp } from "lucide-react";

interface MonthlyInsight {
  topCategory: string;
  topCategoryAmount: number;
  spendTrend: "increasing" | "decreasing" | "stable";
  budgetRiskLevel: "safe" | "warning" | "danger";
  totalExpense: number;
  message: string;
}

interface InsightsPanelProps {
  refreshTrigger?: number;
}

export function InsightsPanel({ refreshTrigger = 0 }: InsightsPanelProps) {
  const [insights, setInsights] = useState<MonthlyInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/ai/monthly-insights", {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch insights: ${response.status}`);
        }

        const data = await response.json();
        setInsights(data);
      } catch (err) {
        console.error("Error fetching insights:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load insights",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, [refreshTrigger]);

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
        <div className="flex items-center justify-center gap-2 text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading insights...</span>
        </div>
      </div>
    );
  }

  if (error) {
    // Graceful degradation - don't block the app if insights fail
    return null;
  }

  if (!insights) {
    return null;
  }

  // Determine risk level styling
  const riskColors = {
    safe: "border-green-700 bg-green-950",
    warning: "border-yellow-700 bg-yellow-950",
    danger: "border-red-700 bg-red-950",
  };

  const riskTextColors = {
    safe: "text-green-300",
    warning: "text-yellow-300",
    danger: "text-red-300",
  };

  const trendIcon =
    insights.spendTrend === "increasing" ? (
      <TrendingUp className="h-4 w-4 text-red-400" />
    ) : insights.spendTrend === "decreasing" ? (
      <TrendingDown className="h-4 w-4 text-green-400" />
    ) : null;

  return (
    <div
      className={`rounded-lg border ${riskColors[insights.budgetRiskLevel]} p-6 transition-all duration-200`}
    >
      <div className="flex items-start gap-3">
        <Lightbulb className="mt-1 h-5 w-5 flex-shrink-0 text-blue-400" />
        <div className="flex-1">
          <h3 className="font-semibold text-white">Monthly Insights</h3>
          <p
            className={`mt-2 text-sm leading-relaxed ${riskTextColors[insights.budgetRiskLevel]}`}
          >
            {insights.message}
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded bg-gray-700/50 p-2">
              <p className="text-xs text-gray-400">Top Category</p>
              <p className="font-semibold text-white">
                {insights.topCategory}
              </p>
            </div>
            <div className="rounded bg-gray-700/50 p-2">
              <p className="text-xs text-gray-400">Spent</p>
              <p className="font-semibold text-white">
                ৳{insights.totalExpense.toLocaleString("en-BD")}
              </p>
            </div>
            <div className="flex items-center gap-1 rounded bg-gray-700/50 p-2">
              <p className="text-xs text-gray-400">Trend</p>
              <div className="flex items-center gap-1">
                {trendIcon}
                <span className="font-semibold text-white">
                  {insights.spendTrend === "stable"
                    ? "Stable"
                    : insights.spendTrend === "increasing"
                      ? "↑"
                      : "↓"}
                </span>
              </div>
            </div>
          </div>

          {insights.budgetRiskLevel === "danger" && (
            <div className="mt-3 flex items-start gap-2 rounded bg-red-900/30 p-2">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-300" />
              <p className="text-xs text-red-200">
                You&apos;re spending near your budget limit. Consider reducing
                expenses.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
