import { redirect } from "next/navigation";
import { SidebarShell } from "@/components/SidebarShell";
import { TopBar } from "@/components/TopBar";
import { StatsBar } from "@/components/StatsBar";
import { getSessionUser } from "@/lib/session";
import { loadProducts, loadSales, loadSettings } from "@/lib/data";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const [settings, products, sales] = await Promise.all([
    loadSettings(),
    loadProducts(),
    loadSales(),
  ]);

  return (
    <div className="app-shell">
      <SidebarShell settings={settings} role={user.role} />
      <main className="dashboard-main" style={{ padding: 28 }}>
        <TopBar user={user} />
        <StatsBar products={products} sales={sales} />
        {children}
      </main>
    </div>
  );
}
