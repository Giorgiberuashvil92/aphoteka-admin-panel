import { API_CONFIG } from '@/src/config/api.config';

export interface CategoryItem {
  id: string;
  name: string;
  productCount: number;
  color?: string;
  icon?: string;
  imageUrl?: string;
}

/** იგივე shape რაც CategoryItem — drill-down ქარდებისთვის */
export type SubcategoryItem = CategoryItem;

const USE_API = true;

function normalizeCategoryList(data: unknown): CategoryItem[] {
  if (Array.isArray(data)) {
    return data
      .map((row) => {
        if (!row || typeof row !== 'object') return null;
        const o = row as Record<string, unknown>;
        const id = String(o.id ?? o._id ?? '').trim();
        const name = String(o.name ?? '').trim();
        if (!id || !name) return null;
        return {
          id,
          name,
          productCount: Number(o.productCount) || 0,
          color: typeof o.color === 'string' ? o.color : undefined,
          icon: typeof o.icon === 'string' ? o.icon : undefined,
          imageUrl: typeof o.imageUrl === 'string' ? o.imageUrl : undefined,
        } satisfies CategoryItem;
      })
      .filter((x): x is CategoryItem => x != null);
  }
  return [];
}

export class CategoryServiceClass {
  async getCategories(): Promise<CategoryItem[]> {
    if (!USE_API) return [];
    try {
      const res = await fetch(API_CONFIG.BASE_URL + API_CONFIG.endpoints.categories.mobile);
      if (!res.ok) return [];
      const data = await res.json();
      return normalizeCategoryList(data);
    } catch (e) {
      console.error('Error fetching categories:', e);
      return [];
    }
  }

  async getSubcategories(categoryId: string): Promise<SubcategoryItem[]> {
    if (!USE_API || !categoryId.trim()) return [];
    const id = encodeURIComponent(categoryId.trim());

    try {
      const primary = await fetch(
        `${API_CONFIG.BASE_URL}/categories/${id}/subcategories`,
      );
      if (primary.ok) {
        const list = normalizeCategoryList(await primary.json());
        if (list.length > 0) return list;
      }

      /** იგივე query რაც ადმინ drill-down — fallback თუ /subcategories ცარიელი/ვერ მოვიდა */
      const fallback = await fetch(
        `${API_CONFIG.BASE_URL}/categories?parentId=${id}&active=true`,
      );
      if (!fallback.ok) return [];
      return normalizeCategoryList(await fallback.json());
    } catch (e) {
      console.error('Error fetching subcategories:', e);
      return [];
    }
  }

  /** root → … → target */
  async getPath(
    categoryId: string,
  ): Promise<{ id: string; name: string; parentId?: string }[]> {
    if (!USE_API || !categoryId.trim()) return [];
    const id = encodeURIComponent(categoryId.trim());
    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}/categories/${id}/path`);
      if (!res.ok) return [];
      const data = await res.json();
      if (!Array.isArray(data)) return [];
      return data
        .map((row) => {
          if (!row || typeof row !== 'object') return null;
          const o = row as Record<string, unknown>;
          const cid = String(o.id ?? o._id ?? '').trim();
          const name = String(o.name ?? '').trim();
          if (!cid || !name) return null;
          return {
            id: cid,
            name,
            parentId:
              typeof o.parentId === 'string' && o.parentId
                ? o.parentId
                : undefined,
          };
        })
        .filter(
          (x): x is { id: string; name: string; parentId?: string } => x != null,
        );
    } catch (e) {
      console.error('Error fetching category path:', e);
      return [];
    }
  }
}

export const CategoryService = new CategoryServiceClass();
