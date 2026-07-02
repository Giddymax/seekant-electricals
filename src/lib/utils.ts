import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

export function makeInventorySku(name: string) {
  const clean = name
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 12);
  return clean || "Stock Keeping Unit";
}

export function generateBarcode() {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 9000 + 1000);
  return `SEL-${timestamp}${random}`;
}

export function normalizeReceiptPrefix(prefix: string) {
  return (prefix || "SEL").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12) || "SEL";
}
