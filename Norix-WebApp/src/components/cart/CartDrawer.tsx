"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { X } from "lucide-react";
import { useCart } from "@/contexts/CartProvider";
import { formatPrice, formatPriceSpaced } from "@/lib/format";
import { CartLineItem } from "./CartLineItem";

export function CartDrawer() {
  const router = useRouter();
  const {
    drawerOpen,
    closeDrawer,
    items,
    itemCount,
    totalPrice,
    totalOldPrice,
    totalDiscount,
    removeFromCart,
    updateQuantity,
  } = useCart();

  useEffect(() => {
    if (!drawerOpen) return;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeDrawer();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [drawerOpen, closeDrawer]);

  if (!drawerOpen) return null;

  return (
    <div className="fixed inset-0 z-[90]">
      <button
        type="button"
        aria-label="დახურვა"
        className="absolute inset-0 bg-black/35"
        onClick={closeDrawer}
      />

      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[420px] flex-col bg-white shadow-2xl">
        <div className="flex items-center gap-3 border-b border-norix-border px-5 py-4">
          <h2 className="text-2xl font-bold text-norix-blue">კალათა</h2>
          {itemCount > 0 && (
            <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-norix-blue px-2 text-sm font-bold text-white">
              {itemCount}
            </span>
          )}
          <button
            type="button"
            onClick={closeDrawer}
            className="ml-auto flex h-10 w-10 items-center justify-center rounded-full text-norix-gray-600 hover:bg-norix-gray-100"
            aria-label="დახურვა"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center py-16 text-center">
              <p className="text-lg font-medium text-foreground">
                კალათა ცარიელია
              </p>
              <p className="mt-2 text-sm text-norix-gray-600">
                დაამატეთ პროდუქტები შესაძენებლად
              </p>
            </div>
          ) : (
            items.map((item) => (
              <CartLineItem
                key={item.id}
                item={item}
                onRemove={removeFromCart}
                onUpdateQuantity={updateQuantity}
                compact
              />
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-norix-border bg-norix-gray-100 px-5 py-5">
            <div className="space-y-2 text-[15px]">
              <div className="flex items-center justify-between text-norix-gray-600">
                <span>პროდუქტის ღირებულება</span>
                <span>{formatPrice(totalOldPrice)}</span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex items-center justify-between text-norix-magenta">
                  <span>სტანდარტული ფასდაკლება:</span>
                  <span>- {formatPrice(totalDiscount)}</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-1 text-lg font-bold text-foreground">
                <span>სულ:</span>
                <span>{formatPriceSpaced(totalPrice)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                closeDrawer();
                router.push("/checkout");
              }}
              className="mt-5 h-12 w-full rounded-xl bg-norix-green text-base font-semibold text-white transition-opacity hover:opacity-90"
            >
              ყიდვა
            </button>

            <Link
              href="/checkout"
              onClick={closeDrawer}
              className="mt-4 block text-center text-base font-medium text-norix-blue hover:underline"
            >
              კალათაში გადასვლა
            </Link>
          </div>
        )}
      </aside>
    </div>
  );
}
