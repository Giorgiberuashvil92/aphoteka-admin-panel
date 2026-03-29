import {
  fetchBalanceExchangeStocks,
  fetchBalanceItemsSeriesForItem,
  fetchBalancePrices,
  fetchBalancePricesByUuid,
  fetchBalanceStocks,
  fetchBalanceWarehouses,
} from '@/lib/api/balanceClient';
import { getApiBaseUrl } from '@/lib/apiBaseUrl';
import {
  aggregateExchangeStocksByItemUid,
  buildBalanceWarehouseNameByUuid,
  buildPriceByUuid,
  buildSkuToBalanceItemUid,
  formatSerialSummaryForBalanceSeries,
  getBalanceItems,
  getBalancePricesRows,
  getItemUuid,
  isBalanceGroupRow,
  mapBalanceItemToProduct,
  mergeBalanceItemSeriesFromStocks,
  normalizeBalanceItemSeriesRows,
  stockLinesHaveSeriesUuid,
  type AggregatedBalanceStockForItem,
  type BalanceItemSeriesLine,
} from '@/lib/api/balanceSync';
import { NextRequest, NextResponse } from 'next/server';

const API_BASE = getApiBaseUrl();

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
    const leafItems = items.filter((row) => !isBalanceGroupRow(row));
    const products = leafItems.map((item, i) =>
      mapBalanceItemToProduct(item, i, items, priceByUuid)
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

    const seriesByItemUid = new Map<string, BalanceItemSeriesLine[]>();
    const seriesFetchOk = new Set<string>();
    const seriesSettled = await Promise.allSettled(
      leafUuids.map((uid) => fetchBalanceItemsSeriesForItem(uid))
    );
    leafUuids.forEach((uid, i) => {
      const r = seriesSettled[i];
      if (r.status === 'fulfilled') {
        seriesFetchOk.add(uid);
        seriesByItemUid.set(uid, normalizeBalanceItemSeriesRows(r.value));
      }
    });

    if (withSku.length === 0) {
      return NextResponse.json({
        ok: true,
        created: 0,
        updated: 0,
        total: 0,
        message: 'Balance-დან ჩანაწერი არ მოიძებნა ან Items ცარიელია.',
      });
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(authHeader ? { Authorization: authHeader } : {}),
    };

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
      const payload = {
        ...product,
        ...(mergedSeries !== undefined
          ? {
              balanceItemSeries: mergedSeries,
              serialNumber:
                mergedSeries.length > 0
                  ? formatSerialSummaryForBalanceSeries(mergedSeries) ??
                    product.serialNumber
                  : product.serialNumber,
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

    return NextResponse.json({
      ok: true,
      created,
      updated,
      total: withSku.length,
      errors: errors.length ? errors : undefined,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
