import { API_CONFIG } from "@/config/api.config";
import type {
  PaginatedProducts,
  Product,
  ProductDetail,
  ProductSort,
} from "@/types/product";

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400";

function mapApiProduct(raw: Record<string, unknown>): Product {
  const listPrice = Number(raw.price ?? raw.listPrice ?? 0);
  const discountAmt = Number(raw.discountAmount ?? raw.balanceDiscountAmount ?? 0);
  const discountPct = Number(
    raw.discountPercent ?? raw.discountPercentage ?? raw.balanceDiscountPercent ?? 0,
  );

  let price = listPrice;
  let oldPrice: number | undefined;
  let discountPercentage: number | undefined;

  if (discountPct > 0 && listPrice > 0) {
    discountPercentage = Math.round(discountPct);
    price = Math.max(0, listPrice * (1 - discountPct / 100));
    oldPrice = listPrice;
  } else if (discountAmt > 0 && listPrice > 0) {
    price = Math.max(0, listPrice - discountAmt);
    oldPrice = listPrice;
    discountPercentage = Math.round((discountAmt / listPrice) * 100);
  }

  const subcategory = String(raw.subcategory ?? "").trim();
  const therapeuticClass = String(raw.category ?? "").trim();

  const brand = String(
    raw.manufacturer ?? raw.productNameBrand ?? raw.brand ?? "",
  ).trim();

  return {
    id: String(raw.id ?? raw._id ?? ""),
    name: String(raw.name ?? ""),
    brand: brand || undefined,
    price,
    oldPrice,
    discountPercentage,
    imageUrl: String(raw.imageUrl ?? PLACEHOLDER_IMAGE),
    category: String(raw.mainCategory ?? therapeuticClass ?? ""),
    subcategory,
    countryOfOrigin: String(raw.countryOfOrigin ?? "").trim() || undefined,
  };
}

function mapApiProductDetail(raw: Record<string, unknown>): ProductDetail {
  const base = mapApiProduct(raw);
  const therapeuticClass = String(raw.category ?? "").trim();

  return {
    ...base,
    sku: String(raw.sku ?? raw.productCode ?? ""),
    description: String(raw.description ?? "").trim() || undefined,
    quantity: raw.quantity != null ? Number(raw.quantity) : undefined,
    unitOfMeasure: String(raw.unitOfMeasure ?? "").trim() || undefined,
    genericName: String(raw.genericName ?? "").trim() || undefined,
    manufacturer: String(raw.manufacturer ?? "").trim() || undefined,
    productNameBrand: String(raw.productNameBrand ?? "").trim() || undefined,
    mainCategory: String(raw.mainCategory ?? "").trim() || undefined,
    therapeuticClass: therapeuticClass || undefined,
    usage: String(raw.usage ?? "").trim() || undefined,
    storageConditions: String(raw.storageConditions ?? "").trim() || undefined,
    activeIngredients: String(raw.activeIngredients ?? "").trim() || undefined,
    sideEffects: Array.isArray(raw.sideEffects)
      ? raw.sideEffects.map((item) => String(item)).filter(Boolean)
      : undefined,
    contraindications: Array.isArray(raw.contraindications)
      ? raw.contraindications.map((item) => String(item)).filter(Boolean)
      : undefined,
    packSize: String(raw.packSize ?? "").trim() || undefined,
    dosageForm: String(raw.dosageForm ?? "").trim() || undefined,
    strength: String(raw.strength ?? "").trim() || undefined,
  };
}

function sortProducts(products: Product[], sort: ProductSort): Product[] {
  const copy = [...products];
  switch (sort) {
    case "price-asc":
      return copy.sort((a, b) => a.price - b.price);
    case "price-desc":
      return copy.sort((a, b) => b.price - a.price);
    case "name":
      return copy.sort((a, b) => a.name.localeCompare(b.name, "ka"));
    default:
      return copy;
  }
}

export interface FetchCategoryProductsParams {
  categoryName: string;
  subcategory?: string;
  page?: number;
  limit?: number;
  minPrice?: number;
  maxPrice?: number;
  sort?: ProductSort;
  activeSubs?: string[];
}

export async function fetchCategoryProducts(
  params: FetchCategoryProductsParams,
): Promise<PaginatedProducts> {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  const activeSubs = params.activeSubs ?? [];
  const useMultiSubFilter = activeSubs.length > 1;
  const singleSub =
    activeSubs.length === 1 ? activeSubs[0] : params.subcategory;

  try {
    const searchParams = new URLSearchParams();
    searchParams.set("page", String(useMultiSubFilter ? 1 : page));
    searchParams.set(
      "limit",
      String(useMultiSubFilter ? 300 : limit),
    );
    searchParams.set("active", "true");
    searchParams.set("category", params.categoryName);
    if (singleSub && !useMultiSubFilter) {
      searchParams.set("subcategory", singleSub);
    }
    if (params.minPrice != null) {
      searchParams.set("minPrice", String(params.minPrice));
    }
    if (params.maxPrice != null) {
      searchParams.set("maxPrice", String(params.maxPrice));
    }

    const url = `${API_CONFIG.BASE_URL}/products?${searchParams.toString()}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return { data: [], total: 0, page, limit };

    const json = await res.json();
    let data: Product[] = (json.data ?? []).map(mapApiProduct);

    if (useMultiSubFilter) {
      data = data.filter((p) =>
        activeSubs.includes(p.subcategory ?? ""),
      );
    }

    if (params.sort) {
      data = sortProducts(data, params.sort);
    }

    const total = useMultiSubFilter ? data.length : (json.total ?? data.length);

    if (useMultiSubFilter) {
      const start = (page - 1) * limit;
      data = data.slice(start, start + limit);
    }

    return { data, total, page, limit };
  } catch {
    return { data: [], total: 0, page, limit };
  }
}

export async function fetchSearchSuggestions(
  search: string,
  limit = 8,
): Promise<Product[]> {
  const { data } = await fetchSearchProducts({
    search,
    page: 1,
    limit,
    sort: "popular",
  });
  return data;
}

export async function fetchSearchProducts(
  params: {
    search: string;
    page?: number;
    limit?: number;
    sort?: ProductSort;
    minPrice?: number;
    maxPrice?: number;
  },
): Promise<PaginatedProducts> {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  const query = params.search.trim();

  if (!query) {
    return { data: [], total: 0, page, limit };
  }

  try {
    const searchParams = new URLSearchParams();
    searchParams.set("page", String(page));
    searchParams.set("limit", String(limit));
    searchParams.set("active", "true");
    searchParams.set("search", query);
    if (params.minPrice != null) {
      searchParams.set("minPrice", String(params.minPrice));
    }
    if (params.maxPrice != null) {
      searchParams.set("maxPrice", String(params.maxPrice));
    }

    const url = `${API_CONFIG.BASE_URL}/products?${searchParams.toString()}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return { data: [], total: 0, page, limit };

    const json = await res.json();
    let data: Product[] = (json.data ?? []).map(mapApiProduct);

    if (params.sort) {
      data = sortProducts(data, params.sort);
    }

    return {
      data,
      total: json.total ?? data.length,
      page: json.page ?? page,
      limit: json.limit ?? limit,
    };
  } catch {
    return { data: [], total: 0, page, limit };
  }
}

export async function fetchProducts(
  limit = 5,
  page = 1,
): Promise<PaginatedProducts> {
  try {
    const url = `${API_CONFIG.BASE_URL}/products?page=${page}&limit=${limit}&active=true`;
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return { data: [], total: 0, page, limit };
    const json = await res.json();
    const data = (json.data ?? []).map(mapApiProduct);
    return {
      data,
      total: json.total ?? data.length,
      page: json.page ?? page,
      limit: json.limit ?? limit,
    };
  } catch {
    return { data: [], total: 0, page, limit };
  }
}

export async function fetchFeaturedProducts(limit = 5): Promise<Product[]> {
  const { data } = await fetchProducts(limit);
  return data;
}

export async function fetchProductById(
  id: string,
): Promise<ProductDetail | null> {
  try {
    const url = `${API_CONFIG.BASE_URL}/products/${id}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const raw = await res.json();
    return mapApiProductDetail(raw);
  } catch {
    return null;
  }
}
