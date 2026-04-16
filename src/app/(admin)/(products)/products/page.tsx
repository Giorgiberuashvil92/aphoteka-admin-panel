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
import { useSearchParams } from "next/navigation";
import { Product, type BalanceItemsSeriesApiRow } from "@/types";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import { PlusIcon, PencilIcon, TrashBinIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import { useProducts } from "@/hooks/useProducts";
import { productsApi, warehousesApi, inventoryApi } from "@/lib/api";
import {
  getBalanceStocks,
  getBalancePrices,
  getBalanceItemPricing,
  getBalanceExchangeStocks,
  itemPricingRowsForDbProducts,
  rowsFromBalanceStocks,
  rowsFromBalancePrices,
  rowsFromBalanceItemPricing,
  rowsFromBalanceExchangeStocks,
} from "@/lib/api/balanceStocks";
import ProductFormModal from "@/components/products/ProductFormModal";
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
  getItemUuid,
  vatRateRawFromBalanceItemRow,
  productBalanceSerialDisplay,
  productBalanceExpiryDisplay,
  type BalanceItemSeriesLine,
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

function ProductsPageContent() {
  const searchParams = useSearchParams();
  const warehouseId = searchParams.get("warehouseId") || undefined;
  
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [warehouse, setWarehouse] = useState<any>(null);
  const [warehouseInventory, setWarehouseInventory] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false);
  const [warehouseProduct, setWarehouseProduct] = useState<Product | null>(null);
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
  } | null>(null);
  const [balanceStocksCollapsed, setBalanceStocksCollapsed] = useState(false);
  const [balancePricesRows, setBalancePricesRows] = useState<Record<string, unknown>[]>([]);
  const [balancePricesRaw, setBalancePricesRaw] = useState<unknown>(null);
  const [balancePricesLoading, setBalancePricesLoading] = useState(true);
  const [balancePricesError, setBalancePricesError] = useState<string | null>(null);
  const [balanceItemPricingRaw, setBalanceItemPricingRaw] = useState<unknown>(null);
  const [balanceItemPricingLoading, setBalanceItemPricingLoading] = useState(true);
  const [balanceItemPricingError, setBalanceItemPricingError] = useState<string | null>(null);
  const [balanceExchangeQtyRows, setBalanceExchangeQtyRows] = useState<
    Record<string, unknown>[]
  >([]);
  const [balanceExchangeQtyRaw, setBalanceExchangeQtyRaw] = useState<unknown>(null);
  const [balanceExchangeQtyLoading, setBalanceExchangeQtyLoading] = useState(true);
  const [balanceExchangeQtyError, setBalanceExchangeQtyError] = useState<string | null>(null);
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
    search: debouncedSearchTerm || undefined,
    limit: 100,
  });

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
    const prods = (data?.data || []).filter(
      (p) => !balanceGroupSkuSet.has(String(p.sku ?? "").trim())
    );
    if (prods.length > 0) {
      console.log('First product:', prods[0]);
      console.log('First product ID:', prods[0].id);
    }
    return prods;
  }, [data?.data, balanceGroupSkuSet]);

  /** ItemPricing — მხოლოდ იმ ჩანაწერები, რაც ემთხვევა ამ გვერდზე ჩატვირთულ პროდუქტებს (SKU + Balance Items) */
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">მონაცემების ჩატვირთვა...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageBreadCrumb pageTitle="პროდუქტების კატალოგი" />
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
      <PageBreadCrumb pageTitle={warehouse ? `${warehouse.name} - პროდუქტები` : "პროდუქტების კატალოგი"} />

      {/* Warehouse Filter Info */}
      {warehouse && (
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
          <Link
            href="/products/import"
            className="flex items-center justify-center gap-2 rounded-lg border border-brand-500 bg-white px-4 py-2 text-sm font-medium text-brand-500 hover:bg-brand-50 dark:bg-gray-800 dark:hover:bg-gray-700"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Excel Import
          </Link>
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
        </div>
      </div>

      {(fixedProbeItemsSeriesError != null ||
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

      {(itemsSeriesBareError != null ||
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
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <button
          type="button"
          onClick={() => setBalanceStocksCollapsed((c) => !c)}
          className="flex w-full flex-wrap items-center justify-between gap-2 p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50"
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
        </button>
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
          ზედა ცხრილი — <strong>Exchange/Items</strong> (ნომენკლატურა, კატეგორიები+საქონელი). ქვემოთ — ცალკე{" "}
          <strong>Exchange/Stocks</strong> რაოდენობები (Item, Warehouse, Quantity, Reserve).
        </p>
        {balanceStocksLoading && (
          <p className="text-sm text-gray-500 dark:text-gray-400">იტვირთება...</p>
        )}
        {balanceStocksError && (
          <p className="text-sm text-red-600 dark:text-red-400">{balanceStocksError}</p>
        )}
        {!balanceStocksLoading && !balanceStocksError && balanceStocksRows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-600">
                  {Object.keys(balanceStocksRows[0]).map((key) => (
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
                {balanceStocksRows.map((row, i) => (
                  <tr
                    key={i}
                    className="border-b border-gray-100 dark:border-gray-700"
                  >
                    {Object.keys(balanceStocksRows[0]).map((key) => (
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

      {/* Products Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  საქონლის კოდი
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  საქონლის დასახელება
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  ზომის ერთეული
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  რაოდ.
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  რეზერვი
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  Balance ნაშთი
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  ერთეულის ფასი
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  საქონლის ფასი
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  დაბეგვრა
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  სტატუსი
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  SKU / internal product code
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  სერიის ნომერი
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  ვარგისიანობის ვადა
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  მწარმოებელი (ქვეყანა)
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  Generic name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  Product name (brand)
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  აქტიური ნივთიერებები
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  Strength (e.g., 500 mg)
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  Dosage form (tablet, syrup, injection)
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  Pack size (10 tablets, 100 ml)
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  შეფუთვის სახეობა
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  კატეგორია
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  მოქმედებები
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={23} className="px-6 py-8 text-center text-sm text-gray-500">
                    პროდუქტები არ მოიძებნა
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  // Debug: Log product to see what we have
                  if (!product.id) {
                    console.error('Product without ID:', product);
                  }
                  return (
                  <tr
                    key={product.id || (product as any)._id || Math.random()}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    {/* საქონლის კოდი */}
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      {product.productCode || product.sku || "-"}
                    </td>
                    {/* საქონლის დასახელება */}
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      {product.name || "-"}
                    </td>
                    {/* ზომის ერთეული */}
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {product.unitOfMeasure || "-"}
                    </td>
                    {/* რაოდ. */}
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {product.quantity ?? "—"}
                    </td>
                    {/* რეზერვი (Balance) */}
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {product.reservedQuantity != null ? product.reservedQuantity : "—"}
                    </td>
                    {/* Balance ნაშთი / სერიული — დეტალები მოდალში */}
                    <td className="px-4 py-3">
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
                    {/* ერთეულის ფასი */}
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      ₾{product.price.toFixed(2)}
                    </td>
                    {/* საქონლის ფასი */}
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      {product.totalPrice ? `₾${product.totalPrice.toFixed(2)}` : `₾${product.price.toFixed(2)}`}
                    </td>
                    {/* დაბეგვრა — პირველ რიგში Balance Items `VATRate` როგორც მოდის */}
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {balanceVatRateBySku.get(String(product.sku ?? "").trim()) ??
                        product.taxation ??
                        balanceTaxationBySku.get(String(product.sku ?? "").trim()) ??
                        "—"}
                    </td>
                    {/* სტატუსი */}
                    <td className="px-4 py-3">
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
                    {/* SKU / internal product code */}
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {product.sku || "-"}
                    </td>
                    {/* სერიის ნომერი — № ან Balance Series ref (როცა ItemsSeries ცარიელია) */}
                    <td
                      className="max-w-40 truncate px-4 py-3 text-sm text-gray-500 dark:text-gray-400"
                      title={productBalanceSerialDisplay(product) || undefined}
                    >
                      {productBalanceSerialDisplay(product) || "—"}
                    </td>
                    {/* ვარგისიანობის ვადა */}
                    <td
                      className="max-w-40 truncate px-4 py-3 text-sm text-gray-500 dark:text-gray-400"
                      title={productBalanceExpiryDisplay(product) || undefined}
                    >
                      {productBalanceExpiryDisplay(product) || "—"}
                    </td>
                    {/* მწარმოებელი (ქვეყანა) */}
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {product.manufacturer || "-"}
                      {product.countryOfOrigin && (
                        <div className="text-xs text-gray-400 dark:text-gray-500">
                          ({product.countryOfOrigin})
                        </div>
                      )}
                    </td>
                    {/* Generic name */}
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {product.genericName || "-"}
                    </td>
                    {/* Product name (brand) */}
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      {product.productNameBrand || product.name || "-"}
                    </td>
                    {/* აქტიური ნივთიერებები */}
                    <td className="max-w-56 px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      <span className="line-clamp-3" title={product.activeIngredients || undefined}>
                        {product.activeIngredients || "-"}
                      </span>
                    </td>
                    {/* Strength (e.g., 500 mg) */}
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {product.strength || "-"}
                    </td>
                    {/* Dosage form (tablet, syrup, injection) */}
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {product.dosageForm || "-"}
                    </td>
                    {/* Pack size (10 tablets, 100 ml) */}
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {product.packSize || "-"}
                    </td>
                    {/* შეფუთვის სახეობა */}
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {product.packagingType || "-"}
                    </td>
                    {/* კატეგორია */}
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {product.category || "-"}
                    </td>
                    {/* მოქმედებები */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/products/${product.id}`}
                          className="rounded p-1 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                          title="ნახვა"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Link>
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
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Balance ნაშთის დეტალები (საწყობები / რეზერვი) */}
      {balanceStockDetailProduct && (
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

      {/* Product Form Modal */}
      <ProductFormModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        product={editingProduct || undefined}
      />

      {/* Add to Warehouse Modal */}
      {warehouseProduct && (
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
