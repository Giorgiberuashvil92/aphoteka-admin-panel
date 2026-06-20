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

interface SearchToolbarProps {
  query: string;
  total: number;
  sort: ProductSort;
  limit: number;
}

export function SearchToolbar({ query, total, sort, limit }: SearchToolbarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("q", query);
    params.set(key, value);
    params.delete("page");
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-base text-norix-gray-600 md:text-lg">
        <span className="font-semibold text-foreground">{total}</span> პროდუქტი
        {query ? (
          <>
            {" "}
            — „<span className="text-foreground">{query}</span>“
          </>
        ) : null}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={String(limit)}
          onChange={(event) => updateParam("limit", event.target.value)}
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
          onChange={(event) => updateParam("sort", event.target.value)}
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
