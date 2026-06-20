import type { Product } from "@/types/product";
import { ProductCard } from "./ProductCard";

interface ProductOffersSectionProps {
  products: Product[];
  title?: string;
}

export function ProductOffersSection({
  products,
  title = "ტოპ 5 შეთავაზება",
}: ProductOffersSectionProps) {
  if (products.length === 0) {
    return (
      <section className="py-8">
        <h2 className="mb-6 text-2xl font-bold text-foreground md:text-3xl">
          {title}
        </h2>
        <p className="text-norix-gray-400">პროდუქტები მალე დაემატება.</p>
      </section>
    );
  }

  return (
    <section className="py-6 md:py-8">
      <h2 className="mb-5 text-2xl font-bold text-foreground md:mb-6 md:text-3xl">
        {title}
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 md:gap-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
