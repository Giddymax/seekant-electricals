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

async function nextReceiptNumber(): Promise<string> {
  const supabase = createSupabaseAdminClient();
  const [{ data: settings }, { count }] = await Promise.all([
    supabase.from("pos_settings").select("receipt_prefix").eq("id", 1).single(),
    supabase.from("pos_sales").select("*", { count: "exact", head: true }),
  ]);
  const prefix = normalizeReceiptPrefix(settings?.receipt_prefix ?? "SEL");
  const next = String((count ?? 0) + 1).padStart(8, "0");
  return `${prefix}-${next}`;
}

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
  const total = Math.max(0, subtotal - discount);
  const amountPaid = Math.max(0, Number(input.amountPaid) || 0);

  const receiptNumber = await nextReceiptNumber();
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

  const { data: inserted, error: insertError } = await supabase
    .from("pos_sales")
    .insert({
      receipt_number: receiptNumber,
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
    })
    .select("*")
    .single();

  if (insertError || !inserted) return { error: insertError?.message ?? "Failed to save sale" };

  for (const item of input.cart) {
    const p = dbProducts.find((entry) => entry.id === item.productId)!;
    await supabase
      .from("pos_products")
      .update({ quantity: Number(p.quantity) - item.quantity, updated_at: new Date().toISOString() })
      .eq("id", item.productId);
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
