"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/session";
import { normalizeReceiptPrefix } from "@/lib/utils";
import type { PosSettings } from "@/lib/types";

const DEFAULTS: PosSettings = {
  companyName: "Seekant Electricals",
  sidebarCopy: "Electrical supplies, lighting, wiring and appliance retail management",
  receiptTitle: "Electrical Sales Receipt",
  receiptPrefix: "SEL",
  receiptFooter: "Thank you for choosing Seekant Electricals.",
  documentTitle: "Seekant Electricals",
};

export async function saveSettings(input: PosSettings) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") return { error: "Admin only" };
  const supabase = createSupabaseAdminClient();
  const companyName = input.companyName.trim() || DEFAULTS.companyName;
  const { error } = await supabase
    .from("pos_settings")
    .update({
      company_name: companyName,
      sidebar_copy: input.sidebarCopy.trim() || DEFAULTS.sidebarCopy,
      receipt_title: input.receiptTitle.trim() || DEFAULTS.receiptTitle,
      receipt_prefix: normalizeReceiptPrefix(input.receiptPrefix || DEFAULTS.receiptPrefix),
      receipt_footer:
        input.receiptFooter.trim() || `Thank you for choosing ${companyName}.`,
      document_title: companyName,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function resetSettings() {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") return { error: "Admin only" };
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("pos_settings")
    .update({
      company_name: DEFAULTS.companyName,
      sidebar_copy: DEFAULTS.sidebarCopy,
      receipt_title: DEFAULTS.receiptTitle,
      receipt_prefix: DEFAULTS.receiptPrefix,
      receipt_footer: DEFAULTS.receiptFooter,
      document_title: DEFAULTS.documentTitle,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}
