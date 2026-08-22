"use client";

/**
 * პროდუქტების გვერდი
 * 
 * curl მოთხოვნები პროდუქტების დასამატებლად:
 * 
 * 1. ცალ-ცალკე პროდუქტების დამატება:
 *    ./add-products.sh
 * 
 * 2. Bulk დამატება (ყველა ერთად):
 *    ./add-products-bulk.sh
 * 
 * ან ხელით curl მოთხოვნებით:
 * 
 * ლოკალური Nest: curl -X POST "http://localhost:3001/api/products" \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "name": "პარაცეტამოლი 500მგ",
 *     "sku": "PAR-500-001",
 *     "price": 2.50,
 *     "quantity": 100,
 *     "totalPrice": 250.00,
 *     "unitOfMeasure": "ცალი",
 *     "genericName": "Paracetamol",
 *     "strength": "500 mg",
 *     "dosageForm": "tablet",
 *     "packSize": "10 tablets",
 *     "barcode": "1234567890123",
 *     "category": "Pain Relief",
 *     "manufacturer": "Bayer",
 *     "countryOfOrigin": "გერმანია",
 *     "productNameBrand": "Paracetamol 500mg - Bayer",
 *     "packagingType": "ფილმი",
 *     "active": true
 *   }'
 */

import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
  Suspense,
} from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Product, type BalanceItemsSeriesApiRow } from "@/types";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import { PlusIcon, PencilIcon, TrashBinIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import { useProducts } from "@/hooks/useProducts";
import { productsApi, warehousesApi, inventoryApi, categoriesApi } from "@/lib/api";
import type { AdminCategory } from "@/lib/api/categories";
import {
  getBalanceStocks,
  getBalancePrices,
  getBalanceDiscounts,
  getBalanceItemPricing,
  getBalanceExchangeStocks,
  itemPricingRowsForDbProducts,
  rowsFromBalanceStocks,
  rowsFromBalancePrices,
  rowsFromBalanceDiscounts,
  rowsFromBalanceItemPricing,
  rowsFromBalanceExchangeStocks,
} from "@/lib/api/balanceStocks";
import {
  getBalanceWarehouses,
  rowsFromBalanceWarehouses,
} from "@/lib/api/balanceWarehouses";
import ProductFormModal from "@/components/products/ProductFormModal";
import Pagination from "@/components/tables/Pagination";
import CategoryPathPicker, {
  pathIdsToCategoryFields,
  resolveCategoryPathIdsByBalanceUid,
  resolveCategoryPathIds,
} from "@/components/products/CategoryPathPicker";
import AddToWarehouseModal from "@/components/inventory/AddToWarehouseModal";
import { getAuthToken } from "@/lib/authToken";
import { api } from "@/lib/api/client";
import {
  buildBalanceItemNameByUid,
  exchangeStockRowNomenclatureItemUid,
  exchangeStockRowSeriesUid,
  getBalanceItems,
  isBalanceGroupRow,
  normalizeBalanceItemSeriesRows,
  normalizeBalanceItemsSeriesApiRows,
  pickItemsSeriesLinesForExchangeStockRow,
  summarizeItemsSeriesLinesForTable,
  itemsSeriesNumbersForTable,
  itemsSeriesValidUntilForTable,
  uniqueExchangeStockNomenclatureItemUids,
  nomenclatureUidForItemsSeriesFromBalanceItems,
  buildTaxationByUuid,
  buildDiscountMapsFromBalanceApi,
  getItemUuid,
  vatRateRawFromBalanceItemRow,
  productBalanceSerialDisplay,
  productBalanceExpiryDisplay,
  type BalanceItemSeriesLine,
  type BalanceDiscountMaps,
  type BalanceDiscountForItem,
} from "@/lib/api/balanceSync";
import { balanceUidForSku } from "@/lib/api/balancePricing";
import { BALANCE_PUBLICATION_TARGET } from "@/lib/balancePublicationTarget";

/**
 * Balance ინტეგრაცია ამ გვერდზე: ბრაუზერი იძახის მხოლოდ `/api/balance/*` (არა პირდაპირ cloud.balance.ge).
 * სერვერი `balanceClient`-ით აწყობს URL-ს (ItemsSeries: `…/sm/a/Balance/{id}/hs/Exchange/ItemsSeries`);
 * ნაგულისხმევი id = `BALANCE_PUBLICATION_TARGET` (7596); env `BALANCE_PUBLICATION_ID` სერვერზე თუ დაყენებულია — იგი ჯობს.
 * Exchange ცხრილისთვის სერიები იღება სრული ItemsSeries სიიდან (`/api/balance/items-series-bare`), არა თითო `ItemSeries?Item=`.
 */
/** ერთ გვერდზე ItemsSeries მოთხოვნების ზედა ზღვარი (Balance სერვერი) */
const MAX_EXCHANGE_ITEMS_SERIES_FETCH = 100;

/** პროდუქტის ცხრილში თარიღის უჯრა (აპის ფორმატის მსგავსად) */
function formatDisplayDate(value: unknown): string {
  if (value == null || value === "") return "—";
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toLocaleDateString("ka-GE");
  }
  const s = String(value).trim();
  if (!s) return "—";
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return d.toLocaleDateString("ka-GE");
  return s;
}

function productFilterValue(product: Product, keys: string[]): unknown {
  const anyProduct = product as Product & Record<string, unknown>;
  for (const key of keys) {
    const direct = anyProduct[key];
    if (direct !== undefined && direct !== null && direct !== "") return direct;
    const filterValue = product.filterValues?.[key];
    if (filterValue !== undefined && filterValue !== null && filterValue !== "") {
      return filterValue;
    }
  }
  return undefined;
}

function yesNoDisplay(value: unknown): string {
  if (value === true) return "Y";
  if (value === false) return "N";
  const s = String(value ?? "").trim();
  if (!s) return "—";
  if (/^(y|yes|true|კი|1)$/i.test(s)) return "Y";
  if (/^(n|no|false|არა|0)$/i.test(s)) return "N";
  return s;
}

function numericProductValue(product: Product, keys: string[]): number | undefined {
  const value = productFilterValue(product, keys);
  if (value === undefined) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function stockStatusDisplay(product: Product): string {
  const explicit = productFilterValue(product, ["stockStatus", "stock_status", "Stock Status"]);
  if (explicit !== undefined) return String(explicit);
  const reorderLevel = numericProductValue(product, [
    "reorderLevel",
    "reorder_level",
    "Reorder Level",
  ]);
  const qty = Number(product.quantity);
  if (!Number.isFinite(qty) || reorderLevel === undefined) return "—";
  return qty <= reorderLevel ? "LOW STOCK" : "OK";
}

/** Balance Discounts API (Items → ნომენკლატურა) + უპირობო წესი — ცხრილში DB-ს გარდა ცოცხალი მნიშვნელობებიც */
function liveBalanceDiscountForProduct(
  product: Product,
  maps: BalanceDiscountMaps,
  stocksRows: Record<string, unknown>[]
): BalanceDiscountForItem | undefined {
  const uidFromDb = product.balanceNomenclatureItemUid?.trim().toLowerCase();
  if (uidFromDb) {
    const d = maps.byItemUid.get(uidFromDb);
    if (d) return d;
  }
  const sku = product.sku?.trim();
  if (sku) {
    const uid = balanceUidForSku(stocksRows, sku)?.trim().toLowerCase();
    if (uid) {
      const d = maps.byItemUid.get(uid);
      if (d) return d;
    }
  }
  return maps.unconditional;
}

/** Kutuku მობილურთან იგივე: პროცენტი → ფასი×(1−p/100); თანხა ერთეულზე → ფასი−თანხა */
function unitAndTotalAfterBalanceDiscount(
  product: Product,
  hasDiscPct: boolean,
  discPct: number,
  hasDiscAmt: boolean,
  discAmt: number
): { apply: boolean; unit: number; total: number; origUnit: number; origTotal: number } {
  const origUnit = Number(product.price);
  if (!Number.isFinite(origUnit) || origUnit <= 0) {
    const t =
      product.totalPrice != null && Number.isFinite(Number(product.totalPrice))
        ? Number(product.totalPrice)
        : 0;
    return { apply: false, unit: origUnit, total: t, origUnit, origTotal: t };
  }
  const qtyRaw = product.quantity;
  const qty =
    qtyRaw != null && Number.isFinite(Number(qtyRaw)) ? Math.max(0, Number(qtyRaw)) : 0;
  const qMult = qty > 0 ? qty : 1;
  const origTotal =
    product.totalPrice != null && Number.isFinite(Number(product.totalPrice))
      ? Number(product.totalPrice)
      : origUnit * qMult;

  if (hasDiscPct) {
    const f = 1 - discPct / 100;
    return {
      apply: true,
      origUnit,
      origTotal,
      unit: Math.max(0, Math.round(origUnit * f * 100) / 100),
      total: Math.max(0, Math.round(origTotal * f * 100) / 100),
    };
  }
  if (hasDiscAmt) {
    const u = Math.max(0, Math.round((origUnit - discAmt) * 100) / 100);
    const t =
      qty > 0
        ? Math.max(0, Math.round(u * qty * 100) / 100)
        : Math.max(0, Math.round((origTotal - discAmt) * 100) / 100);
    return { apply: true, origUnit, origTotal, unit: u, total: t };
  }
  return { apply: false, unit: origUnit, total: origTotal, origUnit, origTotal };
}

function ProductsPageContent() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const warehouseId = searchParams.get("warehouseId") || undefined;
  const isBalanceCatalogPage = pathname === "/products/balance-catalog";
  const isBalanceStocksPage = pathname === "/products/balance-stocks";
  const isPharmacistCatalogPage = pathname === "/products/pharmacist-catalog";
  const isRegularCatalogPage = pathname === "/products" || pathname === "/products/catalog";
  const showProductTable = !isBalanceStocksPage;
  const canEditCatalog = isRegularCatalogPage;
  
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [warehouse, setWarehouse] = useState<any>(null);
  const [warehouseInventory, setWarehouseInventory] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false);
  const [warehouseProduct, setWarehouseProduct] = useState<Product | null>(null);
  const [pharmacistEditingProduct, setPharmacistEditingProduct] =
    useState<Product | null>(null);
  const [pharmacistForm, setPharmacistForm] = useState({
    productCode: "",
    productName: "",
    categoryPathIds: [] as string[],
    form: "",
    strength: "",
    manufacturer: "",
    unit: "",
    packSize: "",
    prescriptionRequired: false,
    unitPrice: "",
    qtyOnHand: "",
    reorderLevel: "",
  });
  const [pharmacistSaving, setPharmacistSaving] = useState(false);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [showBalanceColumns, setShowBalanceColumns] = useState(false);
  const showAllBalanceColumns = isBalanceCatalogPage || showBalanceColumns;
  const [balanceStocksRows, setBalanceStocksRows] = useState<Record<string, unknown>[]>([]);
  const [balanceStocksRaw, setBalanceStocksRaw] = useState<unknown>(null);
  const [balanceStocksLoading, setBalanceStocksLoading] = useState(true);
  const [balanceStocksError, setBalanceStocksError] = useState<string | null>(null);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    created: number;
    updated: number;
    total: number;
    error?: string;
    errors?: string[];
    itemsSeriesBulkUsed?: boolean;
    itemsSeriesBulkLineCount?: number;
    categories?: {
      created: number;
      updated: number;
      total: number;
      errors?: string[];
    };
  } | null>(null);
  const [balanceStocksCollapsed, setBalanceStocksCollapsed] = useState(false);
  const [balancePricesRows, setBalancePricesRows] = useState<Record<string, unknown>[]>([]);
  const [balancePricesRaw, setBalancePricesRaw] = useState<unknown>(null);
  const [balancePricesLoading, setBalancePricesLoading] = useState(true);
  const [balancePricesError, setBalancePricesError] = useState<string | null>(null);
  const [balanceDiscountsRows, setBalanceDiscountsRows] = useState<Record<string, unknown>[]>([]);
  const [balanceDiscountsRaw, setBalanceDiscountsRaw] = useState<unknown>(null);
  const [balanceDiscountsLoading, setBalanceDiscountsLoading] = useState(true);
  const [balanceDiscountsError, setBalanceDiscountsError] = useState<string | null>(null);
  const [balanceItemPricingRaw, setBalanceItemPricingRaw] = useState<unknown>(null);
  const [balanceItemPricingLoading, setBalanceItemPricingLoading] = useState(true);
  const [balanceItemPricingError, setBalanceItemPricingError] = useState<string | null>(null);
  const [balanceExchangeQtyRows, setBalanceExchangeQtyRows] = useState<
    Record<string, unknown>[]
  >([]);
  const [balanceExchangeQtyRaw, setBalanceExchangeQtyRaw] = useState<unknown>(null);
  const [balanceExchangeQtyLoading, setBalanceExchangeQtyLoading] = useState(true);
  const [balanceExchangeQtyError, setBalanceExchangeQtyError] = useState<string | null>(null);
  const [balanceWarehousesRows, setBalanceWarehousesRows] = useState<Record<string, unknown>[]>([]);
  const [balanceWarehousesRaw, setBalanceWarehousesRaw] = useState<unknown>(null);
  const [balanceWarehousesLoading, setBalanceWarehousesLoading] = useState(true);
  const [balanceWarehousesError, setBalanceWarehousesError] = useState<string | null>(null);
  /** Exchange/Stocks ნომენკლატურის `Item` → ItemsSeries პასუხის ხაზები (თითო Item ერთხელ იტვირთება) */
  const [exchangeSeriesByUid, setExchangeSeriesByUid] = useState<
    Record<
      string,
      { ok: true; lines: BalanceItemSeriesLine[] } | { ok: false; error: string }
    >
  >({});
  const [exchangeSeriesLoading, setExchangeSeriesLoading] = useState(false);
  const [fixedProbeItemsSeriesLoading, setFixedProbeItemsSeriesLoading] =
    useState(false);
  const [fixedProbeItemsSeriesError, setFixedProbeItemsSeriesError] = useState<
    string | null
  >(null);
  const [fixedProbeItemsSeriesPayload, setFixedProbeItemsSeriesPayload] =
    useState<unknown | null>(null);
  /** ItemsSeries სრული ბაზის URL (proxy) — იგივე იდეა რაც fetch cloud-ზე, მაგრამ `/api/balance/...` */
  const [itemsSeriesBareData, setItemsSeriesBareData] = useState<unknown | null>(
    null
  );
  const [itemsSeriesBareRequestUrl, setItemsSeriesBareRequestUrl] = useState<
    string | null
  >(null);
  const [itemsSeriesBareLoading, setItemsSeriesBareLoading] = useState(false);
  const [itemsSeriesBareError, setItemsSeriesBareError] = useState<
    string | null
  >(null);
  const [balanceStockDetailProduct, setBalanceStockDetailProduct] =
    useState<Product | null>(null);

  // Debounce search term to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load warehouse info if warehouseId is provided
  useEffect(() => {
    if (warehouseId) {
      warehousesApi.getById(warehouseId).then(response => {
        setWarehouse(response.data);
      });
      inventoryApi.getAll({ warehouseId }).then(response => {
        setWarehouseInventory(response.data);
      });
    }
  }, [warehouseId]);

  useEffect(() => {
    let cancelled = false;
    categoriesApi.getAll().then((list) => {
      if (!cancelled) setCategories(Array.isArray(list) ? list : []);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setBalanceStocksError(null);
        const data = await getBalanceStocks();
        setBalanceStocksRaw(data);
        setBalanceStocksRows(rowsFromBalanceStocks(data));
      } catch (err) {
        setBalanceStocksError(
          err instanceof Error ? err.message : "Balance Stocks-ის ჩატვირთვა ვერ მოხერხდა"
        );
      } finally {
        setBalanceStocksLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setBalancePricesError(null);
        const data = await getBalancePrices();
        setBalancePricesRaw(data);
        setBalancePricesRows(rowsFromBalancePrices(data));
      } catch (err) {
        setBalancePricesError(
          err instanceof Error ? err.message : "Balance Prices-ის ჩატვირთვა ვერ მოხერხდა"
        );
      } finally {
        setBalancePricesLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setBalanceWarehousesError(null);
        const data = await getBalanceWarehouses();
        setBalanceWarehousesRaw(data);
        setBalanceWarehousesRows(rowsFromBalanceWarehouses(data));
      } catch (err) {
        setBalanceWarehousesError(
          err instanceof Error ? err.message : "Balance Warehouses-ის ჩატვირთვა ვერ მოხერხდა"
        );
      } finally {
        setBalanceWarehousesLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setBalanceDiscountsError(null);
        const data = await getBalanceDiscounts();
        setBalanceDiscountsRaw(data);
        setBalanceDiscountsRows(rowsFromBalanceDiscounts(data));
      } catch (err) {
        setBalanceDiscountsError(
          err instanceof Error ? err.message : "Balance Discounts-ის ჩატვირთვა ვერ მოხერხდა"
        );
      } finally {
        setBalanceDiscountsLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setBalanceItemPricingError(null);
        const data = await getBalanceItemPricing();
        setBalanceItemPricingRaw(data);
      } catch (err) {
        setBalanceItemPricingError(
          err instanceof Error ? err.message : "Balance ItemPricing-ის ჩატვირთვა ვერ მოხერხდა"
        );
      } finally {
        setBalanceItemPricingLoading(false);
      }
    })();
  }, []);

  /** Exchange/Stocks — რაოდენობები (`/Stocks?uid=&...&Total=false` docTemplate, თუ ვერ — სტანდარტული uid) */
  useEffect(() => {
    (async () => {
      try {
        setBalanceExchangeQtyError(null);
        let data: unknown;
        try {
          data = await getBalanceExchangeStocks({ docTemplate: true });
        } catch {
          data = await getBalanceExchangeStocks({ Total: false });
        }
        setBalanceExchangeQtyRaw(data);
        setBalanceExchangeQtyRows(rowsFromBalanceExchangeStocks(data));
      } catch (err) {
        setBalanceExchangeQtyError(
          err instanceof Error
            ? err.message
            : "Balance Exchange/Stocks (რაოდენობები) ვერ ჩაიტვირთა"
        );
      } finally {
        setBalanceExchangeQtyLoading(false);
      }
    })();
  }, []);

  const exchangeSeriesPlan = useMemo(() => {
    const all = uniqueExchangeStockNomenclatureItemUids(balanceExchangeQtyRows);
    const truncated = Math.max(0, all.length - MAX_EXCHANGE_ITEMS_SERIES_FETCH);
    const toFetch = all.slice(0, MAX_EXCHANGE_ITEMS_SERIES_FETCH);
    const requestedSet = new Set(toFetch.map((u) => u.toLowerCase()));
    const itemsSeriesUidByExchangeItem = new Map<string, string>();
    for (const ex of all) {
      const c = nomenclatureUidForItemsSeriesFromBalanceItems(
        ex,
        balanceStocksRows
      );
      itemsSeriesUidByExchangeItem.set(ex.toLowerCase(), c);
    }
    return {
      all,
      truncated,
      toFetch,
      requestedSet,
      itemsSeriesUidByExchangeItem,
    };
  }, [balanceExchangeQtyRows, balanceStocksRows]);

  /**
   * Exchange/Stocks ხაზის `Item` → სერიის ხაზები **სრული ItemsSeries სიიდან** (იგივე რაც გვერდზე ცხრილი),
   * `GET /api/balance/ItemSeries?Item=` per-uid აღარ იძახება.
   */
  useEffect(() => {
    if (balanceExchangeQtyLoading) return;

    if (balanceExchangeQtyRows.length === 0) {
      setExchangeSeriesByUid({});
      setExchangeSeriesLoading(false);
      return;
    }

    const { toFetch, itemsSeriesUidByExchangeItem } = exchangeSeriesPlan;
    if (toFetch.length === 0) {
      setExchangeSeriesByUid({});
      setExchangeSeriesLoading(false);
      return;
    }

    if (itemsSeriesBareLoading && itemsSeriesBareData === null) {
      setExchangeSeriesLoading(true);
      return;
    }

    const rawRows =
      itemsSeriesBareData !== null ? getBalanceItems(itemsSeriesBareData) : [];

    const out: Record<
      string,
      { ok: true; lines: BalanceItemSeriesLine[] } | { ok: false; error: string }
    > = {};

    for (const uid of toFetch) {
      const balanceProductUid =
        itemsSeriesUidByExchangeItem.get(uid.toLowerCase()) ?? uid;
      const key = balanceProductUid.trim().toLowerCase();
      const matching = rawRows.filter(
        (r) =>
          String(r.Item ?? r.item ?? "")
            .trim()
            .toLowerCase() === key
      );
      out[uid.toLowerCase()] =
        matching.length > 0
          ? { ok: true, lines: normalizeBalanceItemSeriesRows(matching) }
          : { ok: true, lines: [] };
    }

    setExchangeSeriesByUid(out);
    setExchangeSeriesLoading(false);
  }, [
    balanceExchangeQtyLoading,
    balanceExchangeQtyRows,
    exchangeSeriesPlan,
    itemsSeriesBareData,
    itemsSeriesBareLoading,
  ]);

  useEffect(() => {
    if (!balanceStockDetailProduct) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setBalanceStockDetailProduct(null);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [balanceStockDetailProduct]);

  const { data, loading, error, execute } = useProducts({
    page: currentPage,
    search: debouncedSearchTerm || undefined,
    limit: 50,
    source:
      isRegularCatalogPage || isPharmacistCatalogPage
        ? "balance-live"
        : undefined,
  });
  const totalProducts = data?.total ?? 0;
  const productsPerPage = data?.limit ?? 50;
  const totalPages = Math.max(1, Math.ceil(totalProducts / productsPerPage));

  const runFixedProbeItemsSeries = async () => {
    setFixedProbeItemsSeriesLoading(true);
    setFixedProbeItemsSeriesError(null);
    setFixedProbeItemsSeriesPayload(null);
    try {
      const json = await api.fetchJson<{
        ok?: boolean;
        error?: string;
        [key: string]: unknown;
      }>("/api/balance/item-series-manual-url");
      if (!json.ok) {
        throw new Error(json.error || "ItemsSeries (ხელით URL) ვერ ჩაიტვირთა");
      }
      setFixedProbeItemsSeriesPayload(json);
    } catch (e) {
      setFixedProbeItemsSeriesError(
        e instanceof Error ? e.message : String(e)
      );
    } finally {
      setFixedProbeItemsSeriesLoading(false);
    }
  };

  const fetchItemsSeriesBareFromProxy = useCallback(async () => {
    setItemsSeriesBareLoading(true);
    setItemsSeriesBareError(null);
    setItemsSeriesBareData(null);
    setItemsSeriesBareRequestUrl(null);
    try {
      const json = await api.fetchJson<{
        ok?: boolean;
        data?: unknown;
        requestUrl?: string;
        error?: string;
      }>("/api/balance/items-series-bare");
      if (!json.ok) {
        throw new Error(json.error || "ItemsSeries (bare) ვერ ჩაიტვირთა");
      }
      setItemsSeriesBareData(json.data ?? null);
      setItemsSeriesBareRequestUrl(
        typeof json.requestUrl === "string" ? json.requestUrl : null
      );
    } catch (e) {
      setItemsSeriesBareError(e instanceof Error ? e.message : String(e));
    } finally {
      setItemsSeriesBareLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchItemsSeriesBareFromProxy();
  }, [fetchItemsSeriesBareFromProxy]);

  const itemsSeriesBareRows: BalanceItemsSeriesApiRow[] = useMemo(() => {
    if (itemsSeriesBareData == null) return [];
    return normalizeBalanceItemsSeriesApiRows(itemsSeriesBareData);
  }, [itemsSeriesBareData]);

  /** ხელით „განახლება ბაზა“ — ერთი POST დროში; ორმაგი დაჭერა იგნორირდება */
  const syncManualInFlightRef = useRef(false);

  const syncBalanceToDb = useCallback(async () => {
    if (syncManualInFlightRef.current) return;
    syncManualInFlightRef.current = true;
    setSyncLoading(true);
    setSyncResult(null);
    try {
      const token = getAuthToken();
      const res = await api.fetch("/api/balance/sync-stocks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const json = await res.json();
      if (!res.ok) {
        setSyncResult({
          created: 0,
          updated: 0,
          total: 0,
          error: json.error || "სინქრონიზაცია ვერ მოხერხდა",
          errors: json.errors,
        });
        return;
      }
      setSyncResult({
        created: json.created ?? 0,
        updated: json.updated ?? 0,
        total: json.total ?? 0,
        error: json.error,
        errors: json.errors,
        itemsSeriesBulkUsed: json.itemsSeriesBulkUsed,
        itemsSeriesBulkLineCount: json.itemsSeriesBulkLineCount,
        categories: json.categories,
      });
      await execute();
      void fetchItemsSeriesBareFromProxy();
    } catch (err) {
      setSyncResult({
        created: 0,
        updated: 0,
        total: 0,
        error: err instanceof Error ? err.message : "შეცდომა",
      });
    } finally {
      setSyncLoading(false);
      syncManualInFlightRef.current = false;
    }
  }, [execute, fetchItemsSeriesBareFromProxy]);

  const syncBalanceToDbRef = useRef(false);
  useEffect(() => {
    const twoHoursMs = 2 * 60 * 60 * 1000;
    const id = setInterval(() => {
      if (syncBalanceToDbRef.current) return;
      syncBalanceToDbRef.current = true;
      const token = getAuthToken();
      api.fetch("/api/balance/sync-stocks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })
        .then((r) => r.json())
        .then((json) => {
          if (json.ok) execute();
        })
        .finally(() => {
          syncBalanceToDbRef.current = false;
        });
    }, twoHoursMs);
    return () => clearInterval(id);
  }, [execute]);

  /** Balance-ში IsGroup=true ჩანაწერების Code — DB-ში ადრე როგორც „პროდუქტი“ შევიდა, სიაში აღარ ვაჩვენებთ */
  const balanceGroupSkuSet = useMemo(() => {
    const s = new Set<string>();
    for (const row of balanceStocksRows) {
      if (!isBalanceGroupRow(row)) continue;
      const code = String(row.Code ?? row.code ?? "").trim();
      if (code) s.add(code);
    }
    return s;
  }, [balanceStocksRows]);

  const products = useMemo(() => {
    return (data?.data || []).filter(
      (p) => !balanceGroupSkuSet.has(String(p.sku ?? "").trim())
    );
  }, [data?.data, balanceGroupSkuSet]);

  /** Balance Exchange/Items ცხრილში მხოლოდ საქონელი — IsGroup=true კატეგორიები/ქვეკატეგორიები დამალულია */
  const balanceStockProductRows = useMemo(
    () => balanceStocksRows.filter((row) => !isBalanceGroupRow(row)),
    [balanceStocksRows],
  );
  const balanceCatalogExcludedColumns = useMemo(
    () =>
      new Set([
        "quantity",
        "qty",
        "amount",
        "price",
        "unitprice",
        "unitcost",
        "totalprice",
        "sum",
      ]),
    [],
  );
  const balanceCatalogColumns = useMemo(() => {
    const seen = new Set<string>();
    for (const row of balanceStockProductRows) {
      for (const key of Object.keys(row)) {
        if (balanceCatalogExcludedColumns.has(key.trim().toLowerCase())) {
          continue;
        }
        seen.add(key);
      }
    }
    return Array.from(seen);
  }, [balanceCatalogExcludedColumns, balanceStockProductRows]);
  const balanceCatalogPriceColumns = useMemo(() => {
    const seen = new Set<string>();
    seen.add("ItemName");
    for (const row of balancePricesRows) {
      for (const key of Object.keys(row)) seen.add(key);
    }
    return Array.from(seen);
  }, [balancePricesRows]);
  const balanceCatalogItemNameByUid = useMemo(
    () =>
      new Map(
        Array.from(buildBalanceItemNameByUid(balanceStockProductRows)).map(
          ([uid, name]) => [uid.trim().toLowerCase(), name],
        ),
      ),
    [balanceStockProductRows],
  );
  const balanceCatalogDiscountRows = useMemo(
    () =>
      balanceDiscountsRows.map((row) => {
        const itemUid = getItemUuid(row)?.trim().toLowerCase();
        return {
          ItemName: itemUid ? balanceCatalogItemNameByUid.get(itemUid) ?? "—" : "—",
          ...row,
        };
      }),
    [balanceCatalogItemNameByUid, balanceDiscountsRows],
  );
  const balanceCatalogDiscountColumns = useMemo(() => {
    const seen = new Set<string>();
    for (const row of balanceCatalogDiscountRows) {
      for (const key of Object.keys(row)) seen.add(key);
    }
    return Array.from(seen);
  }, [balanceCatalogDiscountRows]);
  const balanceCatalogSeriesRows = useMemo(
    () =>
      itemsSeriesBareRows.map((row) => {
        const itemUid = String(row.Item ?? "").trim().toLowerCase();
        return {
          ItemName: itemUid ? balanceCatalogItemNameByUid.get(itemUid) ?? "—" : "—",
          ...row,
        };
      }),
    [balanceCatalogItemNameByUid, itemsSeriesBareRows],
  );
  const balanceCatalogSeriesColumns = useMemo(() => {
    const seen = new Set<string>();
    for (const row of balanceCatalogSeriesRows) {
      for (const key of Object.keys(row)) seen.add(key);
    }
    return Array.from(seen);
  }, [balanceCatalogSeriesRows]);
  const balanceCatalogWarehouseColumns = useMemo(() => {
    const preferred = [
      "uid",
      "Name",
      "Group",
      "Adress",
      "Tel",
      "Responsible",
      "Van",
      "ExtCode",
    ];
    const seen = new Set<string>(preferred);
    for (const row of balanceWarehousesRows) {
      for (const key of Object.keys(row)) seen.add(key);
    }
    return Array.from(seen);
  }, [balanceWarehousesRows]);

  const balanceItemPricingRowsForProducts = useMemo(() => {
    if (balanceItemPricingRaw == null) return [];
    const all = rowsFromBalanceItemPricing(balanceItemPricingRaw);
    return itemPricingRowsForDbProducts(all, products, balanceStocksRows);
  }, [balanceItemPricingRaw, products, balanceStocksRows]);

  /** Exchange/Items — ნომენკლატურის `VATRate` როგორც მოდის (SKU → ტექსტი) */
  const balanceVatRateBySku = useMemo(() => {
    const byUid = new Map<string, string>();
    for (const row of balanceStocksRows) {
      if (isBalanceGroupRow(row)) continue;
      const uid = getItemUuid(row);
      if (!uid) continue;
      const raw = vatRateRawFromBalanceItemRow(row);
      if (raw != null) byUid.set(uid.toLowerCase(), raw);
    }
    const m = new Map<string, string>();
    for (const p of products) {
      const sku = p.sku?.trim();
      if (!sku) continue;
      const uid = balanceUidForSku(balanceStocksRows, sku);
      if (!uid) continue;
      const v = byUid.get(uid.toLowerCase());
      if (v != null) m.set(sku, v);
    }
    return m;
  }, [balanceStocksRows, products]);

  /** Balance Prices + ItemPricing → SKU-ზე დაბეგვრა (ფოლბექი, თუ Items-ზე VATRate ცარიელია) */
  const balanceTaxationBySku = useMemo(() => {
    const byUuid = new Map<string, string>();
    for (const [k, v] of buildTaxationByUuid(balancePricesRows)) byUuid.set(k, v);
    for (const [k, v] of buildTaxationByUuid(balanceItemPricingRowsForProducts)) {
      byUuid.set(k, v);
    }
    const m = new Map<string, string>();
    for (const p of products) {
      const sku = p.sku?.trim();
      if (!sku) continue;
      const uid = balanceUidForSku(balanceStocksRows, sku);
      if (!uid) continue;
      const t = byUuid.get(uid);
      if (t) m.set(sku, t);
    }
    return m;
  }, [balancePricesRows, balanceItemPricingRowsForProducts, products, balanceStocksRows]);

  /** GET /api/balance/discounts → ნომენკლატურის Item-ზე + უპირობო (ცხრილში ცოცხლად, სინქამდეც) */
  const balanceDiscountMaps = useMemo(
    () => buildDiscountMapsFromBalanceApi(balanceDiscountsRaw),
    [balanceDiscountsRaw]
  );

  /** Exchange/Stocks — ItemName + ItemsSeries (ფილტრი Stocks `Series` ↔ ItemsSeries ჩანაწერის `uid`) */
  const balanceExchangeQtyDisplayRows = useMemo((): Record<string, unknown>[] => {
    const nameByUid = buildBalanceItemNameByUid(balanceStocksRows);
    const nameByUidLower = new Map(
      [...nameByUid.entries()].map(([k, v]) => [k.toLowerCase(), v])
    );
    return balanceExchangeQtyRows.map((row) => {
      /** იგივე წყარო რაც ItemsSeries fetch-ში (`exchangeStockRowNomenclatureItemUid` — Item + item) */
      const itemUid = exchangeStockRowNomenclatureItemUid(row) ?? "";
      const itemKey = itemUid.toLowerCase();
      const pack = itemKey ? exchangeSeriesByUid[itemKey] : undefined;
      const stockSeriesUid = exchangeStockRowSeriesUid(row);

      let itemsSeriesCell = "—";
      let seriesNumberCell = "—";
      let validUntilCell = "—";
      if (pack?.ok) {
        const picked = pickItemsSeriesLinesForExchangeStockRow(
          pack.lines,
          stockSeriesUid
        );
        itemsSeriesCell = summarizeItemsSeriesLinesForTable(picked);
        seriesNumberCell = itemsSeriesNumbersForTable(picked);
        validUntilCell = itemsSeriesValidUntilForTable(picked);
      } else if (pack && !pack.ok) {
        itemsSeriesCell = `⚠ ${pack.error}`;
        seriesNumberCell = itemsSeriesCell;
        validUntilCell = itemsSeriesCell;
      } else if (itemUid && exchangeSeriesLoading) {
        itemsSeriesCell = "…";
        seriesNumberCell = "…";
        validUntilCell = "…";
      } else if (
        itemUid &&
        !exchangeSeriesLoading &&
        !exchangeSeriesPlan.requestedSet.has(itemKey) &&
        exchangeSeriesPlan.truncated > 0
      ) {
        itemsSeriesCell = "— (ლიმიტი)";
        seriesNumberCell = itemsSeriesCell;
        validUntilCell = itemsSeriesCell;
      }

      return {
        ItemName:
          (itemUid && (nameByUid.get(itemUid) ?? nameByUidLower.get(itemKey))) ??
          "—",
        /** ItemsSeries API: `SeriesNumber` / `ValidUntil` (არ ერევა Exchange `Series` UUID-ს) */
        ItemsSeriesNumber: seriesNumberCell,
        ItemsSeriesValidUntil: validUntilCell,
        ItemsSeries: itemsSeriesCell,
        ...row,
      } as Record<string, unknown>;
    });
  }, [
    balanceExchangeQtyRows,
    balanceStocksRows,
    exchangeSeriesByUid,
    exchangeSeriesLoading,
    exchangeSeriesPlan,
  ]);
  const balanceCatalogQuantityColumns = useMemo(() => {
    const seen = new Set<string>();
    for (const row of balanceExchangeQtyDisplayRows) {
      for (const key of Object.keys(row)) seen.add(key);
    }
    return Array.from(seen);
  }, [balanceExchangeQtyDisplayRows]);

  /**
   * დებაგი: Exchange/Stocks `Series` vs ItemsSeries ხაზები (იგივე pick ლოგიკა, მხოლოდ console).
   * `npm run dev` ან `.env.local` → NEXT_PUBLIC_DEBUG_ITEMS_SERIES_COMPARE=1
   */
  useEffect(() => {
    const enabled =
      process.env.NODE_ENV === "development" ||
      process.env.NEXT_PUBLIC_DEBUG_ITEMS_SERIES_COMPARE === "1";
    if (!enabled) return;
    if (exchangeSeriesLoading) return;
    if (balanceExchangeQtyRows.length === 0) return;

    let nFetchErr = 0;
    let nApiEmpty = 0;
    let nSeriesMismatch = 0;
    let nNoPack = 0;
    const table: Array<{
      Item: string;
      Stocks_Series_raw: string;
      Stocks_Series_forPick: string;
      fetch: string;
      apiLines: number;
      picked: number;
      note: string;
    }> = [];
    const maxTable = 45;

    for (let i = 0; i < balanceExchangeQtyRows.length; i++) {
      const row = balanceExchangeQtyRows[i];
      const itemUid = exchangeStockRowNomenclatureItemUid(row) ?? "";
      const itemKey = itemUid.toLowerCase();
      const seriesRaw =
        String(row.Series ?? row.series ?? row.SeriesUUID ?? "").trim() || "—";
      const stockSeriesUid = exchangeStockRowSeriesUid(row);
      const seriesForPick = stockSeriesUid ?? "— (pick: ყველა ხაზი)";
      const pack = itemKey ? exchangeSeriesByUid[itemKey] : undefined;

      let note = "";
      let fetchCell = "—";
      let apiLines = 0;
      let picked = 0;

      if (!itemUid) {
        note = "Item GUID არაა";
        nNoPack++;
      } else if (!pack) {
        note = "არაა exchangeSeriesByUid-ში (ლიმიტი/ჩატვირთვა)";
        nNoPack++;
      } else if (!pack.ok) {
        fetchCell = "ERR";
        note = pack.error.slice(0, 120);
        nFetchErr++;
      } else {
        fetchCell = "OK";
        apiLines = pack.lines.length;
        const pickedLines = pickItemsSeriesLinesForExchangeStockRow(
          pack.lines,
          stockSeriesUid
        );
        picked = pickedLines.length;
        if (apiLines === 0) {
          note = "ItemsSeries []";
          nApiEmpty++;
        } else if (stockSeriesUid && picked === 0) {
          note =
            "Series არ ემთხვევა ItemsSeries ხაზის seriesRowUid/seriesUuid-ს";
          nSeriesMismatch++;
        } else {
          note = "ok";
        }
      }

      if (table.length < maxTable) {
        table.push({
          Item: itemUid || "—",
          Stocks_Series_raw: seriesRaw,
          Stocks_Series_forPick: seriesForPick,
          fetch: fetchCell,
          apiLines,
          picked,
          note,
        });
      }
    }

    const mismatchSamples: Array<{
      Item: string;
      Stocks_Series: string;
      apiUids: Array<{ seriesRowUid?: string; seriesUuid?: string }>;
    }> = [];
    for (const row of balanceExchangeQtyRows) {
      if (mismatchSamples.length >= 5) break;
      const itemUid = exchangeStockRowNomenclatureItemUid(row) ?? "";
      const itemKey = itemUid.toLowerCase();
      const pack = itemKey ? exchangeSeriesByUid[itemKey] : undefined;
      const stockSeriesUid = exchangeStockRowSeriesUid(row);
      if (!pack?.ok || pack.lines.length === 0 || !stockSeriesUid) continue;
      const pickedLines = pickItemsSeriesLinesForExchangeStockRow(
        pack.lines,
        stockSeriesUid
      );
      if (pickedLines.length !== 0) continue;
      mismatchSamples.push({
        Item: itemUid,
        Stocks_Series: stockSeriesUid,
        apiUids: pack.lines.map((l) => ({
          seriesRowUid: l.seriesRowUid,
          seriesUuid: l.seriesUuid,
        })),
      });
    }

    console.groupCollapsed(
      `[ItemsSeries↔Stocks] ხაზები=${balanceExchangeQtyRows.length} · APIცარიელი=${nApiEmpty} · Series≠ItemsSeries=${nSeriesMismatch} · fetchERR=${nFetchErr} · noPack/სხვა=${nNoPack}`
    );
    console.table(table);
    if (mismatchSamples.length > 0) {
      console.warn(
        "[ItemsSeries↔Stocks] ნიმუში: Stocks Series აქვს, API ხაზებიც აქვს, მაგრამ pick ცარიელია",
        mismatchSamples
      );
    }
    console.groupEnd();
  }, [exchangeSeriesLoading, balanceExchangeQtyRows, exchangeSeriesByUid]);

  // Filter products by warehouse if warehouseId is provided
  const filteredProducts = useMemo(() => {
    let filtered = products;
    
    // Filter by warehouse inventory
    if (warehouseId && warehouseInventory.length > 0) {
      const warehouseProductIds = new Set(warehouseInventory.map(item => item.productId));
      filtered = filtered.filter(product => warehouseProductIds.has(product.id));
    }
    
    // Filter by search term
    if (debouncedSearchTerm) {
      const search = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(search) ||
          product.genericName?.toLowerCase().includes(search) ||
          product.description?.toLowerCase().includes(search) ||
          product.sku?.toLowerCase().includes(search) ||
          product.manufacturer?.toLowerCase().includes(search) ||
          product.countryOfOrigin?.toLowerCase().includes(search)
      );
    }
    
    return filtered;
  }, [products, debouncedSearchTerm, warehouseId, warehouseInventory]);

  const toggleProductStatus = async (id: string) => {
    try {
      await productsApi.toggleStatus(id);
      // Refresh data after status change
      execute();
    } catch (error) {
      console.error('Failed to toggle product status:', error);
      alert('შეცდომა: ვერ მოხერხდა პროდუქტის სტატუსის შეცვლა');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handlePharmacistEdit = (product: Product) => {
    setPharmacistEditingProduct(product);
    const balanceCategoryPathIds = resolveCategoryPathIdsByBalanceUid(
      categories,
      product.balanceCategoryUid,
    );
    const categoryPathIds =
      balanceCategoryPathIds.length > 0
        ? balanceCategoryPathIds
        : resolveCategoryPathIds(
        categories,
        product.mainCategory?.trim() || "",
        product.subcategory?.trim() || "",
      );
    setPharmacistForm({
      productCode: product.productCode?.trim() || product.sku?.trim() || "",
      productName: product.productNameBrand?.trim() || product.name?.trim() || "",
      categoryPathIds,
      form: product.dosageForm?.trim() || "",
      strength: product.strength?.trim() || "",
      manufacturer: product.manufacturer?.trim() || "",
      unit: product.unitOfMeasure?.trim() || "",
      packSize: product.packSize?.trim() || "",
      prescriptionRequired: product.prescriptionRequired ?? false,
      unitPrice:
        product.price != null && Number.isFinite(Number(product.price))
          ? String(product.price)
          : "",
      qtyOnHand:
        product.quantity != null && Number.isFinite(Number(product.quantity))
          ? String(product.quantity)
          : "",
      reorderLevel: product.reorderLevel?.toString() || "",
    });
  };

  const handlePharmacistSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pharmacistEditingProduct) return;
    const productId =
      pharmacistEditingProduct.id ??
      (pharmacistEditingProduct as Product & { _id?: string })._id;
    if (!productId) {
      alert("პროდუქტის ID ვერ მოიძებნა — განაახლეთ გვერდი და სცადეთ ხელახლა");
      return;
    }
    setPharmacistSaving(true);
    try {
      const categoryFields = pathIdsToCategoryFields(
        categories,
        pharmacistForm.categoryPathIds,
      );
      await productsApi.update(productId, {
        productCode: pharmacistForm.productCode.trim() || undefined,
        productNameBrand: pharmacistForm.productName.trim() || undefined,
        name: pharmacistForm.productName.trim() || pharmacistEditingProduct.name,
        mainCategory: categoryFields.mainCategory || undefined,
        subcategory: categoryFields.subcategory || undefined,
        dosageForm: pharmacistForm.form.trim() || undefined,
        strength: pharmacistForm.strength.trim() || undefined,
        manufacturer: pharmacistForm.manufacturer.trim() || undefined,
        unitOfMeasure: pharmacistForm.unit.trim() || undefined,
        packSize: pharmacistForm.packSize.trim() || undefined,
        prescriptionRequired: pharmacistForm.prescriptionRequired,
        price: pharmacistForm.unitPrice
          ? parseFloat(pharmacistForm.unitPrice)
          : pharmacistEditingProduct.price,
        quantity: pharmacistForm.qtyOnHand
          ? parseFloat(pharmacistForm.qtyOnHand)
          : undefined,
        reorderLevel: pharmacistForm.reorderLevel
          ? parseFloat(pharmacistForm.reorderLevel)
          : undefined,
        totalPrice:
          pharmacistForm.unitPrice && pharmacistForm.qtyOnHand
            ? parseFloat(pharmacistForm.unitPrice) * parseFloat(pharmacistForm.qtyOnHand)
            : undefined,
      });
      await execute();
      setPharmacistEditingProduct(null);
    } catch (error) {
      console.error("Failed to update pharmacist catalog fields:", error);
      alert("ფარმაცევტის ველების შენახვა ვერ მოხერხდა");
    } finally {
      setPharmacistSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('დარწმუნებული ხართ, რომ გსურთ ამ პროდუქტის წაშლა?')) {
      return;
    }

    setDeletingProductId(id);
    try {
      await productsApi.delete(id);
      // Refresh data after deletion
      execute();
      alert('პროდუქტი წარმატებით წაიშალა');
    } catch (error) {
      console.error('Failed to delete product:', error);
      alert('შეცდომა: ვერ მოხერხდა პროდუქტის წაშლა');
    } finally {
      setDeletingProductId(null);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleModalSuccess = () => {
    execute();
    handleModalClose();
  };

  const handleAddToWarehouse = (product: Product) => {
    setWarehouseProduct(product);
    setIsWarehouseModalOpen(true);
  };

  const handleWarehouseModalClose = () => {
    setIsWarehouseModalOpen(false);
    setWarehouseProduct(null);
  };

  if (loading && showProductTable) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">მონაცემების ჩატვირთვა...</p>
        </div>
      </div>
    );
  }

  if (error && showProductTable) {
    return (
      <div className="space-y-6">
        <PageBreadCrumb pageTitle="კატალოგი" />
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
            შეცდომა მონაცემების ჩატვირთვისას
          </h3>
          <p className="mt-2 text-red-600 dark:text-red-300">
            {error instanceof Error ? error.message : 'უცნობი შეცდომა'}
          </p>
          <button
            onClick={() => execute()}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            ხელახლა ცდა
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageBreadCrumb
        pageTitle={
          isBalanceCatalogPage
            ? "კატალოგი ბალანსიდან"
            : isBalanceStocksPage
            ? "Balance - ნაშთები (Stocks)"
            : warehouse
              ? `${warehouse.name} - პროდუქტები`
              : isPharmacistCatalogPage
                ? "კატალოგი ფარმაცევტისთვის"
                : "კატალოგი"
        }
      />

      {/* Warehouse Filter Info */}
      {showProductTable && warehouse && (
        <div className="rounded-lg border border-brand-200 bg-brand-50 p-4 dark:border-brand-800 dark:bg-brand-900/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-brand-900 dark:text-brand-200">
                ფილტრი: {warehouse.name}
              </p>
              <p className="text-xs text-brand-700 dark:text-brand-300">
                ნაჩვენებია მხოლოდ ამ საწყობში არსებული პროდუქტები ({filteredProducts.length})
              </p>
            </div>
            <Link
              href="/products"
              className="text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
            >
              ფილტრის მოხსნა
            </Link>
          </div>
        </div>
      )}

      {/* Header Actions */}
      {showProductTable && (
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <input
            type="text"
            placeholder="ძიება პროდუქტებში..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={runFixedProbeItemsSeries}
            disabled={fixedProbeItemsSeriesLoading}
            title="დებაგი: GET /api/balance/item-series-manual-url (იხილე route.ts)"
            className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            {fixedProbeItemsSeriesLoading ? "ItemsSeries…" : "ItemsSeries (ეს Item)"}
          </button>
          <button
            type="button"
            onClick={() => void fetchItemsSeriesBareFromProxy()}
            disabled={itemsSeriesBareLoading}
            title="GET /api/balance/items-series-bare — იგივე cloud ItemsSeries სრული სია"
            className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            {itemsSeriesBareLoading
              ? "ItemsSeries…"
              : "ItemsSeries განახლება"}
          </button>
          {canEditCatalog && (
            <Link
              href="/products/import"
              className="flex items-center justify-center gap-2 rounded-lg border border-brand-500 bg-white px-4 py-2 text-sm font-medium text-brand-500 hover:bg-brand-50 dark:bg-gray-800 dark:hover:bg-gray-700"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Excel Import
            </Link>
          )}
          <button
            type="button"
            onClick={() => void syncBalanceToDb()}
            disabled={syncLoading || balanceStocksLoading}
            className="flex items-center justify-center gap-2 rounded-lg border border-brand-500 bg-white px-4 py-2 text-sm font-medium text-brand-500 hover:bg-brand-50 disabled:opacity-50 dark:bg-gray-800 dark:hover:bg-gray-700"
          >
            {syncLoading ? "იტვირთება..." : "განახლება ბაზა"}
          </button>
          {canEditCatalog && (
            <button
              type="button"
              onClick={() => setShowBalanceColumns((v) => !v)}
              className="flex items-center justify-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-200 dark:hover:bg-amber-900/40"
              aria-expanded={showBalanceColumns}
            >
              {showBalanceColumns ? "Balance სვეტების დაკეცვა" : "Balance სვეტების გაშლა"}
            </button>
          )}
          {canEditCatalog && (
            <button
              onClick={() => {
                setEditingProduct(null);
                setIsModalOpen(true);
              }}
              className="flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
            >
              <PlusIcon className="h-4 w-4" />
              ახალი პროდუქტი
            </button>
          )}
        </div>
      </div>
      )}

      {isBalanceStocksPage && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={runFixedProbeItemsSeries}
            disabled={fixedProbeItemsSeriesLoading}
            title="დებაგი: GET /api/balance/item-series-manual-url (იხილე route.ts)"
            className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            {fixedProbeItemsSeriesLoading ? "ItemsSeries…" : "ItemsSeries (ეს Item)"}
          </button>
          <button
            type="button"
            onClick={() => void fetchItemsSeriesBareFromProxy()}
            disabled={itemsSeriesBareLoading}
            title="GET /api/balance/items-series-bare — იგივე cloud ItemsSeries სრული სია"
            className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            {itemsSeriesBareLoading ? "ItemsSeries…" : "ItemsSeries განახლება"}
          </button>
        </div>
      )}

      {isBalanceStocksPage && (fixedProbeItemsSeriesError != null ||
        fixedProbeItemsSeriesPayload != null) && (
        <div
          className={`rounded-lg border p-3 text-sm ${
            fixedProbeItemsSeriesError
              ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
              : "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/40"
          }`}
        >
          {fixedProbeItemsSeriesError ? (
            <p className="text-red-800 dark:text-red-200">
              {fixedProbeItemsSeriesError}
            </p>
          ) : (
            <pre className="max-h-80 overflow-auto text-xs text-gray-800 dark:text-gray-200">
              {typeof fixedProbeItemsSeriesPayload === "string"
                ? fixedProbeItemsSeriesPayload
                : JSON.stringify(fixedProbeItemsSeriesPayload, null, 2)}
            </pre>
          )}
        </div>
      )}

      {isBalanceStocksPage && (itemsSeriesBareError != null ||
        itemsSeriesBareLoading ||
        itemsSeriesBareData !== null) && (
        <div
          className={`rounded-lg border p-3 text-sm ${
            itemsSeriesBareError
              ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
              : "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/40"
          }`}
        >
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Balance ItemsSeries (სრული სია)
            </h3>
            {itemsSeriesBareLoading && (
              <span className="text-xs text-gray-500">იტვირთება…</span>
            )}
          </div>
          {itemsSeriesBareRequestUrl ? (
            <p className="mb-2 break-all font-mono text-[11px] text-gray-500 dark:text-gray-400">
              {itemsSeriesBareRequestUrl}
            </p>
          ) : null}
          <p className="mb-2 text-xs text-gray-600 dark:text-gray-400">
            ველები ემთხვევა Balance JSON-ს (`Item` = ნომენკლატურა, `uid` = სერიის ref). „განახლება
            ბაზა“ იყენებს იგივე სიას სინქში →{" "}
            <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">balanceItemSeries</code>,{" "}
            <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">serialNumber</code>,{" "}
            <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">expiryDate</code>.
          </p>
          {itemsSeriesBareError ? (
            <p className="text-red-800 dark:text-red-200">{itemsSeriesBareError}</p>
          ) : itemsSeriesBareRows.length > 0 ? (
            <div className="overflow-x-auto rounded border border-gray-200 dark:border-gray-600">
              <table className="min-w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-100 dark:border-gray-600 dark:bg-gray-800">
                    <th className="px-2 py-1.5 font-medium">Item (ნომენკლატურა)</th>
                    <th className="px-2 py-1.5 font-medium">Series №</th>
                    <th className="px-2 py-1.5 font-medium">ვადა</th>
                    <th className="px-2 py-1.5 font-medium">Name</th>
                    <th className="px-2 py-1.5 font-medium">uid (სერია)</th>
                  </tr>
                </thead>
                <tbody>
                  {itemsSeriesBareRows.map((row) => (
                    <tr
                      key={`${row.Item}-${row.uid}`}
                      className="border-b border-gray-100 dark:border-gray-700"
                    >
                      <td className="max-w-[200px] truncate px-2 py-1 font-mono" title={row.Item}>
                        {row.Item}
                      </td>
                      <td className="whitespace-nowrap px-2 py-1">{row.SeriesNumber || "—"}</td>
                      <td className="whitespace-nowrap px-2 py-1">{row.ValidUntil || "—"}</td>
                      <td className="max-w-[180px] truncate px-2 py-1" title={row.Name}>
                        {row.Name || "—"}
                      </td>
                      <td className="max-w-[200px] truncate px-2 py-1 font-mono text-[10px]" title={row.uid}>
                        {row.uid}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : itemsSeriesBareData !== null && !itemsSeriesBareLoading ? (
            <p className="text-gray-500 dark:text-gray-400">მონაცემი ცარიელია.</p>
          ) : null}
        </div>
      )}

      {/* Balance – ნაშთები (Stocks) – აკეცვადი */}
      {isBalanceStocksPage && (
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div
          onClick={() => setBalanceStocksCollapsed((c) => !c)}
          className="flex w-full flex-wrap items-center justify-between gap-2 p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <span
              className={`inline-block transition-transform ${balanceStocksCollapsed ? "" : "rotate-90"}`}
              aria-hidden
            >
              ▶
            </span>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Balance – ნაშთები (Stocks)
            </h2>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              syncBalanceToDb();
            }}
            disabled={syncLoading || balanceStocksLoading}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
          >
            {syncLoading ? "იტვირთება..." : "განახლება ბაზა"}
          </button>
        </div>
        {!balanceStocksCollapsed && (
        <div className="border-t border-gray-200 px-4 pb-4 pt-0 dark:border-gray-700">
        {syncResult && (
          <div
            className={`mb-3 rounded-lg border p-3 text-sm ${
              syncResult.error
                ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
                : "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
            }`}
          >
            {syncResult.error ? (
              <p className="text-red-800 dark:text-red-200">{syncResult.error}</p>
            ) : (
              <p className="text-green-800 dark:text-green-200">
                დასრულდა: {syncResult.created} ახალი, {syncResult.updated} განახლებული, სულ{" "}
                {syncResult.total} ჩანაწერი.
                {syncResult.categories ? (
                  <span className="ml-1">
                    კატეგორიები: {syncResult.categories.created} ახალი,{" "}
                    {syncResult.categories.updated} განახლებული, სულ{" "}
                    {syncResult.categories.total}.
                  </span>
                ) : null}
                {syncResult.itemsSeriesBulkUsed ? (
                  <>
                    {" "}
                    ItemsSeries სრული სიიდან:{" "}
                    <strong>{syncResult.itemsSeriesBulkLineCount ?? "—"}</strong> ხაზი
                    ნომენკლატურაზე დაჯგუფებული → სერია/ვადა ბაზაში დასეტებულია (სადაც SKU
                    ემთხვევა).
                  </>
                ) : null}
              </p>
            )}
            {syncResult.errors && syncResult.errors.length > 0 && (
              <ul className="mt-2 list-inside list-disc text-red-700 dark:text-red-300">
                {syncResult.errors.slice(0, 5).map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
                {syncResult.errors.length > 5 && (
                  <li>... და კიდევ {syncResult.errors.length - 5} შეცდომა</li>
                )}
              </ul>
            )}
          </div>
        )}
        <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
          <span className="mr-1 rounded bg-gray-100 px-1 font-mono text-[11px] dark:bg-gray-900">
            Balance/{BALANCE_PUBLICATION_TARGET}
          </span>
          — ყველა მოთხოვნა სერვერზე იგივე ApplicationID-ით (ნაგულისხმევი{" "}
          <strong>{BALANCE_PUBLICATION_TARGET}</strong>
          ); სერიების სვეტი: სრული სია <code className="text-[11px]">GET /api/balance/items-series-bare</code> — თითო Item-ზე ცალკე{" "}
          <code className="text-[11px]">ItemSeries?Item=</code> აღარ იძახება. დებაგი cloud URL:{" "}
          <code className="text-[11px]">BALANCE_DEBUG_ITEMS_SERIES=1</code>.
        </p>
        <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
          ზედა ცხრილი — <strong>Exchange/Items</strong> მხოლოდ საქონელი (<code className="text-[11px]">IsGroup=false</code>); კატეგორიები/ქვეკატეგორიები ამოღებულია. ქვემოთ — ცალკე{" "}
          <strong>Exchange/Stocks</strong> რაოდენობები (Item, Warehouse, Quantity, Reserve).
        </p>
        {balanceStocksLoading && (
          <p className="text-sm text-gray-500 dark:text-gray-400">იტვირთება...</p>
        )}
        {balanceStocksError && (
          <p className="text-sm text-red-600 dark:text-red-400">{balanceStocksError}</p>
        )}
        {!balanceStocksLoading && !balanceStocksError && balanceStockProductRows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-600">
                  {Object.keys(balanceStockProductRows[0]).map((key) => (
                    <th
                      key={key}
                      className="whitespace-nowrap px-3 py-2 font-medium text-gray-700 dark:text-gray-300"
                    >
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {balanceStockProductRows.map((row, i) => (
                  <tr
                    key={i}
                    className="border-b border-gray-100 dark:border-gray-700"
                  >
                    {Object.keys(balanceStockProductRows[0]).map((key) => (
                      <td
                        key={key}
                        className="max-w-xs truncate px-3 py-2 text-gray-800 dark:text-gray-200"
                        title={String(row[key] ?? "")}
                      >
                        {row[key] === null || row[key] === undefined
                          ? "—"
                          : typeof row[key] === "object"
                            ? JSON.stringify(row[key])
                            : String(row[key])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!balanceStocksLoading && !balanceStocksError && balanceStocksRows.length === 0 && balanceStocksRaw != null && (
          <pre className="max-h-96 overflow-auto rounded bg-gray-50 p-3 text-xs dark:bg-gray-900 dark:text-gray-300">
            {typeof balanceStocksRaw === "string"
              ? balanceStocksRaw
              : JSON.stringify(balanceStocksRaw, null, 2)}
          </pre>
        )}

        {/* Exchange/Stocks — რაოდენობები (ცალკე ენდფოინთი `/Stocks?uid=&StartingPeriod=&EndingPeriod=&Source=&Total=false`) */}
        <div className="mt-6 border-t border-gray-200 pt-4 dark:border-gray-700">
          <h3 className="mb-1 text-base font-semibold text-gray-900 dark:text-white">
            რაოდენობები (Exchange/Stocks)
          </h3>
          <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
            დოკუმენტაციის query პარამეტრებით იტვირთება (შეუსაბამოდ — სტანდარტული uid). სახელი — Items-ის{" "}
            <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">uid</code> →{" "}
            <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">Item</code>. სვეტები{" "}
            <strong>ItemsSeriesNumber</strong> / <strong>ItemsSeriesValidUntil</strong> — Balance ItemsSeries-ის{" "}
            <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">SeriesNumber</code> და{" "}
            <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">ValidUntil</code>;{" "}
            <strong>ItemsSeries</strong> — მოკლე შეჯამება (№ · ვადა). Balance ItemsSeries GET-ზე ნომენკლატურა query-ში{" "}
            <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">Item</code> (არა <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">uid</code>); ფილტრი{" "}
            <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">Series</code> → ItemsSeries პასუხის ჩანაწერის{" "}
            <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">uid</code>.
          </p>
          {exchangeSeriesPlan.truncated > 0 && (
            <p className="mb-2 text-xs text-amber-700 dark:text-amber-400">
              უნიკალური ნომენკლატურის Item-დან პირველი {MAX_EXCHANGE_ITEMS_SERIES_FETCH} იტვირთა; დანარჩენი{" "}
              {exchangeSeriesPlan.truncated} ამ ჩართვაზე ItemsSeries-ით არ განახლდა (სვეტი „— (ლიმიტი)“).
            </p>
          )}
          {balanceExchangeQtyLoading && (
            <p className="text-sm text-gray-500 dark:text-gray-400">იტვირთება...</p>
          )}
          {balanceExchangeQtyError && (
            <p className="text-sm text-red-600 dark:text-red-400">{balanceExchangeQtyError}</p>
          )}
          {!balanceExchangeQtyLoading &&
            !balanceExchangeQtyError &&
            balanceExchangeQtyDisplayRows.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-600">
                      {Object.keys(balanceExchangeQtyDisplayRows[0]).map((key) => (
                        <th
                          key={key}
                          className="whitespace-nowrap px-3 py-2 font-medium text-gray-700 dark:text-gray-300"
                        >
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {balanceExchangeQtyDisplayRows.map((row, i) => (
                      <tr
                        key={i}
                        className="border-b border-gray-100 dark:border-gray-700"
                      >
                        {Object.keys(balanceExchangeQtyDisplayRows[0]).map((key) => (
                          <td
                            key={key}
                            className="max-w-xs truncate px-3 py-2 text-gray-800 dark:text-gray-200"
                            title={String(row[key] ?? "")}
                          >
                            {row[key] === null || row[key] === undefined
                              ? "—"
                              : typeof row[key] === "object"
                                ? JSON.stringify(row[key])
                                : String(row[key])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          {!balanceExchangeQtyLoading &&
            !balanceExchangeQtyError &&
            balanceExchangeQtyDisplayRows.length === 0 &&
            balanceExchangeQtyRaw != null && (
              <pre className="max-h-96 overflow-auto rounded bg-gray-50 p-3 text-xs dark:bg-gray-900 dark:text-gray-300">
                {typeof balanceExchangeQtyRaw === "string"
                  ? balanceExchangeQtyRaw
                  : JSON.stringify(balanceExchangeQtyRaw, null, 2)}
              </pre>
            )}
        </div>

        {/* Balance – ფასები (Prices) */}
        <div className="mt-6 border-t border-gray-200 pt-4 dark:border-gray-700">
          <h3 className="mb-3 text-base font-semibold text-gray-900 dark:text-white">
            ფასები (Prices)
          </h3>
          {balancePricesLoading && (
            <p className="text-sm text-gray-500 dark:text-gray-400">იტვირთება...</p>
          )}
          {balancePricesError && (
            <p className="text-sm text-red-600 dark:text-red-400">{balancePricesError}</p>
          )}
          {!balancePricesLoading && !balancePricesError && balancePricesRows.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-600">
                    {Object.keys(balancePricesRows[0]).map((key) => (
                      <th
                        key={key}
                        className="whitespace-nowrap px-3 py-2 font-medium text-gray-700 dark:text-gray-300"
                      >
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {balancePricesRows.map((row, i) => (
                    <tr
                      key={i}
                      className="border-b border-gray-100 dark:border-gray-700"
                    >
                      {Object.keys(balancePricesRows[0]).map((key) => (
                        <td
                          key={key}
                          className="max-w-xs truncate px-3 py-2 text-gray-800 dark:text-gray-200"
                          title={String(row[key] ?? "")}
                        >
                          {row[key] === null || row[key] === undefined
                            ? "—"
                            : typeof row[key] === "object"
                              ? JSON.stringify(row[key])
                              : String(row[key])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!balancePricesLoading && !balancePricesError && balancePricesRows.length === 0 && balancePricesRaw != null && (
            <pre className="max-h-96 overflow-auto rounded bg-gray-50 p-3 text-xs dark:bg-gray-900 dark:text-gray-300">
              {typeof balancePricesRaw === "string"
                ? balancePricesRaw
                : JSON.stringify(balancePricesRaw, null, 2)}
            </pre>
          )}
        </div>

        {/* Balance – ფასდაკლებები (Discounts) — იგივე პატერნი რაც Prices */}
        <div className="mt-6 border-t border-gray-200 pt-4 dark:border-gray-700">
          <h3 className="mb-1 text-base font-semibold text-gray-900 dark:text-white">
            ფასდაკლებები (Discounts)
          </h3>
          <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
            <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">GET /api/balance/discounts</code>
            {" — "}
            იგივე სერვერული proxy რაც სინქში; ნაგულისხმევი URL: Exchange/Discounts.
          </p>
          {balanceDiscountsLoading && (
            <p className="text-sm text-gray-500 dark:text-gray-400">იტვირთება...</p>
          )}
          {balanceDiscountsError && (
            <p className="text-sm text-red-600 dark:text-red-400">{balanceDiscountsError}</p>
          )}
          {!balanceDiscountsLoading && !balanceDiscountsError && balanceDiscountsRows.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-600">
                    {Object.keys(balanceDiscountsRows[0]).map((key) => (
                      <th
                        key={key}
                        className="whitespace-nowrap px-3 py-2 font-medium text-gray-700 dark:text-gray-300"
                      >
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {balanceDiscountsRows.map((row, i) => (
                    <tr
                      key={i}
                      className="border-b border-gray-100 dark:border-gray-700"
                    >
                      {Object.keys(balanceDiscountsRows[0]).map((key) => (
                        <td
                          key={key}
                          className="max-w-xs truncate px-3 py-2 text-gray-800 dark:text-gray-200"
                          title={String(row[key] ?? "")}
                        >
                          {row[key] === null || row[key] === undefined
                            ? "—"
                            : typeof row[key] === "object"
                              ? JSON.stringify(row[key])
                              : String(row[key])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!balanceDiscountsLoading &&
            !balanceDiscountsError &&
            balanceDiscountsRows.length === 0 &&
            balanceDiscountsRaw != null && (
              <pre className="max-h-96 overflow-auto rounded bg-gray-50 p-3 text-xs dark:bg-gray-900 dark:text-gray-300">
                {typeof balanceDiscountsRaw === "string"
                  ? balanceDiscountsRaw
                  : JSON.stringify(balanceDiscountsRaw, null, 2)}
              </pre>
            )}
        </div>

        {/* Balance – ItemPricing (პროდუქტების მიხედვით გაფილტრული) */}
        <div className="mt-6 border-t border-gray-200 pt-4 dark:border-gray-700">
          <h3 className="mb-3 text-base font-semibold text-gray-900 dark:text-white">
            ItemPricing (პროდუქტებიდან)
          </h3>
          {balanceItemPricingLoading && (
            <p className="text-sm text-gray-500 dark:text-gray-400">იტვირთება...</p>
          )}
          {balanceItemPricingError && (
            <p className="text-sm text-red-600 dark:text-red-400">{balanceItemPricingError}</p>
          )}
          {!balanceItemPricingLoading && !balanceItemPricingError && balanceItemPricingRowsForProducts.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-600">
                    {Object.keys(balanceItemPricingRowsForProducts[0]).map((key) => (
                      <th
                        key={key}
                        className="whitespace-nowrap px-3 py-2 font-medium text-gray-700 dark:text-gray-300"
                      >
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {balanceItemPricingRowsForProducts.map((row, i) => (
                    <tr
                      key={i}
                      className="border-b border-gray-100 dark:border-gray-700"
                    >
                      {Object.keys(balanceItemPricingRowsForProducts[0]).map((key) => (
                        <td
                          key={key}
                          className="max-w-xs truncate px-3 py-2 text-gray-800 dark:text-gray-200"
                          title={String(row[key] ?? "")}
                        >
                          {row[key] === null || row[key] === undefined
                            ? "—"
                            : typeof row[key] === "object"
                              ? JSON.stringify(row[key])
                              : String(row[key])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!balanceItemPricingLoading &&
            !balanceItemPricingError &&
            balanceItemPricingRowsForProducts.length === 0 &&
            balanceItemPricingRaw != null && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  ფილტრით ჩანაწერი არ მოიძებნა (შეამოწმე SKU ↔ Balance Code ან ItemPricing ველების სახელები).
                </p>
                <pre className="max-h-48 overflow-auto rounded bg-gray-50 p-3 text-xs dark:bg-gray-900 dark:text-gray-300">
                  {typeof balanceItemPricingRaw === "string"
                    ? balanceItemPricingRaw
                    : JSON.stringify(balanceItemPricingRaw, null, 2)}
                </pre>
              </div>
            )}
        </div>
        </div>
        )}
      </div>
      )}

      {/* Products Table — თანმიმდევრობა: Balance/ზედნადები (10) → ფარმაცევტის სვეტები (12) → სხვა... → ადმინი: რეზერვი, Balance, მოქმედებები */}
      {showProductTable && (
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        {isBalanceCatalogPage && (
          <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-700">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              ნომენკლატურა
            </h2>
          </div>
        )}
        <div className="overflow-x-auto">
          {isBalanceCatalogPage ? (
          <>
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                {balanceCatalogColumns.map((key) => (
                  <th
                    key={key}
                    className="whitespace-nowrap border border-amber-200/70 bg-amber-100 px-3 py-3 text-left text-xs font-semibold text-gray-900 dark:border-amber-800/50 dark:bg-amber-950/45 dark:text-amber-50"
                  >
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {balanceStocksLoading ? (
                <tr>
                  <td
                    colSpan={Math.max(balanceCatalogColumns.length, 1)}
                    className="px-6 py-8 text-center text-sm text-gray-500"
                  >
                    იტვირთება...
                  </td>
                </tr>
              ) : balanceStocksError ? (
                <tr>
                  <td
                    colSpan={Math.max(balanceCatalogColumns.length, 1)}
                    className="px-6 py-8 text-center text-sm text-red-600"
                  >
                    {balanceStocksError}
                  </td>
                </tr>
              ) : balanceStockProductRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={Math.max(balanceCatalogColumns.length, 1)}
                    className="px-6 py-8 text-center text-sm text-gray-500"
                  >
                    ნომენკლატურა არ მოიძებნა
                  </td>
                </tr>
              ) : (
                balanceStockProductRows.map((row, i) => (
                  <tr
                    key={String(row.uid ?? row.Code ?? row.InternalArticle ?? i)}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    {balanceCatalogColumns.map((key) => {
                      const value = row[key];
                      const display =
                        value === null || value === undefined
                          ? "—"
                          : typeof value === "object"
                            ? JSON.stringify(value)
                            : String(value);
                      return (
                        <td
                          key={key}
                          className="max-w-xs truncate border border-amber-100/90 bg-amber-50/35 px-3 py-2 text-gray-800 dark:border-amber-900/35 dark:bg-amber-950/20 dark:text-gray-200"
                          title={display}
                        >
                          {display}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div className="border-t border-gray-200 dark:border-gray-700">
            <div className="px-5 py-4">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                ფასები
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    {balanceCatalogPriceColumns.map((key) => (
                      <th
                        key={key}
                        className="whitespace-nowrap border border-emerald-200/70 bg-emerald-100 px-3 py-3 text-left text-xs font-semibold text-gray-900 dark:border-emerald-800/50 dark:bg-emerald-950/45 dark:text-emerald-50"
                      >
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {balancePricesLoading ? (
                    <tr>
                      <td
                        colSpan={Math.max(balanceCatalogPriceColumns.length, 1)}
                        className="px-6 py-8 text-center text-sm text-gray-500"
                      >
                        იტვირთება...
                      </td>
                    </tr>
                  ) : balancePricesError ? (
                    <tr>
                      <td
                        colSpan={Math.max(balanceCatalogPriceColumns.length, 1)}
                        className="px-6 py-8 text-center text-sm text-red-600"
                      >
                        {balancePricesError}
                      </td>
                    </tr>
                  ) : balancePricesRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={Math.max(balanceCatalogPriceColumns.length, 1)}
                        className="px-6 py-8 text-center text-sm text-gray-500"
                      >
                        ფასები არ მოიძებნა
                      </td>
                    </tr>
                  ) : (
                    balancePricesRows.map((row, i) => (
                      <tr
                        key={String(row.uid ?? row.Item ?? row.PriceType ?? i)}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        {balanceCatalogPriceColumns.map((key) => {
                          const itemUid = getItemUuid(row)?.trim().toLowerCase();
                          const value =
                            key === "ItemName" && itemUid
                              ? balanceCatalogItemNameByUid.get(itemUid)
                              : row[key];
                          const display =
                            value === null || value === undefined
                              ? "—"
                              : typeof value === "object"
                                ? JSON.stringify(value)
                                : String(value);
                          return (
                            <td
                              key={key}
                              className="max-w-xs truncate border border-emerald-100/90 bg-emerald-50/35 px-3 py-2 text-gray-800 dark:border-emerald-900/35 dark:bg-emerald-950/20 dark:text-gray-200"
                              title={display}
                            >
                              {display}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700">
            <div className="px-5 py-4">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                ფასდაკლებები
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    {balanceCatalogDiscountColumns.map((key) => (
                      <th
                        key={key}
                        className="whitespace-nowrap border border-rose-200/70 bg-rose-100 px-3 py-3 text-left text-xs font-semibold text-gray-900 dark:border-rose-800/50 dark:bg-rose-950/45 dark:text-rose-50"
                      >
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {balanceDiscountsLoading ? (
                    <tr>
                      <td colSpan={Math.max(balanceCatalogDiscountColumns.length, 1)} className="px-6 py-8 text-center text-sm text-gray-500">
                        იტვირთება...
                      </td>
                    </tr>
                  ) : balanceDiscountsError ? (
                    <tr>
                      <td colSpan={Math.max(balanceCatalogDiscountColumns.length, 1)} className="px-6 py-8 text-center text-sm text-red-600">
                        {balanceDiscountsError}
                      </td>
                    </tr>
                  ) : balanceCatalogDiscountRows.length === 0 ? (
                    <tr>
                      <td colSpan={Math.max(balanceCatalogDiscountColumns.length, 1)} className="px-6 py-8 text-center text-sm text-gray-500">
                        ფასდაკლებები არ მოიძებნა
                      </td>
                    </tr>
                  ) : (
                    balanceCatalogDiscountRows.map((row, i) => (
                      <tr key={String((row as Record<string, unknown>).uid ?? (row as Record<string, unknown>).Item ?? i)} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        {balanceCatalogDiscountColumns.map((key) => {
                          const value = (row as Record<string, unknown>)[key];
                          const display =
                            value === null || value === undefined
                              ? "—"
                              : typeof value === "object"
                                ? JSON.stringify(value)
                                : String(value);
                          return (
                            <td
                              key={key}
                              className="max-w-xs truncate border border-rose-100/90 bg-rose-50/35 px-3 py-2 text-gray-800 dark:border-rose-900/35 dark:bg-rose-950/20 dark:text-gray-200"
                              title={display}
                            >
                              {display}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700">
            <div className="px-5 py-4">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                რაოდენობები
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    {balanceCatalogQuantityColumns.map((key) => (
                      <th
                        key={key}
                        className="whitespace-nowrap border border-sky-200/70 bg-sky-100 px-3 py-3 text-left text-xs font-semibold text-gray-900 dark:border-sky-800/50 dark:bg-sky-950/45 dark:text-sky-50"
                      >
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {balanceExchangeQtyLoading ? (
                    <tr>
                      <td colSpan={Math.max(balanceCatalogQuantityColumns.length, 1)} className="px-6 py-8 text-center text-sm text-gray-500">
                        იტვირთება...
                      </td>
                    </tr>
                  ) : balanceExchangeQtyError ? (
                    <tr>
                      <td colSpan={Math.max(balanceCatalogQuantityColumns.length, 1)} className="px-6 py-8 text-center text-sm text-red-600">
                        {balanceExchangeQtyError}
                      </td>
                    </tr>
                  ) : balanceExchangeQtyDisplayRows.length === 0 ? (
                    <tr>
                      <td colSpan={Math.max(balanceCatalogQuantityColumns.length, 1)} className="px-6 py-8 text-center text-sm text-gray-500">
                        რაოდენობები არ მოიძებნა
                      </td>
                    </tr>
                  ) : (
                    balanceExchangeQtyDisplayRows.map((row, i) => (
                      <tr
                        key={[
                          row.uid,
                          row.Item,
                          row.Warehouse,
                          row.Series,
                          row.Quantity,
                          row.Reserve,
                          i,
                        ]
                          .map((part) => String(part ?? ""))
                          .join("|")}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        {balanceCatalogQuantityColumns.map((key) => {
                          const value = row[key];
                          const display =
                            value === null || value === undefined
                              ? "—"
                              : typeof value === "object"
                                ? JSON.stringify(value)
                                : String(value);
                          return (
                            <td
                              key={key}
                              className="max-w-xs truncate border border-sky-100/90 bg-sky-50/35 px-3 py-2 text-gray-800 dark:border-sky-900/35 dark:bg-sky-950/20 dark:text-gray-200"
                              title={display}
                            >
                              {display}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700">
            <div className="px-5 py-4">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                სერიები
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    {balanceCatalogSeriesColumns.map((key) => (
                      <th
                        key={key}
                        className="whitespace-nowrap border border-violet-200/70 bg-violet-100 px-3 py-3 text-left text-xs font-semibold text-gray-900 dark:border-violet-800/50 dark:bg-violet-950/45 dark:text-violet-50"
                      >
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {itemsSeriesBareLoading ? (
                    <tr>
                      <td colSpan={Math.max(balanceCatalogSeriesColumns.length, 1)} className="px-6 py-8 text-center text-sm text-gray-500">
                        იტვირთება...
                      </td>
                    </tr>
                  ) : itemsSeriesBareError ? (
                    <tr>
                      <td colSpan={Math.max(balanceCatalogSeriesColumns.length, 1)} className="px-6 py-8 text-center text-sm text-red-600">
                        {itemsSeriesBareError}
                      </td>
                    </tr>
                  ) : balanceCatalogSeriesRows.length === 0 ? (
                    <tr>
                      <td colSpan={Math.max(balanceCatalogSeriesColumns.length, 1)} className="px-6 py-8 text-center text-sm text-gray-500">
                        სერიები არ მოიძებნა
                      </td>
                    </tr>
                  ) : (
                    balanceCatalogSeriesRows.map((row, i) => (
                      <tr key={String(row.uid ?? row.Item ?? i)} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        {balanceCatalogSeriesColumns.map((key) => {
                          const value = (row as Record<string, unknown>)[key];
                          const display =
                            value === null || value === undefined
                              ? "—"
                              : typeof value === "object"
                                ? JSON.stringify(value)
                                : String(value);
                          return (
                            <td
                              key={key}
                              className="max-w-xs truncate border border-violet-100/90 bg-violet-50/35 px-3 py-2 text-gray-800 dark:border-violet-900/35 dark:bg-violet-950/20 dark:text-gray-200"
                              title={display}
                            >
                              {display}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700">
            <div className="px-5 py-4">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                საწყობები
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    {balanceCatalogWarehouseColumns.map((key) => (
                      <th
                        key={key}
                        className="whitespace-nowrap border border-slate-200/70 bg-slate-100 px-3 py-3 text-left text-xs font-semibold text-gray-900 dark:border-slate-700/70 dark:bg-slate-800 dark:text-slate-50"
                      >
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {balanceWarehousesLoading ? (
                    <tr>
                      <td colSpan={Math.max(balanceCatalogWarehouseColumns.length, 1)} className="px-6 py-8 text-center text-sm text-gray-500">
                        იტვირთება...
                      </td>
                    </tr>
                  ) : balanceWarehousesError ? (
                    <tr>
                      <td colSpan={Math.max(balanceCatalogWarehouseColumns.length, 1)} className="px-6 py-8 text-center text-sm text-red-600">
                        {balanceWarehousesError}
                      </td>
                    </tr>
                  ) : balanceWarehousesRows.length === 0 ? (
                    <tr>
                      <td colSpan={Math.max(balanceCatalogWarehouseColumns.length, 1)} className="px-6 py-8 text-center text-sm text-gray-500">
                        საწყობები არ მოიძებნა
                      </td>
                    </tr>
                  ) : (
                    balanceWarehousesRows.map((row, i) => (
                      <tr key={String(row.uid ?? row.Code ?? row.Name ?? i)} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        {balanceCatalogWarehouseColumns.map((key) => {
                          const value = row[key];
                          const display =
                            value === null || value === undefined
                              ? "—"
                              : typeof value === "object"
                                ? JSON.stringify(value)
                                : String(value);
                          return (
                            <td
                              key={key}
                              className="max-w-xs truncate border border-slate-100 bg-slate-50/50 px-3 py-2 text-gray-800 dark:border-slate-800 dark:bg-slate-900/35 dark:text-gray-200"
                              title={display}
                            >
                              {display}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          </>
          ) : isPharmacistCatalogPage ? (
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                {[
                  "საქონლის კოდი",
                  "Product Name",
                  "Category",
                  "Form",
                  "Strength",
                  "Manufacturer",
                  "Unit",
                  "Pack Size",
                  "Prescription Required (Y/N)",
                  "Unit Price",
                  "Qty on Hand",
                  "Reorder Level",
                  "Stock Value",
                  "Stock Status",
                  "მოქმედებები",
                ].map((label) => (
                  <th
                    key={label}
                    className="whitespace-nowrap px-3 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300"
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={15} className="px-6 py-8 text-center text-sm text-gray-500">
                    პროდუქტები არ მოიძებნა
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const sku =
                    product.productCode?.trim() ||
                    product.sku?.trim() ||
                    "—";
                  const productName =
                    product.productNameBrand?.trim() || product.name?.trim() || "—";
                  const category =
                    [product.mainCategory?.trim(), product.subcategory?.trim()]
                      .filter(Boolean)
                      .join(" / ") || "—";
                  const reorderLevel = numericProductValue(product, [
                    "reorderLevel",
                    "reorder_level",
                    "Reorder Level",
                  ]);
                  const qty =
                    product.quantity != null && Number.isFinite(Number(product.quantity))
                      ? Number(product.quantity)
                      : undefined;
                  const unitPrice =
                    product.price != null && Number.isFinite(Number(product.price))
                      ? Number(product.price)
                      : undefined;
                  const stockValue =
                    product.totalPrice != null && Number.isFinite(Number(product.totalPrice))
                      ? Number(product.totalPrice)
                      : qty !== undefined && unitPrice !== undefined
                        ? qty * unitPrice
                        : undefined;
                  return (
                    <tr
                      key={product.id || (product as any)._id || product.sku}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="max-w-[120px] truncate px-3 py-3 font-mono text-xs text-gray-700 dark:text-gray-300" title={sku}>
                        {sku}
                      </td>
                      <td className="max-w-[220px] truncate px-3 py-3 text-sm font-medium text-gray-900 dark:text-white" title={productName}>
                        {productName}
                      </td>
                      <td className="max-w-[180px] truncate px-3 py-3 text-sm text-gray-600 dark:text-gray-300" title={category}>
                        {category}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-600 dark:text-gray-300">
                        {product.dosageForm?.trim() || "—"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-600 dark:text-gray-300">
                        {product.strength?.trim() || "—"}
                      </td>
                      <td className="max-w-[160px] truncate px-3 py-3 text-sm text-gray-600 dark:text-gray-300" title={product.manufacturer}>
                        {product.manufacturer?.trim() || "—"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-600 dark:text-gray-300">
                        {product.unitOfMeasure?.trim() || "—"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-600 dark:text-gray-300">
                        {product.packSize?.trim() || "—"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-600 dark:text-gray-300">
                        {yesNoDisplay(
                          productFilterValue(product, [
                            "prescriptionRequired",
                            "prescription_required",
                            "Prescription Required",
                          ]),
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-sm tabular-nums text-gray-900 dark:text-white">
                        {unitPrice !== undefined ? `₾${unitPrice.toFixed(2)}` : "—"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-sm tabular-nums text-gray-700 dark:text-gray-300">
                        {qty ?? "—"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-sm tabular-nums text-gray-700 dark:text-gray-300">
                        {reorderLevel ?? "—"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-sm tabular-nums text-gray-900 dark:text-white">
                        {stockValue !== undefined ? `₾${stockValue.toFixed(2)}` : "—"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-sm">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                            stockStatusDisplay(product) === "LOW STOCK"
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                              : stockStatusDisplay(product) === "OK"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {stockStatusDisplay(product)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handlePharmacistEdit(product)}
                            className="rounded p-1 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                            title="რედაქტირება"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            disabled={deletingProductId === product.id}
                            className="rounded p-1 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 disabled:cursor-not-allowed disabled:opacity-50"
                            title="წაშლა"
                          >
                            {deletingProductId === product.id ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                            ) : (
                              <TrashBinIcon className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          ) : (
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="whitespace-nowrap border border-amber-200/70 bg-amber-100 px-3 py-3 text-left text-xs font-semibold text-gray-900 dark:border-amber-800/50 dark:bg-amber-950/45 dark:text-amber-50">
                  საქონლის კოდი
                </th>
                <th className="whitespace-nowrap border border-amber-200/70 bg-amber-100 px-3 py-3 text-left text-xs font-semibold text-gray-900 dark:border-amber-800/50 dark:bg-amber-950/45 dark:text-amber-50">
                  დასახელება (მყიდველისგან)
                </th>
                {showAllBalanceColumns && (
                <>
                <th className="whitespace-nowrap border border-amber-200/70 bg-amber-100 px-3 py-3 text-left text-xs font-semibold text-gray-900 dark:border-amber-800/50 dark:bg-amber-950/45 dark:text-amber-50">
                  ზომის ერთეული
                </th>
                <th className="whitespace-nowrap border border-amber-200/70 bg-amber-100 px-3 py-3 text-left text-xs font-semibold text-gray-900 dark:border-amber-800/50 dark:bg-amber-950/45 dark:text-amber-50">
                  რაოდენობა
                </th>
                <th className="whitespace-nowrap border border-amber-200/70 bg-amber-100 px-3 py-3 text-left text-xs font-semibold text-gray-900 dark:border-amber-800/50 dark:bg-amber-950/45 dark:text-amber-50">
                  ერთეულის ფასი
                </th>
                <th className="whitespace-nowrap border border-amber-200/70 bg-amber-100 px-3 py-3 text-left text-xs font-semibold text-gray-900 dark:border-amber-800/50 dark:bg-amber-950/45 dark:text-amber-50">
                  საქონლის ფასი
                </th>
                </>
                )}
                <th className="whitespace-nowrap border border-amber-200/70 bg-amber-100 px-3 py-3 text-left text-xs font-semibold text-gray-900 dark:border-amber-800/50 dark:bg-amber-950/45 dark:text-amber-50">
                  ფასდაკლებული (ერთ. / ჯამი)
                </th>
                {showAllBalanceColumns && (
                <>
                <th className="whitespace-nowrap border border-amber-200/70 bg-amber-100 px-3 py-3 text-left text-xs font-semibold text-gray-900 dark:border-amber-800/50 dark:bg-amber-950/45 dark:text-amber-50">
                  Balance ფასდაკლება
                </th>
                <th className="whitespace-nowrap border border-amber-200/70 bg-amber-100 px-3 py-3 text-left text-xs font-semibold text-gray-900 dark:border-amber-800/50 dark:bg-amber-950/45 dark:text-amber-50">
                  დაბეგვრა
                </th>
                <th className="whitespace-nowrap border border-amber-200/70 bg-amber-100 px-3 py-3 text-left text-xs font-semibold text-gray-900 dark:border-amber-800/50 dark:bg-amber-950/45 dark:text-amber-50">
                  სტატუსი
                </th>
                <th className="whitespace-nowrap border border-amber-200/70 bg-amber-100 px-3 py-3 text-left text-xs font-semibold text-gray-900 dark:border-amber-800/50 dark:bg-amber-950/45 dark:text-amber-50">
                  სერიის ნომერი
                </th>
                <th className="whitespace-nowrap border border-amber-200/70 bg-amber-100 px-3 py-3 text-left text-xs font-semibold text-gray-900 dark:border-amber-800/50 dark:bg-amber-950/45 dark:text-amber-50">
                  ვარიგისია -მდე
                </th>
                </>
                )}
                {!isBalanceCatalogPage && (
                <>
                <th className="whitespace-nowrap px-3 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300">
                  SKU
                </th>
                <th className="whitespace-nowrap px-3 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300">
                  1) Product Name (Brand Name)
                </th>
                <th className="whitespace-nowrap px-3 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300">
                  2) Generic Name (INN)
                </th>
                <th className="whitespace-nowrap px-3 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300">
                  3) Strength
                </th>
                <th className="whitespace-nowrap px-3 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300">
                  4) Dosage Form
                </th>
                <th className="whitespace-nowrap px-3 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300">
                  5) Route of Administration
                </th>
                <th className="whitespace-nowrap px-3 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300">
                  6) Therapeutic Class
                </th>
                <th className="whitespace-nowrap px-3 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300">
                  7) ATC Code
                </th>
                <th className="whitespace-nowrap px-3 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300">
                  8) Product Description (Short)
                </th>
                <th className="whitespace-nowrap px-3 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300">
                  ბარკოდი
                </th>
                <th className="whitespace-nowrap px-3 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300">
                  Market / Country
                </th>
                <th className="whitespace-nowrap px-3 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300">
                  PDF - სრული ანოტაციის
                </th>
                <th className="whitespace-nowrap px-3 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300">
                  სხვა...
                </th>
                <th className="whitespace-nowrap px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                  რეზერვი
                </th>
                <th className="whitespace-nowrap px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                  Balance ნაშთი
                </th>
                </>
                )}
                {canEditCatalog && (
                <th className="whitespace-nowrap px-3 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-300">
                  მოქმედებები
                </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td
                    colSpan={
                      isBalanceCatalogPage
                        ? 10
                        : showAllBalanceColumns
                          ? 28
                          : 20
                    }
                    className="px-6 py-8 text-center text-sm text-gray-500"
                  >
                    პროდუქტები არ მოიძებნა
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const skuOrCode =
                    String(product.productCode ?? "").trim() ||
                    String(product.sku ?? "").trim() ||
                    "—";
                  const taxationDisplay =
                    balanceVatRateBySku.get(String(product.sku ?? "").trim()) ??
                    product.taxation ??
                    balanceTaxationBySku.get(String(product.sku ?? "").trim()) ??
                    "—";
                  const pdfUrl = product.imageUrl?.trim();
                  const pdfCell =
                    pdfUrl && /\.pdf($|\?)/i.test(pdfUrl) ? (
                      <a
                        href={pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-600 hover:underline dark:text-brand-400"
                      >
                        ბმული
                      </a>
                    ) : (
                      "—"
                    );
                  const otherParts = [
                    product.invoiceNumber && `ზედნადები: ${product.invoiceNumber}`,
                    product.buyer && `მყიდველი: ${product.buyer}`,
                    product.seller && `გამყიდველი: ${product.seller}`,
                    product.activationDate &&
                      `გააქტიურება: ${formatDisplayDate(product.activationDate)}`,
                    product.transportStartDate &&
                      `ტრანსპორტი: ${formatDisplayDate(product.transportStartDate)}`,
                    product.certificateNumber && `ფირნიში: ${product.certificateNumber}`,
                    product.documentNumber && `დოკ. N: ${product.documentNumber}`,
                    product.manufacturer && `მწარმოებელი: ${product.manufacturer}`,
                    product.packSize && `შეფუთვა: ${product.packSize}`,
                    product.packagingType && `შეფუთვის სახე: ${product.packagingType}`,
                    product.activeIngredients && `აქტ. ნივთ.: ${product.activeIngredients}`,
                  ].filter(Boolean);
                  const otherCell =
                    otherParts.length > 0 ? otherParts.join(" · ") : "—";

                  const cellBalance =
                    "border border-amber-100/90 bg-amber-50/35 dark:border-amber-900/35 dark:bg-amber-950/20";

                  const liveDisc = liveBalanceDiscountForProduct(
                    product,
                    balanceDiscountMaps,
                    balanceStocksRows
                  );
                  const discPct =
                    liveDisc?.balanceDiscountPercent ?? product.balanceDiscountPercent;
                  const discAmt =
                    liveDisc?.balanceDiscountAmount ?? product.balanceDiscountAmount;
                  const hasDiscPct =
                    discPct != null && Number.isFinite(Number(discPct)) && Number(discPct) > 0;
                  const hasDiscAmt =
                    discAmt != null && Number.isFinite(Number(discAmt)) && Number(discAmt) > 0;
                  const discountCellText = hasDiscPct
                    ? `−${Number(discPct)}%`
                    : hasDiscAmt
                      ? `−₾${Number(discAmt).toFixed(2)}`
                      : "—";
                  const discountTitle = [
                    (liveDisc?.balanceDiscountName ?? product.balanceDiscountName)?.trim(),
                    (liveDisc?.balanceDiscountUid ?? product.balanceDiscountUid) &&
                      `წესის კოდი: ${liveDisc?.balanceDiscountUid ?? product.balanceDiscountUid}`,
                    liveDisc &&
                      !balanceDiscountsLoading &&
                      !balanceDiscountsError &&
                      "Balance Discounts (ცოცხალი)",
                  ]
                    .filter(Boolean)
                    .join(" · ");

                  const priced = unitAndTotalAfterBalanceDiscount(
                    product,
                    hasDiscPct,
                    hasDiscPct ? Number(discPct) : 0,
                    hasDiscAmt && !hasDiscPct,
                    hasDiscAmt ? Number(discAmt) : 0
                  );

                  return (
                  <tr
                    key={product.id || (product as any)._id || product.sku}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className={`max-w-[130px] truncate px-3 py-3 text-sm text-gray-900 dark:text-white ${cellBalance}`} title={skuOrCode}>
                      {skuOrCode}
                    </td>
                    <td className={`max-w-[200px] truncate px-3 py-3 text-sm text-gray-900 dark:text-white ${cellBalance}`} title={product.name}>
                      {product.name || "—"}
                    </td>
                    {showAllBalanceColumns && (
                    <>
                    <td className={`whitespace-nowrap px-3 py-3 text-sm text-gray-800 dark:text-gray-200 ${cellBalance}`}>
                      {product.unitOfMeasure || "—"}
                    </td>
                    <td className={`whitespace-nowrap px-3 py-3 text-sm tabular-nums text-gray-800 dark:text-gray-200 ${cellBalance}`}>
                      {product.quantity ?? "—"}
                    </td>
                    <td className={`whitespace-nowrap px-3 py-3 text-sm tabular-nums text-gray-900 dark:text-white ${cellBalance}`}>
                      ₾{product.price.toFixed(2)}
                    </td>
                    <td className={`whitespace-nowrap px-3 py-3 text-sm tabular-nums text-gray-900 dark:text-white ${cellBalance}`}>
                      {product.totalPrice != null
                        ? `₾${Number(product.totalPrice).toFixed(2)}`
                        : `₾${product.price.toFixed(2)}`}
                    </td>
                    </>
                    )}
                    <td
                      className={`px-3 py-3 text-sm text-gray-900 dark:text-white ${cellBalance}`}
                      title={priced.apply && discountTitle ? discountTitle : undefined}
                    >
                      {priced.apply ? (
                        <div className="flex flex-col items-end gap-1.5 tabular-nums">
                          <div className="flex flex-col items-end gap-0.5">
                            <span className="text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                              ერთეული
                            </span>
                            <span>
                              <span className="text-xs line-through text-gray-500 dark:text-gray-400">
                                ₾{priced.origUnit.toFixed(2)}
                              </span>
                              <span className="ml-1 font-semibold text-emerald-700 dark:text-emerald-400">
                                ₾{priced.unit.toFixed(2)}
                              </span>
                            </span>
                          </div>
                          <div className="flex flex-col items-end gap-0.5 border-t border-amber-200/60 pt-1 dark:border-amber-800/40">
                            <span className="text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                              ჯამი
                            </span>
                            <span>
                              <span className="text-xs line-through text-gray-500 dark:text-gray-400">
                                ₾{priced.origTotal.toFixed(2)}
                              </span>
                              <span className="ml-1 font-semibold text-emerald-700 dark:text-emerald-400">
                                ₾{priced.total.toFixed(2)}
                              </span>
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400">—</span>
                      )}
                    </td>
                    {showAllBalanceColumns && (
                    <>
                    <td
                      className={`whitespace-nowrap px-3 py-3 text-sm tabular-nums ${cellBalance} ${
                        hasDiscPct || hasDiscAmt
                          ? "font-medium text-emerald-700 dark:text-emerald-400"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                      title={discountTitle || undefined}
                    >
                      {discountCellText}
                    </td>
                    <td className={`max-w-[90px] truncate px-3 py-3 text-sm text-gray-800 dark:text-gray-200 ${cellBalance}`} title={String(taxationDisplay)}>
                      {taxationDisplay}
                    </td>
                    <td className={`px-3 py-3 ${cellBalance}`}>
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          product.active
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        }`}
                      >
                        {product.active ? "აქტიური" : "არააქტიური"}
                      </span>
                    </td>
                    <td
                      className={`max-w-[110px] truncate px-3 py-3 text-sm text-gray-800 dark:text-gray-200 ${cellBalance}`}
                      title={productBalanceSerialDisplay(product) || undefined}
                    >
                      {productBalanceSerialDisplay(product) || "—"}
                    </td>
                    <td
                      className={`max-w-[110px] truncate px-3 py-3 text-sm text-gray-800 dark:text-gray-200 ${cellBalance}`}
                      title={productBalanceExpiryDisplay(product) || undefined}
                    >
                      {productBalanceExpiryDisplay(product) || "—"}
                    </td>
                    </>
                    )}
                    {!isBalanceCatalogPage && (
                    <>
                    <td
                      className="max-w-[120px] truncate px-3 py-3 font-mono text-xs text-gray-600 dark:text-gray-300"
                      title={product.internalSku || undefined}
                    >
                      {product.internalSku?.trim() || "—"}
                    </td>
                    <td className="max-w-[160px] truncate px-3 py-3 text-sm text-gray-900 dark:text-white" title={product.productNameBrand || undefined}>
                      {product.productNameBrand || "—"}
                    </td>
                    <td className="max-w-[130px] truncate px-3 py-3 text-sm text-gray-600 dark:text-gray-300" title={product.genericName}>
                      {product.genericName || "—"}
                    </td>
                    <td className="max-w-[90px] truncate px-3 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {product.strength || "—"}
                    </td>
                    <td className="max-w-[110px] truncate px-3 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {product.dosageForm || "—"}
                    </td>
                    <td className="max-w-[120px] truncate px-3 py-3 text-sm text-gray-600 dark:text-gray-300" title={product.usage}>
                      {product.usage?.trim() || "—"}
                    </td>
                    <td className="max-w-[120px] truncate px-3 py-3 text-sm text-gray-600 dark:text-gray-300" title={product.category}>
                      {product.category || "—"}
                    </td>
                    <td className="max-w-[80px] truncate px-3 py-3 text-sm text-gray-600 dark:text-gray-300">
                      —
                    </td>
                    <td className="max-w-[180px] truncate px-3 py-3 text-sm text-gray-600 dark:text-gray-300" title={product.description}>
                      {product.description?.trim() || "—"}
                    </td>
                    <td className="max-w-[140px] truncate px-3 py-3 font-mono text-xs text-gray-600 dark:text-gray-300" title={product.barcode}>
                      {product.barcode?.trim() || "—"}
                    </td>
                    <td className="max-w-[100px] truncate px-3 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {product.countryOfOrigin?.trim() || "—"}
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {pdfCell}
                    </td>
                    <td className="max-w-[min(28rem,40vw)] truncate px-3 py-3 text-xs text-gray-600 dark:text-gray-300" title={otherCell}>
                      {otherCell}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-sm tabular-nums text-gray-500 dark:text-gray-400">
                      {product.reservedQuantity != null ? product.reservedQuantity : "—"}
                    </td>
                    <td className="px-3 py-3">
                      {(() => {
                        const nWh = product.balanceStockBreakdown?.length ?? 0;
                        const nSe = product.balanceItemSeries?.length ?? 0;
                        const n = nWh + nSe;
                        return n > 0 ? (
                          <button
                            type="button"
                            onClick={() => setBalanceStockDetailProduct(product)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-brand-600 shadow-sm hover:bg-brand-50 dark:border-gray-600 dark:bg-gray-800 dark:text-brand-400 dark:hover:bg-gray-700"
                          >
                            <EyeIcon className="h-3.5 w-3.5 shrink-0" />
                            <span>დეტალები ({n})</span>
                          </button>
                        ) : (
                          <span className="text-sm text-gray-400 dark:text-gray-500">—</span>
                        );
                      })()}
                    </td>
                    </>
                    )}
                    {canEditCatalog && (
                    <td className="px-3 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="rounded p-1 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                          title="რედაქტირება"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleAddToWarehouse(product)}
                          className="rounded p-1 text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20"
                          title="საწყობში დამატება"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          disabled={deletingProductId === product.id}
                          className="rounded p-1 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="წაშლა"
                        >
                          {deletingProductId === product.id ? (
                            <div className="animate-spin h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full" />
                          ) : (
                            <TrashBinIcon className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                    )}
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
          )}
        </div>
        {(isRegularCatalogPage || isPharmacistCatalogPage) && totalProducts > 0 && (
          <div className="flex flex-col gap-3 border-t border-gray-200 px-5 py-4 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              გვერდი {currentPage}/{totalPages} · სულ {totalProducts} პროდუქტი ·{" "}
              {productsPerPage} თითო გვერდზე
            </p>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => {
                const next = Math.min(Math.max(page, 1), totalPages);
                setCurrentPage(next);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          </div>
        )}
      </div>
      )}

      {/* Balance ნაშთის დეტალები (საწყობები / რეზერვი) */}
      {showProductTable && balanceStockDetailProduct && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="balance-stock-modal-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"
            aria-label="დახურვა"
            onClick={() => setBalanceStockDetailProduct(null)}
          />
          <div className="relative z-10 flex max-h-[min(85vh,720px)] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900">
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-gray-200 px-5 py-4 dark:border-gray-700">
              <div className="min-w-0">
                <h2
                  id="balance-stock-modal-title"
                  className="text-lg font-semibold text-gray-900 dark:text-white"
                >
                  Balance — ნაშთი და სერიული ნომრები
                </h2>
                <p className="mt-1 truncate text-sm text-gray-600 dark:text-gray-400">
                  {balanceStockDetailProduct.name}
                  <span className="ml-2 font-mono text-xs text-gray-500">
                    SKU: {balanceStockDetailProduct.sku}
                  </span>
                </p>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
                  <span>
                    ჯამური რაოდენობა:{" "}
                    <strong className="text-gray-800 dark:text-gray-200">
                      {balanceStockDetailProduct.quantity ?? "—"}
                    </strong>
                  </span>
                  <span>
                    ჯამური რეზერვი:{" "}
                    <strong className="text-gray-800 dark:text-gray-200">
                      {balanceStockDetailProduct.reservedQuantity ?? "—"}
                    </strong>
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBalanceStockDetailProduct(null)}
                className="shrink-0 rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="დახურვა"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="min-h-0 flex-1 space-y-8 overflow-auto px-5 py-4">
              {(balanceStockDetailProduct.balanceStockBreakdown ?? []).length >
              0 ? (
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-200">
                    საწყობების მიხედვით
                  </h3>
                  <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 bg-white dark:bg-gray-900">
                      <tr className="border-b border-gray-200 text-xs font-medium uppercase text-gray-500 dark:border-gray-600 dark:text-gray-400">
                        <th className="px-3 py-2">საწყობო</th>
                        <th className="px-3 py-2 text-right">რაოდენობა</th>
                        <th className="px-3 py-2 text-right">რეზერვი</th>
                        <th className="px-3 py-2">ფილიალი (UUID)</th>
                        <th className="px-3 py-2">სერია</th>
                        <th className="px-3 py-2">საწყობო UUID</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {(balanceStockDetailProduct.balanceStockBreakdown ?? []).map(
                        (line, idx) => (
                          <tr key={idx} className="text-gray-800 dark:text-gray-200">
                            <td className="px-3 py-2.5">
                              <span className="font-medium">
                                {line.balanceWarehouseName || "—"}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-right tabular-nums">
                              {line.quantity}
                            </td>
                            <td className="px-3 py-2.5 text-right tabular-nums">
                              {line.reserve}
                            </td>
                            <td
                              className="max-w-40 truncate px-3 py-2.5 font-mono text-xs text-gray-600 dark:text-gray-400"
                              title={line.balanceBranchUuid}
                            >
                              {line.balanceBranchUuid || "—"}
                            </td>
                            <td
                              className="max-w-40 truncate px-3 py-2.5 font-mono text-xs"
                              title={line.seriesUuid}
                            >
                              {line.seriesUuid || "—"}
                            </td>
                            <td
                              className="max-w-48 truncate px-3 py-2.5 font-mono text-xs text-gray-600 dark:text-gray-400"
                              title={line.balanceWarehouseUuid}
                            >
                              {line.balanceWarehouseUuid || "—"}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              ) : null}

              {(balanceStockDetailProduct.balanceItemSeries ?? []).length > 0 ? (
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-200">
                    სერიული ნომრები (ItemsSeries)
                  </h3>
                  <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 bg-white dark:bg-gray-900">
                      <tr className="border-b border-gray-200 text-xs font-medium uppercase text-gray-500 dark:border-gray-600 dark:text-gray-400">
                        <th className="px-3 py-2">სერიული №</th>
                        <th className="px-3 py-2 text-right">რაოდენობა</th>
                        <th className="px-3 py-2">ვადა</th>
                        <th className="px-3 py-2">სერიის UUID</th>
                        <th className="px-3 py-2">საწყობო UUID</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {(balanceStockDetailProduct.balanceItemSeries ?? []).map(
                        (line, idx) => (
                          <tr key={idx} className="text-gray-800 dark:text-gray-200">
                            <td className="px-3 py-2.5 font-medium">
                              {line.seriesNumber || "—"}
                            </td>
                            <td className="px-3 py-2.5 text-right tabular-nums">
                              {line.quantity ?? "—"}
                            </td>
                            <td className="px-3 py-2.5 text-gray-600 dark:text-gray-400">
                              {line.expiryDate ?? "—"}
                            </td>
                            <td
                              className="max-w-44 truncate px-3 py-2.5 font-mono text-xs"
                              title={line.seriesUuid}
                            >
                              {line.seriesUuid || "—"}
                            </td>
                            <td
                              className="max-w-44 truncate px-3 py-2.5 font-mono text-xs text-gray-600 dark:text-gray-400"
                              title={line.warehouseUuid}
                            >
                              {line.warehouseUuid || "—"}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {pharmacistEditingProduct && (
        <div
          className="fixed inset-0 z-100000 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pharmacist-edit-title"
        >
          <form
            onSubmit={handlePharmacistSave}
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2
                  id="pharmacist-edit-title"
                  className="text-lg font-semibold text-gray-900 dark:text-white"
                >
                  ფარმაცევტის ველები
                </h2>
                <p
                  className="mt-1 truncate text-sm text-gray-500 dark:text-gray-400"
                  title={pharmacistEditingProduct.name}
                >
                  {pharmacistEditingProduct.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPharmacistEditingProduct(null)}
                disabled={pharmacistSaving}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50 dark:hover:bg-gray-700"
                aria-label="დახურვა"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    საქონლის კოდი
                  </label>
                  <input
                    type="text"
                    value={pharmacistForm.productCode}
                    onChange={(e) =>
                      setPharmacistForm((prev) => ({
                        ...prev,
                        productCode: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Product Name
                  </label>
                  <input
                    type="text"
                    value={pharmacistForm.productName}
                    onChange={(e) =>
                      setPharmacistForm((prev) => ({
                        ...prev,
                        productName: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <CategoryPathPicker
                categories={categories}
                pathIds={pharmacistForm.categoryPathIds}
                onPathChange={(pathIds) =>
                  setPharmacistForm((prev) => ({
                    ...prev,
                    categoryPathIds: pathIds,
                  }))
                }
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Form
                  </label>
                  <input
                    type="text"
                    value={pharmacistForm.form}
                    onChange={(e) =>
                      setPharmacistForm((prev) => ({
                        ...prev,
                        form: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Strength
                  </label>
                  <input
                    type="text"
                    value={pharmacistForm.strength}
                    onChange={(e) =>
                      setPharmacistForm((prev) => ({
                        ...prev,
                        strength: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Manufacturer
                  </label>
                  <input
                    type="text"
                    value={pharmacistForm.manufacturer}
                    onChange={(e) =>
                      setPharmacistForm((prev) => ({
                        ...prev,
                        manufacturer: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Unit
                  </label>
                  <input
                    type="text"
                    value={pharmacistForm.unit}
                    onChange={(e) =>
                      setPharmacistForm((prev) => ({
                        ...prev,
                        unit: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Pack Size
                  </label>
                  <input
                    type="text"
                    value={pharmacistForm.packSize}
                    onChange={(e) =>
                      setPharmacistForm((prev) => ({
                        ...prev,
                        packSize: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <label className="flex items-center rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-600">
                <input
                  type="checkbox"
                  checked={pharmacistForm.prescriptionRequired}
                  onChange={(e) =>
                    setPharmacistForm((prev) => ({
                      ...prev,
                      prescriptionRequired: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Prescription Required
                </span>
              </label>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Unit Price
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={pharmacistForm.unitPrice}
                  onChange={(e) =>
                    setPharmacistForm((prev) => ({
                      ...prev,
                      unitPrice: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Qty on Hand
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={pharmacistForm.qtyOnHand}
                  onChange={(e) =>
                    setPharmacistForm((prev) => ({
                      ...prev,
                      qtyOnHand: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Reorder Level
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={pharmacistForm.reorderLevel}
                  onChange={(e) =>
                    setPharmacistForm((prev) => ({
                      ...prev,
                      reorderLevel: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="მაგ: 100"
                />
              </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPharmacistEditingProduct(null)}
                disabled={pharmacistSaving}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
              >
                გაუქმება
              </button>
              <button
                type="submit"
                disabled={pharmacistSaving}
                className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
              >
                {pharmacistSaving ? "ინახება..." : "შენახვა"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Product Form Modal */}
      {canEditCatalog && (
      <ProductFormModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        product={editingProduct || undefined}
      />
      )}

      {/* Add to Warehouse Modal */}
      {canEditCatalog && warehouseProduct && (
        <AddToWarehouseModal
          isOpen={isWarehouseModalOpen}
          onClose={handleWarehouseModalClose}
          onSuccess={() => {
            handleWarehouseModalClose();
            // Optionally refresh inventory data
          }}
          product={warehouseProduct}
        />
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[200px] items-center justify-center text-gray-500">
          იტვირთება...
        </div>
      }
    >
      <ProductsPageContent />
    </Suspense>
  );
}
