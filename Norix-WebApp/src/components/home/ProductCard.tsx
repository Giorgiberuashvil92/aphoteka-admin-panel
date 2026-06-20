import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types/product";

interface ProductCardProps {
  product: Product;
  badge?: string;
}

function formatPrice(value: number): string {
  return `${value.toFixed(2)} ₾`;
}

export function ProductCard({ product, badge = "ბრენდის დღე" }: ProductCardProps) {
  const hasDiscount =
    product.discountPercentage != null && product.discountPercentage > 0;

  return (
    <Link
      href={`/product/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-norix-border bg-white transition-shadow hover:shadow-lg"
    >
      <div className="relative aspect-square bg-norix-gray-100 p-4">
        {hasDiscount && (
          <div className="absolute left-0 top-0 z-10">
            <div className="relative">
              <div className="bg-norix-magenta px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                {badge}
              </div>
              <div className="absolute -bottom-2 left-0 h-0 w-0 border-l-[12px] border-t-[8px] border-l-transparent border-t-norix-magenta" />
            </div>
          </div>
        )}

        {hasDiscount && (
          <span className="absolute bottom-3 left-3 z-10 text-2xl font-bold text-norix-magenta">
            -{product.discountPercentage}%
          </span>
        )}

        <Image
          src={product.imageUrl ?? ""}
          alt={product.name}
          fill
          className="object-contain p-2 transition-transform group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, 20vw"
        />
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3 md:p-4">
        {product.brand && (
          <p className="text-xs font-medium uppercase tracking-wide text-norix-gray-400">
            {product.brand}
          </p>
        )}
        <h3 className="line-clamp-2 text-base font-medium leading-snug text-foreground md:text-[17px]">
          {product.name}
        </h3>
        <div className="mt-auto flex items-baseline gap-2 pt-2">
          <span className="text-lg font-bold text-foreground md:text-xl">
            {formatPrice(product.price)}
          </span>
          {product.oldPrice != null && product.oldPrice > product.price && (
            <span className="text-sm text-norix-gray-400 line-through">
              {formatPrice(product.oldPrice)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
