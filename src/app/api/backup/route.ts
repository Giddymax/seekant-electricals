import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

  const supabase = createSupabaseAdminClient();
  const [users, products, sales, settings] = await Promise.all([
    supabase.from("pos_users").select("id,name,username,role,locked"),
    supabase.from("pos_products").select("*"),
    supabase.from("pos_sales").select("*"),
    supabase.from("pos_settings").select("*").eq("id", 1).single(),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    users: users.data ?? [],
    products: products.data ?? [],
    sales: sales.data ?? [],
    settings: settings.data ?? null,
  };
  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="seekant-electricals-backup-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
