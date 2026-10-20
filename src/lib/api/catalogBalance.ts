import { getBalanceDiscounts, getBalanceExchangeStocks, getBalanceItemPricing, getBalancePrices, getBalanceStocks } from './balanceStocks';
import { getBalanceWarehouses } from './balanceWarehouses';
import { nextAppJson } from '@/lib/nextAppApi';
import { aggregateExchangeStocksByItemUid, buildBalanceWarehouseNameByUuid, getBalanceItems, getItemUuid, groupItemsSeriesByNomenclatureItemUid, isBalanceGroupRow, itemsSeriesNumbersForTable, itemsSeriesValidUntilForTable, mapBalanceItemToProduct, resolveBalanceCategoryForItem } from './balanceSync';
import type { Product } from '@/types';

export type CatalogProduct = Product & {
  balanceCatalogItem?: Record<string, unknown>;
  balanceDiscountRows?: Record<string, unknown>[];
};

export async function loadBalanceCatalog(localProducts: Product[]) {
  const items = getBalanceItems(await getBalanceStocks());
  const sources = [
    ['Prices', () => getBalancePrices()],
    ['ItemPricing', () => getBalanceItemPricing()],
    ['Warehouses', () => getBalanceWarehouses()],
    ['Stocks', () => getBalanceExchangeStocks({ docTemplate: true }).catch(() => getBalanceExchangeStocks({ Total: false }))],
    ['ItemsSeries', async () => {
      const result = await nextAppJson<{ ok?: boolean; data?: unknown; error?: string }>('/api/balance/items-series-bare');
      if (!result.ok) throw new Error(result.error || 'ItemsSeries');
      return result.data;
    }],
    ['Discounts', () => getBalanceDiscounts()],
  ] as const;
  const results = await Promise.allSettled(sources.map(([, fetch]) => fetch()));
  const warnings = results.flatMap((result, index) => result.status === 'rejected' ? [sources[index][0]] : []);
  const data = results.map((result) => result.status === 'fulfilled' ? result.value : undefined);
  const [prices, pricing, warehouses, stocks, series, discounts] = data;
  const warehouseNames = buildBalanceWarehouseNameByUuid(warehouses);
  const stockByItem = aggregateExchangeStocksByItemUid(getBalanceItems(stocks), warehouseNames);
  const seriesByItem = groupItemsSeriesByNomenclatureItemUid(series);
  const priceByItem = new Map(getBalanceItems(prices).map((row) => [String(row.Item ?? '').toLowerCase(), row]));
  const pricingByItem = new Map(getBalanceItems(pricing).map((row) => [String(row.Item ?? '').toLowerCase(), row]));
  const localByUid = new Map(localProducts.map((product) => [product.balanceNomenclatureItemUid?.toLowerCase(), product]));
  const localBySku = new Map(localProducts.map((product) => [product.sku, product]));
  const discountRows = getBalanceItems(discounts);
  const products: CatalogProduct[] = items.filter((item) => !isBalanceGroupRow(item)).map((item, index) => {
    const base = mapBalanceItemToProduct(item, index, items);
    const uid = getItemUuid(item)?.toLowerCase() ?? '';
    const local = localByUid.get(uid) ?? localBySku.get(base.sku ?? '');
    const stock = stockByItem.get(getItemUuid(item) ?? '');
    const lines = seriesByItem.get(uid) ?? [];
    const price = priceByItem.get(uid)?.Price ?? item.Price;
    const fields: Record<string, unknown> = {
      ...item,
      ...pricingByItem.get(uid),
      Price: price,
      Group: resolveBalanceCategoryForItem(item, items),
    };
    if (lines.length) {
      fields.ItemsSeriesNumber = itemsSeriesNumbersForTable(lines);
      // Already formatted: preserve every batch's expiry instead of parsing a joined list as one date.
      fields.ItemsSeriesValidUntil = itemsSeriesValidUntilForTable(lines);
    } else if (item.ExpireDate) fields.ItemsSeriesValidUntil = item.ExpireDate;
    if (stock) {
      fields.Quantity = stock.totalQuantity;
      fields.Warehouse = [...new Set(stock.lines.map((line) => line.balanceWarehouseName || line.balanceWarehouseUuid))].join(', ');
      if (price !== undefined && price !== null && price !== '' && Number.isFinite(Number(price))) {
        fields.TotalPrice = stock.totalQuantity * Number(price);
      }
    }
    // Keep the rule fields together; never merge unrelated rules into one product.
    const rules = discountRows.filter((rule) => Array.isArray(rule.Items) && rule.Items.some((entry: { Item?: string }) => entry.Item?.toLowerCase() === uid));
    const ruleFields = rules.map((rule) => {
      const discountFields: Record<string, unknown> = {};
      for (const key of ['IsActive', 'StartDate', 'EndDate', 'DiscountType', 'Percentage', 'DiscountCondition', 'Amount', 'Currency', 'Comments', 'SpecialPrice', 'LoyaltyCardType', 'PointsAccrualMethod', 'PointsValue', 'RoundUp']) {
        discountFields[key] = rule[key];
      }
      discountFields['Discount Name'] = rule.Name;
      discountFields.Items = JSON.stringify(rule.Items);
      discountFields.Schedule = JSON.stringify(rule.Schedule ?? []);
      return discountFields;
    });
    // A single rule can be shown on the common row; multiple rules get separate discount rows.
    if (ruleFields.length === 1) Object.assign(fields, ruleFields[0]);
    return { ...base, ...local, InternalArticle: item.InternalArticle, balanceCatalogItem: fields, balanceDiscountRows: ruleFields } as CatalogProduct;
  });
  return { products, warnings };
}
