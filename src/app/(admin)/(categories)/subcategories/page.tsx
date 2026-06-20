"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { categoriesApi, type AdminCategory } from "@/lib/api";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import { PlusIcon, PencilIcon, TrashBinIcon } from "@/icons";
import Link from "next/link";

export default function SubcategoriesPage() {
  const [roots, setRoots] = useState<AdminCategory[]>([]);
  const [subcategories, setSubcategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [parentFilter, setParentFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rootList = await categoriesApi.getRoots();
      setRoots(Array.isArray(rootList) ? rootList : []);

      const allSubs = await Promise.all(
        (Array.isArray(rootList) ? rootList : []).map((root) =>
          categoriesApi.getSubcategories(root.id),
        ),
      );
      setSubcategories(allSubs.flat());
    } catch (e) {
      setError(e instanceof Error ? e.message : "შეცდომა ჩატვირთვისას");
      setSubcategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const parentNameById = useMemo(() => {
    const map = new Map<string, string>();
    roots.forEach((r) => map.set(r.id, r.name));
    return map;
  }, [roots]);

  const filtered = subcategories.filter((sub) => {
    const matchesParent =
      parentFilter === "all" || sub.parentId === parentFilter;
    const matchesSearch =
      sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sub.parentId &&
        (parentNameById.get(sub.parentId) ?? "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()));
    return matchesParent && matchesSearch;
  });

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "დარწმუნებული ხართ, რომ გსურთ ამ საბკატეგორიის წაშლა? პროდუქტების subcategory ველი არ შეიცვლება ავტომატურად.",
      )
    )
      return;
    setDeletingId(id);
    try {
      await categoriesApi.delete(id);
      setSubcategories((prev) => prev.filter((s) => s.id !== id));
    } catch (e) {
      alert(e instanceof Error ? e.message : "წაშლა ვერ მოხერხდა");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageBreadCrumb pageTitle="საბკატეგორიების მენეჯმენტი" />

      <p className="text-sm text-gray-600 dark:text-gray-400">
        საბკატეგორიები გამოიყენება ვებსაიტსა და აპში ნავიგაციისთვის.
        პროდუქტზე <strong>Therapeutic Class</strong> (category ველი) მედიკამენტებისთვის რჩება Balance-დან.
      </p>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-4 sm:flex-row">
          <input
            type="text"
            placeholder="ძიება..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
          <select
            value={parentFilter}
            onChange={(e) => setParentFilter(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            <option value="all">ყველა მთავარი კატეგორია</option>
            {roots.map((root) => (
              <option key={root.id} value={root.id}>
                {root.name}
              </option>
            ))}
          </select>
        </div>
        <Link
          href="/subcategories/new"
          className="flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
        >
          <PlusIcon className="h-4 w-4" />
          ახალი საბკატეგორია
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
                  საბკატეგორია
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  მთავარი კატეგორია
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  პროდუქტები
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  რიგი
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
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    იტვირთება...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    საბკატეგორიები ვერ მოიძებნა. გაუშვით{" "}
                    <code className="rounded bg-gray-100 px-1">npm run seed:subcategories</code>{" "}
                    backend-ში.
                  </td>
                </tr>
              ) : (
                filtered.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {sub.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {sub.parentId ? parentNameById.get(sub.parentId) ?? "—" : "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {sub.productCount}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {sub.sortOrder}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          sub.active
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                            : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {sub.active ? "აქტიური" : "არააქტიური"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/subcategories/${sub.id}/edit`}
                          className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-brand-500 dark:hover:bg-gray-700"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(sub.id)}
                          disabled={deletingId === sub.id}
                          className="rounded p-1 text-gray-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-900/20"
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
