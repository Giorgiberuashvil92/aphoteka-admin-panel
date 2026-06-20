"use client";

import Image from "next/image";
import Link from "next/link";
import { Eye, Heart, ShoppingBag } from "lucide-react";
import { useCart } from "@/contexts/CartProvider";
import { useFavorites } from "@/contexts/FavoritesProvider";
import { countryFlagUrl } from "@/lib/countryFlag";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/types/product";

interface CatalogProductCardProps {
  product: Product;
}

function DesktopAction({
  label,
  children,
  href,
  onClick,
}: {
  label: string;
  children: React.ReactNode;
  href?: string;
  onClick?: (event: React.MouseEvent) => void;
}) {
  const className =
    "flex h-10 w-10 items-center justify-center rounded-full bg-norix-blue text-white transition-transform hover:scale-105";

  if (href) {
    return (
      <Link href={href} className={className} aria-label={label}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className} aria-label={label}>
      {children}
    </button>
  );
}

function MobileAction({
  label,
  children,
  href,
  onClick,
  wide,
}: {
  label: string;
  children: React.ReactNode;
  href?: string;
  onClick?: (event: React.MouseEvent) => void;
  wide?: boolean;
}) {
  const className = wide
    ? "flex h-8 min-w-8 items-center justify-center rounded-lg bg-[#E8EAF6] px-3 text-norix-blue"
    : "flex h-8 w-8 items-center justify-center rounded-full bg-[#E8EAF6] text-norix-blue";

  if (href) {
    return (
      <Link href={href} className={className} aria-label={label}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className} aria-label={label}>
      {children}
    </button>
  );
}

export function CatalogProductCard({ product }: CatalogProductCardProps) {
  const { addToCart } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  const favorited = isFavorite(product.id);
  const hasDiscount =
    product.discountPercentage != null && product.discountPercentage > 0;
  const hasOldPrice =
    product.oldPrice != null && product.oldPrice > product.price;
  const flagUrl = countryFlagUrl(product.countryOfOrigin);
  const productHref = `/product/${product.id}`;

  function handleToggleFavorite(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    toggleFavorite({
      id: product.id,
      name: product.name,
      price: product.price,
      oldPrice: product.oldPrice,
      imageUrl: product.imageUrl ?? "",
    });
  }

  function handleAddToCart(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      oldPrice: product.oldPrice,
      imageUrl: product.imageUrl ?? "",
    });
  }

  return (
    <div className="group/product flex h-full flex-col overflow-hidden rounded-[10px] border border-[#EEEEEE] bg-white">
      <Link href={productHref} className="flex flex-1 flex-col">
        <div className="product__image-wrapper relative">
          <div className="product__image relative aspect-[1.05/1] w-full">
            {hasDiscount ? (
              <span className="absolute left-1.5 top-1.5 z-[1] rounded bg-norix-magenta px-1.5 py-0.5 text-[10px] font-bold text-white">
                -{product.discountPercentage}%
              </span>
            ) : null}
            <Image
              src={product.imageUrl ?? ""}
              alt={product.name}
              fill
              className="object-contain p-3"
              sizes="(max-width: 640px) 50vw, 25vw"
            />
          </div>

          <div className="product__actions pointer-events-none absolute inset-0 z-10 hidden items-center justify-center gap-2 opacity-0 transition-opacity duration-200 group-hover/product:opacity-100 md:flex">
            <div className="pointer-events-auto flex items-center gap-2">
              <DesktopAction href={productHref} label="სწრაფი ნახვა">
                <Eye className="h-5 w-5" strokeWidth={2} />
              </DesktopAction>
              <DesktopAction label="ვიშლისტი" onClick={handleToggleFavorite}>
                <Heart
                  className={`h-5 w-5 ${favorited ? "fill-white" : ""}`}
                  strokeWidth={2}
                />
              </DesktopAction>
              <DesktopAction label="კალათაში" onClick={handleAddToCart}>
                <ShoppingBag className="h-5 w-5" strokeWidth={2} />
              </DesktopAction>
            </div>
          </div>
        </div>

        <h3 className="product__title line-clamp-2 px-3 pt-2 text-sm font-semibold leading-snug text-[#1A1A2E]">
          {product.name}
        </h3>

        <div className="product__price-wrapper px-3 pt-1.5">
          <span
            className={`product__price text-[15px] font-bold leading-none ${
              hasOldPrice ? "text-norix-magenta" : "text-[#1A1A2E]"
            }`}
          >
            {formatPrice(product.price)}
          </span>
          {hasOldPrice ? (
            <span className="ml-2 text-xs text-[#9CA3AF] line-through">
              {formatPrice(product.oldPrice!)}
            </span>
          ) : null}
        </div>

        {product.countryOfOrigin ? (
          <div className="product__country-wrapper mt-2 flex items-center gap-1.5 px-3 pb-3">
            {flagUrl ? (
              <Image
                src={flagUrl}
                alt={product.countryOfOrigin}
                width={20}
                height={20}
                className="h-5 w-5 shrink-0 rounded-sm object-cover"
                unoptimized
              />
            ) : (
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm bg-norix-gray-100 text-[10px]">
                🌍
              </span>
            )}
            <span className="product__country-name truncate text-xs text-[#9CA3AF]">
              {product.countryOfOrigin}
            </span>
          </div>
        ) : (
          <div className="pb-3" />
        )}
      </Link>

      <div className="product__actions-bottom flex items-center justify-between gap-2 border-t border-[#EEEEEE] px-3 py-2 md:hidden">
        <div className="flex items-center gap-2">
          <MobileAction href={productHref} label="სწრაფი ნახვა">
            <Eye className="h-5 w-5" strokeWidth={2} />
          </MobileAction>
          <MobileAction label="ვიშლისტი" onClick={handleToggleFavorite}>
            <Heart
              className={`h-5 w-5 ${favorited ? "fill-norix-blue" : ""}`}
              strokeWidth={2}
            />
          </MobileAction>
        </div>
        <MobileAction label="კალათაში" onClick={handleAddToCart} wide>
          <ShoppingBag className="h-5 w-5" strokeWidth={2} />
        </MobileAction>
      </div>
    </div>
  );
}
