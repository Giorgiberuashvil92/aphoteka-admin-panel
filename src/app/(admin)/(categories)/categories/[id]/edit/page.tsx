"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import { categoriesApi, type AdminCategory } from "@/lib/api";

export default function EditCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [category, setCategory] = useState<AdminCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#E8F5E9");
  const [icon, setIcon] = useState("folder");
  const [sortOrder, setSortOrder] = useState(0);
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    categoriesApi
      .getById(id)
      .then((data) => {
        if (data) {
          setCategory(data);
          setName(data.name);
          setDescription(data.description ?? "");
          setColor(data.color ?? "#E8F5E9");
          setIcon(data.icon ?? "folder");
          setSortOrder(data.sortOrder ?? 0);
          setActive(data.active ?? true);
        }
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "ჩატვირთვა ვერ მოხერხდა");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    try {
      await categoriesApi.update(id, {
        name,
        description: description || undefined,
        color: color || undefined,
        icon: icon || undefined,
        sortOrder,
        active,
      });
      alert("კატეგორია განახლდა!");
      router.push("/categories");
    } catch (err) {
      alert(err instanceof Error ? err.message : "შეცდომა");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageBreadCrumb pageTitle="კატეგორიის რედაქტირება" />
        <p className="text-gray-500">იტვირთება...</p>
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="space-y-6">
        <PageBreadCrumb pageTitle="კატეგორიის რედაქტირება" />
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
          {error || "კატეგორია არ მოიძებნა"}
        </div>
        <a
          href="/categories"
          className="inline-block rounded-lg bg-brand-500 px-4 py-2 text-sm text-white hover:bg-brand-600"
        >
          დაბრუნება
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageBreadCrumb pageTitle="კატეგორიის რედაქტირება" />
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
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
                  ფერი
                </label>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-10 w-full rounded border border-gray-300"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  ხატულა
                </label>
                <input
                  type="text"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  სორტირების რიგი
                </label>
                <input
                  type="number"
                  min={0}
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
                  className="w-24 rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="flex items-center gap-2 pt-8">
                <input
                  type="checkbox"
                  id="active"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
                <label htmlFor="active" className="text-sm text-gray-700 dark:text-gray-300">
                  აქტიური
                </label>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              პროდუქტები ამ კატეგორიაში: {category.productCount}. პროდუქტის კატეგორიის შესაცვლელად
              რედაქტირება → პროდუქტები → პროდუქტის რედაქტირება → კატეგორია.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
          >
            {saving ? "იგზავნება..." : "ცვლილებების შენახვა"}
          </button>
          <a
            href="/categories"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            გაუქმება
          </a>
        </div>
      </form>
    </div>
  );
}
