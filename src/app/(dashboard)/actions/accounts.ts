"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/session";
import { normalizeUsername } from "@/lib/utils";

export async function saveAccount(input: {
  id?: string;
  name: string;
  username: string;
  password: string;
  role: "admin" | "staff";
}) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") return { error: "Admin only" };
  const supabase = createSupabaseAdminClient();
  const username = normalizeUsername(input.username);
  const name = input.name.trim();
  const password = input.password.trim();

  if (!name || !username || !password) return { error: "Fill in all fields" };

  const { data: dupes } = await supabase
    .from("pos_users")
    .select("id")
    .ilike("username", username);
  if (dupes && dupes.some((row) => row.id !== input.id)) {
    return { error: "That username already exists." };
  }

  if (input.id) {
    const { data: existing } = await supabase
      .from("pos_users")
      .select("locked")
      .eq("id", input.id)
      .single();
    const { error } = await supabase
      .from("pos_users")
      .update({
        name,
        username,
        password_hash: password,
        role: existing?.locked ? "admin" : input.role,
      })
      .eq("id", input.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("pos_users").insert({
      name,
      username,
      password_hash: password,
      role: input.role,
      locked: false,
    });
    if (error) return { error: error.message };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteAccount(id: string) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") return { error: "Admin only" };
  const supabase = createSupabaseAdminClient();
  const { data: target } = await supabase
    .from("pos_users")
    .select("locked")
    .eq("id", id)
    .single();
  if (!target || target.locked) return { error: "This account cannot be removed." };
  const { error } = await supabase.from("pos_users").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}
