"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initial: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initial);
  return (
    <form action={formAction} className="card login-card" style={{ display: "grid", gap: 16 }}>
      <h3 style={{ margin: 0 }}>Sign In</h3>
      <label>
        Username
        <Input name="username" type="text" placeholder="Enter username" autoComplete="username" required />
      </label>
      <label>
        Password
        <Input
          name="password"
          type="password"
          placeholder="Enter password"
          autoComplete="current-password"
          required
        />
      </label>
      <Button type="submit" disabled={pending}>
        {pending ? "Signing in..." : "Login"}
      </Button>
      {state.error ? <p className="message is-error">{state.error}</p> : null}
    </form>
  );
}
