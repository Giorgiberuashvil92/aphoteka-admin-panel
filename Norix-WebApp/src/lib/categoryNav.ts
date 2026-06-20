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

export function buildMainCategoryCards(categories: Category[]) {
  const cards = [
    {
      key: "medications",
      title: "აფთიაქი",
      apiName: "მედიკამენტები",
      bg: "bg-norix-green",
    },
    {
      key: "mother-child",
      title: "ოჯახზე ზრუნვა",
      apiName: "დედა და ბავშვი",
      bg: "bg-norix-yellow",
    },
    {
      key: "cosmetics",
      title: "სილამაზე",
      apiName: "კოსმეტიკა და პირადი ჰიგიენა",
      bg: "bg-norix-magenta",
    },
  ] as const;

  return cards.flatMap((card) => {
    const category = categories.find((item) => item.name === card.apiName);
    if (!category) return [];
    return [{ ...card, href: `/category/${category.id}` }];
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
