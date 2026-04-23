"use client";

import { Pie, PieChart, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryDistributionItem } from "@/lib/types/finance";
import { formatBDT } from "@/lib/utils/currency";

const colors = [
  "#0ea5e9",
  "#14b8a6",
  "#f97316",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#ef4444",
  "#f43f5e",
  "#6366f1",
  "#eab308",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#a855f7",
  "#ec4899",
  "#38bdf8",
];

type ExpenseCategoryPieProps = {
  data: CategoryDistributionItem[];
};

export function ExpenseCategoryPie({ data }: ExpenseCategoryPieProps) {
  return (
    <Card className="border-white/10 bg-[#111b2e]/80">
      <CardHeader>
        <CardTitle className="text-lg">Expense Distribution</CardTitle>
      </CardHeader>
      <CardContent className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="total"
              nameKey="category"
              innerRadius={60}
              outerRadius={110}
              paddingAngle={3}
            >
              {data.map((entry, index) => (
                <Cell key={entry.category} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "#0f172a",
                border: "1px solid rgba(148, 163, 184, 0.3)",
                borderRadius: "0.75rem",
              }}
              formatter={(value) => formatBDT(Number(value ?? 0))}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
