import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { loadUsers } from "@/lib/data";
import { AccountsView } from "./accounts-view";

export default async function AccountsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/");
  const users = await loadUsers();
  return <AccountsView users={users} />;
}
