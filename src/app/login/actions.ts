"use server";

import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { setSessionCookie, clearSessionCookie } from "@/lib/session";
import { normalizeUsername } from "@/lib/utils";

export type LoginState = { error?: string };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const username = normalizeUsername(String(formData.get("username") ?? ""));
  const password = String(formData.get("password") ?? "").trim();
  if (!username || !password) {
    return { error: "Username and password are required." };
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("pos_users")
    .select("id,name,username,role,locked,password_hash")
    .ilike("username", username)
    .single();

  if (error || !data || data.password_hash !== password) {
    return { error: "Invalid username or password." };
  }

  await setSessionCookie(data.id);
  redirect("/");
}

export async function logout() {
  await clearSessionCookie();
  redirect("/login");
}
