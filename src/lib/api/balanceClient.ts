import axios, { type AxiosInstance, isAxiosError } from 'axios';
import https from 'node:https';

const BALANCE_USER_NAME = process.env.BALANCE_USER_NAME ?? 'Ntsulik@gmail.com';
const BALANCE_USER_PASSWORD = process.env.BALANCE_USER_PASSWORD ?? '1985+Mai';

function getEncodedToken(): string {
  const token = `${BALANCE_USER_NAME}:${BALANCE_USER_PASSWORD}`;
  return Buffer.from(token).toString('base64');
}

export function getBalanceTokenInstance(): AxiosInstance {
  const encodedToken = getEncodedToken();
  return axios.create({
    httpsAgent: new https.Agent({
      rejectUnauthorized: false,
    }),
    headers: {
      Authorization: 'Basic ' + encodedToken,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
}

export { getEncodedToken };

/** Balance Exchange – საწყობების სია */
export const BALANCE_WAREHOUSES_URL =
  'https://cloud.balance.ge/sm/a/Balance/7596/hs/Exchange/Warehouses';

export async function balanceGetJson(url: string): Promise<unknown> {
  const client = getBalanceTokenInstance();
  const { data } = await client.get<string | unknown>(url, {
    headers: { 'Content-Type': 'application/json' },
    transformResponse: [
      (raw) => {
        if (typeof raw !== 'string') return raw;
        try {
          return JSON.parse(raw);
        } catch {
          return raw;
        }
      },
    ],
  });
  return data;
}

export async function fetchBalanceWarehouses(): Promise<unknown> {
  return balanceGetJson(BALANCE_WAREHOUSES_URL);
}

export const BALANCE_STOCKS_URL =
  process.env.BALANCE_STOCKS_URL ??
  'https://cloud.balance.ge/sm/o/Balance/7596/hs/Exchange/Items';

export async function fetchBalanceStocks(): Promise<unknown> {
  return balanceGetJson(BALANCE_STOCKS_URL);
}

/** სატესტო: `sm/a/Balance/7596/hs/Exchange/Items` — `uid` ოფციონალური (არა `sm/o`) */
const BALANCE_ITEMS_TEST_PATH =
  'https://cloud.balance.ge/sm/a/Balance/7596/hs/Exchange/Items';

export function buildBalanceItemsTestUrl(uid?: string | null): string {
  const u = new URL(BALANCE_ITEMS_TEST_PATH);
  const t = uid?.trim();
  if (t) u.searchParams.set('uid', t);
  return u.toString();
}

export async function fetchBalanceItemsTest(uid?: string | null): Promise<unknown> {
  return balanceGetJson(buildBalanceItemsTestUrl(uid));
}

export const BALANCE_PRICES_URL =
  process.env.BALANCE_PRICES_URL ??
  'https://cloud.balance.ge/sm/a/Balance/7596/hs/Exchange/Prices';

/** Exchange საერთო `uid` — Prices / Stocks / სხვა */
const BALANCE_EXCHANGE_UID = 'b067980d-7eb5-11ec-80d2-000c29409daa';

function pricesUrlWithQuery(extra?: Record<string, string>): string {
  const u = new URL(BALANCE_PRICES_URL);
  u.searchParams.set('uid', BALANCE_EXCHANGE_UID);
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      if (v !== '') u.searchParams.set(k, v);
    }
  }
  return u.toString();
}

export async function fetchBalancePrices(): Promise<unknown> {
  return balanceGetJson(pricesUrlWithQuery());
}

/** Prices — query `Source` = ნომენკლატურის `uid` (Items ფიდიდან) */
export async function fetchBalancePricesByUuid(uuid: string): Promise<unknown> {
  return balanceGetJson(pricesUrlWithQuery({ Source: uuid }));
}

/** ნაშთები/რაოდენობები — `sm/a/Balance/7596/hs/Exchange/Stocks` (არა Items) */
export const BALANCE_EXCHANGE_STOCKS_URL =
  'https://cloud.balance.ge/sm/a/Balance/7596/hs/Exchange/Stocks';

export type BalanceExchangeStocksQuery = {
  uid?: string;
  StartingPeriod?: string;
  EndingPeriod?: string;
  Source?: string;
  /** დოკუმენტაცია: Total (boolean), მაგ. `false` დეტალური ხაზებისთვის */
  Total?: boolean;
  /**
   * `true` → დოკუმენტაციის URL:
   * `/Stocks?uid=&StartingPeriod=&EndingPeriod=&Source=&Total=false`
   * (ცარიელი სტრიქონები, თუ ველი არ გადაეცა)
   */
  docTemplate?: boolean;
};

export function buildBalanceExchangeStocksUrl(
  query?: BalanceExchangeStocksQuery
): string {
  const u = new URL(BALANCE_EXCHANGE_STOCKS_URL);
  const q = query ?? {};

  if (q.docTemplate) {
    u.searchParams.set('uid', q.uid ?? '');
    u.searchParams.set('StartingPeriod', q.StartingPeriod ?? '');
    u.searchParams.set('EndingPeriod', q.EndingPeriod ?? '');
    u.searchParams.set('Source', q.Source ?? '');
    u.searchParams.set(
      'Total',
      q.Total === undefined ? 'false' : q.Total ? 'true' : 'false'
    );
    return u.toString();
  }

  u.searchParams.set('uid', (q.uid ?? BALANCE_EXCHANGE_UID).trim());
  if (q.StartingPeriod) u.searchParams.set('StartingPeriod', q.StartingPeriod);
  if (q.EndingPeriod) u.searchParams.set('EndingPeriod', q.EndingPeriod);
  if (q.Source) u.searchParams.set('Source', q.Source);
  u.searchParams.set(
    'Total',
    q.Total === undefined ? 'false' : q.Total ? 'true' : 'false'
  );
  return u.toString();
}

export async function fetchBalanceExchangeStocks(
  query?: BalanceExchangeStocksQuery
): Promise<unknown> {
  return balanceGetJson(buildBalanceExchangeStocksUrl(query));
}

/** სრული ბაზის URL (მაგ. `…/Exchange/ItemsSeries` ბოლომდე). ცარიელი env → sm/o შემდეგ sm/a (404-ზე ფოლბექი) */
function balanceItemsSeriesPublicationBases(): string[] {
  const env = process.env.BALANCE_ITEMS_SERIES_URL?.trim();
  if (env) return [env];
  return [
    'https://cloud.balance.ge/sm/o/Balance/7596/hs/Exchange/ItemsSeries',
    'https://cloud.balance.ge/sm/a/Balance/7596/hs/Exchange/ItemsSeries',
  ];
}

/** პირველი ბაზა (ლოგის/დოკისთვის) */
export const BALANCE_ITEMS_SERIES_URL = balanceItemsSeriesPublicationBases()[0];

export function buildBalanceItemsSeriesUrlForBase(
  base: string,
  itemUid: string,
  opts?: { startingPeriod?: string; endingPeriod?: string }
): string {
  const u = new URL(base);
  u.searchParams.set('uid', itemUid.trim());
  u.searchParams.set('StartingPeriod', opts?.startingPeriod ?? '');
  u.searchParams.set('EndingPeriod', opts?.endingPeriod ?? '');
  return u.toString();
}

export function buildBalanceItemsSeriesUrl(
  itemUid: string,
  opts?: { startingPeriod?: string; endingPeriod?: string }
): string {
  return buildBalanceItemsSeriesUrlForBase(
    balanceItemsSeriesPublicationBases()[0],
    itemUid,
    opts
  );
}

/** დებაგი: რა URL-ებს ვცდით (sm/o → sm/a ან მხოლოდ env) */
export function getBalanceItemsSeriesCandidateUrls(
  itemUid: string,
  opts?: { startingPeriod?: string; endingPeriod?: string }
): string[] {
  return balanceItemsSeriesPublicationBases().map((base) =>
    buildBalanceItemsSeriesUrlForBase(base, itemUid, opts)
  );
}

export async function fetchBalanceItemsSeriesForItem(
  itemUid: string,
  opts?: { startingPeriod?: string; endingPeriod?: string }
): Promise<unknown> {
  const bases = balanceItemsSeriesPublicationBases();
  let lastErr: unknown;
  for (let i = 0; i < bases.length; i++) {
    const url = buildBalanceItemsSeriesUrlForBase(bases[i], itemUid, opts);
    try {
      return await balanceGetJson(url);
    } catch (e) {
      lastErr = e;
      const is404 = isAxiosError(e) && e.response?.status === 404;
      if (is404 && i < bases.length - 1) continue;
      throw e;
    }
  }
  throw lastErr;
}
