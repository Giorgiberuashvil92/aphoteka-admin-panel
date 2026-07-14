"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { categoriesApi, type AdminCategory } from "@/lib/api";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import { PlusIcon, PencilIcon, TrashBinIcon } from "@/icons";

type Crumb = { id: string; name: string };

function CategoriesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const parentId = searchParams.get("parent")?.trim() || null;

  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [crumbs, setCrumbs] = useState<Crumb[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const currentTitle = parentId
    ? crumbs[crumbs.length - 1]?.name ?? "ქვეკატეგორიები"
    : "კატეგორიები";

  const loadAncestors = useCallback(async (leafId: string): Promise<Crumb[]> => {
    const chain: Crumb[] = [];
    let currentId: string | null = leafId;
    const guard = new Set<string>();
    while (currentId && !guard.has(currentId)) {
      guard.add(currentId);
      const node = await categoriesApi.getById(currentId);
      if (!node) break;
      chain.unshift({ id: node.id, name: node.name });
      currentId = node.parentId?.trim() || null;
    }
    return chain;
  }, []);

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

      if (parentId) {
        const [list, ancestors] = await Promise.all([
          categoriesApi.getAll({
            parentId,
            ...(activeFilter !== undefined ? { active: activeFilter } : {}),
          }),
          loadAncestors(parentId),
        ]);
        setCategories(Array.isArray(list) ? list : []);
        setCrumbs(ancestors);
      } else {
        const list = await categoriesApi.getAll(
          activeFilter !== undefined
            ? { active: activeFilter, root: true }
            : { root: true },
        );
        setCategories(Array.isArray(list) ? list : []);
        setCrumbs([]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "შეცდომა ჩატვირთვისას");
      setCategories([]);
      setCrumbs([]);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, parentId, loadAncestors]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "დარწმუნებული ხართ, რომ გსურთ ამ კატეგორიის წაშლა? პროდუქტების კატეგორია არ შეიცვლება ავტომატურად.",
      )
    ) {
      return;
    }
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

  const filtered = useMemo(
    () =>
      categories.filter(
        (c) =>
          c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (c.description &&
            c.description.toLowerCase().includes(searchTerm.toLowerCase())),
      ),
    [categories, searchTerm],
  );

  const openParent = (id: string | null) => {
    if (!id) {
      router.push("/categories");
      return;
    }
    router.push(`/categories?parent=${encodeURIComponent(id)}`);
  };

  const newHref = parentId
    ? `/categories/new?parentId=${encodeURIComponent(parentId)}`
    : "/categories/new";

  return (
    <div className="space-y-6">
      <PageBreadCrumb pageTitle={currentTitle} />

      <nav className="flex flex-wrap items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
        <button
          type="button"
          onClick={() => openParent(null)}
          className={`hover:text-brand-600 ${
            !parentId ? "font-semibold text-gray-900 dark:text-white" : ""
          }`}
        >
          კატეგორიები
        </button>
        {crumbs.map((c, i) => (
          <React.Fragment key={c.id}>
            <span className="text-gray-400">›</span>
            <button
              type="button"
              onClick={() => openParent(c.id)}
              className={`hover:text-brand-600 ${
                i === crumbs.length - 1
                  ? "font-semibold text-gray-900 dark:text-white"
                  : ""
              }`}
            >
              {c.name}
            </button>
          </React.Fragment>
        ))}
      </nav>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-4 sm:flex-row">
          {parentId ? (
            <button
              type="button"
              onClick={() => {
                const parentOfCurrent =
                  crumbs.length >= 2 ? crumbs[crumbs.length - 2].id : null;
                openParent(parentOfCurrent);
              }}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              ← უკან
            </button>
          ) : null}
          <input
            type="text"
            placeholder="ძიება ამ დონეზე..."
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
          href={newHref}
          className="flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
        >
          <PlusIcon className="h-4 w-4" />
          {parentId ? "ახალი ქვეკატეგორია" : "ახალი კატეგორია"}
        </Link>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-sm text-gray-500">
          იტვირთება...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white px-6 py-12 text-center dark:border-gray-600 dark:bg-gray-800">
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
            {parentId
              ? "ამ კატეგორიაში ჯერ ქვეკატეგორიები არ არის"
              : "კატეგორიები არ მოიძებნა"}
          </p>
          <Link
            href={newHref}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
          >
            <PlusIcon className="h-4 w-4" />
            {parentId ? "დაამატე ქვეკატეგორია" : "დაამატე კატეგორია"}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((cat) => {
            const imageUrl =
              cat.imageUrl ||
              "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=400";
            return (
              <div
                key={cat.id}
                role="button"
                tabIndex={0}
                onClick={() => openParent(cat.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openParent(cat.id);
                  }
                }}
                className="group cursor-pointer overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:border-brand-400 hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
              >
                <div
                  className="relative h-28 bg-cover bg-center"
                  style={{ backgroundImage: `url(${imageUrl})` }}
                >
                  <div className="absolute inset-0 bg-black/10" />
                  <span
                    className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-xs font-medium ${
                      cat.active
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {cat.active ? "აქტიური" : "არააქტიური"}
                  </span>
                </div>
                <div className="space-y-2 p-4">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {cat.name}
                  </div>
                  {cat.description ? (
                    <p className="line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
                      {cat.description}
                    </p>
                  ) : null}
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>{cat.productCount} პროდუქტი</span>
                    <span>სორტი: {cat.sortOrder}</span>
                  </div>
                  <div
                    className="flex items-center justify-end gap-1 border-t border-gray-100 pt-2 dark:border-gray-700"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Link
                      href={`/categories/${cat.id}/edit`}
                      className="rounded p-1.5 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                      title="რედაქტირება"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(cat.id)}
                      disabled={deletingId === cat.id}
                      className="rounded p-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-gray-700 disabled:opacity-50"
                      title="წაშლა"
                    >
                      <TrashBinIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function CategoriesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[200px] items-center justify-center text-gray-500">
          იტვირთება...
        </div>
      }
    >
      <CategoriesPageContent />
    </Suspense>
  );
}
