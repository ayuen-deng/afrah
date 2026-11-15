import { format } from "date-fns";

export function formatDateUG(date: Date) {
  return format(date, "dd/MM/yyyy");
}

export function formatDateTimeUG(date: Date) {
  return format(date, "dd/MM/yyyy HH:mm");
}

export function formatTimeUG(date: Date) {
  return format(date, "HH:mm");
}

