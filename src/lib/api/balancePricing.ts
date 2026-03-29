import { balanceGetJson } from '@/lib/api/balanceClient';
import { getBalanceItems } from '@/lib/api/balanceSync';

const BALANCE_EXCHANGE_UID = 'b067980d-7eb5-11ec-80d2-000c29409daa';

export const BALANCE_PRICING_URL =
  process.env.BALANCE_PRICING_URL?.trim() ||
  'https://cloud.balance.ge/sm/a/Balance/7596/hs/Exchange/ItemPricing';

function itemPricingUrl(extra?: Record<string, string>): string {
  const u = new URL(BALANCE_PRICING_URL);
  u.searchParams.set('uid', BALANCE_EXCHANGE_UID);
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      if (v) u.searchParams.set(k, v);
    }
  }
  return u.toString();
}

/** სრული ItemPricing სია (ან დამატებითი query პარამეტრებით) */
export async function fetchBalanceItemPricing(
  query?: Record<string, string>
): Promise<unknown> {
  return balanceGetJson(itemPricingUrl(query));
}

/** უკუთავსებობა ძველ სახელთან */
export async function fetchBalancePricing(): Promise<unknown> {
  return fetchBalanceItemPricing();
}

export function rowsFromBalanceItemPricing(data: unknown): Record<string, unknown>[] {
  return getBalanceItems(data);
}

function rowStr(row: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = row[k];
    if (v !== null && v !== undefined && v !== '') return String(v).trim();
  }
  return '';
}

/** Balance Items რიგიდან — `sku` (Code) → ნომენკლატურის `uid` */
export function balanceUidForSku(
  balanceItemRows: Record<string, unknown>[],
  sku: string
): string | undefined {
  const s = sku.trim();
  if (!s) return undefined;
  for (const row of balanceItemRows) {
    if (String(row.IsGroup ?? '').toLowerCase() === 'true') continue;
    const code = rowStr(row, 'Code', 'code', 'SKU', 'sku');
    if (code !== s) continue;
    const uid = rowStr(row, 'uid', 'UID', 'Ref', 'UUID');
    if (uid) return uid;
  }
  return undefined;
}

/**
 * ItemPricing ჩანაწერები, რომლებიც ეხება DB-ში არსებულ პროდუქტებს:
 * `Code`/SKU ან `Item` (Balance uid) ემთხვევა.
 */
export function itemPricingRowsForDbProducts(
  pricingRows: Record<string, unknown>[],
  dbProducts: { sku: string }[],
  balanceItemRows: Record<string, unknown>[]
): Record<string, unknown>[] {
  const skuSet = new Set(
    dbProducts.map((p) => p.sku?.trim()).filter((x): x is string => Boolean(x))
  );
  if (skuSet.size === 0) return [];

  const balanceUids = new Set<string>();
  for (const sku of skuSet) {
    const uid = balanceUidForSku(balanceItemRows, sku);
    if (uid) balanceUids.add(uid);
  }

  return pricingRows.filter((row) => {
    const code = rowStr(row, 'Code', 'code', 'SKU', 'sku', 'InternalArticle');
    const itemRef = rowStr(row, 'Item', 'item', 'uid', 'UID', 'NomenclatureRef', 'Ref');
    if (code && skuSet.has(code)) return true;
    if (itemRef && balanceUids.has(itemRef)) return true;
    return false;
  });
}
