import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CatalogProductCard } from "@/components/catalog/CatalogProductCard";
import type { Product } from "@/types/product";

interface ProductOffersSectionProps {
  products: Product[];
  title?: string;
}

export function ProductOffersSection({
  products,
  title = "ტოპ შეთავაზებები",
}: ProductOffersSectionProps) {
  if (products.length === 0) {
    return (
      <section className="py-8 md:py-10">
        <h2 className="text-xl font-bold text-foreground md:text-2xl">{title}</h2>
        <p className="mt-4 text-norix-gray-600">პროდუქტები მალე დაემატება.</p>
      </section>
    );
  }

  return (
    <section className="py-6 md:py-10">
      <div className="mb-5 flex items-end justify-between gap-4 md:mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground md:text-2xl">{title}</h2>
          <p className="mt-1 text-sm text-norix-gray-600">
            ფასდაკლებული და პოპულარული პროდუქტები
          </p>
        </div>
        <Link
          href="/search"
          className="hidden items-center gap-1 text-sm font-semibold text-norix-blue transition-colors hover:text-norix-blue-light sm:inline-flex"
        >
          ყველას ნახვა
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 md:gap-4">
        {products.map((product) => (
          <CatalogProductCard key={product.id} product={product} />
        ))}
      </div>

      <Link
        href="/search"
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-norix-border bg-white py-3 text-sm font-semibold text-norix-blue transition-colors hover:bg-norix-gray-100 sm:hidden"
      >
        ყველას ნახვა
        <ArrowRight className="h-4 w-4" />
      </Link>
    </section>
  );
}
