"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PosUser } from "@/lib/types";
import { deleteAccount, saveAccount } from "../actions/accounts";

type Draft = {
  id?: string;
  name: string;
  username: string;
  password: string;
  role: "admin" | "staff";
  locked?: boolean;
};

const empty: Draft = { name: "", username: "", password: "", role: "staff" };

export function AccountsView({ users }: { users: PosUser[] }) {
  const [draft, setDraft] = useState<Draft>(empty);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const res = await saveAccount({
        id: draft.id,
        name: draft.name,
        username: draft.username,
        password: draft.password,
        role: draft.role,
      });
      if (res.error) return setMessage(res.error);
      setDraft(empty);
      setMessage("Account saved.");
    });
  };

  const edit = (user: PosUser) =>
    setDraft({
      id: user.id,
      name: user.name,
      username: user.username,
      password: "",
      role: user.role,
      locked: user.locked,
    });

  const remove = (user: PosUser) => {
    if (user.locked) return;
    if (!window.confirm(`Remove account for ${user.name}?`)) return;
    startTransition(async () => {
      await deleteAccount(user.id);
    });
  };

  return (
    <section>
      <div className="section-header">
        <div>
          <p className="eyebrow">Access Control</p>
          <h3 style={{ margin: 0, fontFamily: "var(--font-brand)", fontSize: "1.35rem" }}>
            Admin and sales staff accounts
          </h3>
        </div>
      </div>
      <div className="layout-grid">
        <form onSubmit={submit} className="card form-card" style={{ display: "grid", gap: 16 }}>
          <h4>{draft.id ? (draft.locked ? "Update Admin Login" : "Edit Account") : "Create Team Account"}</h4>
          <label>
            Full Name
            <Input required value={draft.name} onChange={(e) => set("name", e.target.value)} />
          </label>
          <label>
            Username
            <Input
              required
              value={draft.username}
              onChange={(e) => set("username", e.target.value)}
            />
          </label>
          <label>
            Password
            <Input
              type="password"
              required
              value={draft.password}
              onChange={(e) => set("password", e.target.value)}
            />
          </label>
          <label>
            Role
            <select
              value={draft.role}
              onChange={(e) => set("role", e.target.value as "admin" | "staff")}
              disabled={Boolean(draft.locked)}
            >
              <option value="staff">Sales Staff</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <div className="button-row">
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : "Save Account"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setDraft(empty)}>
              Clear
            </Button>
          </div>
          {message ? <p className="message">{message}</p> : null}
          <p className="message">
            Only admin can update login credentials and manage staff accounts.
          </p>
        </form>

        <div className="card">
          <h4 style={{ marginTop: 0 }}>Existing Accounts</h4>
          <div className="accounts-list">
            {users.map((user) => (
              <article key={user.id} className="account-row">
                <div>
                  <h5>{user.name}</h5>
                  <p>
                    {user.username} · {user.role === "admin" ? "admin" : "sales staff"}
                  </p>
                </div>
                <div className="product-actions">
                  <Button variant="mini" onClick={() => edit(user)}>
                    Edit
                  </Button>
                  {user.locked ? null : (
                    <Button variant="mini" onClick={() => remove(user)}>
                      Remove
                    </Button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
