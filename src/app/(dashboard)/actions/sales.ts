"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/session";
import { normalizeReceiptPrefix } from "@/lib/utils";
import { mapSale } from "@/lib/mappers";
import type { CartItem, Sale } from "@/lib/types";

type CheckoutInput = {
  cart: CartItem[];
  customerName: string;
  customerPhone: string;
  paymentMethod: string;
  discount: number;
  amountPaid: number;
};

type SupabaseAdmin = ReturnType<typeof createSupabaseAdminClient>;

async function nextReceiptNumber(supabase: SupabaseAdmin, prefix: string): Promise<string> {
  const { count } = await supabase.from("pos_sales").select("*", { count: "exact", head: true });
  const next = String((count ?? 0) + 1).padStart(8, "0");
  return `${prefix}-${next}`;
}

// Optimistic-concurrency stock decrement: only commits if the quantity hasn't
// changed since we read it, so two simultaneous checkouts can't both succeed
// and drive stock negative. Retries a few times if it loses the race.
async function decrementStock(
  supabase: SupabaseAdmin,
  productId: string,
  qty: number,
  label: string,
): Promise<{ error?: string }> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: product, error: fetchError } = await supabase
      .from("pos_products")
      .select("quantity")
      .eq("id", productId)
      .single();
    if (fetchError || !product) return { error: `Product missing for ${label}` };
    const current = Number(product.quantity);
    if (current < qty) return { error: `Not enough stock for ${label}` };

    const { data: updated, error: updateError } = await supabase
      .from("pos_products")
      .update({ quantity: current - qty, updated_at: new Date().toISOString() })
      .eq("id", productId)
      .eq("quantity", current)
      .select("id");
    if (updateError) return { error: updateError.message };
    if (updated && updated.length > 0) return {};
    // Someone else updated this product between our read and write — retry.
  }
  return { error: `Stock for ${label} changed while processing this sale. Please try again.` };
}

async function restoreStock(supabase: SupabaseAdmin, productId: string, qty: number) {
  const { data: product } = await supabase
    .from("pos_products")
    .select("quantity")
    .eq("id", productId)
    .single();
  if (!product) return;
  await supabase
    .from("pos_products")
    .update({ quantity: Number(product.quantity) + qty })
    .eq("id", productId);
}

const UNIQUE_VIOLATION = "23505";
// Postgres reports missing columns as 42703; PostgREST (Supabase's API layer)
// reports its own schema-cache miss as PGRST204 — both mean the same thing
// here: the ghana-enhancements.sql migration hasn't been run yet.
const isMissingColumnError = (error: { code?: string } | null | undefined) =>
  error?.code === "42703" || error?.code === "PGRST204";

export async function checkout(input: CheckoutInput): Promise<{ error?: string; sale?: Sale }> {
  const user = await getSessionUser();
  if (!user) return { error: "Not authorized" };
  if (!input.cart.length) return { error: "Add products to the cart before checkout." };

  const supabase = createSupabaseAdminClient();
  const productIds = input.cart.map((item) => item.productId);
  const { data: dbProducts, error: fetchError } = await supabase
    .from("pos_products")
    .select("id,quantity,name,cost_price,price")
    .in("id", productIds);
  if (fetchError || !dbProducts) return { error: fetchError?.message ?? "Failed to load products" };

  for (const item of input.cart) {
    const p = dbProducts.find((entry) => entry.id === item.productId);
    if (!p) return { error: `Product missing for ${item.name}` };
    if (Number(p.quantity) < item.quantity) return { error: `Not enough stock for ${item.name}` };
  }

  const subtotal = input.cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const discount = Math.max(0, Number(input.discount) || 0);
  if (discount > subtotal) return { error: "Discount cannot be more than the cart subtotal." };
  const amountPaid = Math.max(0, Number(input.amountPaid) || 0);

  // Reserve stock first (guarded, per item) so a sale is never recorded
  // against stock we failed to actually reserve. Roll back on any failure.
  const reserved: { productId: string; quantity: number }[] = [];
  for (const item of input.cart) {
    const result = await decrementStock(supabase, item.productId, item.quantity, item.name);
    if (result.error) {
      for (const r of reserved) await restoreStock(supabase, r.productId, r.quantity);
      return { error: result.error };
    }
    reserved.push({ productId: item.productId, quantity: item.quantity });
  }

  const items = input.cart.map((item) => ({
    productId: item.productId,
    name: item.name,
    genericName: item.genericName,
    barcode: item.barcode,
    dosageForm: item.dosageForm,
    strength: item.strength,
    batchNumber: item.batchNumber,
    price: item.price,
    costPrice: item.costPrice,
    quantity: item.quantity,
    lineTotal: item.price * item.quantity,
    lineCostTotal: item.costPrice * item.quantity,
    lineProfit: (item.price - item.costPrice) * item.quantity,
  }));

  let settingsRow = await supabase
    .from("pos_settings")
    .select("receipt_prefix, tax_rate")
    .eq("id", 1)
    .single();
  if (isMissingColumnError(settingsRow.error)) {
    // supabase/ghana-enhancements.sql hasn't been run yet — tax defaults to off.
    settingsRow = (await supabase
      .from("pos_settings")
      .select("receipt_prefix")
      .eq("id", 1)
      .single()) as typeof settingsRow;
  }
  const prefix = normalizeReceiptPrefix(settingsRow.data?.receipt_prefix ?? "SEL");
  const taxRate = Math.max(0, Number(settingsRow.data?.tax_rate) || 0);
  const taxableAmount = Math.max(0, subtotal - discount);
  const tax = Math.round(taxableAmount * (taxRate / 100) * 100) / 100;
  const total = taxableAmount + tax;

  const salePayload = {
    customer_name: input.customerName.trim() || "Walk-in Customer",
    customer_phone: input.customerPhone.trim() || "-",
    payment_method: input.paymentMethod,
    served_by: user.name,
    subtotal,
    discount,
    total,
    amount_paid: amountPaid,
    balance_due: Math.max(0, total - amountPaid),
    change_due: Math.max(0, amountPaid - total),
    items,
  };

  let inserted = null;
  let insertError: { code?: string; message: string } | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    const receiptNumber = await nextReceiptNumber(supabase, prefix);
    let result = await supabase
      .from("pos_sales")
      .insert({ receipt_number: receiptNumber, tax, ...salePayload })
      .select("*")
      .single();
    if (isMissingColumnError(result.error)) {
      // supabase/ghana-enhancements.sql hasn't been run yet — save without the tax column.
      result = await supabase
        .from("pos_sales")
        .insert({ receipt_number: receiptNumber, ...salePayload })
        .select("*")
        .single();
    }
    if (!result.error) {
      inserted = result.data;
      insertError = null;
      break;
    }
    insertError = result.error;
    if (result.error.code !== UNIQUE_VIOLATION) break;
    // Receipt number collided with a concurrent sale — retry with a fresh number.
  }

  if (!inserted) {
    for (const r of reserved) await restoreStock(supabase, r.productId, r.quantity);
    return { error: insertError?.message ?? "Failed to save sale" };
  }

  revalidatePath("/", "layout");
  return { sale: mapSale(inserted) };
}

export async function recordPartPayment(saleId: string, amount: number) {
  const user = await getSessionUser();
  if (!user) return { error: "Not authorized" };
  const supabase = createSupabaseAdminClient();
  const { data: sale, error } = await supabase.from("pos_sales").select("*").eq("id", saleId).single();
  if (error || !sale) return { error: "Sale not found" };
  const newPaid = Number(sale.amount_paid) + Math.max(0, amount);
  const balance = Math.max(0, Number(sale.total) - newPaid);
  const change = Math.max(0, newPaid - Number(sale.total));
  const { error: updateError } = await supabase
    .from("pos_sales")
    .update({ amount_paid: newPaid, balance_due: balance, change_due: change })
    .eq("id", saleId);
  if (updateError) return { error: updateError.message };
  await supabase.from("pos_part_payments").insert({ sale_id: saleId, amount });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteSale(saleId: string) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") return { error: "Admin only" };
  const supabase = createSupabaseAdminClient();
  const { data: sale } = await supabase.from("pos_sales").select("*").eq("id", saleId).single();
  if (!sale) return { error: "Sale not found" };
  const items = (sale.items as CheckoutInput["cart"]) || [];
  for (const item of items) {
    const { data: product } = await supabase
      .from("pos_products")
      .select("quantity")
      .eq("id", item.productId)
      .single();
    if (product) {
      await supabase
        .from("pos_products")
        .update({ quantity: Number(product.quantity) + item.quantity })
        .eq("id", item.productId);
    }
  }
  await supabase.from("pos_sales").delete().eq("id", saleId);
  revalidatePath("/", "layout");
  return { ok: true };
}
