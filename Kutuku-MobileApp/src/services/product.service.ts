import {
  Medicine,
  ProductSeriesEntry,
  ProductStockByWarehouse,
} from '@/src/types/medicine.types';
import { API_CONFIG } from '@/src/config/api.config';

export type Product = Medicine;

/** Metro / Xcode კონსოლში: რა მოდის API-დან vs რა გამოდის map-ის შემდეგ */
const LOG_PRODUCTS_DEBUG =
  typeof __DEV__ !== 'undefined' && __DEV__;

function logFeaturedProductsPipeline(
  phase: 'raw' | 'mapped',
  payload: {
    url?: string;
    status?: number;
    jsonTopKeys?: string[];
    rawCount?: number;
    filteredCount?: number;
    sampleRaw?: Record<string, unknown> | null;
    sampleMapped?: Record<string, unknown> | null;
  }
) {
  if (!LOG_PRODUCTS_DEBUG) return;
  console.log(`[ProductService][featured ${phase}]`, JSON.stringify(payload, null, 2));
}

/** რიცხვის გაწმენდა — თუ finite და >= 0, დაბრუნდება, წინააღმდეგ შემთხვევაში fallback */
function toSafeNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/** Product.balanceStockBreakdown → UI hidden stockByWarehouse[] */
function mapStockByWarehouse(raw: unknown): ProductStockByWarehouse[] | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined;
  return raw
    .map((row: any) => {
      const quantity = toSafeNumber(row?.quantity, 0);
      const reserve = toSafeNumber(row?.reserve, 0);
      const available = Math.max(quantity - reserve, 0);
      const warehouseUuid =
        typeof row?.balanceWarehouseUuid === 'string'
          ? row.balanceWarehouseUuid
          : '';
      if (!warehouseUuid) return null;
      return {
        warehouseUuid,
        warehouseName:
          typeof row?.balanceWarehouseName === 'string'
            ? row.balanceWarehouseName
            : undefined,
        branchUuid:
          typeof row?.balanceBranchUuid === 'string'
            ? row.balanceBranchUuid
            : undefined,
        quantity,
        reserve,
        available,
        seriesUuid:
          typeof row?.seriesUuid === 'string' ? row.seriesUuid : undefined,
      } as ProductStockByWarehouse;
    })
    .filter((x): x is ProductStockByWarehouse => x !== null);
}

/** Product.balanceItemSeries → UI hidden series[] */
function mapSeries(raw: unknown): ProductSeriesEntry[] | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined;
  return raw.map((row: any) => ({
    seriesUuid: typeof row?.seriesUuid === 'string' ? row.seriesUuid : undefined,
    seriesNumber:
      typeof row?.seriesNumber === 'string' ? row.seriesNumber : undefined,
    quantity: Number.isFinite(Number(row?.quantity))
      ? Number(row.quantity)
      : undefined,
    expiryDate:
      typeof row?.expiryDate === 'string' ? row.expiryDate : undefined,
    warehouseUuid:
      typeof row?.warehouseUuid === 'string' ? row.warehouseUuid : undefined,
  }));
}

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

  const stockByWarehouse = mapStockByWarehouse(p?.balanceStockBreakdown);
  const series = mapSeries(p?.balanceItemSeries);

  const listPrice = Number.isFinite(Number(p?.price)) ? Number(p.price) : 0;
  const pct =
    Number.isFinite(Number(p?.balanceDiscountPercent)) &&
    Number(p.balanceDiscountPercent) > 0
      ? Number(p.balanceDiscountPercent)
      : undefined;
  const amt =
    pct === undefined &&
    Number.isFinite(Number(p?.balanceDiscountAmount)) &&
    Number(p.balanceDiscountAmount) > 0
      ? Number(p.balanceDiscountAmount)
      : undefined;

  let displayPrice = listPrice;
  let oldPrice: number | undefined;
  let discountPercentage: number | undefined;
  let discountPrice: number | undefined;

  if (pct !== undefined && listPrice > 0) {
    discountPercentage = Math.round(pct);
    oldPrice = listPrice;
    displayPrice = Math.round(listPrice * (1 - pct / 100) * 100) / 100;
    discountPrice = displayPrice;
  } else if (amt !== undefined && listPrice > 0) {
    oldPrice = listPrice;
    displayPrice = Math.max(0, Math.round((listPrice - amt) * 100) / 100);
    discountPrice = displayPrice;
    discountPercentage = Math.round((amt / listPrice) * 100);
  }

  const quantity = Number.isFinite(Number(p?.quantity))
    ? Number(p.quantity)
    : undefined;
  const reservedQuantity = Number.isFinite(Number(p?.reservedQuantity))
    ? Number(p.reservedQuantity)
    : undefined;
  /** ხელმისაწვდომი = total − reserved. Breakdown-იდან ჯამიც ვცდილობთ, თუ root ცარიელია. */
  const availableFromBreakdown = stockByWarehouse
    ? stockByWarehouse.reduce((s, w) => s + w.available, 0)
    : undefined;
  const availableQuantity =
    typeof quantity === 'number'
      ? Math.max(quantity - (reservedQuantity ?? 0), 0)
      : availableFromBreakdown;

  /** მარაგის UI სიგნალი: ხელმისაწვდომიდან + fallback-ი ძველ ქცევაზე (999), რომ დღევანდელი სცენარი არ გაფუჭდეს */
  const stockQuantity =
    typeof availableQuantity === 'number' ? availableQuantity : 999;
  const inStock = stockQuantity > 0;

  return {
    id: p.id,
    name: p.name,
    genericName: typeof p.genericName === 'string' ? p.genericName.trim() : '',
    strength: typeof p.strength === 'string' ? p.strength : '',
    activeIngredients:
      typeof p.activeIngredients === 'string' ? p.activeIngredients : '',
    nameGeo: p.name,
    brand: p.manufacturer || p.productNameBrand || '',
    price: displayPrice,
    oldPrice,
    discountPrice,
    discountPercentage,
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
    stockQuantity,
    lowStockThreshold: 10,
    inStock,
    rating: 4.5,
    reviewCount: 0,

    // hidden, Balance Sale-ის საჭიროებისთვის
    quantity,
    reservedQuantity,
    availableQuantity,
    stockByWarehouse,
    series,
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
        const url = `${API_CONFIG.BASE_URL}${API_CONFIG.endpoints.products.list}?page=1&limit=${limit}`;
        const res = await fetch(url);
        const json = await res.json().catch(() => ({}));
        const rawList: any[] = Array.isArray(json?.data) ? json.data : [];

        const pickDiscountSlice = (p: any) =>
          p
            ? {
                id: p.id ?? p._id,
                sku: p.sku,
                name: p.name,
                price: p.price,
                quantity: p.quantity,
                balanceDiscountPercent: p.balanceDiscountPercent,
                balanceDiscountAmount: p.balanceDiscountAmount,
                balanceDiscountName: p.balanceDiscountName,
                balanceDiscountUid: p.balanceDiscountUid,
                balanceNomenclatureItemUid: p.balanceNomenclatureItemUid,
              }
            : null;

        logFeaturedProductsPipeline('raw', {
          url,
          status: res.status,
          jsonTopKeys: json && typeof json === 'object' ? Object.keys(json) : [],
          rawCount: rawList.length,
          sampleRaw: pickDiscountSlice(rawList[0]) as Record<string, unknown> | null,
        });

        if (!res.ok) {
          console.warn('[ProductService] featured HTTP', res.status, json);
          return [];
        }

        const filtered = filterDisplayableProducts(rawList);
        const mapped = filtered.map(mapApiProductToMedicine);

        logFeaturedProductsPipeline('mapped', {
          filteredCount: filtered.length,
          sampleMapped: mapped[0]
            ? {
                id: mapped[0].id,
                price: mapped[0].price,
                oldPrice: mapped[0].oldPrice,
                discountPercentage: mapped[0].discountPercentage,
                stockQuantity: mapped[0].stockQuantity,
              }
            : null,
        });

        return mapped;
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
