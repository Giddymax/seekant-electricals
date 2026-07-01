import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { loadProducts, loadSales, loadSettings } from "@/lib/data";
import { SummaryView } from "./summary-view";

export default async function SummaryPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/");
  const [sales, products, settings] = await Promise.all([
    loadSales(),
    loadProducts(),
    loadSettings(),
  ]);
  return <SummaryView sales={sales} products={products} settings={settings} />;
}
