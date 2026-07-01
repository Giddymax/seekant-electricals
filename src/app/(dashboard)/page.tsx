import { InventoryView } from "./inventory-view";
import { getSessionUser } from "@/lib/session";
import { loadProducts } from "@/lib/data";
import { redirect } from "next/navigation";

export default async function InventoryPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const products = await loadProducts();
  return <InventoryView products={products} role={user.role} />;
}
