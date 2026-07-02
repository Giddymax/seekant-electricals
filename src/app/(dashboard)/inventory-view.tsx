"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import type { Product, Role } from "@/lib/types";
import { saveProduct, deleteProduct } from "./actions/products";

type DraftProduct = {
  id?: string;
  name: string;
  genericName: string;
  category: string;
  dosageForm: string;
  strength: string;
  manufacturer: string;
  costPrice: string;
  price: string;
  quantity: string;
  reorderLevel: string;
  image: string;
};

const empty: DraftProduct = {
  name: "",
  genericName: "",
  category: "",
  dosageForm: "",
  strength: "",
  manufacturer: "",
  costPrice: "",
  price: "",
  quantity: "",
  reorderLevel: "10",
  image: "",
};

export function InventoryView({ products, role }: { products: Product[]; role: Role }) {
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState<DraftProduct>(empty);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const categories = useMemo(
    () =>
      Array.from(new Set(products.map((p) => p.category).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [products],
  );

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    if (!term) return products;
    return products.filter((p) =>
      [p.name, p.genericName, p.category, p.strength, p.dosageForm, p.manufacturer]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [products, search]);

  const set = <K extends keyof DraftProduct>(k: K, v: DraftProduct[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const handleImage = (file: File | null) => {
    if (!file) return set("image", "");
    const reader = new FileReader();
    reader.onload = () => set("image", String(reader.result ?? ""));
    reader.readAsDataURL(file);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const res = await saveProduct({
        id: draft.id,
        name: draft.name,
        genericName: draft.genericName,
        category: draft.category,
        dosageForm: draft.dosageForm,
        strength: draft.strength,
        manufacturer: draft.manufacturer,
        costPrice: Number(draft.costPrice) || 0,
        price: Number(draft.price) || 0,
        quantity: Number(draft.quantity) || 0,
        reorderLevel: Number(draft.reorderLevel) || 10,
        image: draft.image,
      });
      if ("error" in res && res.error) {
        setMessage(res.error);
        return;
      }
      setDraft({ ...empty, category: draft.category });
      setMessage("Saved.");
    });
  };

  const edit = (product: Product) => {
    setDraft({
      id: product.id,
      name: product.name,
      genericName: product.genericName,
      category: product.category,
      dosageForm: product.dosageForm,
      strength: product.strength,
      manufacturer: product.manufacturer,
      costPrice: String(product.costPrice),
      price: String(product.price),
      quantity: String(product.quantity),
      reorderLevel: String(product.reorderLevel),
      image: product.image,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = (product: Product) => {
    if (!window.confirm(`Delete ${product.name}?`)) return;
    startTransition(async () => {
      await deleteProduct(product.id);
    });
  };

  return (
    <section>
      <div className="section-header">
        <div>
          <p className="eyebrow">Inventory</p>
          <h3 style={{ margin: 0, fontFamily: "var(--font-brand)", fontSize: "1.35rem" }}>
            Electrical supplies grouped by category
          </h3>
        </div>
      </div>
      <div className={`layout-grid${role !== "admin" ? " catalog-only" : ""}`}>
        {role === "admin" ? (
          <form onSubmit={submit} className="card form-card" style={{ display: "grid", gap: 16 }}>
            <h4>{draft.id ? "Update Product" : "Add or Update Product"}</h4>
            <label>
              Product Name
              <Input
                required
                value={draft.name}
                onChange={(e) => set("name", e.target.value)}
              />
            </label>
            <label>
              Description / Use
              <Input
                value={draft.genericName}
                onChange={(e) => set("genericName", e.target.value)}
                placeholder="Socket circuit cable, LED fitting..."
              />
            </label>
            <label>
              Category
              <Input
                required
                list="productCategoryList"
                value={draft.category}
                onChange={(e) => set("category", e.target.value)}
                placeholder="Cables & Wires, Lighting, Switches & Sockets"
              />
              <datalist id="productCategoryList">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </label>
            <label>
              Brand / Manufacturer
              <Input
                value={draft.manufacturer}
                onChange={(e) => set("manufacturer", e.target.value)}
                placeholder="Schneider, CBI, Philips, Luxman..."
              />
            </label>
            <div className="two-column">
              <label>
                Unit Type
                <Input
                  value={draft.dosageForm}
                  onChange={(e) => set("dosageForm", e.target.value)}
                  placeholder="Piece, roll, pack, length"
                />
              </label>
              <label>
                Rating / Size
                <Input
                  value={draft.strength}
                  onChange={(e) => set("strength", e.target.value)}
                  placeholder="13A, 2.5mm, 9W, 20mm"
                />
              </label>
            </div>
            <div className="two-column">
              <label>
                Cost Price
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={draft.costPrice}
                  onChange={(e) => set("costPrice", e.target.value)}
                />
              </label>
              <label>
                Selling Price
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={draft.price}
                  onChange={(e) => set("price", e.target.value)}
                />
              </label>
            </div>
            <div className="two-column">
              <label>
                Quantity
                <Input
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={draft.quantity}
                  onChange={(e) => set("quantity", e.target.value)}
                />
              </label>
              <label>
                Reorder Level
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={draft.reorderLevel}
                  onChange={(e) => set("reorderLevel", e.target.value)}
                />
              </label>
            </div>
            <label>
              Product Image
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImage(e.target.files?.[0] ?? null)}
              />
            </label>
            <div className={`image-preview${draft.image ? "" : " empty"}`}>
              {draft.image ? (
                <img src={draft.image} alt="Preview" />
              ) : (
                <span className="muted">No image selected</span>
              )}
            </div>
            <div className="button-row">
              <Button type="submit" disabled={pending}>
                {pending ? "Saving..." : "Save Product"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setDraft(empty)}>
                Clear
              </Button>
            </div>
            {message && <p className="message">{message}</p>}
            <p className="message">
              Track product names, categories, unit types, sizes, prices and stock levels.
            </p>
          </form>
        ) : null}

        <div className="card">
          <div className="list-header">
            <h4 style={{ margin: 0 }}>Electrical Catalog</h4>
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by product, description or category"
            />
          </div>
          <div className="inventory-list">
            {filtered.length === 0 ? (
              <div className="empty-state">No matching products found.</div>
            ) : (
              filtered.map((product) => {
                const isLow = product.quantity <= product.reorderLevel;
                return (
                  <article className="product-card" key={product.id}>
                    <ImageOrPlaceholder src={product.image} className="product-thumb" />
                    <div className="product-meta">
                      <div className="sales-row-head">
                        <h5>{product.name}</h5>
                        <Badge variant={isLow ? "low" : "default"}>
                          {isLow ? "Low stock" : "In stock"}
                        </Badge>
                      </div>
                      <p className="catalog-submeta">
                        {product.genericName || "Description not set"} ·{" "}
                        {product.category || "Uncategorized"}
                      </p>
                      {product.manufacturer ? (
                        <p className="catalog-submeta">Brand: {product.manufacturer}</p>
                      ) : null}
                      <p>
                        {product.dosageForm || ""} {product.strength ? `· ${product.strength}` : ""}
                      </p>
                      <p>
                        Selling Price: <strong>{formatCurrency(product.price)}</strong>
                      </p>
                      <p>Cost Price: {formatCurrency(product.costPrice)}</p>
                      <p>
                        Quantity: <strong>{product.quantity}</strong> | Reorder:{" "}
                        {product.reorderLevel}
                      </p>
                      <div className="product-actions">
                        {role === "admin" ? (
                          <>
                            <Button variant="mini" onClick={() => edit(product)}>
                              Edit
                            </Button>
                            <Button variant="mini" onClick={() => remove(product)}>
                              Delete
                            </Button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function ImageOrPlaceholder({ src, className }: { src?: string; className: string }) {
  if (!src) return <div className={className} />;
  if (src.startsWith("data:") || src.startsWith("blob:")) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" className={className} />;
  }
  return (
    <Image
      src={src}
      alt=""
      width={200}
      height={200}
      className={className}
      style={{ objectFit: "cover" }}
    />
  );
}
