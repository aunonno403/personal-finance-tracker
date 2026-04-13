import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
};

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
