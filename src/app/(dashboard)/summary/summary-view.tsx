"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDateTime } from "@/lib/format";
import type { PosSettings, Product, Sale } from "@/lib/types";
import { buildSummary, type SummaryRange } from "@/lib/summary";

const RANGES: { key: SummaryRange; label: string }[] = [
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
  { key: "custom", label: "Custom Date" },
];

const esc = (s: string | number) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

export function SummaryView({
  sales,
  products,
  settings,
}: {
  sales: Sale[];
  products: Product[];
  settings: PosSettings;
}) {
  const [range, setRange] = useState<SummaryRange>("daily");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const summary = useMemo(
    () => buildSummary({ sales, products, range, startDate, endDate }),
    [sales, products, range, startDate, endDate],
  );

  const printReport = () => {
    const rows = summary.sales
      .map(
        (sale) => `
        <tr>
          <td>${esc(sale.receiptNumber)}</td>
          <td>${esc(formatDateTime(sale.createdAt))}</td>
          <td>${esc(sale.customerName)}</td>
          <td>${sale.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
          <td>${formatCurrency(sale.discount)}</td>
          <td>${formatCurrency(Math.max(0, sale.total - sale.amountPaid))}</td>
          <td>${formatCurrency(sale.total)}</td>
        </tr>`,
      )
      .join("");

    const html = `<!doctype html><html><head><meta charset="utf-8">
      <title>${esc(settings.companyName)} Summary Report</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 28px; color: #1a1a1a; }
        .report-header { text-align: center; margin-bottom: 24px; }
        .report-header img { width: 150px; height: auto; display: block; margin: 0 auto 12px; }
        .report-header h1 { margin: 0 0 6px; font-size: 28px; color: #1b5f9e; }
        .report-header p { margin: 4px 0; color: #555; }
        .report-summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 14px; margin-bottom: 24px; }
        .summary-box { border: 1px solid #d9dfeb; border-radius: 14px; padding: 14px; background: #f7fafc; }
        .summary-box span { display: block; color: #667085; margin-bottom: 8px; }
        .summary-box strong { font-size: 22px; color: #0f3557; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th, td { border: 1px solid #d7dde6; padding: 10px; text-align: left; }
        th { background: #eef4fa; }
        @page { size: A4 portrait; margin: 12mm; }
      </style></head><body>
      <div class="report-header">
        <img src="/seekant-logo.png" alt="${esc(settings.companyName)} logo">
        <h1>${esc(settings.companyName)} Summary</h1>
        <p>${esc(summary.label)}</p>
        <p>Generated on ${esc(formatDateTime(new Date().toISOString()))}</p>
      </div>
      <div class="report-summary">
        <div class="summary-box"><span>Total Sales</span><strong>${formatCurrency(summary.totalSales)}</strong></div>
        <div class="summary-box"><span>Total Profit</span><strong>${formatCurrency(summary.totalProfit)}</strong></div>
        <div class="summary-box"><span>Discounts Given</span><strong>${formatCurrency(summary.totalDiscounts)}</strong></div>
        <div class="summary-box"><span>Part Payments Due</span><strong>${formatCurrency(summary.totalBalanceDue)}</strong></div>
        <div class="summary-box"><span>Inventory Selling Value</span><strong>${formatCurrency(summary.totalInventoryValue)}</strong></div>
        <div class="summary-box"><span>Total Inventory Cost</span><strong>${formatCurrency(summary.totalInventoryCost)}</strong></div>
        <div class="summary-box"><span>Transactions</span><strong>${summary.transactionCount}</strong></div>
        <div class="summary-box"><span>Items Sold</span><strong>${summary.itemsSold}</strong></div>
      </div>
      <table>
        <thead><tr><th>Receipt</th><th>Date</th><th>Customer</th><th>Items</th><th>Discount</th><th>Balance</th><th>Total</th></tr></thead>
        <tbody>${rows || `<tr><td colspan="7">No sales found for this period.</td></tr>`}</tbody>
      </table>
      <script>window.onload = function () { window.print(); setTimeout(function(){ window.close(); }, 800); };</script>
      </body></html>`;
    const w = window.open("", "_blank", "width=1000,height=800");
    if (!w) return alert("Please allow popups to print the summary.");
    w.document.open();
    w.document.write(html);
    w.document.close();
  };

  return (
    <section>
      <div className="section-header">
        <div>
          <p className="eyebrow">Business Summary</p>
          <h3 style={{ margin: 0, fontFamily: "var(--font-brand)", fontSize: "1.35rem" }}>
            Daily, weekly, monthly and custom electrical shop reports
          </h3>
        </div>
        <Button onClick={printReport}>Print Summary</Button>
      </div>

      <div className="card summary-controls" style={{ display: "grid", gap: 18, marginBottom: 18 }}>
        <div className="summary-filter-row">
          {RANGES.map((item) => (
            <button
              type="button"
              key={item.key}
              className={`mini-btn summary-range-btn${range === item.key ? " active" : ""}`}
              onClick={() => setRange(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>
        {range === "custom" ? (
          <div className="two-column">
            <label>
              Start Date
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </label>
            <label>
              End Date
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </label>
          </div>
        ) : null}
        <p className="message">
          Summary printing is available to admin only and includes sales totals, part payments,
          fast-moving items and loyal customer analysis.
        </p>
      </div>

      <div className="summary-content">
        <div className="summary-grid">
          <article className="stat-card">
            <span>Report Range</span>
            <strong>{summary.label}</strong>
          </article>
          <article className="stat-card">
            <span>Total Sales</span>
            <strong>{formatCurrency(summary.totalSales)}</strong>
          </article>
          <article className="stat-card">
            <span>Total Profit</span>
            <strong>{formatCurrency(summary.totalProfit)}</strong>
          </article>
          <article className="stat-card">
            <span>Discounts Given</span>
            <strong>{formatCurrency(summary.totalDiscounts)}</strong>
          </article>
          <article className="stat-card">
            <span>Part Payments Due</span>
            <strong>{formatCurrency(summary.totalBalanceDue)}</strong>
          </article>
          <article className="stat-card">
            <span>Inventory Selling Value</span>
            <strong>{formatCurrency(summary.totalInventoryValue)}</strong>
          </article>
          <article className="stat-card">
            <span>Total Inventory Cost</span>
            <strong>{formatCurrency(summary.totalInventoryCost)}</strong>
          </article>
          <article className="stat-card">
            <span>Transactions</span>
            <strong>{summary.transactionCount}</strong>
          </article>
          <article className="stat-card">
            <span>Items Sold</span>
            <strong>{summary.itemsSold}</strong>
          </article>
        </div>

        <div className="analysis-grid">
          <div className="card">
            <div className="history-head">
              <div>
                <h4>Fast-Moving Items</h4>
                <p className="muted">Use this to decide what to restock first.</p>
              </div>
            </div>
            <table className="summary-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Qty Sold</th>
                  <th>Sales</th>
                  <th>Current Stock</th>
                </tr>
              </thead>
              <tbody>
                {summary.fastMovingProducts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="muted">
                      No item movement yet for this period.
                    </td>
                  </tr>
                ) : (
                  summary.fastMovingProducts.map((product) => (
                    <tr key={product.name}>
                      <td>{product.name}</td>
                      <td>{product.quantitySold}</td>
                      <td>{formatCurrency(product.revenue)}</td>
                      <td>{product.currentStock}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="card">
            <div className="history-head">
              <div>
                <h4>Loyal Customers</h4>
                <p className="muted">High-value and repeat customers to reward.</p>
              </div>
            </div>
            <table className="summary-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Visits</th>
                  <th>Total Spend</th>
                  <th>Balance</th>
                </tr>
              </thead>
              <tbody>
                {summary.topCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="muted">
                      No customer activity yet for this period.
                    </td>
                  </tr>
                ) : (
                  summary.topCustomers.map((customer) => (
                    <tr key={customer.name + customer.phone}>
                      <td>
                        <strong>{customer.name}</strong>
                        <br />
                        <span className="muted">{customer.phone}</span>
                      </td>
                      <td>{customer.visits}</td>
                      <td>{formatCurrency(customer.totalSpend)}</td>
                      <td>{formatCurrency(customer.balanceDue)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="history-head">
            <div>
              <h4>Report Details</h4>
              <p className="muted">{summary.label}</p>
            </div>
          </div>
          <table className="summary-table">
            <thead>
              <tr>
                <th>Receipt</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Discount</th>
                <th>Balance</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {summary.sales.length === 0 ? (
                <tr>
                  <td colSpan={7} className="muted">
                    No sales found for this period.
                  </td>
                </tr>
              ) : (
                summary.sales.map((sale) => (
                  <tr key={sale.id}>
                    <td>{sale.receiptNumber}</td>
                    <td>{formatDateTime(sale.createdAt)}</td>
                    <td>{sale.customerName}</td>
                    <td>{sale.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
                    <td>{formatCurrency(sale.discount)}</td>
                    <td>{formatCurrency(Math.max(0, sale.total - sale.amountPaid))}</td>
                    <td>{formatCurrency(sale.total)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
