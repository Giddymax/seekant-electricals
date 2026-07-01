import type { Product, PosSettings, PosUser, Sale, SaleItem } from "./types";

type DbUser = {
  id: string;
  name: string;
  username: string;
  role: string;
  locked: boolean;
};
type DbProduct = {
  id: string;
  name: string;
  generic_name: string | null;
  category: string;
  dosage_form: string | null;
  strength: string | null;
  manufacturer: string | null;
  batch_number: string | null;
  barcode: string | null;
  cost_price: string | number;
  price: string | number;
  quantity: number;
  reorder_level: number;
  image: string | null;
  created_at: string;
};
type DbSale = {
  id: string;
  receipt_number: string;
  customer_name: string;
  customer_phone: string | null;
  payment_method: string;
  served_by: string;
  subtotal: string | number;
  discount: string | number;
  total: string | number;
  amount_paid: string | number;
  balance_due: string | number;
  change_due: string | number;
  items: SaleItem[];
  created_at: string;
};
type DbSettings = {
  company_name: string;
  sidebar_copy: string;
  receipt_title: string;
  receipt_prefix: string;
  receipt_footer: string;
  document_title: string;
};

const num = (v: string | number | null | undefined) => Number(v ?? 0);

export const mapUser = (row: DbUser): PosUser => ({
  id: row.id,
  name: row.name,
  username: row.username,
  role: row.role === "admin" ? "admin" : "staff",
  locked: Boolean(row.locked),
});

export const mapProduct = (row: DbProduct): Product => ({
  id: row.id,
  name: row.name,
  genericName: row.generic_name ?? "",
  category: row.category,
  dosageForm: row.dosage_form ?? "",
  strength: row.strength ?? "",
  manufacturer: row.manufacturer ?? "",
  batchNumber: row.batch_number ?? "",
  barcode: row.barcode ?? "",
  costPrice: num(row.cost_price),
  price: num(row.price),
  quantity: row.quantity,
  reorderLevel: row.reorder_level,
  image: row.image ?? "",
  createdAt: row.created_at,
});

export const mapSale = (row: DbSale): Sale => ({
  id: row.id,
  receiptNumber: row.receipt_number,
  customerName: row.customer_name,
  customerPhone: row.customer_phone ?? "-",
  paymentMethod: row.payment_method,
  servedBy: row.served_by,
  subtotal: num(row.subtotal),
  discount: num(row.discount),
  total: num(row.total),
  amountPaid: num(row.amount_paid),
  balanceDue: num(row.balance_due),
  changeDue: num(row.change_due),
  items: Array.isArray(row.items) ? row.items : [],
  createdAt: row.created_at,
});

export const mapSettings = (row: DbSettings): PosSettings => ({
  companyName: row.company_name,
  sidebarCopy: row.sidebar_copy,
  receiptTitle: row.receipt_title,
  receiptPrefix: row.receipt_prefix,
  receiptFooter: row.receipt_footer,
  documentTitle: row.document_title,
});
