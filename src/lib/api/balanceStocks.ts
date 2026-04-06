const BALANCE_CLIENT_LOG_JSON =
  process.env.NODE_ENV === 'development' ||
  process.env.NEXT_PUBLIC_BALANCE_CLIENT_LOG_JSON === '1';

/** ბრაუზერის კონსოლი: სრული JSON (dev ან NEXT_PUBLIC_BALANCE_CLIENT_LOG_JSON=1) */
function logBalanceClientJson(label: string, payload: unknown) {
  if (!BALANCE_CLIENT_LOG_JSON) return;
  try {
    const s = JSON.stringify(payload, null, 2);
    const max = 48_000;
    console.log(
      `[Balance client] ${label}`,
      s.length > max ? `${s.slice(0, max)}… (${s.length} chars)` : s
    );
  } catch {
    console.log(`[Balance client] ${label}`, payload);
  }
}

/** Exchange/Stocks — რაოდენობები (არა Items; query ოფციონალური) */
export type BalanceExchangeStocksParams = {
  uid?: string;
  StartingPeriod?: string;
  EndingPeriod?: string;
  Source?: string;
  Total?: boolean;
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
  logBalanceClientJson(
    `exchange-stocks ${qs ? `?${qs}` : ''}`,
    json
  );
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
  logBalanceClientJson('stocks /api/balance/stocks', json);
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
  logBalanceClientJson('prices /api/balance/prices', json);
  if (!json.ok) throw new Error(json.error || 'Balance Prices API შეცდომა');
  return json.data;
}

/** კლიენტიდან – ItemPricing (Exchange) */
export async function getBalanceItemPricing(): Promise<unknown> {
  const res = await fetch('/api/balance/item-pricing', { cache: 'no-store' });
  const json = await res.json();
  logBalanceClientJson('item-pricing /api/balance/item-pricing', json);
  if (!json.ok) throw new Error(json.error || 'Balance ItemPricing API შეცდომა');
  return json.data;
}

/**
 * `itemUid` — ნომენკლატურის Item → მოთხოვნა მხოლოდ `?uid=...` (სტანდარტი).
 * მხოლოდ `stockSeriesUid` — `?seriesUuid=...` (სერვერი Item-ს Exchange/Stocks-იდან იპოვის).
 */
export async function getBalanceItemsSeries(
  itemUid: string | undefined,
  opts?: {
    startingPeriod?: string;
    endingPeriod?: string;
    stockSeriesUid?: string;
  }
): Promise<unknown> {
  const sp = new URLSearchParams();
  const u = itemUid?.trim();
  const ser = opts?.stockSeriesUid?.trim();
  if (u) sp.set('uid', u);
  if (ser) sp.set('seriesUuid', ser);
  if (!u && !ser) {
    throw new Error(
      'getBalanceItemsSeries: სავალდებულია `itemUid` (Item) ან `opts.stockSeriesUid` (Series)'
    );
  }
  const s = opts?.startingPeriod?.trim();
  const e = opts?.endingPeriod?.trim();
  if (s) sp.set('StartingPeriod', s);
  if (e) sp.set('EndingPeriod', e);
  const res = await fetch(`/api/balance/items-series?${sp.toString()}`, {
    cache: 'no-store',
  });
  const json = await res.json();
  const logLabel = ser
    ? u
      ? `items-series uid=${u}&seriesUuid=${ser}`
      : `items-series ?seriesUuid=${ser}`
    : `items-series ?uid=${u}`;
  logBalanceClientJson(logLabel, json);
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
