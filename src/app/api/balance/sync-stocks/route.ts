import {
  fetchBalanceDiscounts,
  fetchBalanceExchangeStocks,
  fetchBalanceItemsSeriesForItem,
  fetchBalanceItemsSeriesFullList,
  fetchBalancePrices,
  fetchBalancePricesByUuid,
  fetchBalanceStocks,
  fetchBalanceWarehouses,
} from '@/lib/api/balanceClient';
import { getServerNestApiBaseUrl } from '@/lib/apiBaseUrl';
import { fetchBalanceItemPricing } from '@/lib/api/balancePricing';
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
  normalizeBalanceItemSeriesRows,
  stockLinesHaveSeriesUuid,
  type AggregatedBalanceStockForItem,
  type BalanceDiscountForItem,
  type BalanceItemSeriesLine,
} from '@/lib/api/balanceSync';
import { NextRequest, NextResponse } from 'next/server';

const API_BASE = getServerNestApiBaseUrl();
const NULL_BALANCE_UID = '00000000-0000-0000-0000-000000000000';

type AdminCategoryForSync = {
  id: string;
  name: string;
  parentId?: string | null;
  balanceUid?: string;
  balanceParentUid?: string;
};

type BalanceCategoriesSyncResult = {
  created: number;
  updated: number;
  total: number;
  errors?: string[];
};

function balanceRowString(row: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = row[key];
    if (value !== null && value !== undefined && value !== '') {
      return String(value).trim();
    }
  }
  return '';
}

function balanceGroupParentUid(row: Record<string, unknown>): string {
  return balanceRowString(row, 'Group', 'group', 'GroupRef');
}

function balanceGroupName(row: Record<string, unknown>): string {
  return (
    balanceRowString(row, 'Name', 'FullName', 'Description') ||
    balanceRowString(row, 'Code', 'InternalArticle') ||
    getItemUuid(row) ||
    'Balance group'
  );
}

function balanceGroupDepth(
  row: Record<string, unknown>,
  groupByUid: Map<string, Record<string, unknown>>
): number {
  let parentUid = balanceGroupParentUid(row);
  const seen = new Set<string>();
  let depth = 0;
  while (parentUid && parentUid !== NULL_BALANCE_UID && depth < 50) {
    const key = parentUid.toLowerCase();
    if (seen.has(key)) break;
    seen.add(key);
    const parent = groupByUid.get(key);
    if (!parent) break;
    depth++;
    parentUid = balanceGroupParentUid(parent);
  }
  return depth;
}

async function syncBalanceCategories(
  items: Record<string, unknown>[],
  headers: HeadersInit
): Promise<BalanceCategoriesSyncResult> {
  const groups = items.filter(isBalanceGroupRow);
  if (groups.length === 0) return { created: 0, updated: 0, total: 0 };

  const groupByUid = new Map<string, Record<string, unknown>>();
  for (const row of groups) {
    const uid = getItemUuid(row);
    if (uid) groupByUid.set(uid.toLowerCase(), row);
  }

  const sortedGroups = [...groups].sort(
    (a, b) => balanceGroupDepth(a, groupByUid) - balanceGroupDepth(b, groupByUid)
  );

  const existingRes = await fetch(`${API_BASE}/categories`, {
    method: 'GET',
    headers,
  });
  if (!existingRes.ok) {
    throw new Error(
      `Balance კატეგორიებისთვის არსებული categories ვერ ჩაიტვირთა: ${await existingRes.text()}`
    );
  }
  const existing = (await existingRes.json()) as AdminCategoryForSync[];
  const byBalanceUid = new Map<string, AdminCategoryForSync>();
  const byParentAndName = new Map<string, AdminCategoryForSync>();

  const nameKey = (parentId: string | null | undefined, name: string) =>
    `${parentId ?? 'root'}::${name.trim().toLowerCase()}`;

  for (const category of Array.isArray(existing) ? existing : []) {
    if (category.balanceUid) {
      byBalanceUid.set(category.balanceUid.trim().toLowerCase(), category);
    }
    byParentAndName.set(nameKey(category.parentId, category.name), category);
  }

  let created = 0;
  let updated = 0;
  const errors: string[] = [];

  for (const row of sortedGroups) {
    const balanceUid = getItemUuid(row);
    if (!balanceUid) continue;

    const parentBalanceUid = balanceGroupParentUid(row);
    const parentCategory =
      parentBalanceUid && parentBalanceUid !== NULL_BALANCE_UID
        ? byBalanceUid.get(parentBalanceUid.toLowerCase())
        : undefined;
    const parentId = parentCategory?.id;
    const name = balanceGroupName(row);
    const payload = {
      name,
      parentId,
      balanceUid,
      balanceParentUid:
        parentBalanceUid && parentBalanceUid !== NULL_BALANCE_UID
          ? parentBalanceUid
          : undefined,
      active: true,
      sortOrder: Number(row.Code ?? row.SortOrder ?? 0) || 0,
    };

    const existingCategory =
      byBalanceUid.get(balanceUid.toLowerCase()) ??
      byParentAndName.get(nameKey(parentId, name));

    try {
      if (existingCategory) {
        const res = await fetch(`${API_BASE}/categories/${existingCategory.id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(await res.text());
        const updatedCategory = (await res.json()) as AdminCategoryForSync;
        byBalanceUid.set(balanceUid.toLowerCase(), updatedCategory);
        byParentAndName.set(nameKey(updatedCategory.parentId, updatedCategory.name), updatedCategory);
        updated++;
      } else {
        const res = await fetch(`${API_BASE}/categories`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(await res.text());
        const createdCategory = (await res.json()) as AdminCategoryForSync;
        byBalanceUid.set(balanceUid.toLowerCase(), createdCategory);
        byParentAndName.set(nameKey(createdCategory.parentId, createdCategory.name), createdCategory);
        created++;
      }
    } catch (e) {
      errors.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return {
    created,
    updated,
    total: groups.length,
    errors: errors.length ? errors : undefined,
  };
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');

  try {
    const balanceData = await fetchBalanceStocks();
    const items = getBalanceItems(balanceData);

    const leafUuids = [
      ...new Set(
        items
          .filter((row) => !isBalanceGroupRow(row))
          .map((row) => getItemUuid(row))
          .filter((x): x is string => Boolean(x))
      ),
    ];

    const perItemPrices = await Promise.allSettled(
      leafUuids.map((id) => fetchBalancePricesByUuid(id))
    );
    let pricesRows = perItemPrices
      .filter((r): r is PromiseFulfilledResult<unknown> => r.status === 'fulfilled')
      .flatMap((r) => getBalancePricesRows(r.value));

    // fallback: თუ Source=uuid გზით არ მოვიდა, საერთო ფასები მოვიტანოთ
    if (pricesRows.length === 0) {
      const pricesData = await fetchBalancePrices();
      pricesRows = getBalancePricesRows(pricesData);
    }

    const priceByUuid = buildPriceByUuid(pricesRows);
    const taxationByUuid = buildTaxationByUuid(pricesRows);
    try {
      const itemPricingRaw = await fetchBalanceItemPricing();
      const ipRows = getBalanceItems(itemPricingRaw);
      for (const [uid, tax] of buildTaxationByUuid(ipRows)) {
        taxationByUuid.set(uid, tax);
      }
    } catch {
      /* ItemPricing ოფციონალური — VAT მხოლოდ Prices-იდან */
    }
    const leafItems = items.filter((row) => !isBalanceGroupRow(row));
    const products = leafItems.map((item, i) =>
      mapBalanceItemToProduct(item, i, items, priceByUuid, taxationByUuid)
    );
    const withSku = products.filter((p) => p.sku);

    let stockByItemUid = new Map<string, AggregatedBalanceStockForItem>();
    try {
      const whData = await fetchBalanceWarehouses();
      const whNames = buildBalanceWarehouseNameByUuid(whData);
      let exchangeRaw: unknown;
      try {
        exchangeRaw = await fetchBalanceExchangeStocks({ docTemplate: true });
      } catch {
        exchangeRaw = await fetchBalanceExchangeStocks({ Total: false });
      }
      const exchangeRows = getBalanceItems(exchangeRaw);
      stockByItemUid = aggregateExchangeStocksByItemUid(exchangeRows, whNames);
    } catch {
      /* Stocks/Warehouses ოფციონალური — სინქი გაგრძელდება ფასებით/ნომენკლატურით */
    }
    const skuToBalanceItemUid = buildSkuToBalanceItemUid(leafItems);

    let discountByItemUid = new Map<string, BalanceDiscountForItem>();
    let discountUnconditional: BalanceDiscountForItem | undefined;
    try {
      const discountsRaw = await fetchBalanceDiscounts();
      const maps = buildDiscountMapsFromBalanceApi(discountsRaw);
      discountByItemUid = maps.byItemUid;
      discountUnconditional = maps.unconditional;
    } catch {
      /* Discounts ოფციონალური — სინქი სხვა ველებით გრძელდება */
    }

    const seriesByItemUid = new Map<string, BalanceItemSeriesLine[]>();
    const seriesFetchOk = new Set<string>();
    const logSeries =
      process.env.BALANCE_LOG_ITEMS_SERIES === '1' ||
      process.env.NODE_ENV === 'development';

    let bulkGrouped = new Map<string, BalanceItemSeriesLine[]>();
    try {
      const fullList = await fetchBalanceItemsSeriesFullList();
      bulkGrouped = groupItemsSeriesByNomenclatureItemUid(fullList);
      if (logSeries && bulkGrouped.size > 0) {
        let n = 0;
        for (const lines of bulkGrouped.values()) n += lines.length;
        console.log(
          `[sync-stocks] ItemsSeries სრული სია: ${n} ხაზი, ${bulkGrouped.size} ნომენკლატურის Item`
        );
      }
    } catch (e) {
      if (logSeries) {
        console.warn('[sync-stocks] ItemsSeries სრული სია ვერ ჩაიტვირთა, per-Item fallback', e);
      }
    }

    for (const uid of leafUuids) {
      const fromBulk = bulkGrouped.get(uid.trim().toLowerCase());
      if (fromBulk && fromBulk.length > 0) {
        seriesByItemUid.set(uid, fromBulk);
        seriesFetchOk.add(uid);
        if (logSeries) {
          try {
            const raw = JSON.stringify(fromBulk, null, 2);
            const max = 12_000;
            console.log(
              `[sync-stocks] ItemsSeries bulk (Item=${uid})\n`,
              raw.length > max ? `${raw.slice(0, max)}…` : raw
            );
          } catch {
            console.log('[sync-stocks] ItemsSeries bulk', uid, fromBulk);
          }
        }
      }
    }

    const missingSeriesUids = leafUuids.filter((uid) => !seriesFetchOk.has(uid));
    if (missingSeriesUids.length > 0) {
      const seriesSettled = await Promise.allSettled(
        missingSeriesUids.map((uid) => fetchBalanceItemsSeriesForItem(uid))
      );
      missingSeriesUids.forEach((uid, i) => {
        const r = seriesSettled[i];
        if (r.status === 'fulfilled') {
          seriesFetchOk.add(uid);
          if (logSeries) {
            try {
              const raw = JSON.stringify(r.value, null, 2);
              const max = 24_000;
              console.log(
                `[sync-stocks] ItemsSeries per-Item (uid=${uid})\n`,
                raw.length > max ? `${raw.slice(0, max)}… (${raw.length} chars)` : raw
              );
            } catch {
              console.log('[sync-stocks] ItemsSeries raw', uid, r.value);
            }
          }
          seriesByItemUid.set(uid, normalizeBalanceItemSeriesRows(r.value));
        }
      });
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(authHeader ? { Authorization: authHeader } : {}),
    };

    const categoriesSync = await syncBalanceCategories(items, headers);
    console.log(
      `[sync-stocks] Balance categories: created=${categoriesSync.created} updated=${categoriesSync.updated} total=${categoriesSync.total}`
    );

    if (withSku.length === 0) {
      return NextResponse.json({
        ok: true,
        created: 0,
        updated: 0,
        total: 0,
        categories: categoriesSync,
        message: 'Balance-დან პროდუქტი არ მოიძებნა ან Items-ში მხოლოდ group rows არის.',
      });
    }

    const existingRes = await fetch(`${API_BASE}/products?limit=10000`, {
      method: 'GET',
      headers,
    });
    if (!existingRes.ok) {
      const err = await existingRes.text();
      return NextResponse.json(
        { ok: false, error: `ბაზიდან პროდუქტების წამოღება ვერ მოხერხდა: ${err}` },
        { status: 502 }
      );
    }
    const existingJson = await existingRes.json();
    const existingList: { id: string; sku?: string }[] = existingJson.data ?? existingJson ?? [];
    const bySku = new Map<string | undefined, string>();
    for (const p of existingList) {
      if (p.sku) bySku.set(p.sku, p.id);
    }

    let created = 0;
    let updated = 0;
    const errors: string[] = [];

    const logSync =
      process.env.BALANCE_SYNC_DEBUG === '1' ||
      process.env.NODE_ENV === 'development';
    let firstDumpDone = false;

    for (const product of withSku) {
      const id = bySku.get(product.sku!);
      const itemUid = skuToBalanceItemUid.get(product.sku!) ?? '';
      const agg = itemUid ? stockByItemUid.get(itemUid) : undefined;
      const stockLines = agg?.lines ?? [];
      const hasStockSeries = stockLinesHaveSeriesUuid(stockLines);
      const apiSeries: BalanceItemSeriesLine[] =
        itemUid && seriesFetchOk.has(itemUid)
          ? (seriesByItemUid.get(itemUid) ?? [])
          : [];
      const shouldPatchSeries =
        Boolean(itemUid) && (seriesFetchOk.has(itemUid) || hasStockSeries);
      const mergedSeries = shouldPatchSeries
        ? mergeBalanceItemSeriesFromStocks(apiSeries, stockLines)
        : undefined;
      /** სპეც. Items-ით წესი ან უპირობო (Items: []); itemUid ცარიელზეც unconditional უნდა ჩაწეროს */
      const disc =
        (itemUid
          ? discountByItemUid.get(itemUid.trim().toLowerCase())
          : undefined) ?? discountUnconditional;
      const payload = {
        ...product,
        ...(itemUid ? { balanceNomenclatureItemUid: itemUid } : {}),
        ...(disc
          ? {
              ...(disc.balanceDiscountPercent != null
                ? { balanceDiscountPercent: disc.balanceDiscountPercent }
                : {}),
              ...(disc.balanceDiscountAmount != null
                ? { balanceDiscountAmount: disc.balanceDiscountAmount }
                : {}),
              ...(disc.balanceDiscountName
                ? { balanceDiscountName: disc.balanceDiscountName }
                : {}),
              ...(disc.balanceDiscountUid
                ? { balanceDiscountUid: disc.balanceDiscountUid }
                : {}),
            }
          : {}),
        ...(mergedSeries !== undefined
          ? {
              balanceItemSeries: mergedSeries,
              serialNumber:
                mergedSeries.length > 0
                  ? formatSerialSummaryForBalanceSeries(mergedSeries) ??
                    product.serialNumber
                  : product.serialNumber,
              expiryDate:
                mergedSeries.length > 0
                  ? earliestExpiryIsoFromSeriesLines(mergedSeries) ??
                    product.expiryDate
                  : product.expiryDate,
            }
          : {}),
        ...(agg
          ? {
              quantity: agg.totalQuantity,
              reservedQuantity: agg.totalReserve,
              balanceStockBreakdown: agg.lines,
              totalPrice:
                product.price != null
                  ? Number(product.price) * agg.totalQuantity
                  : product.totalPrice,
            }
          : {}),
      };
      const body = JSON.stringify(payload);

      /**
       * დიაგნოსტიკა: პირველი პროდუქტის (ან თითოეული SKU-ის — `BALANCE_SYNC_DEBUG_ALL=1`)
       * Balance Items `raw` და backend-ში მისაწოდებელი payload ერთად დაილოგება. ამით ცხადია:
       * (1) რა დაბრუნა Balance-მა (`InventoriesAccount`, `VATRate`, …);
       * (2) რა მიდის backend-ს (balanceNomenclatureItemUid + ანგარიშები + taxation).
       */
      if (logSync && (!firstDumpDone || process.env.BALANCE_SYNC_DEBUG_ALL === '1')) {
        const rawItem = leafItems.find((row) => {
          const code = String(
            row.Code ?? row.SKU ?? row.sku ?? row.code ?? ''
          ).trim();
          return code === product.sku;
        });
        console.log(
          `[sync-stocks][DEBUG] SKU=${product.sku} id=${id ?? '(new)'}` +
            `\n── Balance Items raw:\n${JSON.stringify(rawItem ?? null, null, 2)}` +
            `\n── payload → backend:\n${JSON.stringify(payload, null, 2)}`
        );
        firstDumpDone = true;
      }

      if (id) {
        const res = await fetch(`${API_BASE}/products/${id}`, {
          method: 'PATCH',
          headers,
          body,
        });
        if (res.ok) updated++;
        else errors.push(`${product.sku}: ${await res.text()}`);
      } else {
        const res = await fetch(`${API_BASE}/products`, {
          method: 'POST',
          headers,
          body,
        });
        if (res.ok) {
          created++;
          const data = await res.json().catch(() => ({}));
          const newId = data?.data?.id ?? data?.id;
          if (newId && product.sku) bySku.set(product.sku, newId);
        } else errors.push(`${product.sku}: ${await res.text()}`);
      }
    }

    let itemsSeriesBulkLineCount = 0;
    for (const lines of bulkGrouped.values()) itemsSeriesBulkLineCount += lines.length;

    return NextResponse.json({
      ok: true,
      created,
      updated,
      total: withSku.length,
      categories: categoriesSync,
      errors: errors.length ? errors : undefined,
      itemsSeriesBulkUsed: bulkGrouped.size > 0,
      itemsSeriesBulkLineCount:
        bulkGrouped.size > 0 ? itemsSeriesBulkLineCount : undefined,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
