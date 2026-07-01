import { cookies } from "next/headers";
import { createSupabaseAdminClient } from "./supabase/server";
import { mapUser } from "./mappers";
import type { PosUser } from "./types";

const SESSION_COOKIE = "seekant_session";

export async function getSessionUser(): Promise<PosUser | null> {
  const store = await cookies();
  const userId = store.get(SESSION_COOKIE)?.value;
  if (!userId) return null;

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("pos_users")
    .select("id,name,username,role,locked")
    .eq("id", userId)
    .single();

  if (error || !data) return null;
  return mapUser(data);
}

export async function setSessionCookie(userId: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
