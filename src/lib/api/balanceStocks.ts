/** Exchange/Stocks — რაოდენობები (არა Items; query ოფციონალური) */
export type BalanceExchangeStocksParams = {
  uid?: string;
  StartingPeriod?: string;
  EndingPeriod?: string;
  Source?: string;
  Total?: boolean;
  /** დოკუმენტაციის სრული query ცარიელი ველებით + Total=false */
  docTemplate?: boolean;
};

export async function getBalanceExchangeStocks(
  params?: BalanceExchangeStocksParams
): Promise<unknown> {
  const sp = new URLSearchParams();
  if (params?.docTemplate) sp.set('docTemplate', '1');
  if (params?.uid !== undefined) sp.set('uid', params.uid);
  if (params?.StartingPeriod !== undefined)
    sp.set('StartingPeriod', params.StartingPeriod);
  if (params?.EndingPeriod !== undefined)
    sp.set('EndingPeriod', params.EndingPeriod);
  if (params?.Source !== undefined) sp.set('Source', params.Source);
  if (params?.Total !== undefined) sp.set('Total', params.Total ? 'true' : 'false');
  const qs = sp.toString();
  const res = await fetch(
    `/api/balance/exchange-stocks${qs ? `?${qs}` : ''}`,
    { cache: 'no-store' }
  );
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || 'Balance Exchange Stocks შეცდომა');
  return json.data;
}

/** Exchange/Stocks პასუხი — ხშირად უშუალოდ `[{ Item, Warehouse, Quantity, ... }]` */
export function rowsFromBalanceExchangeStocks(data: unknown): Record<string, unknown>[] {
  return rowsFromBalanceData(data);
}

/** კლიენტიდან – ნაშთები Balance Exchange-იდან */
export async function getBalanceStocks(): Promise<unknown> {
  const res = await fetch('/api/balance/stocks', { cache: 'no-store' });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || 'Balance Stocks API შეცდომა');
  return json.data;
}

export function rowsFromBalanceStocks(data: unknown): Record<string, unknown>[] {
  return rowsFromBalanceData(data);
}

/** კლიენტიდან – ფასები Balance Exchange-იდან */
export async function getBalancePrices(): Promise<unknown> {
  const res = await fetch('/api/balance/prices', { cache: 'no-store' });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || 'Balance Prices API შეცდომა');
  return json.data;
}

/** კლიენტიდან – ItemPricing (Exchange) */
export async function getBalanceItemPricing(): Promise<unknown> {
  const res = await fetch('/api/balance/item-pricing', { cache: 'no-store' });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || 'Balance ItemPricing API შეცდომა');
  return json.data;
}

export async function getBalanceItemsSeries(
  uid: string,
  opts?: { startingPeriod?: string; endingPeriod?: string }
): Promise<unknown> {
  const sp = new URLSearchParams();
  sp.set('uid', uid);
  if (opts?.startingPeriod !== undefined)
    sp.set('StartingPeriod', opts.startingPeriod);
  if (opts?.endingPeriod !== undefined) sp.set('EndingPeriod', opts.endingPeriod);
  const res = await fetch(`/api/balance/items-series?${sp.toString()}`, {
    cache: 'no-store',
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || 'Balance ItemsSeries API შეცდომა');
  return json.data;
}

export {
  itemPricingRowsForDbProducts,
  rowsFromBalanceItemPricing,
} from '@/lib/api/balancePricing';

export function rowsFromBalancePrices(data: unknown): Record<string, unknown>[] {
  return rowsFromBalanceData(data);
}

function rowsFromBalanceData(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) return data as Record<string, unknown>[];
  if (data && typeof data === 'object') {
    const o = data as Record<string, unknown>;
    if (Array.isArray(o.Items)) return o.Items as Record<string, unknown>[];
    if (Array.isArray(o.value)) return (o.value as Record<string, unknown>[]);
    if (Array.isArray(o.Value)) return (o.Value as Record<string, unknown>[]);
    if (Array.isArray(o.Source)) return o.Source as Record<string, unknown>[];
  }
  return [];
}
