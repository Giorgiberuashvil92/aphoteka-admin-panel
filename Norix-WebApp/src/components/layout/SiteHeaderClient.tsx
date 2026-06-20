"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  ChevronUp,
  Heart,
  LayoutGrid,
  MapPin,
  ShoppingCart,
  Sparkles,
  User,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Category } from "@/types/category";
import { useAuth } from "@/contexts/AuthProvider";
import { useCart } from "@/contexts/CartProvider";
import { useFavorites } from "@/contexts/FavoritesProvider";
import {
  buildHeaderNavLinks,
  categoryIdFromPath,
  isHeaderNavActive,
} from "@/lib/categoryNav";
import { formatPriceSpaced } from "@/lib/format";
import { UserProfileDropdown } from "./UserProfileDropdown";
import { CategoriesPanel } from "./CategoriesPanel";
import { HeaderSearchSlot } from "./HeaderSearchSlot";

const UTILITY_LINKS = [] as const;

interface SiteHeaderClientProps {
  categories: Category[];
}

export function SiteHeaderClient({ categories }: SiteHeaderClientProps) {
  const pathname = usePathname();
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const { openAuth, user } = useAuth();
  const { itemCount, totalPrice, openDrawer } = useCart();
  const { itemCount: favoriteCount } = useFavorites();

  const navLinks = useMemo(
    () => buildHeaderNavLinks(categories),
    [categories],
  );
  const activeCategoryId = categoryIdFromPath(pathname);

  const profileLabel =
    user?.firstName?.trim().slice(0, 3) ||
    user?.email?.trim().slice(0, 3) ||
    "";

  const closeCategories = useCallback(() => setCategoriesOpen(false), []);
  const toggleCategories = useCallback(
    () => setCategoriesOpen((open) => !open),
    [],
  );

  useEffect(() => {
    setCategoriesOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const updateHeaderHeight = () => {
      if (headerRef.current) {
        document.documentElement.style.setProperty(
          "--header-height",
          `${headerRef.current.offsetHeight}px`,
        );
      }
    };
    updateHeaderHeight();
    window.addEventListener("resize", updateHeaderHeight);
    return () => window.removeEventListener("resize", updateHeaderHeight);
  }, [categoriesOpen]);

  useEffect(() => {
    if (!categoriesOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCategories();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [categoriesOpen, closeCategories]);

  return (
    <div className="relative">
      <header
        ref={headerRef}
        className="sticky top-0 z-50 border-b border-norix-border bg-white shadow-sm"
      >
        <div className="w-full px-4 md:px-8 lg:px-12">
          <div className="flex items-center gap-4 py-3 md:gap-6 md:py-4">
            <Link href="/" className="shrink-0" onClick={closeCategories}>
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-norix-blue md:h-12 md:w-12">
                <span className="text-base font-bold tracking-tight text-white">
                  NX
                </span>
              </div>
            </Link>

            <Suspense
              fallback={
                <button
                  type="button"
                  className="flex h-11 flex-1 items-center rounded-full border border-norix-border bg-norix-gray-100 md:h-12"
                  aria-hidden
                />
              }
            >
              <HeaderSearchSlot onPanelOpen={closeCategories} />
            </Suspense>

            <div className="flex shrink-0 items-center gap-1 md:gap-3">
              <Link
                href="/account/favorites"
                className="relative flex h-11 w-11 items-center justify-center rounded-full text-norix-gray-600 transition-colors hover:bg-norix-gray-100"
                aria-label="ვიშლისტი"
              >
                <Heart className="h-6 w-6" />
                {favoriteCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-norix-blue px-1 text-[11px] font-bold text-white">
                    {favoriteCount}
                  </span>
                )}
              </Link>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    if (user) {
                      setProfileOpen((open) => !open);
                    } else {
                      openAuth("login");
                    }
                  }}
                  className={`flex h-11 min-w-11 items-center justify-center rounded-full px-3 text-sm font-semibold transition-colors ${
                    user
                      ? "bg-norix-gray-100 text-foreground hover:bg-norix-gray-200"
                      : "text-norix-gray-600 hover:bg-norix-gray-100"
                  }`}
                  aria-label={user ? "ანგარიში" : "ავტორიზაცია"}
                  aria-expanded={profileOpen}
                >
                  {user ? (
                    profileLabel
                  ) : (
                    <User className="h-6 w-6" />
                  )}
                </button>
                {user && (
                  <UserProfileDropdown
                    open={profileOpen}
                    onClose={() => setProfileOpen(false)}
                  />
                )}
              </div>
              <button
                type="button"
                onClick={openDrawer}
                className="flex items-center gap-2 rounded-full bg-norix-gray-100 px-3 py-2 text-norix-gray-600 transition-colors hover:bg-norix-gray-200"
              >
                <span className="relative">
                  <ShoppingCart className="h-6 w-6" />
                  {itemCount > 0 && (
                    <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-norix-blue px-1 text-[11px] font-bold text-white">
                      {itemCount}
                    </span>
                  )}
                </span>
                <span className="hidden text-base font-semibold text-foreground md:inline">
                  {itemCount > 0 ? formatPriceSpaced(totalPrice) : "კალათა"}
                </span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-norix-border py-3">
            <div className="-mx-4 flex flex-1 items-center gap-1 overflow-x-auto px-4 scrollbar-none md:mx-0 md:flex-wrap md:overflow-visible md:px-0 md:gap-2">
              <button
                type="button"
                onClick={toggleCategories}
                aria-expanded={categoriesOpen}
                aria-haspopup="true"
                className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-base font-semibold transition-colors md:px-4 md:text-[17px] ${
                  categoriesOpen
                    ? "bg-norix-gray-100 text-norix-blue"
                    : "text-norix-gray-600 hover:bg-norix-gray-100"
                }`}
              >
                <LayoutGrid className="h-5 w-5" />
                <span>კატეგორიები</span>
                {categoriesOpen ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </button>

              {navLinks.map((link) => {
                const active = isHeaderNavActive(pathname, link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={closeCategories}
                    className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-base transition-colors md:text-[17px] ${
                      active
                        ? "bg-norix-gray-100 font-semibold text-norix-blue"
                        : "font-medium text-norix-gray-600 hover:bg-norix-gray-100 hover:text-foreground"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}

              <button
                type="button"
                className="hidden items-center gap-2 rounded-full border border-norix-magenta/30 bg-norix-magenta-light px-4 py-2 text-base font-medium text-norix-magenta transition-colors hover:bg-norix-magenta/10 sm:flex md:text-[17px]"
              >
                <Sparkles className="h-4 w-4" />
                Norix ასისტენტი
              </button>
            </div>

            <div className="hidden items-center gap-5 lg:flex">
              {UTILITY_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-norix-gray-400 transition-colors hover:text-norix-gray-600 md:text-base"
                >
                  {link.label}
                </Link>
              ))}
              <button
                type="button"
                className="flex items-center gap-1.5 text-sm text-norix-gray-400 transition-colors hover:text-norix-gray-600 md:text-base"
              >
                <MapPin className="h-4 w-4" />
                აირჩიეთ ქალაქი
              </button>
            </div>
          </div>
        </div>
      </header>

      {categoriesOpen && (
        <CategoriesPanel
          key={activeCategoryId ?? "default"}
          categories={categories}
          initialActiveId={activeCategoryId}
          onClose={closeCategories}
        />
      )}
    </div>
  );
}
