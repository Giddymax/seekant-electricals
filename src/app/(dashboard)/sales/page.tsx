import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { loadProducts, loadSettings } from "@/lib/data";
import { SalesView } from "./sales-view";

export default async function SalesPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const [products, settings] = await Promise.all([loadProducts(), loadSettings()]);
  return <SalesView products={products} settings={settings} />;
}
