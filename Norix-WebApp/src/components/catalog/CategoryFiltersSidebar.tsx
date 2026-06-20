"use client";

import Link from "next/link";
import { ChevronLeft, ChevronUp } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import type { Subcategory } from "@/types/category";

interface CategoryFiltersSidebarProps {
  categoryId: string;
  categoryName: string;
  subcategories: Subcategory[];
  activeSubs: string[];
  minPrice?: number;
  maxPrice?: number;
}

export function CategoryFiltersSidebar({
  categoryId,
  categoryName,
  subcategories,
  activeSubs,
  minPrice,
  maxPrice,
}: CategoryFiltersSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [categoriesOpen, setCategoriesOpen] = useState(true);
  const [priceOpen, setPriceOpen] = useState(true);
  const [priceMin, setPriceMin] = useState(minPrice?.toString() ?? "");
  const [priceMax, setPriceMax] = useState(maxPrice?.toString() ?? "");

  const buildUrl = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value == null || value === "") params.delete(key);
        else params.set(key, value);
      });
      params.delete("page");
      return `/category/${categoryId}?${params.toString()}`;
    },
    [categoryId, searchParams],
  );

  const toggleSubcategory = (name: string) => {
    const next = activeSubs.includes(name)
      ? activeSubs.filter((s) => s !== name)
      : [...activeSubs, name];

    if (next.length === 0) {
      router.push(buildUrl({ subcategory: null, subs: null }));
    } else if (next.length === 1) {
      router.push(
        buildUrl({
          subcategory: next[0],
          subs: null,
        }),
      );
    } else {
      router.push(
        buildUrl({
          subcategory: null,
          subs: next.join(","),
        }),
      );
    }
  };

  const applyPrice = () => {
    router.push(
      buildUrl({
        minPrice: priceMin.trim() || null,
        maxPrice: priceMax.trim() || null,
      }),
    );
  };

  const clearFilters = () => {
    router.push(`/category/${categoryId}`);
  };

  const hasActiveFilters = useMemo(
    () =>
      activeSubs.length > 0 ||
      minPrice != null ||
      maxPrice != null,
    [activeSubs.length, minPrice, maxPrice],
  );

  return (
    <aside className="w-full shrink-0 lg:w-[300px] xl:w-[320px]">
      <div className="rounded-xl border border-norix-border bg-white p-5 md:p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground md:text-2xl">
            ფილტრი
          </h2>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-full border border-norix-blue/30 px-4 py-1.5 text-sm font-medium text-norix-blue transition-colors hover:bg-[#eef3fb] md:text-base"
            >
              არჩევა
            </button>
          )}
        </div>

        <div className="border-b border-norix-border pb-5">
          <button
            type="button"
            onClick={() => setCategoriesOpen((v) => !v)}
            className="flex w-full items-center justify-between py-2 text-left"
          >
            <span className="text-lg font-semibold text-foreground md:text-xl">
              კატეგორიები
            </span>
            <ChevronUp
              className={`h-5 w-5 text-norix-gray-400 transition-transform ${categoriesOpen ? "" : "rotate-180"}`}
            />
          </button>

          {categoriesOpen && (
            <div className="mt-3">
              <Link
                href={`/category/${categoryId}`}
                className="mb-4 flex items-center gap-2 text-base font-medium text-norix-blue hover:underline md:text-[17px]"
              >
                <ChevronLeft className="h-4 w-4" />
                {categoryName}
              </Link>

              <ul className="flex max-h-[420px] flex-col gap-1 overflow-y-auto pr-1">
                {subcategories.map((sub) => {
                  const checked = activeSubs.includes(sub.name);
                  return (
                    <li key={sub.id}>
                      <label className="flex cursor-pointer items-start gap-3 rounded-lg px-1 py-2.5 transition-colors hover:bg-norix-gray-100">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSubcategory(sub.name)}
                          className="mt-1 h-4 w-4 shrink-0 rounded border-norix-border text-norix-blue focus:ring-norix-blue"
                        />
                        <span className="text-base leading-snug text-foreground md:text-[17px]">
                          {sub.name}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        <div className="pt-5">
          <button
            type="button"
            onClick={() => setPriceOpen((v) => !v)}
            className="flex w-full items-center justify-between py-2 text-left"
          >
            <span className="text-lg font-semibold text-foreground md:text-xl">
              ფასი
            </span>
            <ChevronUp
              className={`h-5 w-5 text-norix-gray-400 transition-transform ${priceOpen ? "" : "rotate-180"}`}
            />
          </button>

          {priceOpen && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={0}
                  placeholder="მინ."
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                  className="h-11 w-full rounded-lg border border-norix-border px-3 text-base outline-none focus:border-norix-blue"
                />
                <span className="text-norix-gray-400">—</span>
                <input
                  type="number"
                  min={0}
                  placeholder="მაქს."
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  className="h-11 w-full rounded-lg border border-norix-border px-3 text-base outline-none focus:border-norix-blue"
                />
              </div>
              <button
                type="button"
                onClick={applyPrice}
                className="w-full rounded-lg bg-norix-blue py-2.5 text-base font-medium text-white transition-colors hover:bg-norix-blue-light md:text-[17px]"
              >
                გამოყენება
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
