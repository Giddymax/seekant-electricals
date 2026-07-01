import { formatCurrency } from "@/lib/format";
import { getSaleBalanceDue } from "@/lib/data";
import type { Product, Sale } from "@/lib/types";

export function StatsBar({ products, sales }: { products: Product[]; sales: Sale[] }) {
  const today = new Date().toDateString();
  const todaySales = sales
    .filter((s) => new Date(s.createdAt).toDateString() === today)
    .reduce((sum, s) => sum + s.total, 0);
  const totalUnits = products.reduce((sum, p) => sum + p.quantity, 0);
  const lowStockCount = products.filter((p) => p.quantity <= p.reorderLevel).length;
  const partPaymentCount = sales.filter((s) => getSaleBalanceDue(s) > 0).length;

  const items = [
    { label: "Total Products", value: String(products.length) },
    { label: "Inventory Units", value: String(totalUnits) },
    { label: "Today Sales", value: formatCurrency(todaySales) },
    { label: "Low Stock Alerts", value: String(lowStockCount) },
    { label: "Part Payments Due", value: String(partPaymentCount) },
  ];

  return (
    <section className="stats-grid">
      {items.map((item) => (
        <article className="stat-card" key={item.label}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
        </article>
      ))}
    </section>
  );
}
