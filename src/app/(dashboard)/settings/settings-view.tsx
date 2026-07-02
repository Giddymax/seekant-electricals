"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { PosSettings } from "@/lib/types";
import { normalizeReceiptPrefix } from "@/lib/utils";
import { resetSettings, saveSettings } from "../actions/settings";
import { RestoreButton } from "./restore-button";
import { BackupButton } from "@/components/BackupButton";

export function SettingsView({ settings }: { settings: PosSettings }) {
  const [draft, setDraft] = useState<PosSettings>(settings);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const set = <K extends keyof PosSettings>(k: K, v: PosSettings[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const res = await saveSettings(draft);
      if (res.error) return setMessage(res.error);
      setMessage("Settings saved.");
    });
  };

  const reset = () => {
    startTransition(async () => {
      const res = await resetSettings();
      if (res.error) return setMessage(res.error);
      window.location.reload();
    });
  };

  const prefix = normalizeReceiptPrefix(draft.receiptPrefix || "SEL");

  return (
    <section>
      <div className="section-header">
        <div>
          <p className="eyebrow">Settings</p>
          <h3 style={{ margin: 0, fontFamily: "var(--font-brand)", fontSize: "1.35rem" }}>
            Branding and electrical receipt details
          </h3>
        </div>
      </div>
      <div className="layout-grid settings-layout">
        <form onSubmit={submit} className="card form-card" style={{ display: "grid", gap: 16 }}>
          <h4>Application Settings</h4>
          <label>
            Company Name
            <Input
              required
              value={draft.companyName}
              onChange={(e) => set("companyName", e.target.value)}
            />
          </label>
          <label>
            Sidebar Text
            <Input
              value={draft.sidebarCopy}
              onChange={(e) => set("sidebarCopy", e.target.value)}
            />
          </label>
          <label>
            Receipt Title
            <Input
              value={draft.receiptTitle}
              onChange={(e) => set("receiptTitle", e.target.value)}
            />
          </label>
          <label>
            Receipt Number Prefix
            <Input
              value={draft.receiptPrefix}
              maxLength={12}
              onChange={(e) => set("receiptPrefix", e.target.value)}
            />
          </label>
          <label>
            Receipt Footer / Inscription
            <Textarea
              rows={4}
              value={draft.receiptFooter}
              onChange={(e) => set("receiptFooter", e.target.value)}
            />
          </label>
          <div className="button-row">
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : "Save Settings"}
            </Button>
            <Button type="button" variant="ghost" onClick={reset} disabled={pending}>
              Reset Default
            </Button>
          </div>
          {message ? <p className="message">{message}</p> : null}
          <p className="message">
            Only admin can change app-wide settings. Saved changes reflect across dashboards,
            receipts, and electrical shop reports.
          </p>
        </form>

        <div className="card receipt-preview">
          <h4>Receipt Preview</h4>
          <div className="receipt">
            <h1>{draft.companyName || "Seekant Electricals"}</h1>
            <p className="receipt-subtitle">{draft.receiptTitle}</p>
            <div className="receipt-meta">
              <p>
                <strong>Receipt No:</strong> {prefix}-00000001
              </p>
              <p>
                <strong>Date:</strong> 9 Apr 2026, 1:00 PM
              </p>
              <p>
                <strong>Served By:</strong> Sales Staff
              </p>
              <p>
                <strong>Customer:</strong> Walk-in Customer
              </p>
              <p>
                <strong>Phone:</strong> -
              </p>
              <p>
                <strong>Payment:</strong> Cash
              </p>
            </div>
            <table className="receipt-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>LED Bulb 9W</td>
                  <td>2</td>
                  <td>GHS 18.00</td>
                  <td>GHS 36.00</td>
                </tr>
              </tbody>
            </table>
            <div className="receipt-summary">
              <p>
                <strong>Subtotal:</strong> <span>GHS 36.00</span>
              </p>
              <p>
                <strong>Discount:</strong> <span>GHS 0.00</span>
              </p>
              <p>
                <strong>Total:</strong> <span>GHS 36.00</span>
              </p>
              <p>
                <strong>Paid:</strong> <span>GHS 20.00</span>
              </p>
              <p>
                <strong>Balance:</strong> <span>GHS 16.00</span>
              </p>
              <p>
                <strong>Change:</strong> <span>GHS 0.00</span>
              </p>
            </div>
            <p className="receipt-footer">{draft.receiptFooter}</p>
          </div>
        </div>
      </div>

      <div className="card storage-card" style={{ marginTop: 18 }}>
        <div className="section-header">
          <div>
            <p className="eyebrow">Data Storage</p>
            <h3 style={{ margin: 0, fontFamily: "var(--font-brand)", fontSize: "1.2rem" }}>
              Backup, restore, and storage location
            </h3>
          </div>
        </div>
        <div className="storage-grid">
          <div>
            <p className="message">
              Backups export your products, accounts, sales and settings into a JSON file.
            </p>
          </div>
          <div className="button-row">
            <BackupButton />
            <RestoreButton />
          </div>
        </div>
      </div>
    </section>
  );
}
