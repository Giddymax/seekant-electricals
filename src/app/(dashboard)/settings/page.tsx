import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { loadSettings } from "@/lib/data";
import { SettingsView } from "./settings-view";

export default async function SettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/");
  const settings = await loadSettings();
  return <SettingsView settings={settings} />;
}
