"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { ProductSort } from "@/types/product";

const SORT_OPTIONS: { value: ProductSort; label: string }[] = [
  { value: "popular", label: "პოპულარობით" },
  { value: "price-asc", label: "ფასი: ზრდადობით" },
  { value: "price-desc", label: "ფასი: კლებადობით" },
  { value: "name", label: "სახელი" },
];

const LIMIT_OPTIONS = [20, 40, 60];

interface CategoryToolbarProps {
  categoryId: string;
  total: number;
  sort: ProductSort;
  limit: number;
}

export function CategoryToolbar({
  categoryId,
  total,
  sort,
  limit,
}: CategoryToolbarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    params.delete("page");
    router.push(`/category/${categoryId}?${params.toString()}`);
  };

  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-base text-norix-gray-600 md:text-lg">
        <span className="font-semibold text-foreground">{total}</span> პროდუქტი
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={String(limit)}
          onChange={(e) => updateParam("limit", e.target.value)}
          className="h-11 rounded-lg border border-norix-border bg-white px-3 text-base text-foreground outline-none focus:border-norix-blue md:text-[17px]"
          aria-label="გვერდზე რაოდენობა"
        >
          {LIMIT_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>

        <select
          value={sort}
          onChange={(e) => updateParam("sort", e.target.value)}
          className="h-11 min-w-[180px] rounded-lg border border-norix-border bg-white px-3 text-base text-foreground outline-none focus:border-norix-blue md:text-[17px]"
          aria-label="დალაგება"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
