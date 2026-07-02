import { Button } from "@/components/ui/button";
import { logout } from "@/app/login/actions";
import type { PosUser } from "@/lib/types";

export function TopBar({ user }: { user: PosUser }) {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">Electrical Shop Dashboard</p>
        <h2 style={{ margin: 0, fontFamily: "var(--font-brand)", fontSize: "1.5rem" }}>
          Welcome back,{" "}
          <span>
            {user.role === "admin" ? "SEEKANT ELECTRICALS ADMIN" : "SEEKANT ELECTRICALS STAFF"}
          </span>
        </h2>
      </div>
      <div className="topbar-actions">
        <div className="user-chip">{user.role === "admin" ? "ADMIN" : "STAFF"}</div>
        <form action={logout}>
          <Button type="submit" variant="ghost">
            Logout
          </Button>
        </form>
      </div>
    </header>
  );
}
