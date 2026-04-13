"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MonthlyTrendItem } from "@/lib/types/finance";
import { formatBDT } from "@/lib/utils/currency";

type MonthlyTrendBarProps = {
  data: MonthlyTrendItem[];
};

export function MonthlyTrendBar({ data }: MonthlyTrendBarProps) {
  return (
    <Card className="border-white/10 bg-[#111b2e]/80">
      <CardHeader>
        <CardTitle className="text-lg">Income vs Expense Trend</CardTitle>
      </CardHeader>
      <CardContent className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={6}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" />
            <XAxis dataKey="month" stroke="#94a3b8" tickLine={false} axisLine={false} />
            <YAxis
              stroke="#94a3b8"
              tickFormatter={(value) => `${Math.round(value / 1000)}k`}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "#0f172a",
                border: "1px solid rgba(148, 163, 184, 0.3)",
                borderRadius: "0.75rem",
              }}
              formatter={(value) => formatBDT(Number(value ?? 0))}
            />
            <Legend />
            <Bar dataKey="income" fill="#34d399" radius={[8, 8, 0, 0]} />
            <Bar dataKey="expense" fill="#fb7185" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
