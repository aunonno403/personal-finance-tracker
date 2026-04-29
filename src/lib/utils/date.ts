import { format, parseISO } from "date-fns";

export function getMonthKey(dateString: string): string {
  return format(parseISO(dateString), "yyyy-MM");
}

export function formatHumanDate(dateString: string): string {
  return format(parseISO(dateString), "dd MMM yyyy");
}

export function formatHumanDateTime(dateString: string): string {
  return format(new Date(dateString), "dd MMM yyyy, hh:mm a");
}
