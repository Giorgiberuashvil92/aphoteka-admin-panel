"use client";

import { Search, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { SearchSuggestionsPanel } from "@/components/search/SearchSuggestionsPanel";
import { fetchSearchSuggestions } from "@/lib/api/products";
import { addSearchHistory, getSearchHistory } from "@/lib/search/history";
import type { Product } from "@/types/product";

interface HeaderSearchFormProps {
  initialQuery: string;
  onPanelOpen?: () => void;
}

function HeaderSearchForm({ initialQuery, onPanelOpen }: HeaderSearchFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isSearchPage = pathname === "/search";
  const inputRef = useRef<HTMLInputElement>(null);

  const [value, setValue] = useState(initialQuery);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [mounted] = useState(() => typeof document !== "undefined");
  const requestId = useRef(0);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setLoading(false);
  }, []);

  const openModal = useCallback(() => {
    setHistory(getSearchHistory());
    if (isSearchPage && initialQuery.trim()) {
      setValue(initialQuery.trim());
    }
    setModalOpen(true);
    onPanelOpen?.();
  }, [initialQuery, isSearchPage, onPanelOpen]);

  const submitSearch = useCallback(
    (raw: string) => {
      const query = raw.trim();
      closeModal();
      if (!query) {
        if (isSearchPage) {
          router.push("/search");
        }
        return;
      }

      addSearchHistory(query);
      router.push(`/search?q=${encodeURIComponent(query)}`);
    },
    [closeModal, isSearchPage, router],
  );

  useEffect(() => {
    if (!modalOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const timer = window.setTimeout(() => inputRef.current?.focus(), 50);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeModal();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [modalOpen, closeModal]);

  useEffect(() => {
    const query = value.trim();
    if (!modalOpen || query.length < 1) return;

    const currentRequest = ++requestId.current;

    const timer = setTimeout(() => {
      setLoading(true);
      void fetchSearchSuggestions(query, 8)
        .then((data) => {
          if (currentRequest !== requestId.current) return;
          setSuggestions(data);
        })
        .catch(() => {
          if (currentRequest !== requestId.current) return;
          setSuggestions([]);
        })
        .finally(() => {
          if (currentRequest !== requestId.current) return;
          setLoading(false);
        });
    }, 250);

    return () => clearTimeout(timer);
  }, [value, modalOpen]);

  const triggerLabel =
    isSearchPage && initialQuery.trim()
      ? initialQuery.trim()
      : "მედიკამენტი, ბრენდი ან სიმპტომი";

  const modal =
    modalOpen && mounted
      ? createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[max(1.5rem,env(safe-area-inset-top))] sm:pt-24"
            role="dialog"
            aria-modal="true"
            aria-label="ძებნა"
          >
            <button
              type="button"
              aria-label="ძებნის დახურვა"
              className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
              onClick={closeModal}
            />

            <div className="relative z-10 w-full max-w-2xl">
              <div className="overflow-hidden rounded-2xl border border-norix-border bg-white shadow-2xl">
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    submitSearch(value);
                  }}
                  className="relative border-b border-norix-border"
                >
                  <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-norix-gray-400" />
                  <input
                    ref={inputRef}
                    type="search"
                    value={value}
                    onChange={(event) => {
                      const next = event.target.value;
                      setValue(next);
                      if (next.trim()) setLoading(true);
                    }}
                    placeholder="მედიკამენტი, ბრენდი ან სიმპტომი"
                    enterKeyHint="search"
                    autoComplete="off"
                    role="combobox"
                    aria-controls="search-suggestions"
                    aria-expanded={modalOpen}
                    aria-haspopup="listbox"
                    aria-label="ძებნა"
                    className="h-14 w-full bg-white pl-14 pr-24 text-base outline-none placeholder:text-norix-gray-400 md:text-[17px]"
                  />
                  <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1">
                    {value ? (
                      <button
                        type="button"
                        onClick={() => {
                          setValue("");
                          setSuggestions([]);
                          inputRef.current?.focus();
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-norix-gray-500 hover:bg-norix-gray-100"
                        aria-label="გასუფთავება"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={closeModal}
                      className="rounded-lg px-3 py-1.5 text-sm font-medium text-norix-gray-600 hover:bg-norix-gray-100"
                    >
                      გაუქმება
                    </button>
                  </div>
                </form>

                <div
                  id="search-suggestions"
                  className="max-h-[min(60vh,420px)] overflow-y-auto"
                >
                  <SearchSuggestionsPanel
                    embedded
                    query={value}
                    loading={loading}
                    suggestions={suggestions}
                    history={history}
                    onSelectQuery={(term) => {
                      setValue(term);
                      submitSearch(term);
                    }}
                    onSelectProduct={(productId) => {
                      closeModal();
                      addSearchHistory(value.trim() || productId);
                      router.push(`/product/${productId}`);
                    }}
                    onShowAll={() => submitSearch(value)}
                  />
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="flex h-11 w-full flex-1 items-center gap-3 rounded-full border border-norix-border bg-norix-gray-100 px-5 text-left transition-colors hover:border-norix-blue-light hover:bg-white md:h-12"
        aria-label="ძებნის გახსნა"
      >
        <Search className="h-5 w-5 shrink-0 text-norix-gray-400" />
        <span
          className={`truncate text-base md:text-[17px] ${
            isSearchPage && initialQuery.trim()
              ? "font-medium text-foreground"
              : "text-norix-gray-400"
          }`}
        >
          {triggerLabel}
        </span>
      </button>
      {modal}
    </>
  );
}

interface HeaderSearchProps {
  urlQuery: string;
  isSearchPage: boolean;
  onPanelOpen?: () => void;
}

export function HeaderSearch({
  urlQuery,
  isSearchPage,
  onPanelOpen,
}: HeaderSearchProps) {
  return (
    <HeaderSearchForm
      key={isSearchPage ? `search-${urlQuery}` : "header-search"}
      initialQuery={isSearchPage ? urlQuery : ""}
      onPanelOpen={onPanelOpen}
    />
  );
}
