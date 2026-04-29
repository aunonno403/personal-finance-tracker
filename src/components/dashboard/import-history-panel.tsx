"use client";

import { History, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImportHistoryEntry } from "@/lib/types/finance";
import { formatHumanDateTime } from "@/lib/utils/date";

type ImportHistoryPanelProps = {
  entries: ImportHistoryEntry[];
  onUndo: (entry: ImportHistoryEntry) => Promise<void>;
  undoingId?: string | null;
};

export function ImportHistoryPanel({ entries, onUndo, undoingId }: ImportHistoryPanelProps) {
  return (
    <Card className="border-white/10 bg-[#111b2e]/80">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <History className="h-4 w-4" />
          Import History
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {entries.length === 0 ? (
          <p className="text-sm text-slate-400">No imports yet.</p>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-3">
              <div>
                <div className="text-sm font-medium text-slate-100">
                  {entry.count} transaction{entry.count === 1 ? "" : "s"}
                </div>
                <div className="text-xs text-slate-400">{formatHumanDateTime(entry.createdAt)}</div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onUndo(entry)}
                disabled={undoingId === entry.id}
              >
                <Undo2 className="mr-2 h-4 w-4" />
                {undoingId === entry.id ? "Undoing..." : "Undo"}
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export default ImportHistoryPanel;
