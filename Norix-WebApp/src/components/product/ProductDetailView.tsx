"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Check,
  ChevronRight,
  Heart,
  Minus,
  Plus,
  Star,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartProvider";
import { useFavorites } from "@/contexts/FavoritesProvider";
import { formatPrice } from "@/lib/format";
import type { ProductDetail } from "@/types/product";

function truncateText(text: string, maxLength = 320): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}…`;
}

interface ProductDetailViewProps {
  product: ProductDetail;
  categoryHref?: string;
}

const DELIVERY_OPTIONS = [{ label: "მიწოდება მისამართზე", available: true }] as const;

type DetailTab = "description" | "reviews";

export function ProductDetailView({
  product,
  categoryHref,
}: ProductDetailViewProps) {
  const router = useRouter();
  const { addToCart } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  const favorited = isFavorite(product.id);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<DetailTab>("description");
  const [showFullDescription, setShowFullDescription] = useState(false);

  const inStock = (product.quantity ?? 0) > 0;
  const brandLabel =
    product.productNameBrand ||
    product.manufacturer ||
    product.brand ||
    product.genericName;

  const shortDescription = product.description ?? "";
  const visibleDescription = showFullDescription
    ? shortDescription
    : truncateText(shortDescription);

  const unitLabel = product.unitOfMeasure || "შეკვრა";

  const handleAddToCart = () => {
    addToCart(
      {
        id: product.id,
        name: product.name,
        price: product.price,
        oldPrice: product.oldPrice,
        imageUrl: product.imageUrl ?? "",
        unitLabel,
        maxQuantity: product.quantity,
      },
      quantity,
    );
  };

  const handleToggleFavorite = () => {
    toggleFavorite({
      id: product.id,
      name: product.name,
      price: product.price,
      oldPrice: product.oldPrice,
      imageUrl: product.imageUrl ?? "",
      unitLabel,
      maxQuantity: product.quantity,
    });
  };

  const handleBuyNow = () => {
    addToCart(
      {
        id: product.id,
        name: product.name,
        price: product.price,
        oldPrice: product.oldPrice,
        imageUrl: product.imageUrl ?? "",
        unitLabel,
        maxQuantity: product.quantity,
      },
      quantity,
      { openDrawer: false },
    );
    router.push("/checkout");
  };

  const breadcrumbItems = useMemo(() => {
    const items: Array<{ label: string; href?: string }> = [
      { label: "მთავარი", href: "/" },
    ];

    if (product.mainCategory) {
      items.push({
        label: product.mainCategory,
        href: categoryHref,
      });
    }

    if (product.subcategory) {
      items.push({ label: product.subcategory });
    }

    return items;
  }, [categoryHref, product.mainCategory, product.subcategory]);

  const detailSections = [
    { title: "აღწერა", content: product.description },
    { title: "გამოყენება", content: product.usage },
    { title: "აქტიური ნივთიერებები", content: product.activeIngredients },
    { title: "შენახვის პირობები", content: product.storageConditions },
  ].filter((section) => section.content);

  return (
    <div className="w-full px-4 py-6 md:px-8 md:py-8 lg:px-12 xl:px-16">
      <nav
        aria-label="Breadcrumb"
        className="mb-6 flex flex-wrap items-center gap-1 text-sm text-norix-gray-600"
      >
        {breadcrumbItems.map((item, index) => (
          <span key={`${item.label}-${index}`} className="flex items-center gap-1">
            {index > 0 && (
              <ChevronRight className="h-4 w-4 shrink-0 text-norix-gray-400" />
            )}
            {item.href ? (
              <Link href={item.href} className="hover:text-norix-blue">
                {item.label}
              </Link>
            ) : (
              <span className="text-foreground">{item.label}</span>
            )}
          </span>
        ))}
      </nav>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)_minmax(280px,1.35fr)] lg:items-start xl:gap-12">
        <div className="relative aspect-square min-h-[320px] overflow-hidden rounded-xl border border-norix-border bg-white p-6 lg:aspect-auto lg:min-h-[480px] xl:min-h-[560px]">
          <button
            type="button"
            onClick={handleToggleFavorite}
            className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-norix-border bg-white text-norix-gray-600 shadow-sm transition-colors hover:bg-norix-gray-100"
            aria-label={favorited ? "ვიშლისტიდან წაშლა" : "ვიშლისტში დამატება"}
            aria-pressed={favorited}
          >
            <Heart
              className={`h-5 w-5 ${favorited ? "fill-norix-magenta text-norix-magenta" : ""}`}
            />
          </button>
          <Image
            src={product.imageUrl ?? ""}
            alt={product.name}
            fill
            className="object-contain p-4"
            sizes="(max-width: 1024px) 100vw, 38vw"
            priority
          />
        </div>

        <div className="min-w-0 space-y-5">
          <div>
            <h1 className="text-2xl font-bold leading-tight text-foreground md:text-3xl">
              {product.name}
            </h1>
            {product.sku && (
              <p className="mt-2 text-sm text-norix-gray-400">#{product.sku}</p>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm text-norix-gray-600">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star
                  key={index}
                  className="h-4 w-4 fill-norix-gray-200 text-norix-gray-200"
                />
              ))}
            </div>
            <span>0 შეფასება</span>
          </div>

          <div className="overflow-hidden rounded-lg border border-norix-border">
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b border-norix-border">
                  <th className="w-40 bg-norix-gray-100 px-4 py-3 text-left font-medium text-norix-gray-600">
                    სტატუსი
                  </th>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-2 font-medium ${
                        inStock ? "text-norix-green" : "text-red-500"
                      }`}
                    >
                      {inStock ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                      {inStock ? "მარაგშია" : "არ არის მარაგში"}
                    </span>
                  </td>
                </tr>
                {brandLabel && (
                  <tr className="border-b border-norix-border">
                    <th className="bg-norix-gray-100 px-4 py-3 text-left font-medium text-norix-gray-600">
                      ბრენდი
                    </th>
                    <td className="px-4 py-3 text-foreground">{brandLabel}</td>
                  </tr>
                )}
                {product.countryOfOrigin && (
                  <tr>
                    <th className="bg-norix-gray-100 px-4 py-3 text-left font-medium text-norix-gray-600">
                      ქვეყანა
                    </th>
                    <td className="px-4 py-3 text-foreground">
                      {product.countryOfOrigin}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {shortDescription && (
            <div className="text-[15px] leading-7 text-norix-gray-600">
              <p className="whitespace-pre-line">{visibleDescription}</p>
              {shortDescription.length > 320 && (
                <button
                  type="button"
                  onClick={() => setShowFullDescription((value) => !value)}
                  className="mt-2 text-sm font-medium text-norix-blue hover:underline"
                >
                  {showFullDescription ? "ნაკლების ჩვენება" : "სრული ანოტაცია"}
                </button>
              )}
            </div>
          )}
        </div>

        <aside className="rounded-xl border border-norix-border bg-white p-5 shadow-sm lg:sticky lg:top-24">
          <div className="space-y-5">
            <div>
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-3xl font-bold text-foreground">
                  {formatPrice(product.price)}
                </span>
                {product.oldPrice != null &&
                  product.oldPrice > product.price && (
                    <span className="text-lg text-norix-gray-400 line-through">
                      {formatPrice(product.oldPrice)}
                    </span>
                  )}
              </div>
              {product.discountPercentage != null &&
                product.discountPercentage > 0 && (
                  <span className="mt-1 inline-block rounded-full bg-norix-magenta-light px-2.5 py-0.5 text-sm font-semibold text-norix-magenta">
                    -{product.discountPercentage}%
                  </span>
                )}
            </div>

            <div className="flex items-center justify-between rounded-lg border border-norix-border">
              <button
                type="button"
                aria-label="რაოდენობის შემცირება"
                onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                className="flex h-12 w-12 items-center justify-center text-norix-gray-600 transition-colors hover:bg-norix-gray-100"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="min-w-[5rem] text-center text-sm font-medium text-foreground">
                {quantity} {unitLabel}
              </span>
              <button
                type="button"
                aria-label="რაოდენობის გაზრდა"
                onClick={() => setQuantity((value) => value + 1)}
                className="flex h-12 w-12 items-center justify-center text-norix-gray-600 transition-colors hover:bg-norix-gray-100"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-3">
              <button
                type="button"
                disabled={!inStock}
                onClick={handleAddToCart}
                className="h-12 rounded-lg bg-norix-blue text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                კალათაში
              </button>
              <button
                type="button"
                disabled={!inStock}
                onClick={handleBuyNow}
                className="h-12 rounded-lg bg-norix-green text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ყიდვა
              </button>
            </div>

            <div className="space-y-3 border-t border-norix-border pt-4">
              <p className="text-sm font-semibold text-foreground">
                მიწოდების მეთოდები
              </p>
              <ul className="space-y-2">
                {DELIVERY_OPTIONS.map((option) => (
                  <li
                    key={option.label}
                    className="flex items-center gap-2 text-sm text-norix-gray-600"
                  >
                    {option.available ? (
                      <Check className="h-4 w-4 shrink-0 text-norix-green" />
                    ) : (
                      <X className="h-4 w-4 shrink-0 text-norix-gray-400" />
                    )}
                    {option.label}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>
      </div>

      <section className="mt-10 border-t border-norix-border pt-8">
        <div className="flex gap-8 border-b border-norix-border">
          <button
            type="button"
            onClick={() => setActiveTab("description")}
            className={`border-b-2 pb-3 text-base font-semibold transition-colors ${
              activeTab === "description"
                ? "border-norix-blue text-norix-blue"
                : "border-transparent text-norix-gray-600 hover:text-foreground"
            }`}
          >
            აღწერა
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("reviews")}
            className={`border-b-2 pb-3 text-base font-semibold transition-colors ${
              activeTab === "reviews"
                ? "border-norix-blue text-norix-blue"
                : "border-transparent text-norix-gray-600 hover:text-foreground"
            }`}
          >
            შეფასებები
          </button>
        </div>

        <div className="py-8">
          {activeTab === "description" ? (
            <div className="w-full space-y-6">
              <h2 className="text-xl font-bold text-foreground">{product.name}</h2>
              {detailSections.length > 0 ? (
                detailSections.map((section) => (
                  <div key={section.title}>
                    <h3 className="mb-2 text-base font-semibold text-foreground">
                      {section.title}
                    </h3>
                    <p className="whitespace-pre-line text-[15px] leading-7 text-norix-gray-600">
                      {section.content}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-norix-gray-600">
                  ამ პროდუქტისთვის დამატებითი აღწერა ჯერ არ არის დამატებული.
                </p>
              )}

              {product.sideEffects && product.sideEffects.length > 0 && (
                <div>
                  <h3 className="mb-2 text-base font-semibold text-foreground">
                    გვერდითი მოვლენები
                  </h3>
                  <ul className="list-disc space-y-2 pl-5 text-[15px] leading-7 text-norix-gray-600">
                    {product.sideEffects.map((item, index) => (
                      <li key={index} className="whitespace-pre-line">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {product.contraindications &&
                product.contraindications.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-base font-semibold text-foreground">
                      უკუჩვენებები
                    </h3>
                    <ul className="list-disc space-y-2 pl-5 text-[15px] leading-7 text-norix-gray-600">
                      {product.contraindications.map((item, index) => (
                        <li key={index} className="whitespace-pre-line">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-norix-border px-6 py-12 text-center">
              <p className="text-base font-medium text-foreground">
                შეფასებები ჯერ არ არის
              </p>
              <p className="mt-2 text-sm text-norix-gray-600">
                იყავით პირველი, ვინც გაუზიარებთ გამოცდილებას ამ პროდუქტთან დაკავშირებით.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
