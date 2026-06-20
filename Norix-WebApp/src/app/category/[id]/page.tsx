import { notFound } from "next/navigation";
import { Suspense } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { CategoryPageView } from "@/components/catalog/CategoryPageView";
import {
  fetchCategoryById,
  fetchSubcategories,
} from "@/lib/api/categories";
import { fetchCategoryProducts } from "@/lib/api/products";
import type { ProductSort } from "@/types/product";

interface CategoryPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function parseActiveSubs(
  searchParams: Record<string, string | string[] | undefined>,
): string[] {
  const subsRaw = searchParams.subs;
  if (typeof subsRaw === "string" && subsRaw.trim()) {
    return subsRaw.split(",").map((s) => decodeURIComponent(s.trim())).filter(Boolean);
  }

  const subRaw = searchParams.subcategory;
  if (typeof subRaw === "string" && subRaw.trim()) {
    return [decodeURIComponent(subRaw.trim())];
  }

  return [];
}

function parseSort(value: unknown): ProductSort {
  const allowed: ProductSort[] = ["popular", "price-asc", "price-desc", "name"];
  if (typeof value === "string" && allowed.includes(value as ProductSort)) {
    return value as ProductSort;
  }
  return "popular";
}

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const { id } = await params;
  const sp = await searchParams;

  const category = await fetchCategoryById(id);
  if (!category) notFound();

  const subcategories = await fetchSubcategories(id);
  const activeSubs = parseActiveSubs(sp);
  const page = Math.max(1, Number(sp.page) || 1);
  const limit = Math.min(60, Math.max(20, Number(sp.limit) || 20));
  const sort = parseSort(sp.sort);
  const minPrice = sp.minPrice ? Number(sp.minPrice) : undefined;
  const maxPrice = sp.maxPrice ? Number(sp.maxPrice) : undefined;

  const pageTitle =
    activeSubs.length === 1 ? activeSubs[0] : category.name;

  const products = await fetchCategoryProducts({
    categoryName: category.name,
    activeSubs,
    page,
    limit,
    sort,
    minPrice: Number.isFinite(minPrice) ? minPrice : undefined,
    maxPrice: Number.isFinite(maxPrice) ? maxPrice : undefined,
  });

  return (
    <>
      <SiteHeader />
      <main className="w-full flex-1 bg-white">
        <Suspense
          fallback={
            <div className="px-4 py-16 text-center text-lg text-norix-gray-400 md:px-8">
              იტვირთება...
            </div>
          }
        >
          <CategoryPageView
            categoryId={id}
            categoryName={category.name}
            subcategories={subcategories}
            pageTitle={pageTitle}
            products={products}
            activeSubs={activeSubs}
            sort={sort}
            minPrice={Number.isFinite(minPrice) ? minPrice : undefined}
            maxPrice={Number.isFinite(maxPrice) ? maxPrice : undefined}
          />
        </Suspense>
      </main>
    </>
  );
}
