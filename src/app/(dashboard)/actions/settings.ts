"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/session";
import { normalizeReceiptPrefix } from "@/lib/utils";
import type { PosSettings } from "@/lib/types";

const DEFAULTS: PosSettings = {
  companyName: "Seekant Electricals",
  sidebarCopy: "Electrical supplies, lighting, wiring and appliance retail management",
  receiptTitle: "Sales Receipt",
  receiptPrefix: "SEL",
  receiptFooter: "Thank you for choosing Seekant Electricals.",
  documentTitle: "Seekant Electricals",
  shopPhone: "",
  shopAddress: "",
  tin: "",
  taxLabel: "VAT",
  taxRate: 0,
};

// Postgres reports missing columns as 42703; PostgREST (Supabase's API layer)
// reports its own schema-cache miss as PGRST204 — both mean the same thing
// here: the ghana-enhancements.sql migration hasn't been run yet.
const isMissingColumnError = (error: { code?: string } | null | undefined) =>
  error?.code === "42703" || error?.code === "PGRST204";

export async function saveSettings(input: PosSettings) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") return { error: "Admin only" };
  const supabase = createSupabaseAdminClient();
  const companyName = input.companyName.trim() || DEFAULTS.companyName;
  const basePayload = {
    company_name: companyName,
    sidebar_copy: input.sidebarCopy.trim() || DEFAULTS.sidebarCopy,
    receipt_title: input.receiptTitle.trim() || DEFAULTS.receiptTitle,
    receipt_prefix: normalizeReceiptPrefix(input.receiptPrefix || DEFAULTS.receiptPrefix),
    receipt_footer:
      input.receiptFooter.trim() || `Thank you for choosing ${companyName}.`,
    document_title: companyName,
    updated_at: new Date().toISOString(),
  };
  const ghanaPayload = {
    shop_phone: input.shopPhone.trim(),
    shop_address: input.shopAddress.trim(),
    tin: input.tin.trim(),
    tax_label: input.taxLabel.trim() || DEFAULTS.taxLabel,
    tax_rate: Math.min(100, Math.max(0, Number(input.taxRate) || 0)),
  };

  const { error } = await supabase
    .from("pos_settings")
    .update({ ...basePayload, ...ghanaPayload })
    .eq("id", 1);

  if (isMissingColumnError(error)) {
    // supabase/ghana-enhancements.sql hasn't been run yet — save what we can
    // rather than failing the whole settings update.
    const { error: fallbackError } = await supabase.from("pos_settings").update(basePayload).eq("id", 1);
    if (fallbackError) return { error: fallbackError.message };
    revalidatePath("/", "layout");
    return {
      error:
        "Saved, but shop phone/address/TIN/tax rate need the supabase/ghana-enhancements.sql migration to be run first.",
    };
  }
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function resetSettings() {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") return { error: "Admin only" };
  const supabase = createSupabaseAdminClient();
  const basePayload = {
    company_name: DEFAULTS.companyName,
    sidebar_copy: DEFAULTS.sidebarCopy,
    receipt_title: DEFAULTS.receiptTitle,
    receipt_prefix: DEFAULTS.receiptPrefix,
    receipt_footer: DEFAULTS.receiptFooter,
    document_title: DEFAULTS.documentTitle,
    updated_at: new Date().toISOString(),
  };
  const ghanaPayload = {
    shop_phone: DEFAULTS.shopPhone,
    shop_address: DEFAULTS.shopAddress,
    tin: DEFAULTS.tin,
    tax_label: DEFAULTS.taxLabel,
    tax_rate: DEFAULTS.taxRate,
  };

  const { error } = await supabase
    .from("pos_settings")
    .update({ ...basePayload, ...ghanaPayload })
    .eq("id", 1);

  if (isMissingColumnError(error)) {
    const { error: fallbackError } = await supabase.from("pos_settings").update(basePayload).eq("id", 1);
    if (fallbackError) return { error: fallbackError.message };
    revalidatePath("/", "layout");
    return { ok: true };
  }
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}
