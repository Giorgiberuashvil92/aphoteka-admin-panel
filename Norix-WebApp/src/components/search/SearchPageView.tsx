"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Clock, Sparkles } from "lucide-react";
import { CatalogProductCard } from "@/components/catalog/CatalogProductCard";
import { SearchToolbar } from "@/components/search/SearchToolbar";
import {
  addSearchHistory,
  clearSearchHistory,
  getSearchHistory,
} from "@/lib/search/history";
import { POPULAR_SEARCHES } from "@/lib/search/constants";
import type { PaginatedProducts, ProductSort } from "@/types/product";

interface SearchPageViewProps {
  query: string;
  products: PaginatedProducts;
  sort: ProductSort;
}

export function SearchPageView({ query, products, sort }: SearchPageViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    if (query) {
      addSearchHistory(query);
    }
    setHistory(getSearchHistory());
  }, [query]);

  const currentPage = products.page;
  const totalPages = Math.max(1, Math.ceil(products.total / products.limit));

  const buildPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (query) params.set("q", query);
    params.set("page", String(page));
    return `/search?${params.toString()}`;
  };

  function runSearch(term: string) {
    const trimmed = term.trim();
    if (!trimmed) return;
    addSearchHistory(trimmed);
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  function handleClearHistory() {
    clearSearchHistory();
    setHistory([]);
  }

  if (!query) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-8 md:px-8 md:py-12">
        <h1 className="mb-2 text-2xl font-bold text-foreground md:text-3xl">
          ძებნა
        </h1>
        <p className="mb-8 text-norix-gray-600">
          შეიყვანეთ მედიკამენტის სახელი, ბრენდი ან სიმპტომი ზემოთ მდებარე ველში.
        </p>

        <section className="mb-8 rounded-2xl border border-norix-border bg-white p-6">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-norix-magenta" />
            <h2 className="text-lg font-semibold text-foreground">
              პოპულარული ძიებები
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {POPULAR_SEARCHES.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => runSearch(term)}
                className="rounded-full border border-norix-border bg-norix-gray-100 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-norix-blue-light hover:bg-white"
              >
                {term}
              </button>
            ))}
          </div>
        </section>

        {history.length > 0 ? (
          <section className="rounded-2xl border border-norix-border bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                ბოლო მოძიებული
              </h2>
              <button
                type="button"
                onClick={handleClearHistory}
                className="text-sm font-medium text-norix-blue hover:underline"
              >
                გასუფთავება
              </button>
            </div>
            <div className="divide-y divide-norix-border">
              {history.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => runSearch(term)}
                  className="flex w-full items-center gap-3 py-3 text-left text-[15px] text-foreground transition-colors hover:text-norix-blue"
                >
                  <Clock className="h-4 w-4 shrink-0 text-norix-gray-400" />
                  {term}
                </button>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full px-4 py-6 md:px-8 md:py-8 lg:px-12">
      <h1 className="mb-6 text-2xl font-bold text-foreground md:text-3xl">
        ძიების შედეგები
      </h1>

      <SearchToolbar
        query={query}
        total={products.total}
        sort={sort}
        limit={products.limit}
      />

      {products.data.length === 0 ? (
        <div className="rounded-xl border border-dashed border-norix-border py-16 text-center">
          <p className="text-lg text-norix-gray-400 md:text-xl">
            „{query}“-ის მიხედვით პროდუქტი ვერ მოიძებნა
          </p>
          <p className="mt-3 text-sm text-norix-gray-500">
            სცადეთ სხვა სიტყვა ან შეამოწმეთ მართლწერა
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
            {products.data.map((product) => (
              <CatalogProductCard key={product.id} product={product} />
            ))}
          </div>

          {totalPages > 1 ? (
            <div className="mt-10 flex items-center justify-center gap-2">
              {currentPage > 1 ? (
                <Link
                  href={buildPageUrl(currentPage - 1)}
                  className="rounded-lg border border-norix-border px-4 py-2 text-sm font-medium text-norix-gray-600 hover:bg-norix-gray-100"
                >
                  უკან
                </Link>
              ) : null}
              <span className="px-3 text-sm text-norix-gray-600">
                {currentPage} / {totalPages}
              </span>
              {currentPage < totalPages ? (
                <Link
                  href={buildPageUrl(currentPage + 1)}
                  className="rounded-lg border border-norix-border px-4 py-2 text-sm font-medium text-norix-gray-600 hover:bg-norix-gray-100"
                >
                  შემდეგი
                </Link>
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
