import { Suspense } from "react";
import { SearchPageView } from "@/components/search/SearchPageView";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { fetchSearchProducts } from "@/lib/api/products";
import type { ProductSort } from "@/types/product";

interface SearchPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function parseSort(value: unknown): ProductSort {
  const allowed: ProductSort[] = ["popular", "price-asc", "price-desc", "name"];
  if (typeof value === "string" && allowed.includes(value as ProductSort)) {
    return value as ProductSort;
  }
  return "popular";
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const sp = await searchParams;
  const query = typeof sp.q === "string" ? sp.q.trim() : "";
  const page = Math.max(1, Number(sp.page) || 1);
  const limit = Math.min(60, Math.max(20, Number(sp.limit) || 20));
  const sort = parseSort(sp.sort);

  const products = query
    ? await fetchSearchProducts({ search: query, page, limit, sort })
    : { data: [], total: 0, page: 1, limit };

  return (
    <>
      <SiteHeader />
      <main className="w-full flex-1 bg-white">
        <Suspense
          fallback={
            <div className="px-4 py-16 text-center text-lg text-norix-gray-400">
              იტვირთება...
            </div>
          }
        >
          <SearchPageView query={query} products={products} sort={sort} />
        </Suspense>
      </main>
    </>
  );
}
