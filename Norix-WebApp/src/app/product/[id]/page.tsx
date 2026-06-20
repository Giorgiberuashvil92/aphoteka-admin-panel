import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetailView } from "@/components/product/ProductDetailView";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { fetchCategories } from "@/lib/api/categories";
import { fetchProductById } from "@/lib/api/products";

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await fetchProductById(id);

  if (!product) {
    return { title: "პროდუქტი ვერ მოიძებნა — Norix" };
  }

  return {
    title: `${product.name} — Norix`,
    description:
      product.description?.slice(0, 160) ||
      `${product.name} — ონლაინ შეძენა Norix-ზე`,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    fetchProductById(id),
    fetchCategories(),
  ]);

  if (!product) notFound();

  const matchedCategory = categories.find(
    (category) => category.name === product.mainCategory,
  );

  return (
    <>
      <SiteHeader />
      <main className="w-full flex-1 bg-white">
        <ProductDetailView
          product={product}
          categoryHref={
            matchedCategory ? `/category/${matchedCategory.id}` : undefined
          }
        />
      </main>
    </>
  );
}
