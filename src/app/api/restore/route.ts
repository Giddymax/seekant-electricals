import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/session";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 401 });
  }

  let payload: {
    users?: unknown[];
    products?: unknown[];
    sales?: unknown[];
    settings?: Record<string, unknown> | null;
  };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();

  if (Array.isArray(payload.products)) {
    await supabase.from("pos_products").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    for (const row of payload.products as Record<string, unknown>[]) {
      const { id: _id, ...rest } = row;
      void _id;
      await supabase.from("pos_products").insert(rest);
    }
  }
  if (Array.isArray(payload.sales)) {
    await supabase.from("pos_sales").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    for (const row of payload.sales as Record<string, unknown>[]) {
      const { id: _id, ...rest } = row;
      void _id;
      await supabase.from("pos_sales").insert(rest);
    }
  }
  if (Array.isArray(payload.users)) {
    for (const row of payload.users as Record<string, unknown>[]) {
      await supabase.from("pos_users").upsert(row, { onConflict: "username" });
    }
  }
  if (payload.settings) {
    await supabase.from("pos_settings").update({ ...payload.settings, id: 1 }).eq("id", 1);
  }

  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
