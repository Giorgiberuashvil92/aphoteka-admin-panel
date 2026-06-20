"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Category, Subcategory } from "@/types/category";
import { fetchSubcategories } from "@/lib/api/categories";
import { CategoryIcon } from "./CategoryIcon";

interface CategoriesPanelProps {
  categories: Category[];
  initialActiveId?: string | null;
  onClose: () => void;
}

function splitIntoColumns<T>(items: T[], columnCount: number): T[][] {
  if (items.length === 0) return Array.from({ length: columnCount }, () => []);
  const chunkSize = Math.ceil(items.length / columnCount);
  return Array.from({ length: columnCount }, (_, i) =>
    items.slice(i * chunkSize, (i + 1) * chunkSize),
  );
}

export function CategoriesPanel({
  categories,
  initialActiveId,
  onClose,
}: CategoriesPanelProps) {
  const defaultActiveId =
    initialActiveId && categories.some((c) => c.id === initialActiveId)
      ? initialActiveId
      : (categories[0]?.id ?? null);

  const [activeId, setActiveId] = useState<string | null>(defaultActiveId);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(false);

  const activeCategory = useMemo(
    () => categories.find((c) => c.id === activeId) ?? null,
    [categories, activeId],
  );

  const loadSubcategories = useCallback(async (categoryId: string) => {
    setLoading(true);
    const data = await fetchSubcategories(categoryId);
    setSubcategories(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!activeId) {
      setSubcategories([]);
      return;
    }
    void loadSubcategories(activeId);
  }, [activeId, loadSubcategories]);

  const columns = useMemo(
    () => splitIntoColumns(subcategories, 3),
    [subcategories],
  );

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 top-[var(--header-height,120px)] z-40 bg-black/5"
        aria-label="დახურვა"
        onClick={onClose}
      />

      <div className="absolute left-0 right-0 top-full z-50 bg-white shadow-xl">
        <div className="h-[3px] bg-gradient-to-r from-[#f0b429] via-[#d10074] to-[#7c3aed]" />

        <div className="flex w-full border-t border-norix-border">
          {/* Left: main categories */}
          <nav
            className="max-h-[min(75vh,680px)] w-[300px] shrink-0 overflow-y-auto border-r border-norix-border py-1 md:w-[340px]"
            aria-label="კატეგორიები"
          >
            {categories.length === 0 ? (
              <p className="px-5 py-4 text-lg text-norix-gray-400">
                კატეგორიები ვერ ჩაიტვირთა
              </p>
            ) : (
              categories.map((category) => {
                const isActive = category.id === activeId;
                return (
                  <button
                    key={category.id}
                    type="button"
                    onMouseEnter={() => setActiveId(category.id)}
                    onFocus={() => setActiveId(category.id)}
                    onClick={() => setActiveId(category.id)}
                    className={`flex w-full items-center gap-3 px-5 py-3.5 text-left text-[17px] font-medium leading-snug transition-colors md:gap-4 md:py-4 md:text-lg ${
                      isActive
                        ? "bg-[#eef3fb] text-norix-blue"
                        : "text-foreground hover:bg-norix-gray-100"
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center md:h-9 md:w-9 ${
                        isActive ? "text-norix-blue" : "text-norix-gray-600"
                      }`}
                    >
                      <CategoryIcon
                        icon={category.icon}
                        className="h-6 w-6 md:h-7 md:w-7"
                      />
                    </span>
                    <span className="flex-1">{category.name}</span>
                  </button>
                );
              })
            )}
          </nav>

          {/* Right: subcategories mega-menu */}
          <div className="max-h-[min(75vh,680px)] flex-1 overflow-y-auto px-8 py-6 md:px-10 md:py-8">
            {!activeCategory ? (
              <p className="text-lg text-norix-gray-400">
                აირჩიეთ კატეგორია
              </p>
            ) : loading ? (
              <p className="text-lg text-norix-gray-400">იტვირთება...</p>
            ) : subcategories.length === 0 ? (
              <div>
                <Link
                  href={`/category/${activeCategory.id}`}
                  onClick={onClose}
                  className="text-xl font-bold uppercase tracking-wide text-norix-blue hover:underline md:text-2xl"
                >
                  {activeCategory.name}
                </Link>
                <p className="mt-4 text-[17px] text-norix-gray-400 md:text-lg">
                  ქვეკატეგორიები ჯერ არ არის.{" "}
                  <Link
                    href={`/category/${activeCategory.id}`}
                    onClick={onClose}
                    className="font-medium text-norix-blue hover:underline"
                  >
                    ყველა პროდუქტის ნახვა →
                  </Link>
                </p>
              </div>
            ) : (
              <>
                <Link
                  href={`/category/${activeCategory.id}`}
                  onClick={onClose}
                  className="mb-6 inline-block text-xl font-bold uppercase tracking-wide text-norix-blue hover:underline md:text-2xl"
                >
                  {activeCategory.name}
                </Link>

                <div className="grid grid-cols-1 gap-x-12 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
                  {columns.map((column, colIndex) => (
                    <div key={colIndex} className="flex flex-col gap-3">
                      {column.map((sub) => (
                        <Link
                          key={sub.id}
                          href={`/category/${activeCategory.id}?subcategory=${encodeURIComponent(sub.name)}`}
                          onClick={onClose}
                          className="text-[17px] font-bold uppercase tracking-wide text-norix-blue transition-colors hover:text-norix-blue-light md:text-lg"
                        >
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
