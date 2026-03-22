"use client";

import React, { useState, useEffect } from "react";
import { productsApi } from "@/lib/api";
import { Product } from "@/types";
import type { CreatePromotionPayload } from "@/lib/api/promotions";

interface PromotionFormProps {
  initial?: Partial<CreatePromotionPayload> & { id?: string };
  onSubmit: (payload: CreatePromotionPayload) => Promise<void>;
  submitLabel: string;
}

const DEFAULT_BG = "#F5F5FF";

export default function PromotionForm({
  initial,
  onSubmit,
  submitLabel,
}: PromotionFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [backgroundColor, setBackgroundColor] = useState(
    initial?.backgroundColor ?? DEFAULT_BG
  );
  const [logoUrl, setLogoUrl] = useState(initial?.logoUrl ?? "");
  const [discountPercent, setDiscountPercent] = useState(
    initial?.discountPercent ?? 0
  );
  const [startDate, setStartDate] = useState(
    initial?.startDate
      ? new Date(initial.startDate).toISOString().slice(0, 16)
      : ""
  );
  const [endDate, setEndDate] = useState(
    initial?.endDate
      ? new Date(initial.endDate).toISOString().slice(0, 16)
      : ""
  );
  const [active, setActive] = useState(initial?.active ?? true);
  const [order, setOrder] = useState(initial?.order ?? 0);
  const [productIds, setProductIds] = useState<string[]>(
    initial?.productIds ?? []
  );
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoadingProducts(true);
    productsApi
      .getAll({ active: true, limit: 500 })
      .then((res) => {
        if (!cancelled) setProducts(res.data ?? []);
      })
      .finally(() => {
        if (!cancelled) setLoadingProducts(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleProduct = (id: string) => {
    setProductIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit({
        name,
        description: description || undefined,
        backgroundColor: backgroundColor || DEFAULT_BG,
        logoUrl: logoUrl || undefined,
        productIds: productIds.length ? productIds : undefined,
        discountPercent: Number(discountPercent),
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
        active,
        order: Number(order),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          ძირითადი ინფორმაცია
        </h2>
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              სახელი *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              აღწერა
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                ფონის ფერი (მობილური ბარათი)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded border border-gray-300"
                />
                <input
                  type="text"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                ლოგოს URL
              </label>
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                ფასდაკლების % *
              </label>
              <input
                type="number"
                min={0}
                max={100}
                required
                value={discountPercent}
                onChange={(e) => setDiscountPercent(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                სორტირების რიგი
              </label>
              <input
                type="number"
                min={0}
                value={order}
                onChange={(e) => setOrder(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                დაწყების თარიღი
              </label>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                დასრულების თარიღი
              </label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="active"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            <label htmlFor="active" className="text-sm text-gray-700 dark:text-gray-300">
              აქტიური (ჩანს მობილურ აპში)
            </label>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          პროდუქტები აქციაში
        </h2>
        {loadingProducts ? (
          <p className="text-sm text-gray-500">იტვირთება პროდუქტები...</p>
        ) : products.length === 0 ? (
          <p className="text-sm text-gray-500">პროდუქტები არ მოიძებნა.</p>
        ) : (
          <div className="max-h-64 overflow-y-auto rounded border border-gray-200 dark:border-gray-600">
            <ul className="divide-y divide-gray-200 dark:divide-gray-600">
              {products.map((p) => (
                <li key={p.id} className="flex items-center gap-3 px-3 py-2">
                  <input
                    type="checkbox"
                    id={`prod-${p.id}`}
                    checked={productIds.includes(p.id)}
                    onChange={() => toggleProduct(p.id)}
                    className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  />
                  <label
                    htmlFor={`prod-${p.id}`}
                    className="flex-1 cursor-pointer text-sm text-gray-900 dark:text-white"
                  >
                    {p.name}
                    {p.sku && (
                      <span className="ml-2 text-gray-500">({p.sku})</span>
                    )}
                  </label>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    ₾{typeof p.price === "number" ? p.price.toFixed(2) : p.price}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {productIds.length > 0 && (
          <p className="mt-2 text-sm text-gray-500">
            არჩეულია {productIds.length} პროდუქტი
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
        >
          {saving ? "იგზავნება..." : submitLabel}
        </button>
        <a
          href="/promotions"
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          გაუქმება
        </a>
      </div>
    </form>
  );
}
