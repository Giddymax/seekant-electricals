"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDateTime, formatPaymentMethod } from "@/lib/format";
import { buildReceiptHtml } from "@/lib/receipt";
import type { PosSettings, Role, Sale } from "@/lib/types";
import { deleteSale, recordPartPayment } from "../actions/sales";

const balanceDue = (sale: Sale) => Math.max(0, sale.total - sale.amountPaid);

export function HistoryView({
  sales,
  settings,
  role,
}: {
  sales: Sale[];
  settings: PosSettings;
  role: Role;
}) {
  const [historySearch, setHistorySearch] = useState("");
  const [debtSearch, setDebtSearch] = useState("");
  const [paymentDraft, setPaymentDraft] = useState<{ id: string; amount: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const outstanding = useMemo(() => {
    const term = debtSearch.trim().toLowerCase();
    return sales
      .filter((s) => balanceDue(s) > 0)
      .filter((s) =>
        !term ||
        [s.customerName, s.customerPhone, s.receiptNumber, s.amountPaid, s.total]
          .join(" ")
          .toLowerCase()
          .includes(term),
      );
  }, [sales, debtSearch]);

  const totalPaid = outstanding.reduce((sum, s) => sum + s.amountPaid, 0);
  const totalRemaining = outstanding.reduce((sum, s) => sum + balanceDue(s), 0);

  const historyList = useMemo(() => {
    const term = historySearch.trim().toLowerCase();
    return sales.filter((s) =>
      !term ||
      [s.receiptNumber, s.customerName, s.customerPhone, s.servedBy]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [sales, historySearch]);

  const printSale = (sale: Sale) => {
    const html = buildReceiptHtml(sale, settings);
    const w = window.open("", "_blank", "width=900,height=700");
    if (!w) return alert("Please allow popups to print the receipt.");
    w.document.open();
    w.document.write(html);
    w.document.close();
  };

  const savePayment = (saleId: string, amount: string) => {
    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      alert("Enter a valid payment amount.");
      return;
    }
    startTransition(async () => {
      await recordPartPayment(saleId, parsed);
      setPaymentDraft(null);
    });
  };

  const remove = (sale: Sale) => {
    if (!window.confirm(`Delete sale ${sale.receiptNumber}? Stock will be restored.`)) return;
    startTransition(async () => {
      await deleteSale(sale.id);
    });
  };

  return (
    <section>
      <div className="section-header">
        <div>
          <p className="eyebrow">Transactions</p>
          <h3 style={{ margin: 0, fontFamily: "var(--font-brand)", fontSize: "1.35rem" }}>
            Recent sales and customer activity
          </h3>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <div className="list-header">
          <div>
            <h4 style={{ margin: 0 }}>Outstanding Customer Payments</h4>
            <p className="message">
              Customers with part payments, amount paid and remaining balance.
            </p>
          </div>
          <Input
            type="search"
            value={debtSearch}
            onChange={(e) => setDebtSearch(e.target.value)}
            placeholder="Search part payments by customer, phone, receipt or amount"
          />
        </div>
        <div className="sales-history">
          {outstanding.length === 0 ? (
            <div className="empty-state">
              {debtSearch
                ? "No unpaid customer balances matched your search."
                : "No customers currently have remaining balances."}
            </div>
          ) : (
            <>
              <div className="debt-summary">
                <div>
                  <span>Customers</span>
                  <strong>{outstanding.length}</strong>
                </div>
                <div>
                  <span>Amount Paid</span>
                  <strong>{formatCurrency(totalPaid)}</strong>
                </div>
                <div>
                  <span>Remaining</span>
                  <strong>{formatCurrency(totalRemaining)}</strong>
                </div>
              </div>
              {outstanding.map((sale) => (
                <article className="history-card debt-card" key={sale.id}>
                  <div className="history-head">
                    <div>
                      <h5>{sale.customerName || "Walk-in Customer"}</h5>
                      <p>
                        {sale.customerPhone || "-"} · {sale.receiptNumber}
                      </p>
                    </div>
                    <Button
                      variant="mini"
                      onClick={() =>
                        setPaymentDraft({ id: sale.id, amount: String(balanceDue(sale)) })
                      }
                    >
                      Record Payment
                    </Button>
                  </div>
                  <div className="debt-amounts">
                    <div>
                      <span>Total</span>
                      <strong>{formatCurrency(sale.total)}</strong>
                    </div>
                    <div>
                      <span>Paid</span>
                      <strong>{formatCurrency(sale.amountPaid)}</strong>
                    </div>
                    <div>
                      <span>Remaining</span>
                      <strong>{formatCurrency(balanceDue(sale))}</strong>
                    </div>
                  </div>
                  {paymentDraft?.id === sale.id ? (
                    <form
                      className="payment-record-form"
                      onSubmit={(e) => {
                        e.preventDefault();
                        savePayment(sale.id, paymentDraft.amount);
                      }}
                    >
                      <label>
                        Amount Received
                        <Input
                          type="number"
                          min="0.01"
                          max={balanceDue(sale)}
                          step="0.01"
                          value={paymentDraft.amount}
                          onChange={(e) =>
                            setPaymentDraft({ id: sale.id, amount: e.target.value })
                          }
                          required
                        />
                      </label>
                      <div className="button-row">
                        <Button type="submit" disabled={pending}>
                          {pending ? "Saving..." : "Save Payment"}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setPaymentDraft(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : null}
                  <p className="muted">
                    Sold on {formatDateTime(sale.createdAt)} by {sale.servedBy || "-"}
                  </p>
                </article>
              ))}
            </>
          )}
        </div>
      </div>

      <div className="card">
        <div className="list-header">
          <h4 style={{ margin: 0 }}>Sales History</h4>
          <Input
            type="search"
            value={historySearch}
            onChange={(e) => setHistorySearch(e.target.value)}
            placeholder="Search by receipt, customer or staff"
          />
        </div>
        <div className="sales-history">
          {historyList.length === 0 ? (
            <div className="empty-state">
              {sales.length === 0
                ? "Sales history is currently empty."
                : "No sales matched your search."}
            </div>
          ) : (
            historyList.map((sale) => (
              <article className="history-card" key={sale.id}>
                <div className="history-head">
                  <div>
                    <h5>{sale.receiptNumber}</h5>
                    <p>{formatDateTime(sale.createdAt)}</p>
                  </div>
                  <div className="product-actions">
                    <Button variant="ghost" onClick={() => printSale(sale)}>
                      Print Receipt
                    </Button>
                    {balanceDue(sale) > 0 ? (
                      <Button
                        variant="mini"
                        onClick={() =>
                          setPaymentDraft({ id: sale.id, amount: String(balanceDue(sale)) })
                        }
                      >
                        Record Payment
                      </Button>
                    ) : null}
                    {role === "admin" ? (
                      <Button variant="mini" onClick={() => remove(sale)}>
                        Delete Sale
                      </Button>
                    ) : null}
                  </div>
                </div>
                <div className="catalog-flags">
                  <Badge>Counter sale</Badge>
                </div>
                <p>
                  Customer: <strong>{sale.customerName}</strong>
                </p>
                <p>
                  Phone: {sale.customerPhone || "-"} | Payment:{" "}
                  {formatPaymentMethod(sale.paymentMethod)}
                </p>
                <p>Served By: {sale.servedBy}</p>
                <p>
                  Subtotal: {formatCurrency(sale.subtotal)} | Discount:{" "}
                  {formatCurrency(sale.discount)}
                  {sale.tax > 0 ? <> | Tax: {formatCurrency(sale.tax)}</> : null} | Total:{" "}
                  <strong>{formatCurrency(sale.total)}</strong>
                </p>
                <p>
                  Paid: {formatCurrency(sale.amountPaid)} | Balance:{" "}
                  {formatCurrency(balanceDue(sale))} |{" "}
                  {balanceDue(sale) <= 0
                    ? "Fully paid"
                    : sale.amountPaid > 0
                      ? "Part payment"
                      : "Payment pending"}
                </p>
                <div className="history-items">
                  {sale.items
                    .map((item) => `${item.name} x ${item.quantity} (${item.batchNumber || "-"})`)
                    .join(" · ")}
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
