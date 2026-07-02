"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/format";
import { buildReceiptHtml } from "@/lib/receipt";
import type { CartItem, PosSettings, Product } from "@/lib/types";
import { checkout } from "../actions/sales";

export function SalesView({ products, settings }: { products: Product[]; settings: PosSettings }) {
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [discount, setDiscount] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    if (!term) return products;
    return products.filter((p) =>
      [p.name, p.genericName, p.category, p.strength, p.dosageForm]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [products, search]);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = Math.max(0, Number(discount) || 0);
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxRate = Math.max(0, Number(settings.taxRate) || 0);
  const taxAmount = Math.round(taxableAmount * (taxRate / 100) * 100) / 100;
  const total = taxableAmount + taxAmount;
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const addToCart = (product: Product) => {
    if (product.quantity < 1) return;
    setCart((current) => {
      const existing = current.find((i) => i.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.quantity) {
          alert("Cannot add more than available stock.");
          return current;
        }
        return current.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [
        ...current,
        {
          productId: product.id,
          name: product.name,
          genericName: product.genericName,
          barcode: product.barcode,
          price: product.price,
          costPrice: product.costPrice,
          quantity: 1,
          dosageForm: product.dosageForm,
          strength: product.strength,
          batchNumber: product.batchNumber,
        },
      ];
    });
  };

  const changeQty = (productId: string, delta: number) => {
    setCart((current) =>
      current
        .map((item) => {
          if (item.productId !== productId) return item;
          const product = products.find((p) => p.id === productId);
          const next = item.quantity + delta;
          if (product && next > product.quantity) {
            alert("Stock limit reached for this product.");
            return item;
          }
          return { ...item, quantity: next };
        })
        .filter((item) => item.quantity > 0),
    );
  };

  const remove = (productId: string) =>
    setCart((current) => current.filter((i) => i.productId !== productId));

  const clearCart = () => {
    setCart([]);
    setCustomerName("");
    setCustomerPhone("");
    setPaymentMethod("cash");
    setDiscount("");
    setAmountPaid("");
    setMessage(null);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const res = await checkout({
        cart,
        customerName,
        customerPhone,
        paymentMethod,
        discount: discountAmount,
        amountPaid: Number(amountPaid) || 0,
      });
      if (res.error) {
        setMessage(res.error);
        return;
      }
      if (res.sale) {
        const html = buildReceiptHtml(res.sale, settings);
        const w = window.open("", "_blank", "width=900,height=700");
        if (!w) {
          alert("Please allow popups to print the receipt.");
        } else {
          w.document.open();
          w.document.write(html);
          w.document.close();
        }
      }
      clearCart();
    });
  };

  return (
    <section>
      <div className="section-header">
        <div>
          <p className="eyebrow">Point of Sale</p>
          <h3 style={{ margin: 0, fontFamily: "var(--font-brand)", fontSize: "1.35rem" }}>
            Sell cables, fittings, lighting and electrical accessories
          </h3>
        </div>
      </div>
      <div className="layout-grid sales-layout">
        <div className="card">
          <div className="list-header">
            <h4 style={{ margin: 0 }}>Available Stock</h4>
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by product, description or category"
            />
          </div>
          <div className="sales-products">
            {filtered.length === 0 ? (
              <div className="empty-state">No products available for sale.</div>
            ) : (
              filtered.map((product) => (
                <article className="sales-product-card" key={product.id}>
                  <div className="sales-thumb" style={product.image ? { backgroundImage: `url(${product.image})`, backgroundSize: "cover" } : undefined} />
                  <div>
                    <h5>{product.name}</h5>
                    <p className="muted">
                      {product.genericName || "Description not set"} · {product.dosageForm}{" "}
                      {product.strength}
                    </p>
                    <p>
                      <strong>{formatCurrency(product.price)}</strong> · {product.quantity} left
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={() => addToCart(product)}
                    disabled={product.quantity < 1}
                  >
                    {product.quantity < 1 ? "Out" : "Add"}
                  </Button>
                </article>
              ))
            )}
          </div>
        </div>

        <div className="card cart-card" style={{ display: "grid", gap: 16 }}>
          <h4 style={{ margin: 0 }}>Current Sales Cart</h4>
          <div className="cart-items">
            {cart.length === 0 ? (
              <div className="empty-state">No items in the sales cart yet.</div>
            ) : (
              cart.map((item) => (
                <article className="cart-item" key={item.productId}>
                  <div>
                    <strong>{item.name}</strong>
                    <p className="muted">
                      {item.genericName || "Description not set"} · {item.strength}
                    </p>
                    <p>
                      {formatCurrency(item.price)} x {item.quantity}
                    </p>
                  </div>
                  <div className="product-actions">
                    <Button variant="mini" onClick={() => changeQty(item.productId, -1)}>
                      -
                    </Button>
                    <Button variant="mini" onClick={() => changeQty(item.productId, 1)}>
                      +
                    </Button>
                    <Button variant="mini" onClick={() => remove(item.productId)}>
                      Remove
                    </Button>
                  </div>
                </article>
              ))
            )}
          </div>
          <div className="totals">
            <div>
              <span>Items</span>
              <strong>{itemCount}</strong>
            </div>
            <div>
              <span>Subtotal</span>
              <strong>{formatCurrency(subtotal)}</strong>
            </div>
            {taxAmount > 0 ? (
              <div>
                <span>
                  {settings.taxLabel || "Tax"} ({taxRate}%)
                </span>
                <strong>{formatCurrency(taxAmount)}</strong>
              </div>
            ) : null}
            <div>
              <span>Total</span>
              <strong>{formatCurrency(total)}</strong>
            </div>
          </div>
          <form onSubmit={submit} style={{ display: "grid", gap: 16 }}>
            <label>
              Customer Name
              <Input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Walk-in customer"
              />
            </label>
            <label>
              Customer Phone
              <Input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="024 000 0000"
              />
            </label>
            <label>
              Payment Method
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="cash">Cash</option>
                <option value="momo-mtn">Mobile Money (MTN)</option>
                <option value="momo-telecel">Mobile Money (Telecel Cash)</option>
                <option value="momo-airteltigo">Mobile Money (AirtelTigo)</option>
                <option value="card">Card</option>
                <option value="bank-transfer">Bank Transfer</option>
              </select>
            </label>
            <label>
              Discount
              <Input
                type="number"
                min="0"
                step="0.01"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                placeholder="0.00"
              />
            </label>
            <label>
              Amount Paid
              <Input
                type="number"
                min="0"
                step="0.01"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                placeholder="0.00"
              />
            </label>
            <p
              className={`message checkout-message${message ? " is-error" : ""}`}
              aria-live="polite"
            >
              {message}
            </p>
            <Button type="submit" disabled={pending}>
              {pending ? "Processing..." : "Complete Sale & Print Receipt"}
            </Button>
            <Button type="button" variant="ghost" onClick={clearCart}>
              Clear Cart
            </Button>
          </form>
          <p className="card-note">
            Discounts reduce the receipt total. If the customer pays less than the total, the
            balance is saved as a part payment.
          </p>
        </div>
      </div>
    </section>
  );
}
