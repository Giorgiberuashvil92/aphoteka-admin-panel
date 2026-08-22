import {
  fetchBalanceDiscounts,
  fetchBalanceExchangeStocks,
  fetchBalanceItemsSeriesFullList,
  fetchBalancePrices,
  fetchBalancePricesByUuid,
  fetchBalanceStocks,
  fetchBalanceWarehouses,
} from '@/lib/api/balanceClient';
import { fetchBalanceItemPricing } from '@/lib/api/balancePricing';
import { getServerNestApiBaseUrl } from '@/lib/apiBaseUrl';
import {
  aggregateExchangeStocksByItemUid,
  buildBalanceWarehouseNameByUuid,
  buildDiscountMapsFromBalanceApi,
  buildPriceByUuid,
  buildSkuToBalanceItemUid,
  buildTaxationByUuid,
  earliestExpiryIsoFromSeriesLines,
  formatSerialSummaryForBalanceSeries,
  getBalanceItems,
  getBalancePricesRows,
  getItemUuid,
  groupItemsSeriesByNomenclatureItemUid,
  isBalanceGroupRow,
  mapBalanceItemToProduct,
  mergeBalanceItemSeriesFromStocks,
  stockLinesHaveSeriesUuid,
  type BalanceItemSeriesLine,
} from '@/lib/api/balanceSync';
import { NextRequest, NextResponse } from 'next/server';

const API_BASE = getServerNestApiBaseUrl();

type LocalProduct = Record<string, unknown> & {
  id?: string;
  _id?: string;
  sku?: string;
  balanceNomenclatureItemUid?: string;
};

const LOCAL_OVERRIDE_KEYS = [
  'id',
  '_id',
  'description',
  'imageUrl',
  'active',
  'internalSku',
  'barcode',
  'genericName',
  'strength',
  'dosageForm',
  'packSize',
  'manufacturer',
  'countryOfOrigin',
  'packagingType',
  'productNameBrand',
  'activeIngredients',
  'usage',
  'sideEffects',
  'contraindications',
  'storageConditions',
  'prescriptionRequired',
  'reorderLevel',
  'filterValues',
] as const;

function localOverride(local: LocalProduct | undefined): Record<string, unknown> {
  if (!local) return {};
  const out: Record<string, unknown> = {};
  for (const key of LOCAL_OVERRIDE_KEYS) {
    const value = local[key];
    if (value !== undefined && value !== null && value !== '') out[key] = value;
  }
  return out;
}

function matchesText(row: Record<string, unknown>, search: string): boolean {
  if (!search) return true;
  const needle = search.toLowerCase();
  return [
    row.name,
    row.sku,
    row.productCode,
    row.genericName,
    row.productNameBrand,
    row.manufacturer,
    row.barcode,
    row.description,
  ].some((value) => String(value ?? '').toLowerCase().includes(needle));
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const page = Math.max(1, Number(sp.get('page') ?? 1) || 1);
  const limit = Math.max(1, Math.min(50, Number(sp.get('limit') ?? 50) || 50));
  const search = sp.get('search')?.trim().toLowerCase() ?? '';
  const category = sp.get('category')?.trim() ?? '';
  const includeSeries = sp.get('includeSeries') === '1';
  const activeRaw = sp.get('active');
  const activeFilter =
    activeRaw === 'true' ? true : activeRaw === 'false' ? false : undefined;
  const authHeader = request.headers.get('authorization');

  try {
    const balanceData = await fetchBalanceStocks();
    const items = getBalanceItems(balanceData);
    const leafItems = items.filter((row) => !isBalanceGroupRow(row));

    const preliminary = leafItems
      .map((item, index) => {
        const base = mapBalanceItemToProduct(item, index, items) as Record<
          string,
          unknown
        >;
        return { item, index, base };
      })
      .filter(({ base }) => {
        if (category) {
          const main = String(base.mainCategory ?? '').trim();
          const legacy = String(base.category ?? '').trim();
          if (main !== category && legacy !== category) return false;
        }
        return matchesText(base, search);
      });

    const total = preliminary.length;
    const start = (page - 1) * limit;
    const pageItems = preliminary.slice(start, start + limit);
    const pageUids = [
      ...new Set(
        pageItems
          .map(({ item }) => getItemUuid(item))
          .filter((x): x is string => Boolean(x))
      ),
    ];
    const pageUidSet = new Set(pageUids.map((uid) => uid.toLowerCase()));

    const [localJson, itemPricingRaw, warehousesRaw, exchangeRaw, discountsRaw, seriesRaw] =
      await Promise.all([
        fetch(`${API_BASE}/products?limit=10000`, {
          headers: authHeader ? { Authorization: authHeader } : undefined,
          cache: 'no-store',
        })
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null),
        fetchBalanceItemPricing().catch(() => null),
        fetchBalanceWarehouses().catch(() => null),
        fetchBalanceExchangeStocks({ docTemplate: true }).catch(() =>
          fetchBalanceExchangeStocks({ Total: false }).catch(() => null)
        ),
        fetchBalanceDiscounts().catch(() => null),
        includeSeries ? fetchBalanceItemsSeriesFullList().catch(() => null) : null,
      ]);

    const perItemPrices = await Promise.allSettled(
      pageUids.map((uid) => fetchBalancePricesByUuid(uid))
    );
    let pricesRows = perItemPrices
      .filter((r): r is PromiseFulfilledResult<unknown> => r.status === 'fulfilled')
      .flatMap((r) => getBalancePricesRows(r.value));
    if (pricesRows.length === 0) {
      pricesRows = getBalancePricesRows(await fetchBalancePrices().catch(() => null));
    }

    const priceByUuid = buildPriceByUuid(pricesRows);
    const taxationByUuid = buildTaxationByUuid(pricesRows);
    if (itemPricingRaw != null) {
      for (const [uid, tax] of buildTaxationByUuid(getBalanceItems(itemPricingRaw))) {
        taxationByUuid.set(uid, tax);
      }
    }

    const warehouseNames =
      warehousesRaw != null
        ? buildBalanceWarehouseNameByUuid(warehousesRaw)
        : new Map<string, string>();
    const stockByItemUid =
      exchangeRaw != null
        ? aggregateExchangeStocksByItemUid(
            getBalanceItems(exchangeRaw).filter((row) =>
              pageUidSet.has(String(row.Item ?? row.item ?? '').trim().toLowerCase())
            ),
            warehouseNames
          )
        : new Map();
    const skuToBalanceItemUid = buildSkuToBalanceItemUid(pageItems.map(({ item }) => item));
    const discountMaps =
      discountsRaw != null ? buildDiscountMapsFromBalanceApi(discountsRaw) : undefined;
    const seriesByItemUid =
      seriesRaw != null ? groupItemsSeriesByNomenclatureItemUid(seriesRaw) : new Map();

    const localRows: LocalProduct[] = Array.isArray(localJson?.data)
      ? localJson.data
      : Array.isArray(localJson)
        ? localJson
        : [];
    const localBySku = new Map<string, LocalProduct>();
    const localByBalanceUid = new Map<string, LocalProduct>();
    for (const local of localRows) {
      if (local.sku) localBySku.set(String(local.sku).trim(), local);
      if (local.balanceNomenclatureItemUid) {
        localByBalanceUid.set(
          String(local.balanceNomenclatureItemUid).trim().toLowerCase(),
          local
        );
      }
    }

    const merged: Record<string, unknown>[] = pageItems.map(({ item, index }) => {
      const base = mapBalanceItemToProduct(
        item,
        index,
        items,
        priceByUuid,
        taxationByUuid
      ) as Record<string, unknown>;
      const sku = String(base.sku ?? '').trim();
      const itemUid = skuToBalanceItemUid.get(sku) ?? getItemUuid(item) ?? '';
      const local =
        (itemUid ? localByBalanceUid.get(itemUid.toLowerCase()) : undefined) ??
        localBySku.get(sku);
      const agg = itemUid ? stockByItemUid.get(itemUid) : undefined;
      const stockLines = agg?.lines ?? [];
      const apiSeries: BalanceItemSeriesLine[] = itemUid
        ? (seriesByItemUid.get(itemUid.toLowerCase()) ?? [])
        : [];
      const mergedSeries =
        itemUid && (apiSeries.length > 0 || stockLinesHaveSeriesUuid(stockLines))
          ? mergeBalanceItemSeriesFromStocks(apiSeries, stockLines)
          : undefined;
      const discount =
        (itemUid
          ? discountMaps?.byItemUid.get(itemUid.toLowerCase())
          : undefined) ?? discountMaps?.unconditional;

      const mergedId = String(local?.id || local?._id || itemUid || sku);
      const localProductId = local?.id || local?._id;

      return {
        ...base,
        ...localOverride(local),
        id: mergedId,
        localProductId,
        source: 'balance-live',
        sku,
        productCode: base.productCode ?? sku,
        balanceNomenclatureItemUid: itemUid || base.balanceNomenclatureItemUid,
        ...(agg
          ? {
              quantity: agg.totalQuantity,
              reservedQuantity: agg.totalReserve,
              balanceStockBreakdown: agg.lines,
              totalPrice:
                Number(base.price) && Number.isFinite(Number(base.price))
                  ? Number(base.price) * agg.totalQuantity
                  : base.totalPrice,
            }
          : {}),
        ...(mergedSeries !== undefined
          ? {
              balanceItemSeries: mergedSeries,
              serialNumber:
                mergedSeries.length > 0
                  ? formatSerialSummaryForBalanceSeries(mergedSeries)
                  : base.serialNumber,
              expiryDate:
                mergedSeries.length > 0
                  ? earliestExpiryIsoFromSeriesLines(mergedSeries)
                  : base.expiryDate,
            }
          : {}),
        ...(discount
          ? {
              ...(discount.balanceDiscountPercent != null
                ? { balanceDiscountPercent: discount.balanceDiscountPercent }
                : {}),
              ...(discount.balanceDiscountAmount != null
                ? { balanceDiscountAmount: discount.balanceDiscountAmount }
                : {}),
              ...(discount.balanceDiscountName
                ? { balanceDiscountName: discount.balanceDiscountName }
                : {}),
              ...(discount.balanceDiscountUid
                ? { balanceDiscountUid: discount.balanceDiscountUid }
                : {}),
            }
          : {}),
      };
    });

    const filtered = merged.filter((row) => {
      if (activeFilter !== undefined && Boolean(row.active ?? true) !== activeFilter) {
        return false;
      }
      return true;
    });

    return NextResponse.json({
      ok: true as const,
      data: filtered,
      total,
      page,
      limit,
      source: 'balance-live',
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { ok: false as const, error: message },
      { status: 502 }
    );
  }
}
