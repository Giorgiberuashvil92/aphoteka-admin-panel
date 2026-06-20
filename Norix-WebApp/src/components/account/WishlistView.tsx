"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, Heart, Trash2 } from "lucide-react";
import { useCart } from "@/contexts/CartProvider";
import { useFavorites } from "@/contexts/FavoritesProvider";
import { formatPrice } from "@/lib/format";

const DELIVERY_OPTIONS = [
  { label: "მიწოდება მისამართზე", available: true },
] as const;

export function WishlistView() {
  const { items, itemCount, removeFromFavorites, clearFavorites } = useFavorites();
  const { addToCart } = useCart();

  function moveToCart(item: (typeof items)[number]) {
    addToCart(
      {
        id: item.id,
        name: item.name,
        price: item.price,
        oldPrice: item.oldPrice,
        imageUrl: item.imageUrl,
        unitLabel: item.unitLabel,
        maxQuantity: item.maxQuantity,
      },
      1,
      { openDrawer: false },
    );
  }

  if (itemCount === 0) {
    return (
      <section className="rounded-2xl border border-norix-border bg-white p-8 md:p-10">
        <h1 className="text-2xl font-bold text-foreground">ვიშლისტი</h1>
        <p className="mt-4 text-[15px] text-norix-gray-600">
          ვიშლისტი ცარიელია. დაამატეთ პროდუქტები გულის ღილაკით.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex h-11 items-center rounded-xl bg-norix-blue px-6 text-sm font-semibold text-white"
        >
          კატალოგში გადასვლა
        </Link>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-norix-border bg-white">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-norix-border px-5 py-5 md:px-8">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground">ვიშლისტი</h1>
          <span className="flex h-8 min-w-8 items-center justify-center rounded-lg bg-norix-gray-100 px-2 text-sm font-semibold text-norix-gray-600">
            {itemCount}
          </span>
        </div>
        <button
          type="button"
          onClick={clearFavorites}
          className="inline-flex items-center gap-2 text-[15px] font-medium text-norix-gray-600 transition-colors hover:text-foreground"
        >
          <Trash2 className="h-4 w-4" />
          გასუფთავება
        </button>
      </div>

      <div className="hidden grid-cols-[minmax(0,2fr)_minmax(220px,1fr)_140px] gap-4 border-b border-norix-border bg-norix-gray-100 px-5 py-3 text-sm font-semibold text-norix-gray-600 md:grid md:px-8">
        <span>პროდუქტი</span>
        <span>მიწოდება</span>
        <span className="text-right">ფასი</span>
      </div>

      <ul className="divide-y divide-norix-border">
        {items.map((item) => (
          <li
            key={item.id}
            className="grid gap-5 px-5 py-5 md:grid-cols-[minmax(0,2fr)_minmax(220px,1fr)_140px] md:items-center md:gap-4 md:px-8 md:py-6"
          >
            <div className="flex gap-4">
              <Link
                href={`/product/${item.id}`}
                className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-norix-border bg-white p-2 md:h-28 md:w-28"
              >
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    className="object-contain p-1"
                    sizes="112px"
                  />
                ) : null}
              </Link>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/product/${item.id}`}
                  className="line-clamp-3 text-[15px] font-medium leading-snug text-foreground hover:text-norix-blue md:text-base"
                >
                  {item.name}
                </Link>
                <button
                  type="button"
                  onClick={() => moveToCart(item)}
                  className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-norix-blue hover:underline"
                >
                  <Heart className="h-4 w-4 fill-norix-blue text-norix-blue" />
                  კალათაში გადატანა
                </button>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-norix-gray-500 md:hidden">
                მიწოდება
              </p>
              <ul className="space-y-2">
                {DELIVERY_OPTIONS.map((option) => (
                  <li
                    key={option.label}
                    className="flex items-center gap-2 text-sm text-foreground"
                  >
                    <Check className="h-4 w-4 shrink-0 text-norix-green" />
                    {option.label}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center justify-between gap-3 md:justify-end">
              <div className="md:text-right">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-norix-gray-500 md:hidden">
                  ფასი
                </p>
                <p className="text-xl font-bold text-norix-magenta">
                  {formatPrice(item.price)}
                </p>
                {item.oldPrice != null && item.oldPrice > item.price ? (
                  <p className="text-sm text-norix-gray-400 line-through">
                    {formatPrice(item.oldPrice)}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => removeFromFavorites(item.id)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-norix-gray-500 transition-colors hover:bg-norix-gray-100 hover:text-foreground"
                aria-label="წაშლა"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
