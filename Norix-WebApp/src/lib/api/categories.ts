import { API_CONFIG } from "@/config/api.config";
import type { Category, Subcategory } from "@/types/category";

export async function fetchCategories(): Promise<Category[]> {
  try {
    const url = `${API_CONFIG.BASE_URL}/categories/mobile`;
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function fetchSubcategories(
  categoryId: string,
): Promise<Subcategory[]> {
  try {
    const url = `${API_CONFIG.BASE_URL}/categories/${categoryId}/subcategories`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function fetchCategoryById(
  categoryId: string,
): Promise<Category | null> {
  try {
    const url = `${API_CONFIG.BASE_URL}/categories/${categoryId}`;
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const raw = await res.json();
    return {
      id: String(raw.id ?? categoryId),
      name: String(raw.name ?? ""),
      productCount: Number(raw.productCount ?? 0),
      color: raw.color,
      icon: raw.icon,
      imageUrl: raw.imageUrl,
    };
  } catch {
    return null;
  }
}
