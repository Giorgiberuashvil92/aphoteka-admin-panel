"use client";

import Image from "next/image";
import { Minus, Plus, Trash2, X } from "lucide-react";
import type { CartItem } from "@/types/cart";
import { formatPrice } from "@/lib/format";

interface CartLineItemProps {
  item: CartItem;
  onRemove: (id: string) => void;
  onUpdateQuantity: (id: string, quantity: number) => void;
  compact?: boolean;
}

export function CartLineItem({
  item,
  onRemove,
  onUpdateQuantity,
  compact = false,
}: CartLineItemProps) {
  const unitLabel = item.unitLabel || "შეკვრა";
  const hasDiscount =
    item.oldPrice != null && item.oldPrice > item.price;

  return (
    <div
      className={`relative border-b border-norix-border pb-5 ${
        compact ? "pt-1" : "pt-4"
      }`}
    >
      <button
        type="button"
        onClick={() => onRemove(item.id)}
        className="absolute right-0 top-0 text-norix-gray-400 transition-colors hover:text-red-500"
        aria-label="წაშლა"
      >
        {compact ? (
          <X className="h-5 w-5" />
        ) : (
          <Trash2 className="h-5 w-5" />
        )}
      </button>

      <div className="flex gap-4 pr-8">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border border-norix-border bg-white p-2">
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            className="object-contain p-1"
            sizes="80px"
          />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-[15px] font-medium leading-snug text-foreground">
            {item.name}
          </h3>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center rounded-lg border border-norix-border">
              <button
                type="button"
                onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                className="flex h-9 w-9 items-center justify-center text-norix-gray-600 hover:bg-norix-gray-100"
                aria-label="რაოდენობის შემცირება"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="min-w-16 px-2 text-center text-sm font-medium">
                {item.quantity} {unitLabel}
              </span>
              <button
                type="button"
                onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                className="flex h-9 w-9 items-center justify-center text-norix-gray-600 hover:bg-norix-gray-100"
                aria-label="რაოდენობის გაზრდა"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <div className="text-right">
              <div className="text-lg font-bold text-norix-magenta">
                {formatPrice(item.price * item.quantity)}
              </div>
              {hasDiscount && (
                <div className="text-sm text-norix-gray-400 line-through">
                  {formatPrice(item.oldPrice! * item.quantity)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
