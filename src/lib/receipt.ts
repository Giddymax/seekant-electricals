import { formatCurrency, formatDateTime, formatPaymentMethod } from "./format";
import type { PosSettings, Sale } from "./types";

const esc = (v: string | number | undefined | null) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export function buildReceiptHtml(sale: Sale, settings: PosSettings) {
  const rows = sale.items
    .map(
      (item) => `
      <tr>
        <td>${esc(item.name)}<br><span style="color:#555">${esc(item.batchNumber ?? "")}</span></td>
        <td>${item.quantity}</td>
        <td>${formatCurrency(item.price)}</td>
        <td>${formatCurrency(item.lineTotal ?? item.price * item.quantity)}</td>
      </tr>`,
    )
    .join("");

  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(sale.receiptNumber)}</title>
    <style>
      body { font-family: "Courier New", monospace; padding: 0; margin: 0; color: #111; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .receipt { width: 280px; margin: 0 auto; padding: 10px 8px 14px; }
      .receipt h1, .receipt p { margin: 0; }
      .receipt h1 { text-align: center; font-size: 18px; margin-bottom: 4px; }
      .receipt-subtitle, .receipt-footer { text-align: center; font-size: 11px; color: #444; }
      .receipt-meta, .receipt-summary { margin-top: 10px; font-size: 11px; line-height: 1.5; }
      .receipt-table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 11px; }
      .receipt-table thead { border-top: 1px dashed #000; border-bottom: 1px dashed #000; }
      .receipt-table th, .receipt-table td { padding: 6px 0; text-align: left; vertical-align: top; }
      .receipt-table th:nth-child(2), .receipt-table th:nth-child(3), .receipt-table th:nth-child(4),
      .receipt-table td:nth-child(2), .receipt-table td:nth-child(3), .receipt-table td:nth-child(4) { text-align: right; }
      .receipt-summary { border-top: 1px dashed #000; padding-top: 8px; }
      .receipt-summary p { display: flex; justify-content: space-between; }
      .receipt-footer { border-top: 1px dashed #000; margin-top: 12px; padding-top: 10px; }
      @page { size: 80mm auto; margin: 0; }
    </style></head><body>
    <div class="receipt">
      <h1>${esc(settings.companyName)}</h1>
      <p class="receipt-subtitle">${esc(settings.receiptTitle)}</p>
      <div class="receipt-meta">
        <p><strong>Receipt No:</strong> ${esc(sale.receiptNumber)}</p>
        <p><strong>Date:</strong> ${esc(formatDateTime(sale.createdAt))}</p>
        <p><strong>Served By:</strong> ${esc(sale.servedBy)}</p>
        <p><strong>Customer:</strong> ${esc(sale.customerName)}</p>
        <p><strong>Phone:</strong> ${esc(sale.customerPhone || "-")}</p>
        <p><strong>Payment:</strong> ${esc(formatPaymentMethod(sale.paymentMethod))}</p>
      </div>
      <table class="receipt-table">
        <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="receipt-summary">
        <p><strong>Subtotal:</strong> <span>${formatCurrency(sale.subtotal)}</span></p>
        <p><strong>Discount:</strong> <span>${formatCurrency(sale.discount)}</span></p>
        <p><strong>Total:</strong> <span>${formatCurrency(sale.total)}</span></p>
        <p><strong>Paid:</strong> <span>${formatCurrency(sale.amountPaid)}</span></p>
        <p><strong>Balance:</strong> <span>${formatCurrency(sale.balanceDue)}</span></p>
        <p><strong>Change:</strong> <span>${formatCurrency(sale.changeDue)}</span></p>
      </div>
      <p class="receipt-footer">${esc(settings.receiptFooter)}</p>
    </div>
    <script>window.onload = function () { window.print(); setTimeout(function(){ window.close(); }, 500); };</script>
  </body></html>`;
}
