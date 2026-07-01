import type { Product, Sale, SaleItem } from "./types";

export type SummaryRange = "daily" | "weekly" | "monthly" | "custom";

export interface SummaryInput {
  sales: Sale[];
  products: Product[];
  range: SummaryRange;
  startDate?: string;
  endDate?: string;
}

export interface SummaryResult {
  sales: Sale[];
  totalSales: number;
  totalProfit: number;
  totalDiscounts: number;
  totalBalanceDue: number;
  totalInventoryValue: number;
  totalInventoryCost: number;
  itemsSold: number;
  transactionCount: number;
  averageSale: number;
  fastMovingProducts: Array<{
    name: string;
    quantitySold: number;
    revenue: number;
    profit: number;
    currentStock: number;
  }>;
  topCustomers: Array<{
    name: string;
    phone: string;
    visits: number;
    totalSpend: number;
    balanceDue: number;
  }>;
  label: string;
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

function inRange(iso: string, start: Date, end: Date) {
  const t = new Date(iso).getTime();
  return t >= start.getTime() && t <= end.getTime();
}

function computeWindow(range: SummaryRange, startDate?: string, endDate?: string) {
  const now = new Date();
  if (range === "daily") {
    return { start: startOfDay(now), end: endOfDay(now), label: "Daily summary" };
  }
  if (range === "weekly") {
    const start = new Date(now);
    start.setDate(now.getDate() - 6);
    return { start: startOfDay(start), end: endOfDay(now), label: "Weekly summary (last 7 days)" };
  }
  if (range === "monthly") {
    const start = new Date(now);
    start.setDate(now.getDate() - 29);
    return {
      start: startOfDay(start),
      end: endOfDay(now),
      label: "Monthly summary (last 30 days)",
    };
  }
  const start = startDate ? startOfDay(new Date(startDate)) : startOfDay(now);
  const end = endDate ? endOfDay(new Date(endDate)) : endOfDay(now);
  return { start, end, label: `Custom ${startDate ?? ""} → ${endDate ?? ""}` };
}

const saleBalance = (sale: Sale) => Math.max(0, sale.total - sale.amountPaid);

export function buildSummary({ sales, products, range, startDate, endDate }: SummaryInput): SummaryResult {
  const { start, end, label } = computeWindow(range, startDate, endDate);
  const filtered = sales.filter((sale) => inRange(sale.createdAt, start, end));

  const totalSales = filtered.reduce((sum, sale) => sum + sale.total, 0);
  const totalProfit = filtered.reduce(
    (sum, sale) => sum + sale.items.reduce((s, i) => s + (i.lineProfit ?? 0), 0),
    0,
  );
  const totalDiscounts = filtered.reduce((sum, sale) => sum + sale.discount, 0);
  const totalBalanceDue = filtered.reduce((sum, sale) => sum + saleBalance(sale), 0);
  const itemsSold = filtered.reduce(
    (sum, sale) => sum + sale.items.reduce((s, i) => s + i.quantity, 0),
    0,
  );
  const totalInventoryValue = products.reduce((sum, p) => sum + p.quantity * p.price, 0);
  const totalInventoryCost = products.reduce((sum, p) => sum + p.quantity * p.costPrice, 0);

  const productMap = new Map<string, SummaryResult["fastMovingProducts"][number]>();
  filtered.forEach((sale) =>
    sale.items.forEach((item: SaleItem) => {
      const key = item.productId || item.name;
      const currentStock = products.find((p) => p.id === item.productId)?.quantity ?? 0;
      const entry = productMap.get(key) ?? {
        name: item.name,
        quantitySold: 0,
        revenue: 0,
        profit: 0,
        currentStock,
      };
      entry.quantitySold += item.quantity;
      entry.revenue += item.lineTotal ?? item.price * item.quantity;
      entry.profit += item.lineProfit ?? (item.price - (item.costPrice ?? 0)) * item.quantity;
      entry.currentStock = currentStock;
      productMap.set(key, entry);
    }),
  );

  const customerMap = new Map<string, SummaryResult["topCustomers"][number]>();
  filtered.forEach((sale) => {
    const name = sale.customerName || "Walk-in Customer";
    const phone = sale.customerPhone || "-";
    const key = `${name.toLowerCase()}|${phone}`;
    const entry = customerMap.get(key) ?? {
      name,
      phone,
      visits: 0,
      totalSpend: 0,
      balanceDue: 0,
    };
    entry.visits += 1;
    entry.totalSpend += sale.total;
    entry.balanceDue += saleBalance(sale);
    customerMap.set(key, entry);
  });

  return {
    sales: [...filtered].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    ),
    totalSales,
    totalProfit,
    totalDiscounts,
    totalBalanceDue,
    totalInventoryValue,
    totalInventoryCost,
    itemsSold,
    transactionCount: filtered.length,
    averageSale: filtered.length ? totalSales / filtered.length : 0,
    fastMovingProducts: [...productMap.values()]
      .sort((a, b) => b.quantitySold - a.quantitySold || b.revenue - a.revenue)
      .slice(0, 10),
    topCustomers: [...customerMap.values()]
      .sort((a, b) => b.totalSpend - a.totalSpend || b.visits - a.visits)
      .slice(0, 10),
    label,
  };
}
