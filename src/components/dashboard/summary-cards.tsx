import { Wallet, TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBDT } from "@/lib/utils/currency";

type SummaryCardsProps = {
  balance: number;
  income: number;
  expense: number;
};

export function SummaryCards({ balance, income, expense }: SummaryCardsProps) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Card className="border-white/10 bg-[#111b2e]/80 shadow-2xl shadow-cyan-900/10 backdrop-blur">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-slate-300">Current Balance</CardTitle>
          <Wallet className="h-5 w-5 text-cyan-300" />
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-semibold tracking-tight text-cyan-100">{formatBDT(balance)}</p>
        </CardContent>
      </Card>

      <Card className="border-emerald-300/20 bg-[#10211c]/80 shadow-2xl shadow-emerald-900/10 backdrop-blur">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-emerald-200/80">Income This Month</CardTitle>
          <TrendingUp className="h-5 w-5 text-emerald-300" />
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-semibold tracking-tight text-emerald-100">{formatBDT(income)}</p>
        </CardContent>
      </Card>

      <Card className="border-rose-300/20 bg-[#2a1616]/80 shadow-2xl shadow-rose-900/10 backdrop-blur sm:col-span-2 lg:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-rose-200/80">Expense This Month</CardTitle>
          <TrendingDown className="h-5 w-5 text-rose-300" />
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-semibold tracking-tight text-rose-100">{formatBDT(expense)}</p>
        </CardContent>
      </Card>
    </section>
  );
}
