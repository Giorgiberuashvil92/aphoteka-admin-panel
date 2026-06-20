"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Subcategory } from "@/types/category";
import type { PaginatedProducts, ProductSort } from "@/types/product";
import { CatalogProductCard } from "./CatalogProductCard";
import { CategoryFiltersSidebar } from "./CategoryFiltersSidebar";
import { CategoryToolbar } from "./CategoryToolbar";

interface CategoryPageViewProps {
  categoryId: string;
  categoryName: string;
  subcategories: Subcategory[];
  pageTitle: string;
  products: PaginatedProducts;
  activeSubs: string[];
  sort: ProductSort;
  minPrice?: number;
  maxPrice?: number;
}

export function CategoryPageView({
  categoryId,
  categoryName,
  subcategories,
  pageTitle,
  products,
  activeSubs,
  sort,
  minPrice,
  maxPrice,
}: CategoryPageViewProps) {
  const searchParams = useSearchParams();
  const currentPage = products.page;
  const totalPages = Math.max(1, Math.ceil(products.total / products.limit));

  const buildPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    return `/category/${categoryId}?${params.toString()}`;
  };

  return (
    <div className="mx-auto w-full px-4 py-6 md:px-8 md:py-8 lg:px-12">
      <h1 className="mb-6 text-2xl font-bold text-foreground md:text-3xl lg:text-4xl">
        {pageTitle}
      </h1>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <CategoryFiltersSidebar
          categoryId={categoryId}
          categoryName={categoryName}
          subcategories={subcategories}
          activeSubs={activeSubs}
          minPrice={minPrice}
          maxPrice={maxPrice}
        />

        <div className="min-w-0 flex-1">
          <CategoryToolbar
            categoryId={categoryId}
            total={products.total}
            sort={sort}
            limit={products.limit}
          />

          {products.data.length === 0 ? (
            <div className="rounded-xl border border-dashed border-norix-border py-16 text-center">
              <p className="text-lg text-norix-gray-400 md:text-xl">
                ამ ფილტრებით პროდუქტი ვერ მოიძებნა
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
              {products.data.map((product) => (
                <CatalogProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
              {currentPage > 1 && (
                <Link
                  href={buildPageUrl(currentPage - 1)}
                  className="rounded-lg border border-norix-border px-4 py-2 text-base hover:bg-norix-gray-100"
                >
                  ← წინა
                </Link>
              )}
              <span className="px-3 text-base text-norix-gray-600">
                {currentPage} / {totalPages}
              </span>
              {currentPage < totalPages && (
                <Link
                  href={buildPageUrl(currentPage + 1)}
                  className="rounded-lg border border-norix-border px-4 py-2 text-base hover:bg-norix-gray-100"
                >
                  შემდეგი →
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
