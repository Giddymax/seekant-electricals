"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { PosSettings, Role } from "@/lib/types";

const NAV = [
  { href: "/", label: "Inventory", roles: ["admin", "staff"] as Role[] },
  { href: "/sales", label: "Sales", roles: ["admin", "staff"] as Role[] },
  { href: "/history", label: "Sales History", roles: ["admin", "staff"] as Role[] },
  { href: "/summary", label: "Summary", roles: ["admin"] as Role[] },
  { href: "/accounts", label: "Accounts", roles: ["admin"] as Role[] },
  { href: "/settings", label: "Settings", roles: ["admin"] as Role[] },
];

export function Sidebar({ settings, role }: { settings: PosSettings; role: Role }) {
  const pathname = usePathname();
  return (
    <aside className="sidebar">
      <div>
        <div className="brand-mark">
          <Image
            src="/seekant-logo.png"
            alt={`${settings.companyName} logo`}
            width={512}
            height={512}
            priority
          />
        </div>
        <h1>{settings.companyName}</h1>
        <p className="sidebar-copy">{settings.sidebarCopy}</p>
      </div>
      <nav className="tabs sidebar-tabs">
        {NAV.filter((item) => item.roles.includes(role)).map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn("tab-btn", active && "active")}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
