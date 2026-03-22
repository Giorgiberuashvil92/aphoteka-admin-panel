"use client";

import React, { useCallback, useEffect, useState } from "react";
import { categoriesApi, type AdminCategory } from "@/lib/api";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import { PlusIcon, PencilIcon, TrashBinIcon } from "@/icons";
import Link from "next/link";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const activeFilter =
        filterStatus === "active"
          ? true
          : filterStatus === "inactive"
          ? false
          : undefined;
      const list = await categoriesApi.getAll(
        activeFilter !== undefined ? { active: activeFilter } : undefined
      );
      setCategories(Array.isArray(list) ? list : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "შეცდომა ჩატვირთვისას");
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "დარწმუნებული ხართ, რომ გსურთ ამ კატეგორიის წაშლა? პროდუქტების კატეგორია არ შეიცვლება ავტომატურად."
      )
    )
      return;
    setDeletingId(id);
    try {
      await categoriesApi.delete(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      alert(e instanceof Error ? e.message : "წაშლა ვერ მოხერხდა");
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.description &&
        c.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <PageBreadCrumb pageTitle="კატეგორიების მენეჯმენტი" />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-4 sm:flex-row">
          <input
            type="text"
            placeholder="ძიება კატეგორიებში..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            <option value="all">ყველა</option>
            <option value="active">აქტიური</option>
            <option value="inactive">არააქტიური</option>
          </select>
        </div>
        <Link
          href="/categories/new"
          className="flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
        >
          <PlusIcon className="h-4 w-4" />
          ახალი კატეგორია
        </Link>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  კატეგორია
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  აღწერა
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  პროდუქტები
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  სორტირება
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  სტატუსი
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  მოქმედებები
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-sm text-gray-500"
                  >
                    იტვირთება...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-sm text-gray-500"
                  >
                    კატეგორიები არ მოიძებნა
                  </td>
                </tr>
              ) : (
                filtered.map((cat) => (
                  <tr
                    key={cat.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {cat.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {cat.description || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {cat.productCount} პროდუქტი
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {cat.sortOrder}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          cat.active
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                        }`}
                      >
                        {cat.active ? "აქტიური" : "არააქტიური"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/categories/${cat.id}/edit`}
                          className="rounded p-1 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                          title="რედაქტირება"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(cat.id)}
                          disabled={deletingId === cat.id}
                          className="rounded p-1 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-gray-700 disabled:opacity-50"
                          title="წაშლა"
                        >
                          <TrashBinIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
