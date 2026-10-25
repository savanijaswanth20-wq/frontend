import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = "INR"): string {
  if (currency === "INR") {
    if (amount >= 100000) {
      const lpa = amount / 100000;
      return `₹${lpa.toFixed(lpa % 1 === 0 ? 0 : 1)} LPA`;
    }
    return `₹${amount.toLocaleString("en-IN")}`;
  } else if (currency === "BDT") {
    if (amount >= 100000) {
      return `৳${(amount / 100000).toFixed(1)} Lakh`;
    }
    return `৳${amount.toLocaleString()}`;
  } else {
    return `$${(amount / 1000).toFixed(0)}k`;
  }
}

export function formatDate(dateString: string | Date): string {
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function truncate(str: string, length: number): string {
  if (!str) return "";
  return str.length > length ? str.substring(0, length) + "..." : str;
}
