"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/session";
import { generateBarcode, makeInventorySku } from "@/lib/utils";

type ProductInput = {
  id?: string;
  name: string;
  genericName: string;
  category: string;
  dosageForm: string;
  strength: string;
  costPrice: number;
  price: number;
  quantity: number;
  reorderLevel: number;
  image?: string;
};

export async function saveProduct(input: ProductInput) {
  const user = await getSessionUser();
  if (!user) return { error: "Not authorized" };

  const supabase = createSupabaseAdminClient();
  const payload = {
    name: input.name.trim(),
    generic_name: input.genericName.trim(),
    category: input.category.trim(),
    dosage_form: input.dosageForm.trim(),
    strength: input.strength.trim(),
    cost_price: Number(input.costPrice) || 0,
    price: Number(input.price) || 0,
    quantity: Number(input.quantity) || 0,
    reorder_level: Number(input.reorderLevel) || 10,
    image: input.image ?? "",
    updated_at: new Date().toISOString(),
  };
  if (!payload.name || !payload.category) {
    return { error: "Product name and category are required." };
  }

  if (input.id) {
    const { error } = await supabase.from("pos_products").update(payload).eq("id", input.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("pos_products").insert({
      ...payload,
      batch_number: makeInventorySku(payload.name),
      barcode: generateBarcode(),
    });
    if (error) return { error: error.message };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteProduct(id: string) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") return { error: "Admin only" };
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("pos_products").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}
