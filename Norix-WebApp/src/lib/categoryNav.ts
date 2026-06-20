import type { Category } from "@/types/category";

/** მობილურის MAIN_CATEGORY_API_NAMES — API-ს სახელები */
export const FEATURED_CATEGORIES = [
  { apiName: "მედიკამენტები", label: "მედიკამენტები" },
  { apiName: "კოსმეტიკა და პირადი ჰიგიენა", label: "კოსმეტიკა" },
  { apiName: "დედა და ბავშვი", label: "დედა & ბავშვი" },
] as const;

export interface HeaderNavLink {
  label: string;
  href: string;
}

export function buildHeaderNavLinks(categories: Category[]): HeaderNavLink[] {
  const categoryLinks: HeaderNavLink[] = [];

  for (const featured of FEATURED_CATEGORIES) {
    const category = categories.find((item) => item.name === featured.apiName);
    if (!category) continue;
    categoryLinks.push({
      label: featured.label,
      href: `/category/${category.id}`,
    });
  }

  return categoryLinks;
}

const CATEGORY_KEYS: Record<(typeof FEATURED_CATEGORIES)[number]["apiName"], string> = {
  "მედიკამენტები": "medications",
  "კოსმეტიკა და პირადი ჰიგიენა": "cosmetics",
  "დედა და ბავშვი": "mother-child",
};

export interface MainCategoryCard {
  key: string;
  title: string;
  href: string;
  apiName: string;
}

export function buildMainCategoryCards(categories: Category[]): MainCategoryCard[] {
  return FEATURED_CATEGORIES.flatMap((featured) => {
    const category = categories.find((item) => item.name === featured.apiName);
    if (!category) return [];
    return [
      {
        key: CATEGORY_KEYS[featured.apiName],
        title: featured.label,
        href: `/category/${category.id}`,
        apiName: featured.apiName,
      },
    ];
  });
}

export function categoryIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/category\/([^/?#]+)/);
  return match?.[1] ?? null;
}

export function isHeaderNavActive(pathname: string, href: string): boolean {
  if (href.startsWith("/category/")) {
    const hrefId = href.replace("/category/", "");
    const pathId = categoryIdFromPath(pathname);
    return pathId === hrefId;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
