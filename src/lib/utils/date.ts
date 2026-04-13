import { format, parseISO } from "date-fns";

export function getMonthKey(dateString: string): string {
  return format(parseISO(dateString), "yyyy-MM");
}

export function formatHumanDate(dateString: string): string {
  return format(parseISO(dateString), "dd MMM yyyy");
}
