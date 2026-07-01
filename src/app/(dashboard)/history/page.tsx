import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { loadSales, loadSettings } from "@/lib/data";
import { HistoryView } from "./history-view";

export default async function HistoryPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const [sales, settings] = await Promise.all([loadSales(), loadSettings()]);
  return <HistoryView sales={sales} settings={settings} role={user.role} />;
}
