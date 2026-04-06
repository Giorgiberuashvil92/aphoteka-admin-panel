import { Medicine } from '@/src/types/medicine.types';
import { API_CONFIG } from '@/src/config/api.config';

export type Product = Medicine;

const USE_API = true;

/** ადმინში დამალული Balance group-ის მსგავსი ჩანაწერების გამორიცხვა მობილურში */
function isLikelyCategoryPlaceholder(p: any): boolean {
  const hasStockBreakdown =
    Array.isArray(p?.balanceStockBreakdown) && p.balanceStockBreakdown.length > 0;
  const qty = Number(p?.quantity ?? 0);
  const hasQty = Number.isFinite(qty) && qty > 0;

  const hasDetails = Boolean(
    p?.unitOfMeasure ||
      p?.packSize ||
      p?.dosageForm ||
      p?.manufacturer ||
      p?.productNameBrand ||
      p?.activeIngredients ||
      p?.countryOfOrigin
  );

  const price = Number(p?.price ?? 0);
  const zeroPrice = Number.isFinite(price) && price === 0;

  // Placeholder ჯგუფები ჩვეულებრივ მხოლოდ Code/Name-ით არიან
  return !hasStockBreakdown && !hasQty && !hasDetails && zeroPrice;
}

function filterDisplayableProducts(rows: any[]): any[] {
  return rows.filter((p) => !isLikelyCategoryPlaceholder(p));
}

function mapApiProductToMedicine(p: any): Product {
  const sideEffects = Array.isArray(p.sideEffects)
    ? p.sideEffects.filter((x: unknown): x is string => typeof x === 'string')
    : [];
  const contraindications = Array.isArray(p.contraindications)
    ? p.contraindications.filter((x: unknown): x is string => typeof x === 'string')
    : [];
  return {
    id: p.id,
    name: p.name,
    genericName: typeof p.genericName === 'string' ? p.genericName.trim() : '',
    strength: typeof p.strength === 'string' ? p.strength : '',
    activeIngredients:
      typeof p.activeIngredients === 'string' ? p.activeIngredients : '',
    nameGeo: p.name,
    brand: p.manufacturer || p.productNameBrand || '',
    price: p.price ?? 0,
    thumbnail: p.imageUrl || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400',
    images: p.imageUrl ? [p.imageUrl] : [],
    description: p.description || '',
    descriptionGeo: p.description || '',
    annotation: p.usage || '',
    sideEffects,
    contraindications,
    storageConditions: p.storageConditions || '',
    category: p.category || '',
    dosageForm: p.dosageForm || '',
    packSize: p.packSize || undefined,
    prescriptionRequired: false,
    manufacturer: p.manufacturer || '',
    stockQuantity: 999,
    lowStockThreshold: 10,
    inStock: true,
    rating: 4.5,
    reviewCount: 0,
  };
}

export class ProductServiceClass {
  async getProductById(id: string): Promise<Product | null> {
    if (USE_API) {
      try {
        const res = await fetch(API_CONFIG.BASE_URL + API_CONFIG.endpoints.products.byId(id));
        if (!res.ok) return null;
        const data = await res.json();
        return mapApiProductToMedicine(data);
      } catch (e) {
        console.error('Error fetching product:', e);
        return null;
      }
    }
    return null;
  }

  async getProductsByCategory(categoryName: string, page = 1, limit = 20): Promise<{ data: Product[]; total: number }> {
    if (USE_API) {
      try {
        const url = `${API_CONFIG.BASE_URL}${API_CONFIG.endpoints.products.list}?page=${page}&limit=${limit}&category=${encodeURIComponent(categoryName)}`;
        const res = await fetch(url);
        if (!res.ok) return { data: [], total: 0 };
        const json = await res.json();
        const data = filterDisplayableProducts(json.data || []).map(
          mapApiProductToMedicine
        );
        return { data, total: json.total ?? data.length };
      } catch (e) {
        console.error('Error fetching products by category:', e);
        return { data: [], total: 0 };
      }
    }
    return { data: [], total: 0 };
  }

  async searchProducts(query: string, page = 1, limit = 20): Promise<{ data: Product[]; total: number }> {
    return this.getProductsFiltered({ search: query || undefined, page, limit });
  }

  /** ძიება + კატეგორია (ორივე ნებისმიერი კომბინაციით). სახელით, კატეგორიით, ყველაფრით. */
  async getProductsFiltered(params: {
    search?: string;
    category?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: Product[]; total: number }> {
    if (!USE_API) return { data: [], total: 0 };
    try {
      const page = params.page ?? 1;
      const limit = params.limit ?? 100;
      const searchParams = new URLSearchParams();
      searchParams.set('page', String(page));
      searchParams.set('limit', String(limit));
      if (params.search?.trim()) searchParams.set('search', params.search.trim());
      if (params.category?.trim()) searchParams.set('category', params.category.trim());
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.endpoints.products.list}?${searchParams.toString()}`;
      const res = await fetch(url);
      if (!res.ok) return { data: [], total: 0 };
      const json = await res.json();
      const data = filterDisplayableProducts(json.data || []).map(
        mapApiProductToMedicine
      );
      return { data, total: json.total ?? data.length };
    } catch (e) {
      console.error('Error fetching products:', e);
      return { data: [], total: 0 };
    }
  }

  async getFeaturedProducts(limit = 8): Promise<Product[]> {
    if (USE_API) {
      try {
        const res = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.endpoints.products.list}?page=1&limit=${limit}`);
        if (!res.ok) return [];
        const json = await res.json();
        return filterDisplayableProducts(json.data || []).map(
          mapApiProductToMedicine
        );
      } catch (e) {
        console.error('Error fetching featured products:', e);
        return [];
      }
    }
    return [];
  }

  async getCategories(): Promise<{ id: string; name: string }[]> {
    if (USE_API) {
      try {
        const res = await fetch(API_CONFIG.BASE_URL + API_CONFIG.endpoints.products.categories);
        if (!res.ok) return [];
        return await res.json();
      } catch (e) {
        console.error('Error fetching categories:', e);
        return [];
      }
    }
    return [];
  }

  async getSimilarProducts(productId: string): Promise<Product[]> {
    const product = await this.getProductById(productId);
    if (!product) return [];
    const { data } = await this.getProductsByCategory(product.category, 1, 4);
    return data.filter((p) => p.id !== productId);
  }
}

export const ProductService = new ProductServiceClass();
