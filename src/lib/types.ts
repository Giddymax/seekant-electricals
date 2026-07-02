export type Role = "admin" | "staff";

export interface PosUser {
  id: string;
  name: string;
  username: string;
  role: Role;
  locked: boolean;
}

export interface PosSettings {
  companyName: string;
  sidebarCopy: string;
  receiptTitle: string;
  receiptPrefix: string;
  receiptFooter: string;
  documentTitle: string;
  shopPhone: string;
  shopAddress: string;
  tin: string;
  taxLabel: string;
  taxRate: number;
}

export interface Product {
  id: string;
  name: string;
  genericName: string;
  category: string;
  dosageForm: string;
  strength: string;
  manufacturer: string;
  batchNumber: string;
  barcode: string;
  costPrice: number;
  price: number;
  quantity: number;
  reorderLevel: number;
  image: string;
  createdAt: string;
}

export interface SaleItem {
  productId: string;
  name: string;
  genericName?: string;
  barcode?: string;
  price: number;
  costPrice: number;
  quantity: number;
  dosageForm?: string;
  strength?: string;
  batchNumber?: string;
  lineTotal: number;
  lineCostTotal: number;
  lineProfit: number;
}

export interface Sale {
  id: string;
  receiptNumber: string;
  customerName: string;
  customerPhone: string;
  paymentMethod: string;
  servedBy: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  amountPaid: number;
  balanceDue: number;
  changeDue: number;
  items: SaleItem[];
  createdAt: string;
}

export interface CartItem {
  productId: string;
  name: string;
  genericName: string;
  barcode: string;
  price: number;
  costPrice: number;
  quantity: number;
  dosageForm: string;
  strength: string;
  batchNumber: string;
}
