"use client";

import Image from "next/image";
import { ArrowRight, Clock, Loader2, Search, Sparkles } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { POPULAR_SEARCHES } from "@/lib/search/constants";
import type { Product } from "@/types/product";

interface SearchSuggestionsPanelProps {
  query: string;
  loading: boolean;
  suggestions: Product[];
  history: string[];
  embedded?: boolean;
  onSelectQuery: (query: string) => void;
  onSelectProduct: (productId: string) => void;
  onShowAll: () => void;
}

export function SearchSuggestionsPanel({
  query,
  loading,
  suggestions,
  history,
  embedded = false,
  onSelectQuery,
  onSelectProduct,
  onShowAll,
}: SearchSuggestionsPanelProps) {
  const trimmed = query.trim();
  const hasQuery = trimmed.length > 0;

  const filteredHistory = hasQuery
    ? history.filter((item) =>
        item.toLowerCase().includes(trimmed.toLowerCase()),
      )
    : history;

  const filteredPopular = hasQuery
    ? POPULAR_SEARCHES.filter((item) =>
        item.toLowerCase().includes(trimmed.toLowerCase()),
      )
    : [...POPULAR_SEARCHES];

  const showHints =
    !hasQuery || (!loading && suggestions.length === 0 && trimmed.length < 2);

  return (
    <div
      className={
        embedded
          ? "overflow-hidden bg-white"
          : "overflow-hidden rounded-2xl border border-norix-border bg-white shadow-xl"
      }
    >
      {hasQuery && trimmed.length >= 1 ? (
        <>
          {loading ? (
            <div className="flex items-center gap-3 px-5 py-6 text-norix-gray-600">
              <Loader2 className="h-5 w-5 animate-spin text-norix-blue" />
              <span className="text-[15px]">იძებნება...</span>
            </div>
          ) : suggestions.length > 0 ? (
            <>
              <p className="border-b border-norix-border px-5 py-3 text-xs font-semibold uppercase tracking-wide text-norix-gray-500">
                პროდუქტები
              </p>
              <ul>
                {suggestions.map((product) => (
                  <li key={product.id}>
                    <button
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => onSelectProduct(product.id)}
                      className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-norix-gray-100"
                    >
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-norix-gray-100">
                        {product.imageUrl ? (
                          <Image
                            src={product.imageUrl}
                            alt=""
                            fill
                            className="object-contain p-1"
                            sizes="48px"
                          />
                        ) : null}
                      </div>
                      <span className="min-w-0 flex-1 line-clamp-2 text-[15px] text-foreground">
                        {product.name}
                      </span>
                      <span className="shrink-0 text-sm font-semibold text-norix-blue">
                        {formatPrice(product.price)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={onShowAll}
                className="flex w-full items-center justify-center gap-2 border-t border-norix-border px-5 py-4 text-[15px] font-semibold text-norix-blue transition-colors hover:bg-norix-gray-100"
              >
                <Search className="h-4 w-4" />
                ყველა შედეგის ნახვა „{trimmed}“
                <ArrowRight className="h-4 w-4" />
              </button>
            </>
          ) : (
            <div className="px-5 py-8 text-center">
              <p className="text-[15px] text-norix-gray-600">
                „{trimmed}“-ის მიხედვით პროდუქტი ვერ მოიძებნა
              </p>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={onShowAll}
                className="mt-4 text-sm font-semibold text-norix-blue hover:underline"
              >
                მაინც ძებნის გვერდზე გადასვლა
              </button>
            </div>
          )}
        </>
      ) : null}

      {showHints && filteredHistory.length > 0 ? (
        <div className={hasQuery ? "border-t border-norix-border" : ""}>
          <p className="border-b border-norix-border px-5 py-3 text-xs font-semibold uppercase tracking-wide text-norix-gray-500">
            ბოლო მოძიებული
          </p>
          <ul>
            {filteredHistory.slice(0, 5).map((term) => (
              <li key={term}>
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => onSelectQuery(term)}
                  className="flex w-full items-center gap-3 px-5 py-3 text-left text-[15px] text-foreground transition-colors hover:bg-norix-gray-100"
                >
                  <Clock className="h-4 w-4 shrink-0 text-norix-gray-400" />
                  {term}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {showHints && filteredPopular.length > 0 ? (
        <div
          className={
            filteredHistory.length > 0 || hasQuery
              ? "border-t border-norix-border"
              : ""
          }
        >
          <div className="flex items-center gap-2 border-b border-norix-border px-5 py-3">
            <Sparkles className="h-4 w-4 text-norix-magenta" />
            <p className="text-xs font-semibold uppercase tracking-wide text-norix-gray-500">
              პოპულარული
            </p>
          </div>
          <div className="flex flex-wrap gap-2 px-5 py-4">
            {filteredPopular.slice(0, 6).map((term) => (
              <button
                key={term}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => onSelectQuery(term)}
                className="rounded-full border border-norix-border bg-norix-gray-100 px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-norix-blue-light hover:bg-white"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
