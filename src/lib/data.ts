import { createSupabaseAdminClient } from "./supabase/server";
import { mapProduct, mapSale, mapSettings, mapUser } from "./mappers";
import type { PosSettings, Product, Sale, PosUser } from "./types";

export async function loadSettings(): Promise<PosSettings> {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase.from("pos_settings").select("*").eq("id", 1).single();
  if (!data) {
    return {
      companyName: "Seekant Electricals",
      sidebarCopy: "Electrical supplies, lighting, wiring and appliance retail management",
      receiptTitle: "Electrical Sales Receipt",
      receiptPrefix: "SEL",
      receiptFooter: "Thank you for choosing Seekant Electricals.",
      documentTitle: "Seekant Electricals",
    };
  }
  return mapSettings(data);
}

export async function loadProducts(): Promise<Product[]> {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("pos_products")
    .select("*")
    .order("created_at", { ascending: false });
  return (data ?? []).map(mapProduct);
}

export async function loadSales(): Promise<Sale[]> {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("pos_sales")
    .select("*")
    .order("created_at", { ascending: false });
  return (data ?? []).map(mapSale);
}

export async function loadUsers(): Promise<PosUser[]> {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("pos_users")
    .select("id,name,username,role,locked")
    .order("created_at", { ascending: true });
  return (data ?? []).map(mapUser);
}

export function getSaleBalanceDue(sale: Sale) {
  return Math.max(0, sale.total - sale.amountPaid);
}

export function getSaleProfit(sale: Sale) {
  return sale.items.reduce((sum, item) => sum + (item.lineProfit ?? 0), 0);
}

export function getSaleSubtotal(sale: Sale) {
  const explicit = sale.subtotal;
  if (explicit > 0) return explicit;
  return sale.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function getPaymentStatusLabel(sale: Sale) {
  const bal = getSaleBalanceDue(sale);
  if (bal <= 0) return "Fully paid";
  if (sale.amountPaid > 0) return "Part payment";
  return "Payment pending";
}
